import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { paymentService } from '../services/payment';
import { useAuth } from '../hooks/useAuth';
import { Platform } from 'react-native';
import { WebBrowser } from 'expo-web-browser';

export interface PaymentContextType {
  subscriptionStatus: {
    isSubscribed: boolean;
    tier: string | null;
    subscriptionEnd: string | null;
  };
  subscriptionPlans: any[];
  isLoading: boolean;
  createSubscription: (planId: string) => Promise<void>;
  createPayment: (amount: number, productName: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  hasAccessToFeature: (feature: string) => boolean;
}

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isSubscribed: false,
    tier: null as string | null,
    subscriptionEnd: null as string | null
  });
  const [subscriptionPlans] = useState(paymentService.getSubscriptionPlans());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const status = await paymentService.checkSubscriptionStatus();
      
      setSubscriptionStatus({
        isSubscribed: status.subscribed || false,
        tier: status.subscription_tier || null,
        subscriptionEnd: status.subscription_end || null
      });

      // Update user profile with subscription info
      if (status.subscribed) {
        await paymentService.updateSubscriptionStatus(user.id, status);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSubscription = async (planId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const result = await paymentService.createSubscriptionCheckout(
        plan.stripePriceId,
        `${window.location.origin}/subscription-success`,
        `${window.location.origin}/subscription-cancel`
      );

      // Open payment page
      if (Platform.OS === 'web') {
        window.open(result.url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(result.url);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (amount: number, productName: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      const result = await paymentService.createPaymentCheckout(
        amount,
        productName,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/payment-cancel`
      );

      // Open payment page
      if (Platform.OS === 'web') {
        window.open(result.url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(result.url);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      const result = await paymentService.openCustomerPortal(window.location.origin);

      // Open customer portal
      if (Platform.OS === 'web') {
        window.open(result.url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(result.url);
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccessToFeature = (feature: string): boolean => {
    if (!subscriptionStatus.isSubscribed) {
      // Free tier features
      return ['basic_workouts', 'community', 'basic_tracking'].includes(feature);
    }

    const tier = subscriptionStatus.tier;
    
    switch (tier) {
      case 'basic':
        return ['basic_workouts', 'community', 'basic_tracking', 'progress_charts'].includes(feature);
      case 'premium':
        return ![
          'personal_coach', 
          'custom_meal_plans', 
          'advanced_challenges', 
          'wearable_sync'
        ].includes(feature);
      case 'pro':
        return true; // Access to all features
      default:
        return ['basic_workouts', 'community', 'basic_tracking'].includes(feature);
    }
  };

  return (
    <PaymentContext.Provider value={{
      subscriptionStatus,
      subscriptionPlans,
      isLoading,
      createSubscription,
      createPayment,
      openCustomerPortal,
      checkSubscriptionStatus,
      hasAccessToFeature
    }}>
      {children}
    </PaymentContext.Provider>
  );
}