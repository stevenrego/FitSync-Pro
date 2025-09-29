import { supabase } from './supabase';

export const paymentService = {
  // Create subscription checkout session
  async createSubscriptionCheckout(priceId: string, successUrl: string, cancelUrl: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId,
        successUrl,
        cancelUrl,
        mode: 'subscription'
      }
    });

    if (error) throw error;
    return data;
  },

  // Create one-time payment session
  async createPaymentCheckout(amount: number, productName: string, successUrl: string, cancelUrl: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        amount: amount * 100, // Convert to cents
        productName,
        successUrl,
        cancelUrl
      }
    });

    if (error) throw error;
    return data;
  },

  // Check subscription status
  async checkSubscriptionStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('check-subscription');
    
    if (error) throw error;
    return data;
  },

  // Open customer portal for subscription management
  async openCustomerPortal(returnUrl: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      body: { returnUrl }
    });

    if (error) throw error;
    return data;
  },

  // Update local subscription status
  async updateSubscriptionStatus(userId: string, subscriptionData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription: subscriptionData.tier,
        subscription_end: subscriptionData.subscription_end,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get subscription plans
  getSubscriptionPlans() {
    return [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Basic workout plans',
          'Community access',
          'Progress tracking',
          'Email support'
        ],
        stripePriceId: 'price_basic_monthly' // Replace with actual Stripe Price ID
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'AI-powered custom plans',
          'Nutrition tracking',
          'Coach consultation',
          'Advanced analytics',
          'Priority support'
        ],
        stripePriceId: 'price_premium_monthly' // Replace with actual Stripe Price ID
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 39.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Everything in Premium',
          'Personal coach assignment',
          'Custom meal plans',
          'Wearable integrations',
          'Advanced challenges',
          '24/7 support'
        ],
        stripePriceId: 'price_pro_monthly' // Replace with actual Stripe Price ID
      }
    ];
  }
};