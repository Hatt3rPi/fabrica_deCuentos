export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      character_thumbnails: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          style_type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          style_type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          style_type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_thumbnails_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: string | null
          back_view_url: string | null
          created_at: string | null
          description: Json
          frontal_view_url: string | null
          id: string
          name: string
          reference_urls: string[] | null
          side_view_url: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          back_view_url?: string | null
          created_at?: string | null
          description: Json
          frontal_view_url?: string | null
          id?: string
          name: string
          reference_urls?: string[] | null
          side_view_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          back_view_url?: string | null
          created_at?: string | null
          description?: Json
          frontal_view_url?: string | null
          id?: string
          name?: string
          reference_urls?: string[] | null
          side_view_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inflight_calls: {
        Row: {
          actividad: string | null
          etapa: string | null
          id: string
          inicio: string | null
          input: Json | null
          modelo: string | null
          user_id: string | null
        }
        Insert: {
          actividad?: string | null
          etapa?: string | null
          id?: string
          inicio?: string | null
          input?: Json | null
          modelo?: string | null
          user_id?: string | null
        }
        Update: {
          actividad?: string | null
          etapa?: string | null
          id?: string
          inicio?: string | null
          input?: Json | null
          modelo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actions: Json | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompt_metrics: {
        Row: {
          actividad: string | null
          edge_function: string | null
          error_type: string | null
          estado: string | null
          id: string
          metadatos: Json | null
          modelo_ia: string
          prompt_id: string | null
          tiempo_respuesta_ms: number | null
          timestamp: string | null
          tokens_entrada: number | null
          tokens_entrada_cacheados: number | null
          tokens_salida: number | null
          tokens_salida_cacheados: number | null
          usuario_id: string | null
        }
        Insert: {
          actividad?: string | null
          edge_function?: string | null
          error_type?: string | null
          estado?: string | null
          id?: string
          metadatos?: Json | null
          modelo_ia: string
          prompt_id?: string | null
          tiempo_respuesta_ms?: number | null
          timestamp?: string | null
          tokens_entrada?: number | null
          tokens_entrada_cacheados?: number | null
          tokens_salida?: number | null
          tokens_salida_cacheados?: number | null
          usuario_id?: string | null
        }
        Update: {
          actividad?: string | null
          edge_function?: string | null
          error_type?: string | null
          estado?: string | null
          id?: string
          metadatos?: Json | null
          modelo_ia?: string
          prompt_id?: string | null
          tiempo_respuesta_ms?: number | null
          timestamp?: string | null
          tokens_entrada?: number | null
          tokens_entrada_cacheados?: number | null
          tokens_salida?: number | null
          tokens_salida_cacheados?: number | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_metrics_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          prompt_id: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt_id?: string | null
          version: number
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          content: string
          endpoint: string | null
          id: string
          model: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          content: string
          endpoint?: string | null
          id?: string
          model?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: string
          endpoint?: string | null
          id?: string
          model?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      stories: {
        Row: {
          additional_details: string | null
          central_message: string | null
          created_at: string | null
          id: string
          literary_style: string | null
          loader: Json | null
          loaders: Json | null
          status: string
          target_age: string | null
          theme: string | null
          title: string
          updated_at: string | null
          user_id: string
          wizard_state: Json | null
        }
        Insert: {
          additional_details?: string | null
          central_message?: string | null
          created_at?: string | null
          id?: string
          literary_style?: string | null
          loader?: Json | null
          loaders?: Json | null
          status?: string
          target_age?: string | null
          theme?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          wizard_state?: Json | null
        }
        Update: {
          additional_details?: string | null
          central_message?: string | null
          created_at?: string | null
          id?: string
          literary_style?: string | null
          loader?: Json | null
          loaders?: Json | null
          status?: string
          target_age?: string | null
          theme?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          wizard_state?: Json | null
        }
        Relationships: []
      }
      story_characters: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          story_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          story_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_characters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_designs: {
        Row: {
          color_palette: string
          created_at: string | null
          id: string
          story_id: string
          updated_at: string | null
          visual_style: string
        }
        Insert: {
          color_palette: string
          created_at?: string | null
          id?: string
          story_id: string
          updated_at?: string | null
          visual_style: string
        }
        Update: {
          color_palette?: string
          created_at?: string | null
          id?: string
          story_id?: string
          updated_at?: string | null
          visual_style?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_designs_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_pages: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          page_number: number
          prompt: string
          story_id: string
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          page_number: number
          prompt: string
          story_id: string
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          page_number?: number
          prompt?: string
          story_id?: string
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          notification_preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          additional_notes: string | null
          contact_person: string | null
          created_at: string | null
          id: string
          shipping_address: string | null
          shipping_city: string | null
          shipping_comuna: string | null
          shipping_phone: string | null
          shipping_region: string | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_comuna?: string | null
          shipping_phone?: string | null
          shipping_region?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_comuna?: string | null
          shipping_phone?: string | null
          shipping_region?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_user_content: {
        Args: { p_email: string } | { user_id: string }
        Returns: string
      }
      create_reset_token: {
        Args: { user_email: string }
        Returns: string
      }
      delete_full_story: {
        Args: { story_id: string }
        Returns: string[]
      }
      delete_story_preserve_characters: {
        Args: { p_story_id: string }
        Returns: string[]
      }
      generate_reset_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          user_id: string
          user_email: string
        }[]
      }
      get_user_id_by_email: {
        Args: { p_email: string }
        Returns: string
      }
      link_character_to_story: {
        Args: { p_story_id: string; p_character_id: string; p_user_id: string }
        Returns: undefined
      }
      reset_password: {
        Args: { p_token: string; p_new_password: string }
        Returns: undefined
      }
      revert_prompt_version: {
        Args: { p_id: string; p_version: number }
        Returns: undefined
      }
      wizard_state_rank: {
        Args: { p_state: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
