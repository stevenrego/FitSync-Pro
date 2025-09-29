import React, { useState, Platform } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePayment } from '../hooks/usePayment';
import { useAuth } from '../hooks/useAuth';
import GradientButton from '../components/ui/GradientButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Colors, Sizes, Fonts } from '../constants/theme';

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    subscriptionPlans, 
    subscriptionStatus, 
    createSubscription, 
    openCustomerPortal,
    isLoading 
  } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onOk?: () => void;
  }>({ visible: false, title: '', message: '' });

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message, onOk });
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      showWebAlert('Authentication Required', 'Please log in to subscribe');
      return;
    }

    try {
      await createSubscription(planId);
      showWebAlert('Success', 'Redirecting to payment...');
    } catch (error: any) {
      showWebAlert('Error', error.message || 'Failed to process subscription');
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error: any) {
      showWebAlert('Error', error.message || 'Failed to open customer portal');
    }
  };

  if (isLoading && !subscriptionPlans.length) {
    return <LoadingSpinner text="Loading subscription plans..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription Plans</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        {subscriptionStatus.isSubscribed && (
          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <Text style={styles.currentPlanName}>
              {subscriptionStatus.tier?.toUpperCase()} Plan
            </Text>
            {subscriptionStatus.subscriptionEnd && (
              <Text style={styles.currentPlanEnd}>
                Valid until {new Date(subscriptionStatus.subscriptionEnd).toLocaleDateString()}
              </Text>
            )}
            <GradientButton
              title="Manage Subscription"
              onPress={handleManageSubscription}
              gradient={Colors.gradient.secondary}
              style={styles.manageButton}
            />
          </View>
        )}

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = subscriptionStatus.tier === plan.id;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isCurrentPlan && styles.currentPlanCard,
                  isSelected && styles.selectedPlanCard
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                disabled={isCurrentPlan}
              >
                {plan.id === 'premium' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.planPrice}>${plan.price}</Text>
                  <Text style={styles.planInterval}>/{plan.interval}</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature: string, index: number) => (
                    <View key={index} style={styles.featureItem}>
                      <MaterialIcons name="check" size={20} color={Colors.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {isCurrentPlan ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current Plan</Text>
                  </View>
                ) : (
                  <GradientButton
                    title={`Choose ${plan.name}`}
                    onPress={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    gradient={plan.id === 'premium' ? Colors.gradient.primary : Colors.gradient.secondary}
                    style={styles.subscribeButton}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Features Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Feature Comparison</Text>
          
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.featureHeader}>Features</Text>
              <Text style={styles.planHeader}>Basic</Text>
              <Text style={styles.planHeader}>Premium</Text>
              <Text style={styles.planHeader}>Pro</Text>
            </View>

            {[
              ['Basic Workouts', '✓', '✓', '✓'],
              ['AI Custom Plans', '✗', '✓', '✓'],
              ['Nutrition Tracking', '✗', '✓', '✓'],
              ['Coach Consultation', '✗', '✓', '✓'],
              ['Personal Coach', '✗', '✗', '✓'],
              ['Wearable Sync', '✗', '✗', '✓'],
              ['Advanced Analytics', '✗', '✓', '✓'],
              ['24/7 Support', '✗', '✗', '✓']
            ].map((row, index) => (
              <View key={index} style={styles.comparisonRow}>
                <Text style={styles.featureCell}>{row[0]}</Text>
                <Text style={[styles.planCell, row[1] === '✓' ? styles.available : styles.unavailable]}>
                  {row[1]}
                </Text>
                <Text style={[styles.planCell, row[2] === '✓' ? styles.available : styles.unavailable]}>
                  {row[2]}
                </Text>
                <Text style={[styles.planCell, row[3] === '✓' ? styles.available : styles.unavailable]}>
                  {row[3]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          {[
            {
              question: 'Can I cancel anytime?',
              answer: 'Yes, you can cancel your subscription at any time. You will continue to have access until the end of your billing period.'
            },
            {
              question: 'Do you offer refunds?',
              answer: 'We offer a 30-day money-back guarantee for new subscribers. If you are not satisfied, contact support for a full refund.'
            },
            {
              question: 'Can I change my plan?',
              answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades and at the next billing cycle for downgrades.'
            }
          ].map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Web Alert Modal */}
      {Platform.OS === 'web' && (
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={() => {
                  alertConfig.onOk?.();
                  setAlertConfig(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sizes.lg,
    paddingBottom: Sizes.md,
  },
  backButton: {
    padding: Sizes.sm,
    marginRight: Sizes.md,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Sizes.lg,
  },
  currentPlan: {
    backgroundColor: Colors.success + '20',
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    marginBottom: Sizes.xl,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  currentPlanTitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: Sizes.xs,
  },
  currentPlanName: {
    fontSize: Fonts.sizes.lg,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Sizes.xs,
  },
  currentPlanEnd: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.md,
  },
  manageButton: {
    marginTop: Sizes.sm,
  },
  plansContainer: {
    marginBottom: Sizes.xl,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    marginBottom: Sizes.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  currentPlanCard: {
    borderColor: Colors.success,
    opacity: 0.7,
  },
  selectedPlanCard: {
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: Sizes.md,
    paddingVertical: Sizes.xs,
    borderRadius: Sizes.sm,
  },
  popularText: {
    color: 'white',
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Sizes.lg,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  planInterval: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    marginLeft: Sizes.xs,
  },
  featuresContainer: {
    marginBottom: Sizes.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sizes.sm,
  },
  featureText: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    marginLeft: Sizes.sm,
  },
  currentBadge: {
    backgroundColor: Colors.success,
    paddingVertical: Sizes.sm,
    paddingHorizontal: Sizes.md,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  currentBadgeText: {
    color: 'white',
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  subscribeButton: {
    marginTop: Sizes.sm,
  },
  comparisonSection: {
    marginBottom: Sizes.xl,
  },
  comparisonTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  comparisonTable: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '20',
    paddingVertical: Sizes.md,
    paddingHorizontal: Sizes.sm,
  },
  featureHeader: {
    flex: 2,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  planHeader: {
    flex: 1,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: Sizes.sm,
    paddingHorizontal: Sizes.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  featureCell: {
    flex: 2,
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
  },
  planCell: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  available: {
    color: Colors.success,
  },
  unavailable: {
    color: Colors.textSecondary,
  },
  faqSection: {
    marginBottom: Sizes.xl,
  },
  faqTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  faqItem: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.md,
  },
  faqQuestion: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  faqAnswer: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: 'white',
    padding: Sizes.lg,
    borderRadius: Sizes.borderRadius,
    minWidth: 280,
  },
  alertTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    marginBottom: Sizes.sm,
    color: Colors.text,
  },
  alertMessage: {
    fontSize: Fonts.sizes.md,
    marginBottom: Sizes.lg,
    color: Colors.textSecondary,
  },
  alertButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.sm,
    borderRadius: Sizes.sm,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Fonts.sizes.md,
  },
});