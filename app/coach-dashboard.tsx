import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { aiPersonalService } from '../services/aiPersonal';
import GradientButton from '../components/ui/GradientButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Colors, Sizes, Fonts } from '../constants/theme';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

interface ClientStats {
  totalClients: number;
  activeClients: number;
  monthlyRevenue: number;
  plansSold: number;
  averageRating: number;
  completionRate: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  fitness_level: string;
  goals: string[];
  total_workouts: number;
  streak_days: number;
  last_workout: string;
  subscription: string;
  monthly_fee?: number;
  status: string;
}

export default function CoachDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    plansSold: 0,
    averageRating: 0,
    completionRate: 0
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration_weeks: 8,
    price: 0
  });

  useEffect(() => {
    if (user?.role !== 'coach' && user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadCoachData();
  }, [user]);

  const loadCoachData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStats(),
        loadClients()
      ]);
    } catch (error) {
      console.error('Error loading coach data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get coach clients count
      const { count: totalClients } = await supabase
        .from('coach_clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id);

      // Get active clients (recent activity)
      const { count: activeClients } = await supabase
        .from('coach_clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id)
        .eq('status', 'active');

      // Calculate monthly revenue
      const { data: clientsData } = await supabase
        .from('coach_clients')
        .select('monthly_fee')
        .eq('coach_id', user?.id)
        .eq('status', 'active');

      const monthlyRevenue = clientsData?.reduce((sum, client) => sum + (client.monthly_fee || 0), 0) || 0;

      // Get workout plans count
      const { count: plansSold } = await supabase
        .from('workout_plans')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user?.id);

      setStats({
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        monthlyRevenue,
        plansSold: plansSold || 0,
        averageRating: 4.8, // Mock data - would come from reviews
        completionRate: 85 // Mock data - would be calculated from workout sessions
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_clients')
        .select(`
          *,
          client:profiles!coach_clients_client_id_fkey(*)
        `)
        .eq('coach_id', user?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      const formattedClients = data?.map((relationship: any) => ({
        id: relationship.client.id,
        name: relationship.client.name,
        email: relationship.client.email,
        avatar_url: relationship.client.avatar_url,
        fitness_level: relationship.client.fitness_level || 'beginner',
        goals: relationship.client.goals || [],
        total_workouts: relationship.client.total_workouts || 0,
        streak_days: relationship.client.streak_days || 0,
        last_workout: '2 days ago', // Would calculate from workout_sessions
        subscription: relationship.client.subscription || 'free',
        monthly_fee: relationship.monthly_fee,
        status: relationship.status
      })) || [];

      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const createAIPlan = async (clientId: string) => {
    try {
      setIsLoading(true);
      
      // Get client profile
      const { data: clientProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      // Generate AI plan
      const aiPlan = await aiPersonalService.generatePersonalizedPlan(clientProfile);
      
      if (aiPlan) {
        showWebAlert('Success', `AI Plan "${aiPlan.name}" created for ${clientProfile.name}!`);
        await loadCoachData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating AI plan:', error);
      showWebAlert('Error', 'Failed to create AI plan');
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomPlan = async () => {
    try {
      if (!newPlan.name.trim()) {
        showWebAlert('Error', 'Please enter a plan name');
        return;
      }

      const { error } = await supabase
        .from('workout_plans')
        .insert({
          name: newPlan.name,
          description: newPlan.description,
          difficulty: newPlan.difficulty,
          duration_weeks: newPlan.duration_weeks,
          created_by: user?.id,
          is_ai_generated: false,
          is_public: true,
          price: newPlan.price
        });

      if (error) throw error;

      setShowPlanModal(false);
      setNewPlan({
        name: '',
        description: '',
        difficulty: 'beginner',
        duration_weeks: 8,
        price: 0
      });

      await loadStats();
      showWebAlert('Success', 'Workout plan created successfully!');
    } catch (error) {
      console.error('Error creating plan:', error);
      showWebAlert('Error', 'Failed to create plan');
    }
  };

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && !clients.length) {
    return <LoadingSpinner text="Loading coach dashboard..." />;
  }

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {trend && (
            <Text style={[styles.statTrend, { color: trend > 0 ? Colors.success : Colors.error }]}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </Text>
          )}
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
          <Text style={styles.title}>Coach Dashboard</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome, Coach {user?.name}</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton title="Overview" tabKey="overview" icon="dashboard" />
          <TabButton title="Clients" tabKey="clients" icon="people" />
          <TabButton title="Plans" tabKey="plans" icon="fitness-center" />
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
                title="Total Clients"
                value={stats.totalClients}
                icon="people"
                color={Colors.primary}
                trend={12}
              />
              <StatCard
                title="Active Clients"
                value={stats.activeClients}
                icon="person-add"
                color={Colors.success}
                trend={8}
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${stats.monthlyRevenue.toLocaleString()}`}
                icon="attach-money"
                color={Colors.accent}
                trend={15}
              />
              <StatCard
                title="Plans Sold"
                value={stats.plansSold}
                icon="shopping-cart"
                color={Colors.warning}
                trend={-3}
              />
              <StatCard
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                icon="star"
                color={Colors.secondary}
              />
              <StatCard
                title="Completion Rate"
                value={`${stats.completionRate}%`}
                icon="check-circle"
                color={Colors.error}
                trend={5}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowPlanModal(true)}
                >
                  <MaterialIcons name="add" size={24} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Create Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="message" size={24} color={Colors.success} />
                  <Text style={styles.actionButtonText}>Message Clients</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="assessment" size={24} color={Colors.accent} />
                  <Text style={styles.actionButtonText}>View Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <View style={styles.clientsTab}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Clients List */}
            <View style={styles.clientsList}>
              {filteredClients.map((client) => (
                <View key={client.id} style={styles.clientCard}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                    <Text style={styles.clientStats}>
                      {client.total_workouts} workouts • {client.streak_days} day streak • Last: {client.last_workout}
                    </Text>
                    <Text style={styles.clientGoals}>
                      Goals: {client.goals.join(', ') || 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.clientActions}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
                      <Text style={styles.statusText}>{client.status.toUpperCase()}</Text>
                    </View>
                    {client.monthly_fee && (
                      <Text style={styles.feeText}>${client.monthly_fee}/mo</Text>
                    )}
                    <TouchableOpacity
                      style={styles.aiButton}
                      onPress={() => createAIPlan(client.id)}
                    >
                      <MaterialIcons name="psychology" size={16} color={Colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.messageButton}>
                      <MaterialIcons name="message" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <View style={styles.plansTab}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Workout Plans</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowPlanModal(true)}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Plan</Text>
              </TouchableOpacity>
            </View>
            
            {/* Plans would be loaded here */}
            <View style={styles.emptyState}>
              <MaterialIcons name="fitness-center" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No plans created yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first workout plan to start helping clients</Text>
            </View>
          </View>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <View style={styles.analyticsTab}>
            <Text style={styles.sectionTitle}>Performance Analytics</Text>
            
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Client Engagement</Text>
              <Text style={styles.analyticsValue}>85%</Text>
              <Text style={styles.analyticsDescription}>
                Average workout completion rate across all clients
              </Text>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Revenue Growth</Text>
              <Text style={styles.analyticsValue}>+15%</Text>
              <Text style={styles.analyticsDescription}>
                Monthly recurring revenue increase
              </Text>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Client Satisfaction</Text>
              <Text style={styles.analyticsValue}>4.8/5</Text>
              <Text style={styles.analyticsDescription}>
                Average rating from client feedback
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Plan Creation Modal */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Workout Plan</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Plan Name"
              value={newPlan.name}
              onChangeText={(text) => setNewPlan(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={newPlan.description}
              onChangeText={(text) => setNewPlan(prev => ({ ...prev, description: text }))}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButtonModal]}
                onPress={createCustomPlan}
              >
                <Text style={styles.createButtonModalText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return Colors.success;
    case 'inactive': return Colors.textSecondary;
    case 'paused': return Colors.warning;
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
  statTrend: {
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
    marginTop: Sizes.xs,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clientsTab: {
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
  clientsList: {
    flex: 1,
  },
  clientCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  clientEmail: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  clientStats: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  clientGoals: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.sm,
  },
  statusBadge: {
    paddingHorizontal: Sizes.sm,
    paddingVertical: Sizes.xs,
    borderRadius: Sizes.xs,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
    color: 'white',
    fontWeight: 'bold',
  },
  feeText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.success,
    fontWeight: 'bold',
  },
  aiButton: {
    padding: Sizes.xs,
  },
  messageButton: {
    padding: Sizes.xs,
  },
  plansTab: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Sizes.md,
    paddingVertical: Sizes.sm,
    borderRadius: Sizes.borderRadius,
  },
  createButtonText: {
    color: 'white',
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    marginLeft: Sizes.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Sizes.xxl,
  },
  emptyStateText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Sizes.md,
    marginBottom: Sizes.xs,
  },
  emptyStateSubtext: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  analyticsTab: {
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
  createButtonModal: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  createButtonModalText: {
    color: 'white',
    fontWeight: '600',
  },
});