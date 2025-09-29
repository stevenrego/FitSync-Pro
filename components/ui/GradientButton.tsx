import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Sizes, Fonts } from '../../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: string[];
  disabled?: boolean;
  style?: ViewStyle;
}

export default function GradientButton({ 
  title, 
  onPress, 
  gradient = Colors.gradient.primary,
  disabled = false,
  style 
}: GradientButtonProps) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled}
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#BDC3C7', '#95A5A6'] : gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.text, { opacity: disabled ? 0.7 : 1 }]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Sizes.borderRadius,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: Sizes.md,
    paddingHorizontal: Sizes.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Sizes.buttonHeight,
  },
  text: {
    color: 'white',
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
});