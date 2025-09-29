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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, loginWithGoogle, loginWithApple, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
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

  const validateForm = () => {
    if (!name.trim()) {
      showWebAlert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      showWebAlert('Error', 'Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showWebAlert('Error', 'Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      showWebAlert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      showWebAlert('Error', 'Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      showWebAlert('Error', 'Please agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register(email, password, name);
      showWebAlert('Success', 'Account created successfully! Welcome to FitSync Pro!', () => {
        router.replace('/(tabs)');
      });
    } catch (error: any) {
      showWebAlert('Registration Failed', error.message || 'Please try again later');
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      showWebAlert('Error', error.message || 'Google signup failed');
    }
  };

  const handleAppleSignup = async () => {
    try {
      await loginWithApple();
      router.replace('/(tabs)');
    } catch (error: any) {
      showWebAlert('Error', error.message || 'Apple signup failed');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Creating your account..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={Colors.gradient.secondary}
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start your fitness transformation today
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

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
                autoComplete="new-password"
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

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Confirm password"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialIcons 
                  name={showConfirmPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <MaterialIcons 
                name={agreeToTerms ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={agreeToTerms ? Colors.primary : Colors.textSecondary} 
              />
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <GradientButton
              title="Create Account"
              onPress={handleRegister}
              disabled={isLoading}
              gradient={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.registerButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Signup */}
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleSignup}
                disabled={isLoading}
              >
                <MaterialIcons name="g-translate" size={24} color={Colors.text} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleAppleSignup}
                disabled={isLoading}
              >
                <MaterialIcons name="apple" size={24} color={Colors.text} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
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
    marginVertical: Sizes.xl,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Sizes.lg,
  },
  checkboxText: {
    flex: 1,
    marginLeft: Sizes.sm,
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  registerButton: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.md,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
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