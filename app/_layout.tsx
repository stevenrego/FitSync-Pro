import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { FitnessProvider } from '../contexts/FitnessContext';
import { PaymentProvider } from '../contexts/PaymentContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FitnessProvider>
          <PaymentProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="admin-dashboard" />
              <Stack.Screen name="coach-dashboard" />
              <Stack.Screen name="nutritionist-dashboard" />
              <Stack.Screen name="subscription" />
              <Stack.Screen name="wearables" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </PaymentProvider>
        </FitnessProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}