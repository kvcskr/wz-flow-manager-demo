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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ceny_klientow: {
        Row: {
          cena_jednostkowa: number
          id: string
          klient_id: string
          produkt_id: string
        }
        Insert: {
          cena_jednostkowa?: number
          id?: string
          klient_id: string
          produkt_id: string
        }
        Update: {
          cena_jednostkowa?: number
          id?: string
          klient_id?: string
          produkt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ceny_klientow_klient_id_fkey"
            columns: ["klient_id"]
            isOneToOne: false
            referencedRelation: "klienci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceny_klientow_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkty"
            referencedColumns: ["id"]
          },
        ]
      }
      dokumenty_wz: {
        Row: {
          data: string
          id: string
          klient_id: string | null
          org_id: string
          utworzono: string | null
          wystawil: string | null
        }
        Insert: {
          data?: string
          id?: string
          klient_id?: string | null
          org_id: string
          utworzono?: string | null
          wystawil?: string | null
        }
        Update: {
          data?: string
          id?: string
          klient_id?: string | null
          org_id?: string
          utworzono?: string | null
          wystawil?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dokumenty_wz_klient_id_fkey"
            columns: ["klient_id"]
            isOneToOne: false
            referencedRelation: "klienci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dokumenty_wz_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacje"
            referencedColumns: ["id"]
          },
        ]
      }
      klienci: {
        Row: {
          aktywny: boolean | null
          id: string
          nazwa: string
          nip: string | null
          org_id: string
          utworzono: string | null
        }
        Insert: {
          aktywny?: boolean | null
          id?: string
          nazwa: string
          nip?: string | null
          org_id: string
          utworzono?: string | null
        }
        Update: {
          aktywny?: boolean | null
          id?: string
          nazwa?: string
          nip?: string | null
          org_id?: string
          utworzono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "klienci_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacje"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacje: {
        Row: {
          email_kontaktowy: string | null
          id: string
          nazwa: string
          nazwa_na_wz: string
          nip: string | null
          nip_na_wz: string
          subscription_expires_at: string | null
          subscription_status: string
          utworzono: string | null
        }
        Insert: {
          email_kontaktowy?: string | null
          id?: string
          nazwa: string
          nazwa_na_wz?: string
          nip?: string | null
          nip_na_wz?: string
          subscription_expires_at?: string | null
          subscription_status?: string
          utworzono?: string | null
        }
        Update: {
          email_kontaktowy?: string | null
          id?: string
          nazwa?: string
          nazwa_na_wz?: string
          nip?: string | null
          nip_na_wz?: string
          subscription_expires_at?: string | null
          subscription_status?: string
          utworzono?: string | null
        }
        Relationships: []
      }
      pozycje_wz: {
        Row: {
          cena_snapshot: number | null
          id: string
          produkt_id: string | null
          wydano: number
          wz_id: string
          zwrocono: number
        }
        Insert: {
          cena_snapshot?: number | null
          id?: string
          produkt_id?: string | null
          wydano?: number
          wz_id: string
          zwrocono?: number
        }
        Update: {
          cena_snapshot?: number | null
          id?: string
          produkt_id?: string | null
          wydano?: number
          wz_id?: string
          zwrocono?: number
        }
        Relationships: [
          {
            foreignKeyName: "pozycje_wz_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pozycje_wz_wz_id_fkey"
            columns: ["wz_id"]
            isOneToOne: false
            referencedRelation: "dokumenty_wz"
            referencedColumns: ["id"]
          },
        ]
      }
      produkty: {
        Row: {
          aktywny: boolean | null
          id: string
          jednostka: string
          kolejnosc: number | null
          nazwa: string
          org_id: string
          utworzono: string | null
        }
        Insert: {
          aktywny?: boolean | null
          id?: string
          jednostka?: string
          kolejnosc?: number | null
          nazwa: string
          org_id: string
          utworzono?: string | null
        }
        Update: {
          aktywny?: boolean | null
          id?: string
          jednostka?: string
          kolejnosc?: number | null
          nazwa?: string
          org_id?: string
          utworzono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produkty_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacje"
            referencedColumns: ["id"]
          },
        ]
      }
      uzytkownicy_organizacji: {
        Row: {
          id: string
          org_id: string | null
          rola: string
          user_id: string
          utworzono: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          rola: string
          user_id: string
          utworzono?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          rola?: string
          user_id?: string
          utworzono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uzytkownicy_organizacji_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizacje"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
