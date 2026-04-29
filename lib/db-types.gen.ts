export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ingredient_help: {
        Row: {
          allergy_warnings: Json
          best_options: Json
          key: string
          regions: Json
          substitutes: Json
          tips: Json
          title: string
          updated_at: string
          video_url: string | null
          what: string
          where_to_find: Json
          why_it_works: string | null
        }
        Insert: {
          allergy_warnings?: Json
          best_options?: Json
          key: string
          regions?: Json
          substitutes?: Json
          tips?: Json
          title: string
          updated_at?: string
          video_url?: string | null
          what: string
          where_to_find?: Json
          why_it_works?: string | null
        }
        Update: {
          allergy_warnings?: Json
          best_options?: Json
          key?: string
          regions?: Json
          substitutes?: Json
          tips?: Json
          title?: string
          updated_at?: string
          video_url?: string | null
          what?: string
          where_to_find?: Json
          why_it_works?: string | null
        }
        Relationships: []
      }
      recipe_benefits: {
        Row: {
          benefits: Json
          best_for: Json
          recipe_id: string
          updated_at: string
          use_frequency: string | null
          why_it_works: string | null
        }
        Insert: {
          benefits?: Json
          best_for?: Json
          recipe_id: string
          updated_at?: string
          use_frequency?: string | null
          why_it_works?: string | null
        }
        Update: {
          benefits?: Json
          best_for?: Json
          recipe_id?: string
          updated_at?: string
          use_frequency?: string | null
          why_it_works?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_benefits_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_shelf_life: {
        Row: {
          badges: Database["public"]["Enums"]["shelf_life_badge"][]
          best_kept: string | null
          duration: string
          notes: Json
          recipe_id: string
          storage: string
          updated_at: string
        }
        Insert: {
          badges?: Database["public"]["Enums"]["shelf_life_badge"][]
          best_kept?: string | null
          duration: string
          notes?: Json
          recipe_id: string
          storage: string
          updated_at?: string
        }
        Update: {
          badges?: Database["public"]["Enums"]["shelf_life_badge"][]
          best_kept?: string | null
          duration?: string
          notes?: Json
          recipe_id?: string
          storage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_shelf_life_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_user_id: string | null
          category_key: Database["public"]["Enums"]["recipe_category_key"]
          category_label: string
          cost_savings: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["recipe_difficulty"]
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_published: boolean
          numeric_id: number | null
          pantry_magic: boolean
          safe_for_kids: boolean
          search_tsv: unknown
          source: string
          tags: Json
          time_label: string
          title: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          category_key: Database["public"]["Enums"]["recipe_category_key"]
          category_label: string
          cost_savings?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["recipe_difficulty"]
          id: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_published?: boolean
          numeric_id?: number | null
          pantry_magic?: boolean
          safe_for_kids?: boolean
          search_tsv?: unknown
          source?: string
          tags?: Json
          time_label: string
          title: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          category_key?: Database["public"]["Enums"]["recipe_category_key"]
          category_label?: string
          cost_savings?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["recipe_difficulty"]
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_published?: boolean
          numeric_id?: number | null
          pantry_magic?: boolean
          safe_for_kids?: boolean
          search_tsv?: unknown
          source?: string
          tags?: Json
          time_label?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      retail_overrides: {
        Row: {
          high_usd: number
          label: string
          low_usd: number
          recipe_id: string
          updated_at: string
        }
        Insert: {
          high_usd: number
          label: string
          low_usd: number
          recipe_id: string
          updated_at?: string
        }
        Update: {
          high_usd?: number
          label?: string
          low_usd?: number
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retail_overrides_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_recipes: {
        Row: {
          last_made: string | null
          made_count: number
          note: string | null
          recipe_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          last_made?: string | null
          made_count?: number
          note?: string | null
          recipe_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          last_made?: string | null
          made_count?: number
          note?: string | null
          recipe_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avoidances: Json
          created_at: string
          display_name: string | null
          household: Json
          intent_categories: Json
          onboarding_complete: boolean
          onboarding_step: number
          priorities: Json
          region: string | null
          routine: Json
          scent_preferences: Json
          skin_profile: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          avoidances?: Json
          created_at?: string
          display_name?: string | null
          household?: Json
          intent_categories?: Json
          onboarding_complete?: boolean
          onboarding_step?: number
          priorities?: Json
          region?: string | null
          routine?: Json
          scent_preferences?: Json
          skin_profile?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          avoidances?: Json
          created_at?: string
          display_name?: string | null
          household?: Json
          intent_categories?: Json
          onboarding_complete?: boolean
          onboarding_step?: number
          priorities?: Json
          region?: string | null
          routine?: Json
          scent_preferences?: Json
          skin_profile?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_recipes: {
        Args: { max_results?: number; q: string }
        Returns: {
          author_user_id: string | null
          category_key: Database["public"]["Enums"]["recipe_category_key"]
          category_label: string
          cost_savings: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["recipe_difficulty"]
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_published: boolean
          numeric_id: number | null
          pantry_magic: boolean
          safe_for_kids: boolean
          search_tsv: unknown
          source: string
          tags: Json
          time_label: string
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "recipes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      recipe_category_key:
        | "cleaning"
        | "laundry"
        | "beauty-skincare"
        | "hair-care"
        | "baby-family-safe"
        | "home-air-freshening"
        | "pet-safe"
        | "garden-outdoor"
        | "seasonal-holiday"
        | "emergency-budget-hacks"
      recipe_difficulty: "Easy" | "Medium" | "Hard"
      shelf_life_badge:
        | "Pantry Stable"
        | "Refrigerate"
        | "Use Quickly"
        | "Shake Before Use"
        | "Sensitive to Heat"
        | "Keep Dry"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      recipe_category_key: [
        "cleaning",
        "laundry",
        "beauty-skincare",
        "hair-care",
        "baby-family-safe",
        "home-air-freshening",
        "pet-safe",
        "garden-outdoor",
        "seasonal-holiday",
        "emergency-budget-hacks",
      ],
      recipe_difficulty: ["Easy", "Medium", "Hard"],
      shelf_life_badge: [
        "Pantry Stable",
        "Refrigerate",
        "Use Quickly",
        "Shake Before Use",
        "Sensitive to Heat",
        "Keep Dry",
      ],
    },
  },
} as const
