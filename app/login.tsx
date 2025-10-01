import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import GradientButton from '../components/ui/GradientButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Colors, Sizes, Fonts } from '../constants/theme';

// ✅ Local supabase client (safe for role fetch)
// If you already have a central client, replace with that import (e.g. ../services/supabase)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Role-based redirect helper ---
async function redirectByRoleAfterAuth() {
  // Grab the current user from Supabase
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user?.id) {
    // Fallback: if we can't read the session for any reason, send to tabs
    router.replace('/(tabs)');
    return;
  }

  // Fetch role from profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (error) {
    console.warn('Role fetch failed:', error.message);
    router.replace('/(tabs)');
    return;
  }

  const role = (data?.role || 'user') as 'admin' | 'coach' | 'nutritionist' | 'user';

  if (role === 'admin') {
    router.replace('/admin-dashboard');
  } else if (role === 'coach') {
    router.replace('/coach-dashboard');
  } else if (role === 'nutritionist') {
    router.replace('/nutritionist-dashboard');
  } else {
    router.replace('/(tabs)'); // default end-user home
  }
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, loginWithApple, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    if (!email || !password) {
      showWebAlert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email, password); // your hook performs the auth
      await redirectByRoleAfterAuth(); // 🔁 role-aware redirect
    } catch (error: any) {
      showWebAlert('Login Failed', error?.message || 'Invalid email or password');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(); // your hook handles the OAuth / demo fallback
      await redirectByRoleAfterAuth(); // 🔁 role-aware redirect
    } catch (error: any) {
      if (error?.message?.includes('not configured')) {
        showWebAlert('Demo Mode', 'Google OAuth not configured. Created demo account instead.', async () => {
          await redirectByRoleAfterAuth();
        });
      } else {
        showWebAlert('Error', error?.message || 'Google login failed');
      }
    }
  };

  const handleAppleLogin = async () => {
    try {
      await loginWithApple();
      await redirectByRoleAfterAuth(); // 🔁 role-aware redirect
    } catch (error: any) {
      if (error?.message?.includes('not configured')) {
        showWebAlert('Demo Mode', 'Apple OAuth not configured. Created demo account instead.', async () => {
          await redirectByRoleAfterAuth();
        });
      } else {
        showWebAlert('Error', error?.message || 'Apple login failed');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Signing you in..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={Colors.gradient.primary}
        style={[styles.background, { paddingTop: insets.top }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              disabled={isLoading}
