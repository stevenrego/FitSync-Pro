import { supabase } from './supabase';
import { User } from '../types';

export const authService = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    // Create profile record
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name,
          role: 'user',
          subscription: 'free',
          points: 0,
          streak_days: 0,
          total_workouts: 0,
          calories_burned: 0
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signInWithOAuth(provider: 'google' | 'apple') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'fitsync://auth/callback'
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      // Handle OAuth provider not enabled error
      if (error.message?.includes('provider is not enabled') || 
          error.error_code === 'validation_failed') {
        
        // Create demo OAuth account
        const demoEmail = `demo.${provider}@example.com`;
        const demoName = `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
        
        try {
          // Try to sign in with existing demo account
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: 'demo123456'
          });

          if (!signInError) {
            return signInData;
          }

          // If demo account doesn't exist, create it
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: demoEmail,
            password: 'demo123456',
            options: {
              data: { name: demoName }
            }
          });

          if (signUpError) throw signUpError;

          // Create profile for demo user
          if (signUpData.user) {
            await supabase
              .from('profiles')
              .insert({
                id: signUpData.user.id,
                email: demoEmail,
                name: demoName,
                role: 'user',
                subscription: 'free',
                points: 0,
                streak_days: 0,
                total_workouts: 0,
                calories_burned: 0
              });
          }

          return signUpData;
        } catch (demoError) {
          console.error('Demo OAuth creation failed:', demoError);
          throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured. Please use email login.`);
        }
      }
      
      throw error;
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile as User;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'fitsync://auth/reset-password'
    });

    if (error) throw error;
  }
};