import '../react-shim'; // Import React 19 compatibility shim first
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { FitnessProvider } from '../contexts/FitnessContext';
import { PaymentProvider } from '../contexts/PaymentContext';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // Ensure React compatibility is loaded
    if (typeof globalThis !== 'undefined') {
      globalThis.__REACT_VERSION__ = '19.0.0';
    }
  }, []);

  return (
    <AuthProvider>
      <FitnessProvider>
        <PaymentProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="subscription" options={{ headerShown: false }} />
            <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="coach-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="nutritionist-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="wearables" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </PaymentProvider>
      </FitnessProvider>
    </AuthProvider>
  );
}