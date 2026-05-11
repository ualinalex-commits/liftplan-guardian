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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      lift_plan_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_review_document: boolean
          lift_plan_id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_review_document?: boolean
          lift_plan_id: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_review_document?: boolean
          lift_plan_id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lift_plan_files_lift_plan_id_fkey"
            columns: ["lift_plan_id"]
            isOneToOne: false
            referencedRelation: "lift_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lift_plan_write_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_deliverable: boolean
          lift_plan_write_id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_deliverable?: boolean
          lift_plan_write_id: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_deliverable?: boolean
          lift_plan_write_id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lift_plan_write_files_lift_plan_write_id_fkey"
            columns: ["lift_plan_write_id"]
            isOneToOne: false
            referencedRelation: "lift_plan_writes"
            referencedColumns: ["id"]
          },
        ]
      }
      lift_plan_writes: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          details: string
          due_date: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          po_number: string | null
          price: number | null
          reference: string
          status: Database["public"]["Enums"]["lift_plan_write_status"]
          timeframe: Database["public"]["Enums"]["timeframe_type"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          details: string
          due_date?: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          po_number?: string | null
          price?: number | null
          reference: string
          status?: Database["public"]["Enums"]["lift_plan_write_status"]
          timeframe: Database["public"]["Enums"]["timeframe_type"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          details?: string
          due_date?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          po_number?: string | null
          price?: number | null
          reference?: string
          status?: Database["public"]["Enums"]["lift_plan_write_status"]
          timeframe?: Database["public"]["Enums"]["timeframe_type"]
          updated_at?: string
        }
        Relationships: []
      }
      lift_plans: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          po_number: string | null
          price: number | null
          reference: string
          status: Database["public"]["Enums"]["lift_plan_status"]
          timeframe: Database["public"]["Enums"]["timeframe_type"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          po_number?: string | null
          price?: number | null
          reference: string
          status?: Database["public"]["Enums"]["lift_plan_status"]
          timeframe: Database["public"]["Enums"]["timeframe_type"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          po_number?: string | null
          price?: number | null
          reference?: string
          status?: Database["public"]["Enums"]["lift_plan_status"]
          timeframe?: Database["public"]["Enums"]["timeframe_type"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          lift_plan_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lift_plan_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lift_plan_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lift_plan_id_fkey"
            columns: ["lift_plan_id"]
            isOneToOne: false
            referencedRelation: "lift_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          created_at: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: string
          price: number
          service: Database["public"]["Enums"]["service_kind"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id?: string
          price?: number
          service: Database["public"]["Enums"]["service_kind"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          price?: number
          service?: Database["public"]["Enums"]["service_kind"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      status_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status: Database["public"]["Enums"]["lift_plan_status"] | null
          id: string
          lift_plan_id: string
          note: string | null
          to_status: Database["public"]["Enums"]["lift_plan_status"]
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["lift_plan_status"] | null
          id?: string
          lift_plan_id: string
          note?: string | null
          to_status: Database["public"]["Enums"]["lift_plan_status"]
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["lift_plan_status"] | null
          id?: string
          lift_plan_id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["lift_plan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_history_lift_plan_id_fkey"
            columns: ["lift_plan_id"]
            isOneToOne: false
            referencedRelation: "lift_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      write_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          lift_plan_write_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lift_plan_write_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lift_plan_write_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "write_messages_lift_plan_write_id_fkey"
            columns: ["lift_plan_write_id"]
            isOneToOne: false
            referencedRelation: "lift_plan_writes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "client" | "appointed_person" | "admin"
      equipment_type:
        | "tower_crane"
        | "mobile_crane"
        | "digger"
        | "forklift"
        | "hiab"
        | "mewp"
      lift_plan_status:
        | "submitted"
        | "assigned"
        | "in_review"
        | "request_info"
        | "rejected"
        | "completed"
      lift_plan_write_status:
        | "submitted"
        | "assigned"
        | "request_info"
        | "draft_delivered"
        | "completed"
      payment_status: "pending" | "paid" | "po_recorded"
      payment_type: "po" | "direct"
      service_kind: "review" | "write"
      timeframe_type: "24h" | "48h" | "72h"
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
    Enums: {
      app_role: ["client", "appointed_person", "admin"],
      equipment_type: [
        "tower_crane",
        "mobile_crane",
        "digger",
        "forklift",
        "hiab",
        "mewp",
      ],
      lift_plan_status: [
        "submitted",
        "assigned",
        "in_review",
        "request_info",
        "rejected",
        "completed",
      ],
      lift_plan_write_status: [
        "submitted",
        "assigned",
        "request_info",
        "draft_delivered",
        "completed",
      ],
      payment_status: ["pending", "paid", "po_recorded"],
      payment_type: ["po", "direct"],
      service_kind: ["review", "write"],
      timeframe_type: ["24h", "48h", "72h"],
    },
  },
} as const
