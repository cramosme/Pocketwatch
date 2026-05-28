// Generated from Supabase
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
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          auto_reimburse_fees: boolean | null
          available_balance: number | null
          created_at: string | null
          current_balance: number | null
          default_envelope_id: string | null
          id: string
          is_active: boolean
          is_primary: boolean | null
          last_synced: string | null
          name: string
          plaid_account_id: string
          plaid_item_id: string
          restricted_to_envelope_ids: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          auto_reimburse_fees?: boolean | null
          available_balance?: number | null
          created_at?: string | null
          current_balance?: number | null
          default_envelope_id?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean | null
          last_synced?: string | null
          name: string
          plaid_account_id: string
          plaid_item_id: string
          restricted_to_envelope_ids?: string[] | null
          type: string
          user_id: string
        }
        Update: {
          auto_reimburse_fees?: boolean | null
          available_balance?: number | null
          created_at?: string | null
          current_balance?: number | null
          default_envelope_id?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean | null
          last_synced?: string | null
          name?: string
          plaid_account_id?: string
          plaid_item_id?: string
          restricted_to_envelope_ids?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "plaid_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_default_envelope_id_fkey"
            columns: ["default_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_details: {
        Row: {
          account_id: string
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          id: string
          last_statement_balance: number | null
          last_statement_date: string | null
          minimum_payment: number | null
          next_payment_due_date: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          id?: string
          last_statement_balance?: number | null
          last_statement_date?: string | null
          minimum_payment?: number | null
          next_payment_due_date?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          id?: string
          last_statement_balance?: number | null
          last_statement_date?: string | null
          minimum_payment?: number | null
          next_payment_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_details_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_events: {
        Row: {
          created_at: string | null
          id: string
          pay_period_end: string | null
          pay_period_start: string | null
          split_at: string | null
          total_amount: number
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pay_period_end?: string | null
          pay_period_start?: string | null
          split_at?: string | null
          total_amount: number
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pay_period_end?: string | null
          pay_period_start?: string | null
          split_at?: string | null
          total_amount?: number
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_split_items: {
        Row: {
          amount_added: number
          balance_after: number
          balance_before: number
          created_at: string | null
          deposit_event_id: string
          envelope_id: string
          id: string
          skip_reason: string | null
          was_skipped: boolean | null
        }
        Insert: {
          amount_added: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          deposit_event_id: string
          envelope_id: string
          id?: string
          skip_reason?: string | null
          was_skipped?: boolean | null
        }
        Update: {
          amount_added?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          deposit_event_id?: string
          envelope_id?: string
          id?: string
          skip_reason?: string | null
          was_skipped?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_split_items_deposit_event_id_fkey"
            columns: ["deposit_event_id"]
            isOneToOne: false
            referencedRelation: "deposit_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_split_items_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      envelopes: {
        Row: {
          always_refill: boolean | null
          cap_multiplier: number | null
          color: string | null
          created_at: string | null
          current_balance: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          monthly_target: number | null
          name: string
          overflow_envelope_id: string | null
          percentage: number | null
          priority_order: number | null
          refill_threshold: number | null
          type: string
          user_id: string
        }
        Insert: {
          always_refill?: boolean | null
          cap_multiplier?: number | null
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          monthly_target?: number | null
          name: string
          overflow_envelope_id?: string | null
          percentage?: number | null
          priority_order?: number | null
          refill_threshold?: number | null
          type: string
          user_id: string
        }
        Update: {
          always_refill?: boolean | null
          cap_multiplier?: number | null
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          monthly_target?: number | null
          name?: string
          overflow_envelope_id?: string | null
          percentage?: number | null
          priority_order?: number | null
          refill_threshold?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "envelopes_overflow_envelope_id_fkey"
            columns: ["overflow_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envelopes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          plaid_suggested_category: string | null
          reason: string
          resolved: boolean | null
          resolved_at: string | null
          suggested_envelope_id: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          plaid_suggested_category?: string | null
          reason: string
          resolved?: boolean | null
          resolved_at?: string | null
          suggested_envelope_id?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          plaid_suggested_category?: string | null
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          suggested_envelope_id?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_suggested_envelope_id_fkey"
            columns: ["suggested_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_rules: {
        Row: {
          confidence: number | null
          created_at: string | null
          custom_category: string | null
          envelope_id: string | null
          id: string
          match_type: string
          merchant_pattern: string
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          custom_category?: string | null
          envelope_id?: string | null
          id?: string
          match_type: string
          merchant_pattern: string
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          custom_category?: string | null
          envelope_id?: string | null
          id?: string
          match_type?: string
          merchant_pattern?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_rules_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          cc_due_date_warning: boolean | null
          created_at: string | null
          flag_alerts: boolean | null
          id: string
          low_balance_alerts: boolean | null
          low_balance_threshold: number | null
          payday_recap: boolean | null
          plaid_disconnect: boolean | null
          refund_detected: boolean | null
          spending_velocity: boolean | null
          spending_velocity_threshold: number | null
          subscription_charging_soon: boolean | null
          subscription_days_ahead: number | null
          user_id: string
        }
        Insert: {
          cc_due_date_warning?: boolean | null
          created_at?: string | null
          flag_alerts?: boolean | null
          id?: string
          low_balance_alerts?: boolean | null
          low_balance_threshold?: number | null
          payday_recap?: boolean | null
          plaid_disconnect?: boolean | null
          refund_detected?: boolean | null
          spending_velocity?: boolean | null
          spending_velocity_threshold?: number | null
          subscription_charging_soon?: boolean | null
          subscription_days_ahead?: number | null
          user_id: string
        }
        Update: {
          cc_due_date_warning?: boolean | null
          created_at?: string | null
          flag_alerts?: boolean | null
          id?: string
          low_balance_alerts?: boolean | null
          low_balance_threshold?: number | null
          payday_recap?: boolean | null
          plaid_disconnect?: boolean | null
          refund_detected?: boolean | null
          spending_velocity?: boolean | null
          spending_velocity_threshold?: number | null
          subscription_charging_soon?: boolean | null
          subscription_days_ahead?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_items: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_active: boolean
          item_id: string
          last_error: string | null
          last_synced: string | null
          transaction_cursor: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_active?: boolean
          item_id: string
          last_error?: string | null
          last_synced?: string | null
          transaction_cursor?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_active?: boolean
          item_id?: string
          last_error?: string | null
          last_synced?: string | null
          transaction_cursor?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaid_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          estimated_monthly_income: number
          id: string
          name: string | null
          next_payday: string | null
          pay_frequency: string | null
          setup_complete: boolean
        }
        Insert: {
          created_at?: string
          estimated_monthly_income?: number
          id: string
          name?: string | null
          next_payday?: string | null
          pay_frequency?: string | null
          setup_complete?: boolean
        }
        Update: {
          created_at?: string
          estimated_monthly_income?: number
          id?: string
          name?: string | null
          next_payday?: string | null
          pay_frequency?: string | null
          setup_complete?: boolean
        }
        Relationships: []
      }
      savings_goal_details: {
        Row: {
          created_at: string | null
          envelope_id: string
          id: string
          is_spending_phase: boolean | null
          planned_spend: Json | null
          spending_phase_start_date: string | null
          target_amount: number
          target_date: string | null
        }
        Insert: {
          created_at?: string | null
          envelope_id: string
          id?: string
          is_spending_phase?: boolean | null
          planned_spend?: Json | null
          spending_phase_start_date?: string | null
          target_amount: number
          target_date?: string | null
        }
        Update: {
          created_at?: string | null
          envelope_id?: string
          id?: string
          is_spending_phase?: boolean | null
          planned_spend?: Json | null
          spending_phase_start_date?: string | null
          target_amount?: number
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goal_details_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: true
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      sinking_fund_items: {
        Row: {
          annual_contribution: number | null
          cost: number
          created_at: string | null
          description: string
          envelope_id: string
          frequency_per_year: number
          id: string
        }
        Insert: {
          annual_contribution?: number | null
          cost: number
          created_at?: string | null
          description: string
          envelope_id: string
          frequency_per_year: number
          id?: string
        }
        Update: {
          annual_contribution?: number | null
          cost?: number
          created_at?: string | null
          description?: string
          envelope_id?: string
          frequency_per_year?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinking_fund_items_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          custom_category: string | null
          date: string
          envelope_id: string | null
          fee_amount: number | null
          fee_currency: string | null
          id: string
          is_cc_payment: boolean | null
          is_pending: boolean | null
          merchant_name: string | null
          merchant_name_normalized: string | null
          notes: string | null
          original_amount: number | null
          original_currency: string | null
          paired_transaction_id: string | null
          plaid_category: string | null
          plaid_category_id: string | null
          plaid_transaction_id: string | null
          removed_at: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          custom_category?: string | null
          date: string
          envelope_id?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          id?: string
          is_cc_payment?: boolean | null
          is_pending?: boolean | null
          merchant_name?: string | null
          merchant_name_normalized?: string | null
          notes?: string | null
          original_amount?: number | null
          original_currency?: string | null
          paired_transaction_id?: string | null
          plaid_category?: string | null
          plaid_category_id?: string | null
          plaid_transaction_id?: string | null
          removed_at?: string | null
          transaction_type?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          custom_category?: string | null
          date?: string
          envelope_id?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          id?: string
          is_cc_payment?: boolean | null
          is_pending?: boolean | null
          merchant_name?: string | null
          merchant_name_normalized?: string | null
          notes?: string | null
          original_amount?: number | null
          original_currency?: string | null
          paired_transaction_id?: string | null
          plaid_category?: string | null
          plaid_category_id?: string | null
          plaid_transaction_id?: string | null
          removed_at?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_paired_transaction_id_fkey"
            columns: ["paired_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          frequency: string | null
          from_envelope_id: string
          id: string
          memo: string | null
          series_end: string | null
          series_id: string | null
          status: string
          to_envelope_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          frequency?: string | null
          from_envelope_id: string
          id?: string
          memo?: string | null
          series_end?: string | null
          series_id?: string | null
          status?: string
          to_envelope_id: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          frequency?: string | null
          from_envelope_id?: string
          id?: string
          memo?: string | null
          series_end?: string | null
          series_id?: string | null
          status?: string
          to_envelope_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_envelope_id_fkey"
            columns: ["from_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_envelope_id_fkey"
            columns: ["to_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
