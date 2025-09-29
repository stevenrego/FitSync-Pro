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

    const { returnUrl } = await req.json();

    // Get customer
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1
    });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ error: "No customer found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const customerId = customers.data[0].id;

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${req.headers.get("origin")}/subscription`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Customer portal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create customer portal session' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});