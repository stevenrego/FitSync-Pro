import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface HealthData {
  steps?: number;
  distance?: number;
  calories?: number;
  heartRate?: number;
  sleepHours?: number;
  activeMinutes?: number;
  date: string;
}

export interface WearableDevice {
  type: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'whoop';
  connected: boolean;
  lastSync?: string;
  permissions?: string[];
}

export const wearableService = {
  // Check device availability and permissions
  async checkDeviceSupport(): Promise<WearableDevice[]> {
    const devices: WearableDevice[] = [];

    if (Platform.OS === 'ios') {
      devices.push({
        type: 'apple_health',
        connected: false, // Would check AppleHealthKit availability
        permissions: ['steps', 'distance', 'calories', 'heartRate']
      });
    }

    if (Platform.OS === 'android') {
      devices.push({
        type: 'google_fit',
        connected: false, // Would check Google Fit availability
        permissions: ['steps', 'distance', 'calories', 'heartRate']
      });
    }

    // External wearables (available on both platforms)
    devices.push(
      {
        type: 'fitbit',
        connected: false,
        permissions: ['steps', 'distance', 'calories', 'heartRate', 'sleep']
      },
      {
        type: 'garmin',
        connected: false,
        permissions: ['steps', 'distance', 'calories', 'heartRate', 'activeMinutes']
      },
      {
        type: 'whoop',
        connected: false,
        permissions: ['heartRate', 'sleep', 'recovery', 'strain']
      }
    );

    return devices;
  },

  // Connect to Apple Health (iOS only)
  async connectAppleHealth(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Health is only available on iOS');
    }

    try {
      // Mock implementation - in real app would use react-native-health
      console.log('Connecting to Apple Health...');
      
      // Would request permissions here
      const permissions = {
        permissions: {
          read: ['Steps', 'Distance', 'Calories', 'HeartRate'],
          write: ['Steps', 'Calories']
        }
      };

      // Simulate successful connection
      await this.saveDeviceConnection('apple_health', true);
      return true;
    } catch (error) {
      console.error('Apple Health connection failed:', error);
      return false;
    }
  },

  // Connect to Google Fit (Android only)
  async connectGoogleFit(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('Google Fit is only available on Android');
    }

    try {
      // Mock implementation - in real app would use @react-native-google-fit/google-fit
      console.log('Connecting to Google Fit...');
      
      // Would request permissions here
      const scopes = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.location.read'
      ];

      // Simulate successful connection
      await this.saveDeviceConnection('google_fit', true);
      return true;
    } catch (error) {
      console.error('Google Fit connection failed:', error);
      return false;
    }
  },

  // Connect to Fitbit via OAuth
  async connectFitbit(): Promise<boolean> {
    try {
      // Mock implementation - would use Fitbit Web API
      console.log('Connecting to Fitbit...');
      
      // Would open OAuth flow here
      const authUrl = 'https://www.fitbit.com/oauth2/authorize?client_id=...';
      
      // Simulate successful OAuth
      await this.saveDeviceConnection('fitbit', true);
      return true;
    } catch (error) {
      console.error('Fitbit connection failed:', error);
      return false;
    }
  },

  // Connect to Garmin Connect IQ
  async connectGarmin(): Promise<boolean> {
    try {
      // Mock implementation - would use Garmin Connect IQ API
      console.log('Connecting to Garmin...');
      
      await this.saveDeviceConnection('garmin', true);
      return true;
    } catch (error) {
      console.error('Garmin connection failed:', error);
      return false;
    }
  },

  // Connect to WHOOP
  async connectWhoop(): Promise<boolean> {
    try {
      // Mock implementation - would use WHOOP API
      console.log('Connecting to WHOOP...');
      
      await this.saveDeviceConnection('whoop', true);
      return true;
    } catch (error) {
      console.error('WHOOP connection failed:', error);
      return false;
    }
  },

  // Save device connection status
  async saveDeviceConnection(deviceType: string, connected: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('wearable_connections')
      .upsert({
        user_id: user.id,
        device_type: deviceType,
        connected: connected,
        last_sync: connected ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,device_type' 
      });

    if (error) throw error;
  },

  // Get user's connected devices
  async getConnectedDevices(): Promise<WearableDevice[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('connected', true);

    if (error) {
      console.error('Error loading connected devices:', error);
      return [];
    }

    return data?.map(connection => ({
      type: connection.device_type as any,
      connected: connection.connected,
      lastSync: connection.last_sync
    })) || [];
  },

  // Sync health data from connected devices
  async syncHealthData(): Promise<HealthData[]> {
    const connectedDevices = await this.getConnectedDevices();
    const healthData: HealthData[] = [];
    
    for (const device of connectedDevices) {
      try {
        let deviceData: HealthData | null = null;

        switch (device.type) {
          case 'apple_health':
            deviceData = await this.syncAppleHealthData();
            break;
          case 'google_fit':
            deviceData = await this.syncGoogleFitData();
            break;
          case 'fitbit':
            deviceData = await this.syncFitbitData();
            break;
          case 'garmin':
            deviceData = await this.syncGarminData();
            break;
          case 'whoop':
            deviceData = await this.syncWhoopData();
            break;
        }

        if (deviceData) {
          healthData.push(deviceData);
          await this.saveHealthData(deviceData, device.type);
        }
      } catch (error) {
        console.error(`Error syncing ${device.type}:`, error);
      }
    }

    return healthData;
  },

  // Sync Apple Health data
  async syncAppleHealthData(): Promise<HealthData | null> {
    // Mock implementation - would use react-native-health
    return {
      steps: Math.floor(8000 + Math.random() * 4000),
      distance: Math.floor(5 + Math.random() * 3),
      calories: Math.floor(2000 + Math.random() * 500),
      heartRate: Math.floor(70 + Math.random() * 20),
      date: new Date().toISOString().split('T')[0]
    };
  },

  // Sync Google Fit data
  async syncGoogleFitData(): Promise<HealthData | null> {
    // Mock implementation - would use Google Fit API
    return {
      steps: Math.floor(7500 + Math.random() * 5000),
      distance: Math.floor(4 + Math.random() * 4),
      calories: Math.floor(1800 + Math.random() * 600),
      activeMinutes: Math.floor(30 + Math.random() * 60),
      date: new Date().toISOString().split('T')[0]
    };
  },

  // Sync Fitbit data
  async syncFitbitData(): Promise<HealthData | null> {
    // Mock implementation - would use Fitbit Web API
    return {
      steps: Math.floor(9000 + Math.random() * 3000),
      distance: Math.floor(6 + Math.random() * 2),
      calories: Math.floor(2200 + Math.random() * 300),
      heartRate: Math.floor(65 + Math.random() * 25),
      sleepHours: Math.floor(6 + Math.random() * 3),
      date: new Date().toISOString().split('T')[0]
    };
  },

  // Sync Garmin data
  async syncGarminData(): Promise<HealthData | null> {
    // Mock implementation - would use Garmin Connect IQ API
    return {
      steps: Math.floor(10000 + Math.random() * 2000),
      distance: Math.floor(7 + Math.random() * 3),
      calories: Math.floor(2400 + Math.random() * 400),
      heartRate: Math.floor(68 + Math.random() * 22),
      activeMinutes: Math.floor(45 + Math.random() * 45),
      date: new Date().toISOString().split('T')[0]
    };
  },

  // Sync WHOOP data
  async syncWhoopData(): Promise<HealthData | null> {
    // Mock implementation - would use WHOOP API
    return {
      heartRate: Math.floor(60 + Math.random() * 30),
      sleepHours: Math.floor(7 + Math.random() * 2),
      calories: Math.floor(2300 + Math.random() * 500),
      date: new Date().toISOString().split('T')[0]
    };
  },

  // Save health data to database
  async saveHealthData(data: HealthData, deviceType: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('health_data')
      .upsert({
        user_id: user.id,
        device_type: deviceType,
        date: data.date,
        steps: data.steps,
        distance: data.distance,
        calories: data.calories,
        heart_rate: data.heartRate,
        sleep_hours: data.sleepHours,
        active_minutes: data.activeMinutes,
        synced_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,device_type,date' 
      });

    if (error) throw error;
  },

  // Get health data for date range
  async getHealthData(startDate: string, endDate: string): Promise<HealthData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading health data:', error);
      return [];
    }

    return data?.map(item => ({
      steps: item.steps,
      distance: item.distance,
      calories: item.calories,
      heartRate: item.heart_rate,
      sleepHours: item.sleep_hours,
      activeMinutes: item.active_minutes,
      date: item.date
    })) || [];
  },

  // Disconnect a device
  async disconnectDevice(deviceType: string): Promise<void> {
    await this.saveDeviceConnection(deviceType, false);
  },

  // Get sync status for all devices
  async getSyncStatus(): Promise<Record<string, boolean>> {
    const devices = await this.getConnectedDevices();
    const status: Record<string, boolean> = {};
    
    for (const device of devices) {
      if (device.lastSync) {
        const lastSyncDate = new Date(device.lastSync);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
        status[device.type] = hoursSinceSync < 24; // Consider synced if within 24 hours
      } else {
        status[device.type] = false;
      }
    }
    
    return status;
  }
};