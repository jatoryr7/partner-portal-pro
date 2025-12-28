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
      app_configurations: {
        Row: {
          category: string
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          metadata: Json | null
          sort_order: number
          updated_at: string
          value: string | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          metadata?: Json | null
          sort_order?: number
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          metadata?: Json | null
          sort_order?: number
          updated_at?: string
          value?: string | null
        }
        Relationships: []
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
      campaign_analytics: {
        Row: {
          cac: number | null
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string
          id: string
          impressions: number | null
          notes: string | null
          period_end: string
          period_start: string
          revenue: number | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          cac?: number | null
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          period_end: string
          period_start: string
          revenue?: number | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          cac?: number | null
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          period_end?: string
          period_start?: string
          revenue?: number | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_deals"
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
          funnel_stage: Database["public"]["Enums"]["funnel_stage"] | null
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
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"] | null
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
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"] | null
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
      content_ad_units: {
        Row: {
          article_id: string
          booked_at: string | null
          booked_end_date: string | null
          booked_start_date: string | null
          created_at: string
          deal_id: string | null
          id: string
          notes: string | null
          pitched_at: string | null
          rate: number | null
          status: Database["public"]["Enums"]["inventory_availability"]
          unit_type: string
          updated_at: string
        }
        Insert: {
          article_id: string
          booked_at?: string | null
          booked_end_date?: string | null
          booked_start_date?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          notes?: string | null
          pitched_at?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["inventory_availability"]
          unit_type: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          booked_at?: string | null
          booked_end_date?: string | null
          booked_start_date?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          notes?: string | null
          pitched_at?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["inventory_availability"]
          unit_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ad_units_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ad_units_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "campaign_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_articles: {
        Row: {
          created_at: string
          id: string
          k1_cluster_id: string
          monthly_pageviews: number | null
          status: Database["public"]["Enums"]["inventory_availability"]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          k1_cluster_id: string
          monthly_pageviews?: number | null
          status?: Database["public"]["Enums"]["inventory_availability"]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          k1_cluster_id?: string
          monthly_pageviews?: number | null
          status?: Database["public"]["Enums"]["inventory_availability"]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_articles_k1_cluster_id_fkey"
            columns: ["k1_cluster_id"]
            isOneToOne: false
            referencedRelation: "content_k1_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      content_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sub_vertical_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sub_vertical_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sub_vertical_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_categories_sub_vertical_id_fkey"
            columns: ["sub_vertical_id"]
            isOneToOne: false
            referencedRelation: "content_sub_verticals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_k1_clusters: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          k1_code: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          k1_code?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          k1_code?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_k1_clusters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
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
      content_sub_verticals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          vertical_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          vertical_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          vertical_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sub_verticals_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "content_verticals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_verticals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      inventory: {
        Row: {
          campaign_id: string | null
          created_at: string
          created_by: string
          date_slot: string
          id: string
          notes: string | null
          property_name: string
          status: Database["public"]["Enums"]["placement_status"]
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          created_by: string
          date_slot: string
          id?: string
          notes?: string | null
          property_name: string
          status?: Database["public"]["Enums"]["placement_status"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string
          date_slot?: string
          id?: string
          notes?: string | null
          property_name?: string
          status?: Database["public"]["Enums"]["placement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_deals"
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
      operational_insights: {
        Row: {
          cac: number | null
          conversions: number | null
          created_at: string
          created_by: string
          external_resources: Json | null
          id: string
          inventory_percent: number | null
          partner_id: string
          priority_tag: string
          revenue: number | null
          roas: number | null
          spend: number | null
          updated_at: string
          week_start: string
          weekly_blurb: string | null
        }
        Insert: {
          cac?: number | null
          conversions?: number | null
          created_at?: string
          created_by: string
          external_resources?: Json | null
          id?: string
          inventory_percent?: number | null
          partner_id: string
          priority_tag?: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string
          week_start?: string
          weekly_blurb?: string | null
        }
        Update: {
          cac?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string
          external_resources?: Json | null
          id?: string
          inventory_percent?: number | null
          partner_id?: string
          priority_tag?: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string
          week_start?: string
          weekly_blurb?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_insights_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          assigned_manager_id: string | null
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
          assigned_manager_id?: string | null
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
          assigned_manager_id?: string | null
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
      funnel_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      inventory_availability: "available" | "pitched" | "booked"
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
      funnel_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      inventory_availability: ["available", "pitched", "booked"],
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
