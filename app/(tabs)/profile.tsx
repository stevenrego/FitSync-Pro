import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useFitness } from '../../hooks/useFitness';
import GradientButton from '../../components/ui/GradientButton';
import { Colors, Sizes, Fonts } from '../../constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { stats, badges } = useFitness();

  const menuItems = [
    { title: 'Personal Information', icon: 'person', color: Colors.primary },
    { title: 'Fitness Goals', icon: 'track-changes', color: Colors.accent },
    { title: 'Subscription', icon: 'card-membership', color: Colors.warning },
    { title: 'Privacy Settings', icon: 'security', color: Colors.secondary },
    { title: 'Notifications', icon: 'notifications', color: Colors.primary },
    { title: 'Connected Apps', icon: 'sync', color: Colors.success },
    { title: 'Help & Support', icon: 'help', color: Colors.textSecondary },
  ];

  const achievements = [
    { name: 'First Week', icon: '🏃', unlocked: true },
    { name: '10 Workouts', icon: '💪', unlocked: true },
    { name: 'Streak Master', icon: '🔥', unlocked: false },
    { name: 'Community Star', icon: '⭐', unlocked: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image 
              source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150&h=150&fit=crop&crop=face' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'Fitness Enthusiast'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.subscriptionBadge}>
                <MaterialIcons name="stars" size={16} color={Colors.warning} />
                <Text style={styles.subscriptionText}>
                  {user?.subscription?.toUpperCase() || 'FREE'} MEMBER
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <MaterialIcons name="edit" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.weeklyStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <View key={index} style={[
                styles.achievementCard,
                { opacity: achievement.unlocked ? 1 : 0.5 }
              ]}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                {achievement.unlocked && (
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon as keyof typeof MaterialIcons.glyphMap} size={24} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscription Upgrade */}
        {user?.subscription === 'free' && (
          <View style={styles.section}>
            <View style={styles.upgradeCard}>
              <Text style={styles.upgradeTitle}>Unlock Premium Features</Text>
              <Text style={styles.upgradeDescription}>
                Get AI-powered plans, unlimited food logging, and premium coaching access
              </Text>
              <GradientButton
                title="Upgrade to Premium"
                onPress={() => {}}
                gradient={Colors.gradient.primary}
                style={styles.upgradeButton}
              />
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <MaterialIcons name="logout" size={24} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>FitSync Pro v1.0.0</Text>
        </View>
      </ScrollView>
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
    padding: Sizes.lg,
    backgroundColor: Colors.surface,
    marginBottom: Sizes.md,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Sizes.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  userEmail: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.sm,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Sizes.sm,
    paddingVertical: Sizes.xs,
    borderRadius: Sizes.sm,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
    color: Colors.warning,
    marginLeft: Sizes.xs,
  },
  editButton: {
    padding: Sizes.sm,
    backgroundColor: Colors.background,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Sizes.lg,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    marginBottom: Sizes.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Sizes.xs,
  },
  statLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.background,
    marginHorizontal: Sizes.md,
  },
  section: {
    marginBottom: Sizes.xl,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: Sizes.lg,
    marginBottom: Sizes.md,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Sizes.lg,
    gap: Sizes.md,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: Sizes.sm,
  },
  achievementName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Sizes.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Sizes.lg,
    marginBottom: Sizes.xs,
    padding: Sizes.md,
    borderRadius: Sizes.borderRadius,
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: Sizes.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  upgradeCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Sizes.lg,
    padding: Sizes.lg,
    borderRadius: Sizes.borderRadius,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  upgradeTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.sm,
  },
  upgradeDescription: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Sizes.lg,
  },
  upgradeButton: {
    marginTop: Sizes.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Sizes.lg,
    padding: Sizes.md,
    borderRadius: Sizes.borderRadius,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  logoutText: {
    fontSize: Fonts.sizes.md,
    color: Colors.error,
    marginLeft: Sizes.md,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Sizes.xl,
  },
  versionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
});