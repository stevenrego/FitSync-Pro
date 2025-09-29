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

    // Check for existing customer
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1
    });

    if (customers.data.length === 0) {
      // Update profile to free tier
      await supabaseClient
        .from('profiles')
        .update({
          subscription: 'free',
          subscription_end: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const customerId = customers.data[0].id;
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      
      // Determine tier based on price amount
      const amount = price.unit_amount || 0;
      if (amount >= 3999) {
        subscriptionTier = 'pro';
      } else if (amount >= 1999) {
        subscriptionTier = 'premium';
      } else if (amount >= 999) {
        subscriptionTier = 'basic';
      } else {
        subscriptionTier = 'free';
      }
      
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    }

    // Update user profile with subscription status
    await supabaseClient
      .from('profiles')
      .update({
        subscription: subscriptionTier as 'free' | 'premium' | 'pro',
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Update subscriptions table
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: hasActiveSub ? subscriptions.data[0].id : null,
        status: hasActiveSub ? subscriptions.data[0].status : 'inactive',
        tier: subscriptionTier as 'free' | 'premium' | 'pro',
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to check subscription status' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});