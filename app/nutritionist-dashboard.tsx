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

interface NutritionStats {
  totalClients: number;
  activeClients: number;
  mealPlansCreated: number;
  averageCalorieAdherence: number;
  averageMacroAccuracy: number;
  clientSatisfaction: number;
}

interface NutritionClient {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  goals: string[];
  dietary_restrictions?: string[];
  target_calories: number;
  current_calories: number;
  macro_adherence: number;
  last_log: string;
  status: string;
}

export default function NutritionistDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<NutritionStats>({
    totalClients: 0,
    activeClients: 0,
    mealPlansCreated: 0,
    averageCalorieAdherence: 0,
    averageMacroAccuracy: 0,
    clientSatisfaction: 0
  });
  const [clients, setClients] = useState<NutritionClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<NutritionClient | null>(null);
  const [newMealPlan, setNewMealPlan] = useState({
    name: '',
    description: '',
    calories: 0,
    meals: [] as string[]
  });

  useEffect(() => {
    if (user?.role !== 'dietician' && user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadNutritionistData();
  }, [user]);

  const loadNutritionistData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStats(),
        loadClients()
      ]);
    } catch (error) {
      console.error('Error loading nutritionist data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get nutritionist clients count
      const { count: totalClients } = await supabase
        .from('coach_clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id);

      // Mock data for nutrition-specific stats
      setStats({
        totalClients: totalClients || 0,
        activeClients: Math.floor((totalClients || 0) * 0.8),
        mealPlansCreated: 24,
        averageCalorieAdherence: 78,
        averageMacroAccuracy: 85,
        clientSatisfaction: 4.6
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

      // Mock nutrition-specific client data
      const formattedClients = data?.map((relationship: any, index: number) => {
        const goals = aiPersonalService.calculateNutritionGoals(relationship.client);
        return {
          id: relationship.client.id,
          name: relationship.client.name,
          email: relationship.client.email,
          avatar_url: relationship.client.avatar_url,
          goals: relationship.client.goals || [],
          dietary_restrictions: relationship.client.dietary_restrictions || [],
          target_calories: goals.calories,
          current_calories: Math.floor(goals.calories * (0.7 + Math.random() * 0.6)),
          macro_adherence: Math.floor(70 + Math.random() * 30),
          last_log: index === 0 ? 'Today' : `${index + 1} days ago`,
          status: relationship.status
        };
      }) || [];

      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const createNutritionPlan = async (clientId: string) => {
    try {
      setIsLoading(true);
      
      // Get client profile
      const { data: clientProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      // Generate AI nutrition goals
      const nutritionGoals = aiPersonalService.calculateNutritionGoals(clientProfile);
      
      showWebAlert('Success', `Nutrition Plan created for ${clientProfile.name}!\nCalories: ${nutritionGoals.calories}\nProtein: ${nutritionGoals.protein}g\nCarbs: ${nutritionGoals.carbs}g\nFat: ${nutritionGoals.fat}g`);
      
      await loadNutritionistData(); // Refresh data
    } catch (error) {
      console.error('Error creating nutrition plan:', error);
      showWebAlert('Error', 'Failed to create nutrition plan');
    } finally {
      setIsLoading(false);
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
    return <LoadingSpinner text="Loading nutrition dashboard..." />;
  }

  const StatCard = ({ title, value, icon, color, unit = '' }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}{unit}</Text>
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
          <Text style={styles.title}>Nutritionist Dashboard</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton title="Overview" tabKey="overview" icon="dashboard" />
          <TabButton title="Clients" tabKey="clients" icon="people" />
          <TabButton title="Meal Plans" tabKey="meals" icon="restaurant" />
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
              />
              <StatCard
                title="Active Clients"
                value={stats.activeClients}
                icon="person-add"
                color={Colors.success}
              />
              <StatCard
                title="Meal Plans"
                value={stats.mealPlansCreated}
                icon="restaurant"
                color={Colors.accent}
              />
              <StatCard
                title="Calorie Adherence"
                value={stats.averageCalorieAdherence}
                icon="local-fire-department"
                color={Colors.warning}
                unit="%"
              />
              <StatCard
                title="Macro Accuracy"
                value={stats.averageMacroAccuracy}
                icon="pie-chart"
                color={Colors.secondary}
                unit="%"
              />
              <StatCard
                title="Satisfaction"
                value={stats.clientSatisfaction}
                icon="star"
                color={Colors.error}
                unit="/5"
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowMealPlanModal(true)}
                >
                  <MaterialIcons name="add" size={24} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Create Meal Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="analytics" size={24} color={Colors.success} />
                  <Text style={styles.actionButtonText}>View Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="restaurant-menu" size={24} color={Colors.accent} />
                  <Text style={styles.actionButtonText}>Recipe Database</Text>
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
                    <View style={styles.nutritionProgress}>
                      <View style={styles.calorieProgress}>
                        <Text style={styles.progressLabel}>Calories</Text>
                        <View style={styles.progressBar}>
                          <View style={[
                            styles.progressFill, 
                            { 
                              width: `${Math.min((client.current_calories / client.target_calories) * 100, 100)}%`,
                              backgroundColor: client.current_calories > client.target_calories * 1.1 ? Colors.error : Colors.success
                            }
                          ]} />
                        </View>
                        <Text style={styles.progressText}>
                          {client.current_calories} / {client.target_calories}
                        </Text>
                      </View>
                      <View style={styles.macroAdherence}>
                        <Text style={styles.progressLabel}>Macro Adherence</Text>
                        <Text style={[
                          styles.adherenceText,
                          { color: client.macro_adherence >= 80 ? Colors.success : Colors.warning }
                        ]}>
                          {client.macro_adherence}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.lastLog}>Last log: {client.last_log}</Text>
                    {client.dietary_restrictions && client.dietary_restrictions.length > 0 && (
                      <Text style={styles.restrictions}>
                        Restrictions: {client.dietary_restrictions.join(', ')}
                      </Text>
                    )}
                  </View>
                  <View style={styles.clientActions}>
                    <TouchableOpacity
                      style={styles.aiButton}
                      onPress={() => createNutritionPlan(client.id)}
                    >
                      <MaterialIcons name="psychology" size={16} color={Colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mealButton}>
                      <MaterialIcons name="restaurant" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.messageButton}>
                      <MaterialIcons name="message" size={16} color={Colors.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meal Plans Tab */}
        {activeTab === 'meals' && (
          <View style={styles.mealsTab}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meal Plans</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowMealPlanModal(true)}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Plan</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.emptyState}>
              <MaterialIcons name="restaurant" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No meal plans created yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first meal plan to start helping clients with nutrition</Text>
            </View>
          </View>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <View style={styles.analyticsTab}>
            <Text style={styles.sectionTitle}>Nutrition Analytics</Text>
            
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Average Calorie Adherence</Text>
              <Text style={styles.analyticsValue}>{stats.averageCalorieAdherence}%</Text>
              <Text style={styles.analyticsDescription}>
                Clients meeting their daily calorie targets
              </Text>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Macro Balance Accuracy</Text>
              <Text style={styles.analyticsValue}>{stats.averageMacroAccuracy}%</Text>
              <Text style={styles.analyticsDescription}>
                Accuracy in meeting protein, carbs, and fat ratios
              </Text>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Client Satisfaction</Text>
              <Text style={styles.analyticsValue}>{stats.clientSatisfaction}/5</Text>
              <Text style={styles.analyticsDescription}>
                Average rating from nutrition coaching sessions
              </Text>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Most Common Goals</Text>
              <Text style={styles.analyticsValue}>Weight Loss</Text>
              <Text style={styles.analyticsDescription}>
                65% of clients focus on weight management
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Meal Plan Creation Modal */}
      <Modal visible={showMealPlanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Meal Plan</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Plan Name"
              value={newMealPlan.name}
              onChangeText={(text) => setNewMealPlan(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={newMealPlan.description}
              onChangeText={(text) => setNewMealPlan(prev => ({ ...prev, description: text }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Target Calories"
              keyboardType="numeric"
              value={newMealPlan.calories.toString()}
              onChangeText={(text) => setNewMealPlan(prev => ({ ...prev, calories: parseInt(text) || 0 }))}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMealPlanModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButtonModal]}
                onPress={() => {
                  setShowMealPlanModal(false);
                  showWebAlert('Success', 'Meal plan created successfully!');
                }}
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
    marginBottom: Sizes.sm,
  },
  nutritionProgress: {
    marginBottom: Sizes.sm,
  },
  calorieProgress: {
    marginBottom: Sizes.xs,
  },
  progressLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  macroAdherence: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  lastLog: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  restrictions: {
    fontSize: Fonts.sizes.xs,
    color: Colors.warning,
    fontStyle: 'italic',
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.sm,
  },
  aiButton: {
    padding: Sizes.xs,
  },
  mealButton: {
    padding: Sizes.xs,
  },
  messageButton: {
    padding: Sizes.xs,
  },
  mealsTab: {
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