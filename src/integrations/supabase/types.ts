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
      _config: {
        Row: {
          created_at: string
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          name?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      business_reviews: {
        Row: {
          anonymous_id: string | null
          business_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      points_of_interest: {
        Row: {
          category: Database["public"]["Enums"]["poi_category"]
          created_at: string
          description: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          rating: number | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["poi_category"]
          created_at?: string
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          rating?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["poi_category"]
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      special_offers: {
        Row: {
          business_id: string
          created_at: string
          description: string
          end_date: string
          id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description: string
          end_date: string
          id?: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      test_heatspots: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string | null
          type: Database["public"]["Enums"]["heatspot_type"]
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name?: string | null
          type?: Database["public"]["Enums"]["heatspot_type"]
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string | null
          type?: Database["public"]["Enums"]["heatspot_type"]
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      tracking_settings: {
        Row: {
          background_enabled: boolean
          created_at: string
          high_accuracy: boolean
          status: Database["public"]["Enums"]["tracking_status"]
          updated_at: string
          user_id: string
          wake_lock_enabled: boolean
        }
        Insert: {
          background_enabled?: boolean
          created_at?: string
          high_accuracy?: boolean
          status?: Database["public"]["Enums"]["tracking_status"]
          updated_at?: string
          user_id: string
          wake_lock_enabled?: boolean
        }
        Update: {
          background_enabled?: boolean
          created_at?: string
          high_accuracy?: boolean
          status?: Database["public"]["Enums"]["tracking_status"]
          updated_at?: string
          user_id?: string
          wake_lock_enabled?: boolean
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          created_at: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          source: string | null
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          source?: string | null
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          source?: string | null
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_locations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      business_status: "pending" | "verified" | "rejected"
      heatspot_type: "test" | "real"
      poi_category: "bar" | "restaurant" | "hotel" | "plaza" | "mall"
      tracking_status: "active" | "paused" | "stopped"
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
    Enums: {
      business_status: ["pending", "verified", "rejected"],
      heatspot_type: ["test", "real"],
      poi_category: ["bar", "restaurant", "hotel", "plaza", "mall"],
      tracking_status: ["active", "paused", "stopped"],
    },
  },
} as const
