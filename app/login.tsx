import React, { useState, Platform } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import GradientButton from '../components/ui/GradientButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Colors, Sizes, Fonts } from '../constants/theme';

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
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      showWebAlert('Login Failed', error.message || 'Invalid email or password');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      showWebAlert('Error', error.message || 'Google login failed');
    }
  };

  const handleAppleLogin = async () => {
    try {
      await loginWithApple();
      router.replace('/(tabs)');
    } catch (error: any) {
      showWebAlert('Error', error.message || 'Apple login failed');
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your fitness journey
            </Text>
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
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              disabled={isLoading}
              gradient={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <MaterialIcons name="g-translate" size={24} color={Colors.text} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleAppleLogin}
                disabled={isLoading}
              >
                <MaterialIcons name="apple" size={24} color={Colors.text} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Do not have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Credentials */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: test@example.com</Text>
              <Text style={styles.demoText}>Password: 123456</Text>
            </View>
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
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Sizes.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: Sizes.xxl,
  },
  backButton: {
    position: 'absolute',
    left: -Sizes.lg,
    top: 0,
    padding: Sizes.sm,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: Sizes.sm,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Sizes.lg,
    padding: Sizes.lg,
    marginBottom: Sizes.xxl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    marginBottom: Sizes.md,
    paddingHorizontal: Sizes.md,
  },
  inputIcon: {
    marginRight: Sizes.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Sizes.md,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  eyeIcon: {
    position: 'absolute',
    right: Sizes.md,
    padding: Sizes.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Sizes.lg,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.sm,
  },
  loginButton: {
    marginBottom: Sizes.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Sizes.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.textSecondary + '30',
  },
  dividerText: {
    marginHorizontal: Sizes.md,
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Sizes.md,
    marginBottom: Sizes.lg,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sizes.md,
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
  },
  socialButtonText: {
    marginLeft: Sizes.sm,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Sizes.md,
  },
  signupText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.md,
  },
  signupLink: {
    color: Colors.primary,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  demoContainer: {
    backgroundColor: Colors.background,
    padding: Sizes.md,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  demoText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
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