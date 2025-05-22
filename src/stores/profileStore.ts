import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '../types/profile';

interface ProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  updateShippingInfo: (shippingInfo: Partial<UserProfile>) => Promise<void>;
}

const defaultProfile: UserProfile = {
  id: '',
  user_id: '',
  theme_preference: 'light',
  shipping_address: null,
  shipping_comuna: null,
  shipping_city: null,
  shipping_region: null,
  shipping_phone: null,
  contact_person: null,
  additional_notes: null
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,
      
      loadProfile: async () => {
        const { supabase, user } = window.authContext || {};
        if (!user) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            set({ profile: data as UserProfile });
          } else {
            const newProfile = {
              ...defaultProfile,
              user_id: user.id
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([newProfile])
              .select()
              .single();
              
            if (createError) throw createError;
            
            set({ profile: createdProfile as UserProfile });
          }
        } catch (error: any) {
          set({ error: error.message });
          console.error('Error loading profile:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateProfile: async (profileData) => {
        const { supabase, user } = window.authContext || {};
        const { profile } = get();
        
        if (!user || !profile) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('user_id', user.id);
            
          if (error) throw error;
          
          set({ profile: { ...profile, ...profileData } });
        } catch (error: any) {
          set({ error: error.message });
          console.error('Error updating profile:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateTheme: async (theme) => {
        const { updateProfile } = get();
        await updateProfile({ theme_preference: theme });
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      updateShippingInfo: async (shippingInfo) => {
        const { updateProfile } = get();
        await updateProfile(shippingInfo);
      }
    }),
    {
      name: 'profile-store',
      partialize: (state) => ({
        profile: state.profile
      })
    }
  )
);

declare global {
  interface Window {
    authContext: {
      supabase: any;
      user: any;
    };
  }
}
