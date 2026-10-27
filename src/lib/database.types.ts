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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          checked_in_at: string
          event_id: string
          guest_id: string
        }
        Insert: {
          checked_in_at?: string
          event_id: string
          guest_id: string
        }
        Update: {
          checked_in_at?: string
          event_id?: string
          guest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          maps_url: string | null
          sort: number
          starts_at: string
          title_en: string
          title_fr: string
          venue: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          maps_url?: string | null
          sort?: number
          starts_at: string
          title_en: string
          title_fr?: string
          venue?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          maps_url?: string | null
          sort?: number
          starts_at?: string
          title_en?: string
          title_fr?: string
          venue?: string
          visible?: boolean
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          created_at: string
          height: number | null
          id: string
          path: string
          sort: number
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          path: string
          sort?: number
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          path?: string
          sort?: number
          width?: number | null
        }
        Relationships: []
      }
      gift_announcements: {
        Row: {
          amount_fcfa: number | null
          created_at: string
          guest_id: string
          id: string
          message: string
          method: Database["public"]["Enums"]["gift_method"]
          received: boolean
        }
        Insert: {
          amount_fcfa?: number | null
          created_at?: string
          guest_id: string
          id?: string
          message?: string
          method: Database["public"]["Enums"]["gift_method"]
          received?: boolean
        }
        Update: {
          amount_fcfa?: number | null
          created_at?: string
          guest_id?: string
          id?: string
          message?: string
          method?: Database["public"]["Enums"]["gift_method"]
          received?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gift_announcements_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          deleted_at: string | null
          first_opened_at: string | null
          id: string
          invite_sent_at: string | null
          lang: string | null
          last_opened_at: string | null
          name: string
          open_count: number
          pass_code: string
          phone: string | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          first_opened_at?: string | null
          id?: string
          invite_sent_at?: string | null
          lang?: string | null
          last_opened_at?: string | null
          name: string
          open_count?: number
          pass_code?: string
          phone?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          first_opened_at?: string | null
          id?: string
          invite_sent_at?: string | null
          lang?: string | null
          last_opened_at?: string | null
          name?: string
          open_count?: number
          pass_code?: string
          phone?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          attending: boolean
          diet: string
          guest_id: string
          note: string
          responded_at: string
          updated_at: string
        }
        Insert: {
          attending: boolean
          diet?: string
          guest_id: string
          note?: string
          responded_at?: string
          updated_at?: string
        }
        Update: {
          attending?: boolean
          diet?: string
          guest_id?: string
          note?: string
          responded_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          bride: string
          city: string
          countdown_at: string
          dress_en: string
          dress_fr: string
          gift_box_note_en: string
          gift_box_note_fr: string
          groom: string
          hero_path: string | null
          id: boolean
          momo_name: string | null
          momo_number: string | null
          music_path: string | null
          music_title: string | null
          om_name: string | null
          om_number: string | null
          rsvp_deadline: string | null
          show_dress: boolean
          show_gallery: boolean
          show_gift_box: boolean
          show_gifts: boolean
          show_wishes: boolean
          show_word: boolean
          updated_at: string
          wa_template_en: string
          wa_template_fr: string
          word_en: string
          word_fr: string
          word_photo_path: string | null
        }
        Insert: {
          bride?: string
          city?: string
          countdown_at?: string
          dress_en?: string
          dress_fr?: string
          gift_box_note_en?: string
          gift_box_note_fr?: string
          groom?: string
          hero_path?: string | null
          id?: boolean
          momo_name?: string | null
          momo_number?: string | null
          music_path?: string | null
          music_title?: string | null
          om_name?: string | null
          om_number?: string | null
          rsvp_deadline?: string | null
          show_dress?: boolean
          show_gallery?: boolean
          show_gift_box?: boolean
          show_gifts?: boolean
          show_wishes?: boolean
          show_word?: boolean
          updated_at?: string
          wa_template_en?: string
          wa_template_fr?: string
          word_en?: string
          word_fr?: string
          word_photo_path?: string | null
        }
        Update: {
          bride?: string
          city?: string
          countdown_at?: string
          dress_en?: string
          dress_fr?: string
          gift_box_note_en?: string
          gift_box_note_fr?: string
          groom?: string
          hero_path?: string | null
          id?: boolean
          momo_name?: string | null
          momo_number?: string | null
          music_path?: string | null
          music_title?: string | null
          om_name?: string | null
          om_number?: string | null
          rsvp_deadline?: string | null
          show_dress?: boolean
          show_gallery?: boolean
          show_gift_box?: boolean
          show_gifts?: boolean
          show_wishes?: boolean
          show_word?: boolean
          updated_at?: string
          wa_template_en?: string
          wa_template_fr?: string
          word_en?: string
          word_fr?: string
          word_photo_path?: string | null
        }
        Relationships: []
      }
      wishes: {
        Row: {
          created_at: string
          guest_id: string
          hidden: boolean
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          hidden?: boolean
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          hidden?: boolean
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
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
      gift_method: "momo" | "orange" | "cash"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      gift_method: ["momo", "orange", "cash"],
    },
  },
} as const
