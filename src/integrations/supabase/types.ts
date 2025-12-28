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
      admin_reviews: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          internal_comments: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          step_name: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          internal_comments?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          step_name: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          internal_comments?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          step_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_status"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_feedback: {
        Row: {
          asset_id: string
          comments: string | null
          created_at: string
          id: string
          reviewer_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          comments?: string | null
          created_at?: string
          id?: string
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_feedback_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "creative_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          partner_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          partner_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          partner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_comments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_deals: {
        Row: {
          assigned_internal_manager: string | null
          contract_status: Database["public"]["Enums"]["contract_status"]
          created_at: string
          deal_name: string
          deal_value: number | null
          end_date: string | null
          id: string
          notes: string | null
          partner_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_internal_manager?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          deal_name: string
          deal_value?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_internal_manager?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          deal_name?: string
          deal_value?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_deals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_status: {
        Row: {
          campaign_conclusion_date: string | null
          created_at: string
          id: string
          next_meeting_date: string | null
          partner_id: string
          priority: string
          stage: string
          updated_at: string
        }
        Insert: {
          campaign_conclusion_date?: string | null
          created_at?: string
          id?: string
          next_meeting_date?: string | null
          partner_id: string
          priority?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          campaign_conclusion_date?: string | null
          created_at?: string
          id?: string
          next_meeting_date?: string | null
          partner_id?: string
          priority?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_status_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      content_placements: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          dimensions: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          placement_type: string
          property: string
          rate: number | null
          rate_type: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["placement_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          dimensions?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          placement_type: string
          property?: string
          rate?: number | null
          rate_type?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["placement_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          dimensions?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          placement_type?: string
          property?: string
          rate?: number | null
          rate_type?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["placement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_placements_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "campaign_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_assets: {
        Row: {
          affiliate_link: string | null
          affiliate_platform: string | null
          asset_url: string | null
          channel: string
          context_instructions: string | null
          copy_from_native: boolean | null
          copy_text: string | null
          created_at: string
          deal_id: string | null
          driver_types: string[] | null
          file_urls: string[] | null
          id: string
          is_complete: boolean
          is_draft: boolean | null
          partner_id: string
          promo_copy: string | null
          updated_at: string
        }
        Insert: {
          affiliate_link?: string | null
          affiliate_platform?: string | null
          asset_url?: string | null
          channel: string
          context_instructions?: string | null
          copy_from_native?: boolean | null
          copy_text?: string | null
          created_at?: string
          deal_id?: string | null
          driver_types?: string[] | null
          file_urls?: string[] | null
          id?: string
          is_complete?: boolean
          is_draft?: boolean | null
          partner_id: string
          promo_copy?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_link?: string | null
          affiliate_platform?: string | null
          asset_url?: string | null
          channel?: string
          context_instructions?: string | null
          copy_from_native?: boolean | null
          copy_text?: string | null
          created_at?: string
          deal_id?: string | null
          driver_types?: string[] | null
          file_urls?: string[] | null
          id?: string
          is_complete?: boolean
          is_draft?: boolean | null
          partner_id?: string
          promo_copy?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_assets_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "campaign_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_assets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          reorder_level: number
          reorder_quantity: number
          sku: string
          supplier_id: string | null
          unit_cost: number | null
          unit_of_measure: string
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          reorder_level?: number
          reorder_quantity?: number
          sku: string
          supplier_id?: string | null
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reorder_level?: number
          reorder_quantity?: number
          sku?: string
          supplier_id?: string | null
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          company_name: string
          created_at: string
          id: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          submission_date: string
          target_launch_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          submission_date?: string
          target_launch_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          submission_date?: string
          target_launch_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          assigned_to: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          created_by: string
          estimated_deal_value: number | null
          id: string
          industry: string | null
          notes: string | null
          source: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          stage_updated_at: string
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          created_by: string
          estimated_deal_value?: number | null
          id?: string
          industry?: string | null
          notes?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          stage_updated_at?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          estimated_deal_value?: number | null
          id?: string
          industry?: string | null
          notes?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          stage_updated_at?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string
          shipping: number
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number: string
          shipping?: number
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string
          shipping?: number
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          partner_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          partner_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          partner_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "partner"
      contract_status: "draft" | "signed" | "expired"
      pipeline_stage:
        | "prospecting"
        | "initial_pitch"
        | "negotiation"
        | "contract_sent"
        | "closed_won"
        | "closed_lost"
      placement_status: "available" | "pitched" | "booked" | "upcoming"
      po_status:
        | "draft"
        | "submitted"
        | "approved"
        | "ordered"
        | "partially_received"
        | "received"
        | "cancelled"
      review_status: "pending" | "approved" | "revision_requested"
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
      app_role: ["admin", "partner"],
      contract_status: ["draft", "signed", "expired"],
      pipeline_stage: [
        "prospecting",
        "initial_pitch",
        "negotiation",
        "contract_sent",
        "closed_won",
        "closed_lost",
      ],
      placement_status: ["available", "pitched", "booked", "upcoming"],
      po_status: [
        "draft",
        "submitted",
        "approved",
        "ordered",
        "partially_received",
        "received",
        "cancelled",
      ],
      review_status: ["pending", "approved", "revision_requested"],
    },
  },
} as const
