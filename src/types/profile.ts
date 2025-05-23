export interface UserProfile {
  id: string;
  user_id: string;
  theme_preference: 'light' | 'dark';
  shipping_address: string | null;
  shipping_comuna: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_phone: string | null;
  contact_person: string | null;
  additional_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChileanRegion {
  id: string;
  name: string;
  comunas: ChileanComuna[];
}

export interface ChileanComuna {
  id: string;
  name: string;
  cities: string[];
}
