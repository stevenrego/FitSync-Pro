import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Sizes, Fonts } from '../../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient?: string[];
  unit?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  gradient = Colors.gradient.primary,
  unit 
}: StatCardProps) {
  return (
    <LinearGradient
      colors={gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <MaterialIcons name={icon} size={28} color="white" />
        <Text style={styles.value}>
          {value}
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flex: 1,
    minHeight: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  value: {
    color: 'white',
    fontSize: Fonts.sizes.xxl,
    fontWeight: 'bold',
    marginVertical: Sizes.xs,
  },
  unit: {
    fontSize: Fonts.sizes.md,
    fontWeight: 'normal',
  },
  title: {
    color: 'white',
    fontSize: Fonts.sizes.sm,
    opacity: 0.9,
  },
});