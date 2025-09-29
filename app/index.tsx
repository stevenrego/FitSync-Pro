import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import GradientButton from '../components/ui/GradientButton';
import { Colors, Sizes, Fonts } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <LinearGradient
      colors={Colors.gradient.primary}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="fitness-center" size={60} color="white" />
          </View>
          <Text style={styles.title}>FitSync Pro</Text>
          <Text style={styles.subtitle}>
            Transform your body, elevate your mind
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <MaterialIcons name="psychology" size={24} color="white" />
            <Text style={styles.featureText}>AI-Powered Plans</Text>
          </View>
          <View style={styles.feature}>
            <MaterialIcons name="groups" size={24} color="white" />
            <Text style={styles.featureText}>Community Support</Text>
          </View>
          <View style={styles.feature}>
            <MaterialIcons name="analytics" size={24} color="white" />
            <Text style={styles.featureText}>Progress Tracking</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GradientButton
            title="Get Started"
            onPress={handleRegister}
            gradient={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.button}
          />
          <GradientButton
            title="Sign In"
            onPress={handleLogin}
            gradient={['transparent', 'transparent']}
            style={[styles.button, styles.secondaryButton]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Sizes.lg,
    justifyContent: 'space-between',
    paddingBottom: Sizes.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Sizes.lg,
  },
  title: {
    fontSize: Fonts.sizes.title + 8,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: Sizes.sm,
  },
  subtitle: {
    fontSize: Fonts.sizes.lg,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Sizes.sm,
  },
  featureText: {
    color: 'white',
    fontSize: Fonts.sizes.md,
    marginLeft: Sizes.md,
    fontWeight: '500',
  },
  actions: {
    gap: Sizes.md,
  },
  button: {
    width: '100%',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});