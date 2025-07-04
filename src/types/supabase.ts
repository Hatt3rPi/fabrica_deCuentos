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
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fulfillment_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_status: string | null
          id: string
          notes: string | null
          story_id: string | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          story_id?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          story_id?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fulfillment_history_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "pedidos_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_history_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          id: string
          order_id: string | null
          product_type_id: string | null
          quantity: number
          story_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          product_type_id?: string | null
          quantity?: number
          story_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          product_type_id?: string | null
          quantity?: number
          story_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "pedidos_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          expires_at: string | null
          fulfilled_at: string | null
          fulfillment_notes: string | null
          fulfillment_status: string | null
          id: string
          order_type: string | null
          paid_at: string | null
          payment_data: Json | null
          payment_method: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          expires_at?: string | null
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          fulfillment_status?: string | null
          id?: string
          order_type?: string | null
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          expires_at?: string | null
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          fulfillment_status?: string | null
          id?: string
          order_type?: string | null
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_percentage: number | null
          final_price: number | null
          id: string
          notes: string | null
          price: number
          product_type_id: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_percentage?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          price: number
          product_type_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_percentage?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          price?: number
          product_type_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_prices_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
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
          {
            foreignKeyName: "prompt_metrics_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
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
          height: number | null
          id: string
          model: string | null
          quality: string | null
          size: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
          version: number
          width: number | null
        }
        Insert: {
          content: string
          endpoint?: string | null
          height?: number | null
          id?: string
          model?: string | null
          quality?: string | null
          size?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
          width?: number | null
        }
        Update: {
          content?: string
          endpoint?: string | null
          height?: number | null
          id?: string
          model?: string | null
          quality?: string | null
          size?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipping_info: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          courier: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_notes: string | null
          estimated_delivery: string | null
          id: string
          postal_code: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          region: string | null
          story_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          courier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          estimated_delivery?: string | null
          id?: string
          postal_code?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          region?: string | null
          story_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          courier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          estimated_delivery?: string | null
          id?: string
          postal_code?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          region?: string | null
          story_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_info_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "pedidos_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_info_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          additional_details: string | null
          central_message: string | null
          completed_at: string | null
          created_at: string | null
          dedicatoria_background_url: string | null
          dedicatoria_chosen: boolean | null
          dedicatoria_image_url: string | null
          dedicatoria_layout: Json | null
          dedicatoria_text: string | null
          export_url: string | null
          exported_at: string | null
          fulfillment_status: string | null
          id: string
          literary_style: string | null
          loader: Json | null
          loaders: Json | null
          pdf_generated_at: string | null
          pdf_url: string | null
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
          completed_at?: string | null
          created_at?: string | null
          dedicatoria_background_url?: string | null
          dedicatoria_chosen?: boolean | null
          dedicatoria_image_url?: string | null
          dedicatoria_layout?: Json | null
          dedicatoria_text?: string | null
          export_url?: string | null
          exported_at?: string | null
          fulfillment_status?: string | null
          id?: string
          literary_style?: string | null
          loader?: Json | null
          loaders?: Json | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
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
          completed_at?: string | null
          created_at?: string | null
          dedicatoria_background_url?: string | null
          dedicatoria_chosen?: boolean | null
          dedicatoria_image_url?: string | null
          dedicatoria_layout?: Json | null
          dedicatoria_text?: string | null
          export_url?: string | null
          exported_at?: string | null
          fulfillment_status?: string | null
          id?: string
          literary_style?: string | null
          loader?: Json | null
          loaders?: Json | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status?: string
          target_age?: string | null
          theme?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          wizard_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
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
            referencedRelation: "pedidos_view"
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
            referencedRelation: "pedidos_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "pedidos_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_style_configs: {
        Row: {
          cover_background_url: string | null
          cover_config: Json
          cover_sample_text: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          page_background_url: string | null
          page_config: Json
          page_sample_text: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          cover_background_url?: string | null
          cover_config?: Json
          cover_sample_text?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          page_background_url?: string | null
          page_config?: Json
          page_sample_text?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          cover_background_url?: string | null
          cover_config?: Json
          cover_sample_text?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          page_background_url?: string | null
          page_config?: Json
          page_sample_text?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "story_style_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      story_style_templates: {
        Row: {
          category: string
          config_data: Json
          created_at: string | null
          custom_images: Json | null
          custom_texts: Json | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          thumbnail_url: string | null
        }
        Insert: {
          category: string
          config_data: Json
          created_at?: string | null
          custom_images?: Json | null
          custom_texts?: Json | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          thumbnail_url?: string | null
        }
        Update: {
          category?: string
          config_data?: Json
          created_at?: string | null
          custom_images?: Json | null
          custom_texts?: Json | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          thumbnail_url?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_role_history: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          ip_address: unknown | null
          new_state: Json | null
          previous_state: Json | null
          reason: string | null
          role: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: unknown | null
          new_state?: Json | null
          previous_state?: Json | null
          reason?: string | null
          role: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: unknown | null
          new_state?: Json | null
          previous_state?: Json | null
          reason?: string | null
          role?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_role_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      orders_with_items: {
        Row: {
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          id: string | null
          items: Json | null
          order_type: string | null
          paid_at: string | null
          payment_method: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pedidos_view: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          completed_at: string | null
          courier: string | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          export_url: string | null
          exported_at: string | null
          fulfillment_status: string | null
          history: Json | null
          id: string | null
          postal_code: string | null
          recipient_name: string | null
          recipient_phone: string | null
          region: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_comuna: string | null
          shipping_phone: string | null
          shipping_region: string | null
          status: string | null
          title: string | null
          tracking_number: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users_with_roles: {
        Row: {
          active_roles: string[] | null
          email: string | null
          is_admin: boolean | null
          is_operator: boolean | null
          is_user: boolean | null
          roles: Json | null
          user_created_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_style_config: {
        Args: { style_id: string }
        Returns: undefined
      }
      activate_template: {
        Args: { template_id: string }
        Returns: boolean
      }
      assign_role: {
        Args: {
          target_user_id: string
          new_role: string
          expires_at_param?: string
          notes_param?: string
        }
        Returns: boolean
      }
      cleanup_expired_roles: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_image_access_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
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
      detect_suspicious_image_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          ip_address: unknown
          request_count: number
          unique_files: number
          time_period: string
          risk_level: string
        }[]
      }
      generate_reset_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_story_style: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_price: {
        Args: { p_product_type_id: string }
        Returns: {
          price: number
          final_price: number
          currency: string
        }[]
      }
      get_default_product_type: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          category: string
        }[]
      }
      get_image_access_stats: {
        Args: { p_user_id?: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          total_requests: number
          unique_files: number
          watermarked_requests: number
          avg_processing_time_ms: number
          top_files: Json
          hourly_distribution: Json
        }[]
      }
      get_pending_fulfillment_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          user_id: string
          user_email: string
          total_amount: number
          paid_at: string
          story_ids: string[]
        }[]
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
      get_user_roles: {
        Args: { target_user_id?: string }
        Returns: {
          role: string
          granted_at: string
          expires_at: string
          notes: string
        }[]
      }
      has_any_role: {
        Args: { check_roles: string[] }
        Returns: boolean
      }
      has_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      has_role: {
        Args: { check_role: string }
        Returns: boolean
      }
      link_character_to_story: {
        Args: { p_story_id: string; p_character_id: string; p_user_id: string }
        Returns: undefined
      }
      process_order_payment: {
        Args: {
          p_order_id: string
          p_payment_method: string
          p_payment_data?: Json
        }
        Returns: Json
      }
      reset_password: {
        Args: { p_token: string; p_new_password: string }
        Returns: undefined
      }
      revert_prompt_version: {
        Args: { p_id: string; p_version: number }
        Returns: undefined
      }
      revoke_role: {
        Args: {
          target_user_id: string
          role_to_revoke: string
          reason_param?: string
        }
        Returns: boolean
      }
      update_fulfillment_status: {
        Args: {
          p_story_id: string
          p_new_status: string
          p_user_id: string
          p_notes?: string
        }
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
