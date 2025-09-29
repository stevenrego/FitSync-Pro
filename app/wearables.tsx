import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { wearableService, WearableDevice, HealthData } from '../services/wearables';
import GradientButton from '../components/ui/GradientButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Colors, Sizes, Fonts } from '../constants/theme';

export default function WearablesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadWearableData();
  }, []);

  const loadWearableData = async () => {
    try {
      setIsLoading(true);
      const [supportedDevices, connectedDevices, recentHealthData] = await Promise.all([
        wearableService.checkDeviceSupport(),
        wearableService.getConnectedDevices(),
        wearableService.getHealthData(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        )
      ]);

      // Merge supported devices with connection status
      const mergedDevices = supportedDevices.map(device => {
        const connected = connectedDevices.find(c => c.type === device.type);
        return {
          ...device,
          connected: !!connected,
          lastSync: connected?.lastSync
        };
      });

      setDevices(mergedDevices);
      setHealthData(recentHealthData);
    } catch (error) {
      console.error('Error loading wearable data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceConnection = async (deviceType: string, connect: boolean) => {
    try {
      setIsLoading(true);

      if (connect) {
        let success = false;
        switch (deviceType) {
          case 'apple_health':
            success = await wearableService.connectAppleHealth();
            break;
          case 'google_fit':
            success = await wearableService.connectGoogleFit();
            break;
          case 'fitbit':
            success = await wearableService.connectFitbit();
            break;
          case 'garmin':
            success = await wearableService.connectGarmin();
            break;
          case 'whoop':
            success = await wearableService.connectWhoop();
            break;
        }

        if (success) {
          showAlert('Success', `${getDeviceName(deviceType)} connected successfully!`);
        } else {
          showAlert('Error', `Failed to connect ${getDeviceName(deviceType)}`);
        }
      } else {
        await wearableService.disconnectDevice(deviceType);
        showAlert('Success', `${getDeviceName(deviceType)} disconnected`);
      }

      await loadWearableData();
    } catch (error) {
      console.error('Error handling device connection:', error);
      showAlert('Error', error.message || 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    try {
      setSyncing(true);
      const syncedData = await wearableService.syncHealthData();
      
      if (syncedData.length > 0) {
        showAlert('Success', `Synced data from ${syncedData.length} device(s)`);
        await loadWearableData();
      } else {
        showAlert('Info', 'No new data to sync');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      showAlert('Error', 'Failed to sync health data');
    } finally {
      setSyncing(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getDeviceName = (type: string): string => {
    switch (type) {
      case 'apple_health': return 'Apple Health';
      case 'google_fit': return 'Google Fit';
      case 'fitbit': return 'Fitbit';
      case 'garmin': return 'Garmin';
      case 'whoop': return 'WHOOP';
      default: return type;
    }
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'apple_health': return 'favorite';
      case 'google_fit': return 'directions-run';
      case 'fitbit': return 'watch';
      case 'garmin': return 'watch';
      case 'whoop': return 'fitness-center';
      default: return 'device-unknown';
    }
  };

  const getLatestHealthData = (): HealthData | null => {
    if (healthData.length === 0) return null;
    return healthData.reduce((latest, data) => 
      new Date(data.date) > new Date(latest.date) ? data : latest
    );
  };

  if (isLoading && devices.length === 0) {
    return <LoadingSpinner text="Loading wearable devices..." />;
  }

  const latestData = getLatestHealthData();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Wearable Devices</Text>
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSyncData}
          disabled={syncing}
        >
          <MaterialIcons 
            name="sync" 
            size={24} 
            color={syncing ? Colors.textSecondary : Colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Health Data Summary */}
        {latestData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Health Data</Text>
            <View style={styles.healthSummary}>
              <View style={styles.healthMetric}>
                <MaterialIcons name="directions-walk" size={24} color={Colors.primary} />
                <Text style={styles.metricValue}>{latestData.steps?.toLocaleString() || '0'}</Text>
                <Text style={styles.metricLabel}>Steps</Text>
              </View>
              <View style={styles.healthMetric}>
                <MaterialIcons name="local-fire-department" size={24} color={Colors.error} />
                <Text style={styles.metricValue}>{latestData.calories?.toLocaleString() || '0'}</Text>
                <Text style={styles.metricLabel}>Calories</Text>
              </View>
              <View style={styles.healthMetric}>
                <MaterialIcons name="straighten" size={24} color={Colors.success} />
                <Text style={styles.metricValue}>{latestData.distance?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.metricLabel}>Distance (km)</Text>
              </View>
              <View style={styles.healthMetric}>
                <MaterialIcons name="favorite" size={24} color={Colors.accent} />
                <Text style={styles.metricValue}>{latestData.heartRate || '--'}</Text>
                <Text style={styles.metricLabel}>Heart Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Connected Devices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          
          {devices.map((device) => (
            <View key={device.type} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIcon}>
                  <MaterialIcons 
                    name={getDeviceIcon(device.type) as any} 
                    size={32} 
                    color={device.connected ? Colors.success : Colors.textSecondary} 
                  />
                </View>
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>{getDeviceName(device.type)}</Text>
                  <Text style={styles.deviceStatus}>
                    {device.connected ? 'Connected' : 'Not Connected'}
                  </Text>
                  {device.lastSync && (
                    <Text style={styles.lastSync}>
                      Last sync: {new Date(device.lastSync).toLocaleDateString()}
                    </Text>
                  )}
                  {device.permissions && (
                    <Text style={styles.permissions}>
                      Tracks: {device.permissions.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
              
              <Switch
                value={device.connected}
                onValueChange={(value) => handleDeviceConnection(device.type, value)}
                trackColor={{ false: Colors.textSecondary, true: Colors.success }}
                thumbColor={device.connected ? 'white' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Sync Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Synchronization</Text>
          
          <View style={styles.syncCard}>
            <MaterialIcons name="sync" size={32} color={Colors.primary} />
            <View style={styles.syncInfo}>
              <Text style={styles.syncTitle}>Automatic Sync</Text>
              <Text style={styles.syncDescription}>
                Your health data syncs automatically every hour when connected devices are available.
              </Text>
            </View>
          </View>

          <GradientButton
            title={syncing ? "Syncing..." : "Sync Now"}
            onPress={handleSyncData}
            disabled={syncing || devices.filter(d => d.connected).length === 0}
            gradient={Colors.gradient.primary}
            style={styles.syncButton}
          />
        </View>

        {/* Health Data History */}
        {healthData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            
            {healthData.slice(0, 7).map((data, index) => (
              <View key={`${data.date}-${index}`} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(data.date).toLocaleDateString()}
                </Text>
                <View style={styles.historyMetrics}>
                  <Text style={styles.historyMetric}>
                    {data.steps?.toLocaleString() || '0'} steps
                  </Text>
                  <Text style={styles.historyMetric}>
                    {data.calories?.toLocaleString() || '0'} cal
                  </Text>
                  <Text style={styles.historyMetric}>
                    {data.distance?.toFixed(1) || '0.0'} km
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Privacy Notice */}
        <View style={styles.section}>
          <View style={styles.privacyCard}>
            <MaterialIcons name="security" size={24} color={Colors.warning} />
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyTitle}>Privacy & Security</Text>
              <Text style={styles.privacyText}>
                Your health data is encrypted and stored securely. You can disconnect devices at any time to stop data collection.
              </Text>
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Sizes.lg,
    paddingBottom: Sizes.md,
  },
  backButton: {
    padding: Sizes.sm,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: 'bold',
    color: Colors.text,
  },
  syncButton: {
    padding: Sizes.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Sizes.lg,
  },
  section: {
    marginBottom: Sizes.xl,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  healthSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    justifyContent: 'space-around',
  },
  healthMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Sizes.xs,
  },
  metricLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Sizes.xs,
  },
  deviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Sizes.md,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  deviceStatus: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  lastSync: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Sizes.xs,
  },
  permissions: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
  },
  syncCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sizes.md,
  },
  syncInfo: {
    flex: 1,
    marginLeft: Sizes.md,
  },
  syncTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  syncDescription: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  historyItem: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.sm,
  },
  historyDate: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  historyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMetric: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  privacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  privacyInfo: {
    flex: 1,
    marginLeft: Sizes.md,
  },
  privacyTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  privacyText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});