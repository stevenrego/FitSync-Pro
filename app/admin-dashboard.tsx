import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { aiPersonalService } from '../services/aiPersonal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import GradientButton from '../components/ui/GradientButton';
import { Colors, Sizes, Fonts } from '../constants/theme';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalWorkouts: number;
  totalChallenges: number;
  revenueThisMonth: number;
  newUsersThisWeek: number;
  avgWorkoutsPerUser: number;
  retentionRate: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: string;
  created_at: string;
  total_workouts: number;
  points: number;
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalWorkouts: 0,
    totalChallenges: 0,
    revenueThisMonth: 0,
    newUsersThisWeek: 0,
    avgWorkoutsPerUser: 0,
    retentionRate: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    target_value: 0,
    reward_points: 100,
    duration_days: 7
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStats(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('subscription', 'free');

      // Get total workouts
      const { count: totalWorkouts } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null);

      // Get total challenges
      const { count: totalChallenges } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true });

      // Get new users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: newUsersThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Calculate estimated revenue
      const estimatedRevenue = (activeSubscriptions || 0) * 19.99;

      // Calculate average workouts per user
      const avgWorkouts = totalUsers ? Math.round((totalWorkouts || 0) / totalUsers * 10) / 10 : 0;

      // Calculate retention rate (users with workouts in last 30 days)
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('workout_sessions')
        .select('user_id', { count: 'exact', head: true })
        .gte('started_at', monthAgo.toISOString());

      const retentionRate = totalUsers ? Math.round((activeUsers || 0) / totalUsers * 100) : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalWorkouts: totalWorkouts || 0,
        totalChallenges: totalChallenges || 0,
        revenueThisMonth: estimatedRevenue,
        newUsersThisWeek: newUsersThisWeek || 0,
        avgWorkoutsPerUser: avgWorkouts,
        retentionRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh users list
      await loadUsers();
      
      if (Platform.OS === 'web') {
        alert('User role updated successfully!');
      } else {
        Alert.alert('Success', 'User role updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      if (Platform.OS === 'web') {
        alert('Failed to update user role');
      } else {
        Alert.alert('Error', 'Failed to update user role');
      }
    }
  };

  const generateAIPlan = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Get user profile
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Generate AI plan
      const aiPlan = await aiPersonalService.generatePersonalizedPlan(userProfile);
      
      if (aiPlan) {
        if (Platform.OS === 'web') {
          alert(`AI Plan "${aiPlan.name}" created successfully for ${userProfile.name}!`);
        } else {
          Alert.alert('Success', `AI Plan "${aiPlan.name}" created successfully for ${userProfile.name}!`);
        }
      }
    } catch (error) {
      console.error('Error generating AI plan:', error);
      if (Platform.OS === 'web') {
        alert('Failed to generate AI plan');
      } else {
        Alert.alert('Error', 'Failed to generate AI plan');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createChallenge = async () => {
    try {
      if (!newChallenge.title.trim()) {
        if (Platform.OS === 'web') {
          alert('Please enter a challenge title');
        } else {
          Alert.alert('Error', 'Please enter a challenge title');
        }
        return;
      }

      const { error } = await supabase
        .from('challenges')
        .insert({
          title: newChallenge.title,
          description: newChallenge.description,
          challenge_type: 'custom',
          target_value: newChallenge.target_value,
          reward_points: newChallenge.reward_points,
          duration_days: newChallenge.duration_days,
          created_by: user?.id,
          is_public: true,
          end_date: new Date(Date.now() + newChallenge.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

      if (error) throw error;

      setShowChallengeModal(false);
      setNewChallenge({
        title: '',
        description: '',
        target_value: 0,
        reward_points: 100,
        duration_days: 7
      });

      await loadStats();

      if (Platform.OS === 'web') {
        alert('Challenge created successfully!');
      } else {
        Alert.alert('Success', 'Challenge created successfully!');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      if (Platform.OS === 'web') {
        alert('Failed to create challenge');
      } else {
        Alert.alert('Error', 'Failed to create challenge');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && !users.length) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <MaterialIcons name={icon} size={32} color={color} />
      </View>
    </View>
  );

  const TabButton = ({ title, tabKey, icon }: any) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTab]}
      onPress={() => setActiveTab(tabKey)}
    >
      <MaterialIcons 
        name={icon} 
        size={20} 
        color={activeTab === tabKey ? Colors.primary : Colors.textSecondary} 
      />
      <Text style={[
        styles.tabText,
        activeTab === tabKey && styles.activeTabText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Dashboard</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton title="Overview" tabKey="overview" icon="dashboard" />
          <TabButton title="Users" tabKey="users" icon="people" />
          <TabButton title="Analytics" tabKey="analytics" icon="analytics" />
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.overviewTab}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                icon="people"
                color={Colors.primary}
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.activeSubscriptions.toLocaleString()}
                icon="star"
                color={Colors.success}
              />
              <StatCard
                title="Total Workouts"
                value={stats.totalWorkouts.toLocaleString()}
                icon="fitness-center"
                color={Colors.accent}
              />
              <StatCard
                title="Active Challenges"
                value={stats.totalChallenges.toLocaleString()}
                icon="emoji-events"
                color={Colors.warning}
              />
              <StatCard
                title="Avg Workouts/User"
                value={stats.avgWorkoutsPerUser}
                icon="trending-up"
                color={Colors.secondary}
              />
              <StatCard
                title="Retention Rate"
                value={`${stats.retentionRate}%`}
                icon="timeline"
                color={Colors.error}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowChallengeModal(true)}
                >
                  <MaterialIcons name="add" size={24} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Create Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="group-add" size={24} color={Colors.success} />
                  <Text style={styles.actionButtonText}>Invite Coach</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="campaign" size={24} color={Colors.accent} />
                  <Text style={styles.actionButtonText}>Send Announcement</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <View style={styles.usersTab}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Users List */}
            <View style={styles.usersList}>
              {filteredUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userStats}>
                      {user.total_workouts} workouts • {user.points} points • Joined {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.userActions}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                      <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                    </View>
                    <View style={styles.subscriptionBadge}>
                      <Text style={styles.subscriptionText}>{user.subscription.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        const newRole = user.role === 'user' ? 'coach' : 'user';
                        updateUserRole(user.id, newRole);
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.aiButton}
                      onPress={() => generateAIPlan(user.id)}
                    >
                      <MaterialIcons name="psychology" size={16} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Performance Analytics</Text>
            
            {/* Revenue Analytics */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Revenue Analytics</Text>
              <Text style={styles.analyticsValue}>
                ${stats.revenueThisMonth.toFixed(2)} estimated monthly
              </Text>
              <Text style={styles.analyticsDescription}>
                Based on {stats.activeSubscriptions} active subscriptions
              </Text>
            </View>

            {/* User Engagement */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>User Engagement</Text>
              <Text style={styles.analyticsValue}>
                {stats.avgWorkoutsPerUser} avg workouts per user
              </Text>
              <Text style={styles.analyticsDescription}>
                {stats.retentionRate}% retention rate (30-day active)
              </Text>
            </View>

            {/* Growth Metrics */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Growth Metrics</Text>
              <Text style={styles.analyticsValue}>
                +{stats.newUsersThisWeek} new users this week
              </Text>
              <Text style={styles.analyticsDescription}>
                {((stats.newUsersThisWeek / Math.max(stats.totalUsers - stats.newUsersThisWeek, 1)) * 100).toFixed(1)}% growth rate
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Challenge Creation Modal */}
      <Modal visible={showChallengeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Challenge</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Challenge Title"
              value={newChallenge.title}
              onChangeText={(text) => setNewChallenge(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={newChallenge.description}
              onChangeText={(text) => setNewChallenge(prev => ({ ...prev, description: text }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Target Value"
              keyboardType="numeric"
              value={newChallenge.target_value.toString()}
              onChangeText={(text) => setNewChallenge(prev => ({ ...prev, target_value: parseInt(text) || 0 }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Reward Points"
              keyboardType="numeric"
              value={newChallenge.reward_points.toString()}
              onChangeText={(text) => setNewChallenge(prev => ({ ...prev, reward_points: parseInt(text) || 100 }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Duration (days)"
              keyboardType="numeric"
              value={newChallenge.duration_days.toString()}
              onChangeText={(text) => setNewChallenge(prev => ({ ...prev, duration_days: parseInt(text) || 7 }))}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowChallengeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createChallenge}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return Colors.error;
    case 'coach': return Colors.success;
    case 'dietician': return Colors.accent;
    default: return Colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Sizes.lg,
    paddingBottom: Sizes.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  welcomeText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  tabContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sizes.lg,
    paddingVertical: Sizes.md,
    marginRight: Sizes.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: Sizes.xs,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Sizes.lg,
  },
  overviewTab: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Sizes.xl,
    gap: Sizes.md,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    borderLeftWidth: 4,
    minWidth: isWeb ? '30%' : '100%',
    flex: isWeb ? 1 : undefined,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  statTitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  quickActions: {
    marginBottom: Sizes.xl,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Sizes.md,
  },
  actionButton: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    alignItems: 'center',
    minWidth: 120,
    flex: isWeb ? 1 : undefined,
  },
  actionButtonText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    marginTop: Sizes.xs,
    textAlign: 'center',
  },
  usersTab: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    paddingHorizontal: Sizes.md,
    marginBottom: Sizes.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Sizes.md,
    paddingHorizontal: Sizes.sm,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  userEmail: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  userStats: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.sm,
  },
  roleBadge: {
    paddingHorizontal: Sizes.sm,
    paddingVertical: Sizes.xs,
    borderRadius: Sizes.xs,
  },
  roleText: {
    fontSize: Fonts.sizes.xs,
    color: 'white',
    fontWeight: 'bold',
  },
  subscriptionBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Sizes.sm,
    paddingVertical: Sizes.xs,
    borderRadius: Sizes.xs,
  },
  subscriptionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  editButton: {
    padding: Sizes.xs,
  },
  aiButton: {
    padding: Sizes.xs,
  },
  tabContent: {
    flex: 1,
  },
  analyticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    marginBottom: Sizes.md,
  },
  analyticsTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.sm,
  },
  analyticsValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Sizes.xs,
  },
  analyticsDescription: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.lg,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    fontSize: Fonts.sizes.md,
    marginBottom: Sizes.md,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Sizes.md,
    marginTop: Sizes.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Sizes.md,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.textSecondary + '20',
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});