import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { priceId, successUrl, cancelUrl, mode = "subscription" } = await req.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Price ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get or create customer
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: mode as "subscription" | "payment",
      success_url: successUrl || `${req.headers.get("origin")}/success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      metadata: {
        supabase_user_id: user.id
      }
    };

    // Add subscription-specific settings
    if (mode === "subscription") {
      sessionConfig.subscription_data = {
        metadata: {
          supabase_user_id: user.id
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log the checkout attempt
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'checkout_started',
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create checkout session' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});