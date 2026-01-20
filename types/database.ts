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
      albums: {
        Row: {
          band_id: string
          c_line: string | null
          cover_key: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          label_name: string | null
          original_content_confirmed: boolean | null
          p_line: string | null
          release_date: string | null
          release_type: Database["public"]["Enums"]["release_type"]
          rights_confirmed: boolean | null
          rights_confirmed_at: string | null
          rights_confirmed_by: string | null
          sample_declaration: string | null
          slug: string
          title: string
          total_duration_seconds: number | null
          total_streams: number | null
          total_tracks: number | null
          upc: string | null
          updated_at: string | null
        }
        Insert: {
          band_id: string
          c_line?: string | null
          cover_key?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          label_name?: string | null
          original_content_confirmed?: boolean | null
          p_line?: string | null
          release_date?: string | null
          release_type?: Database["public"]["Enums"]["release_type"]
          rights_confirmed?: boolean | null
          rights_confirmed_at?: string | null
          rights_confirmed_by?: string | null
          sample_declaration?: string | null
          slug: string
          title: string
          total_duration_seconds?: number | null
          total_streams?: number | null
          total_tracks?: number | null
          upc?: string | null
          updated_at?: string | null
        }
        Update: {
          band_id?: string
          c_line?: string | null
          cover_key?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          label_name?: string | null
          original_content_confirmed?: boolean | null
          p_line?: string | null
          release_date?: string | null
          release_type?: Database["public"]["Enums"]["release_type"]
          rights_confirmed?: boolean | null
          rights_confirmed_at?: string | null
          rights_confirmed_by?: string | null
          sample_declaration?: string | null
          slug?: string
          title?: string
          total_duration_seconds?: number | null
          total_streams?: number | null
          total_tracks?: number | null
          upc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_rights_confirmed_by_fkey"
            columns: ["rights_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_balances: {
        Row: {
          balance_cents: number | null
          band_id: string
          last_payout_at: string | null
          lifetime_earnings_cents: number | null
          updated_at: string | null
        }
        Insert: {
          balance_cents?: number | null
          band_id: string
          last_payout_at?: string | null
          lifetime_earnings_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          balance_cents?: number | null
          band_id?: string
          last_payout_at?: string | null
          lifetime_earnings_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_balances_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: true
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_earnings: {
        Row: {
          band_id: string | null
          created_at: string | null
          gross_earnings_cents: number
          id: string
          listening_seconds: number
          net_earnings_cents: number
          paid_at: string | null
          payout_status: string | null
          revenue_period_id: string | null
          stream_count: number
          stripe_transfer_id: string | null
        }
        Insert: {
          band_id?: string | null
          created_at?: string | null
          gross_earnings_cents?: number
          id?: string
          listening_seconds?: number
          net_earnings_cents?: number
          paid_at?: string | null
          payout_status?: string | null
          revenue_period_id?: string | null
          stream_count?: number
          stripe_transfer_id?: string | null
        }
        Update: {
          band_id?: string | null
          created_at?: string | null
          gross_earnings_cents?: number
          id?: string
          listening_seconds?: number
          net_earnings_cents?: number
          paid_at?: string | null
          payout_status?: string | null
          revenue_period_id?: string | null
          stream_count?: number
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_earnings_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_earnings_revenue_period_id_fkey"
            columns: ["revenue_period_id"]
            isOneToOne: false
            referencedRelation: "revenue_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          bandcamp: string | null
          banner_key: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          facebook: string | null
          featured_at: string | null
          featured_by: string | null
          flag_count: number | null
          follower_count: number
          genres: string[] | null
          id: string
          instagram: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          location: string | null
          name: string
          owner_id: string
          slug: string
          soundcloud: string | null
          spotify: string | null
          status: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_onboarding_complete: boolean | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          tagline: string | null
          theme_color: string | null
          tiktok: string | null
          total_earnings_cents: number | null
          total_streams: number | null
          twitter: string | null
          updated_at: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          bandcamp?: string | null
          banner_key?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          facebook?: string | null
          featured_at?: string | null
          featured_by?: string | null
          flag_count?: number | null
          follower_count?: number
          genres?: string[] | null
          id?: string
          instagram?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          name: string
          owner_id: string
          slug: string
          soundcloud?: string | null
          spotify?: string | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tagline?: string | null
          theme_color?: string | null
          tiktok?: string | null
          total_earnings_cents?: number | null
          total_streams?: number | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          bandcamp?: string | null
          banner_key?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          facebook?: string | null
          featured_at?: string | null
          featured_by?: string | null
          flag_count?: number | null
          follower_count?: number
          genres?: string[] | null
          id?: string
          instagram?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          name?: string
          owner_id?: string
          slug?: string
          soundcloud?: string | null
          spotify?: string | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tagline?: string | null
          theme_color?: string | null
          tiktok?: string | null
          total_earnings_cents?: number | null
          total_streams?: number | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bands_featured_by_fkey"
            columns: ["featured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bands_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bands_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string | null
          details: string | null
          evidence_url: string | null
          id: string
          reason: string
          reporter_email: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          track_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          evidence_url?: string | null
          id?: string
          reason: string
          reporter_email?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          track_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          evidence_url?: string | null
          id?: string
          reason?: string
          reporter_email?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      dmca_requests: {
        Row: {
          accuracy_statement: boolean
          admin_notes: string | null
          claimant_address: string
          claimant_email: string
          claimant_name: string
          claimant_phone: string | null
          copyrighted_work_description: string
          copyrighted_work_url: string | null
          counter_notice_date: string | null
          counter_notice_details: string | null
          counter_notice_received: boolean | null
          created_at: string | null
          good_faith_statement: boolean
          id: string
          infringing_url: string
          perjury_statement: boolean
          processed_at: string | null
          processed_by: string | null
          signature: string
          signature_date: string
          status: string | null
          track_id: string | null
        }
        Insert: {
          accuracy_statement?: boolean
          admin_notes?: string | null
          claimant_address: string
          claimant_email: string
          claimant_name: string
          claimant_phone?: string | null
          copyrighted_work_description: string
          copyrighted_work_url?: string | null
          counter_notice_date?: string | null
          counter_notice_details?: string | null
          counter_notice_received?: boolean | null
          created_at?: string | null
          good_faith_statement?: boolean
          id?: string
          infringing_url: string
          perjury_statement?: boolean
          processed_at?: string | null
          processed_by?: string | null
          signature: string
          signature_date?: string
          status?: string | null
          track_id?: string | null
        }
        Update: {
          accuracy_statement?: boolean
          admin_notes?: string | null
          claimant_address?: string
          claimant_email?: string
          claimant_name?: string
          claimant_phone?: string | null
          copyrighted_work_description?: string
          copyrighted_work_url?: string | null
          counter_notice_date?: string | null
          counter_notice_details?: string | null
          counter_notice_received?: boolean | null
          created_at?: string | null
          good_faith_statement?: boolean
          id?: string
          infringing_url?: string
          perjury_statement?: boolean
          processed_at?: string | null
          processed_by?: string | null
          signature?: string
          signature_date?: string
          status?: string | null
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dmca_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dmca_requests_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          album_id: string | null
          band_id: string | null
          created_at: string | null
          id: string
          track_id: string | null
          user_id: string
        }
        Insert: {
          album_id?: string | null
          band_id?: string | null
          created_at?: string | null
          id?: string
          track_id?: string | null
          user_id: string
        }
        Update: {
          album_id?: string | null
          band_id?: string | null
          created_at?: string | null
          id?: string
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          band_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          period: string
          show_artist_breakdown: boolean | null
          show_artists_supported: boolean | null
          show_listening_time: boolean | null
          show_stream_count: boolean | null
          show_total_earned: boolean | null
          token: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          period: string
          show_artist_breakdown?: boolean | null
          show_artists_supported?: boolean | null
          show_listening_time?: boolean | null
          show_stream_count?: boolean | null
          show_total_earned?: boolean | null
          token: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          period?: string
          show_artist_breakdown?: boolean | null
          show_artists_supported?: boolean | null
          show_listening_time?: boolean | null
          show_stream_count?: boolean | null
          show_total_earned?: boolean | null
          token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      liked_tracks: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      listening_history: {
        Row: {
          album_id: string
          band_id: string
          completed: boolean
          country_code: string | null
          duration_seconds: number
          id: string
          is_free_play: boolean | null
          listened_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          album_id: string
          band_id: string
          completed?: boolean
          country_code?: string | null
          duration_seconds?: number
          id?: string
          is_free_play?: boolean | null
          listened_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          album_id?: string
          band_id?: string
          completed?: boolean
          country_code?: string | null
          duration_seconds?: number
          id?: string
          is_free_play?: boolean | null
          listened_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_history_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          band_id: string
          created_at: string | null
          id: string
          notes: string | null
          priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          submitted_by: string
          track_id: string
        }
        Insert: {
          band_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          submitted_by: string
          track_id: string
        }
        Update: {
          band_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          submitted_by?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          band_id: string
          created_at: string | null
          error_message: string | null
          id: string
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          band_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          band_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_isrc_allocations: {
        Row: {
          allocation_year: number
          assigned_at: string | null
          assigned_to_band_id: string | null
          created_at: string | null
          id: string
          isrc: string
          released_at: string | null
          sequence_number: number
          status: string
          track_id: string | null
        }
        Insert: {
          allocation_year: number
          assigned_at?: string | null
          assigned_to_band_id?: string | null
          created_at?: string | null
          id?: string
          isrc: string
          released_at?: string | null
          sequence_number: number
          status?: string
          track_id?: string | null
        }
        Update: {
          allocation_year?: number
          assigned_at?: string | null
          assigned_to_band_id?: string | null
          created_at?: string | null
          id?: string
          isrc?: string
          released_at?: string | null
          sequence_number?: number
          status?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_isrc_allocations_allocation_year_fkey"
            columns: ["allocation_year"]
            isOneToOne: false
            referencedRelation: "platform_isrc_counters"
            referencedColumns: ["year"]
          },
          {
            foreignKeyName: "platform_isrc_allocations_assigned_to_band_id_fkey"
            columns: ["assigned_to_band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_isrc_allocations_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_isrc_counters: {
        Row: {
          max_sequence: number
          next_sequence: number
          range_prefix: string
          year: number
        }
        Insert: {
          max_sequence?: number
          next_sequence?: number
          range_prefix: string
          year: number
        }
        Update: {
          max_sequence?: number
          next_sequence?: number
          range_prefix?: string
          year?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_collaborators: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          playlist_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          playlist_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          playlist_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_by: string
          created_at: string | null
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_by: string
          created_at?: string | null
          id?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          added_by?: string
          created_at?: string | null
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_key: string | null
          created_at: string | null
          description: string | null
          featured_at: string | null
          featured_by: string | null
          id: string
          is_curated: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          owner_id: string
          share_token: string | null
          title: string
          track_count: number | null
          updated_at: string | null
        }
        Insert: {
          cover_key?: string | null
          created_at?: string | null
          description?: string | null
          featured_at?: string | null
          featured_by?: string | null
          id?: string
          is_curated?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          owner_id: string
          share_token?: string | null
          title: string
          track_count?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_key?: string | null
          created_at?: string | null
          description?: string | null
          featured_at?: string | null
          featured_by?: string | null
          id?: string
          is_curated?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          owner_id?: string
          share_token?: string | null
          title?: string
          track_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_featured_by_fkey"
            columns: ["featured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          location: string | null
          monthly_full_plays: number | null
          play_allowance_reset_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_impact_publicly: boolean | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          location?: string | null
          monthly_full_plays?: number | null
          play_allowance_reset_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_impact_publicly?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          location?: string | null
          monthly_full_plays?: number | null
          play_allowance_reset_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_impact_publicly?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      revenue_distributions: {
        Row: {
          amount_cents: number
          band_id: string
          created_at: string | null
          id: string
          listening_seconds: number
          percentage_of_user: number
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          band_id: string
          created_at?: string | null
          id?: string
          listening_seconds?: number
          percentage_of_user?: number
          period_end: string
          period_start: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          band_id?: string
          created_at?: string | null
          id?: string
          listening_seconds?: number
          percentage_of_user?: number
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_distributions_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_distributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_periods: {
        Row: {
          artist_pool_cents: number
          cmo_fee_cents: number | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          platform_fee_cents: number
          status: string | null
          total_streams: number
          total_subscription_revenue_cents: number
        }
        Insert: {
          artist_pool_cents?: number
          cmo_fee_cents?: number | null
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          platform_fee_cents?: number
          status?: string | null
          total_streams?: number
          total_subscription_revenue_cents?: number
        }
        Update: {
          artist_pool_cents?: number
          cmo_fee_cents?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          platform_fee_cents?: number
          status?: string | null
          total_streams?: number
          total_subscription_revenue_cents?: number
        }
        Relationships: []
      }
      saved_albums: {
        Row: {
          album_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_albums_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_events: {
        Row: {
          band_id: string
          created_at: string | null
          duration_seconds: number
          id: string
          is_full_stream: boolean | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          track_id: string
          user_id: string
        }
        Insert: {
          band_id: string
          created_at?: string | null
          duration_seconds: number
          id?: string
          is_full_stream?: boolean | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          track_id: string
          user_id: string
        }
        Update: {
          band_id?: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          is_full_stream?: boolean | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_events_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_events_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_credits: {
        Row: {
          created_at: string | null
          id: string
          ipi_number: string | null
          name: string
          role: string
          track_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ipi_number?: string | null
          name: string
          role: string
          track_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ipi_number?: string | null
          name?: string
          role?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_credits_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          ai_declaration: boolean | null
          album_id: string
          archive_audio_key: string | null
          audio_key: string | null
          audio_url: string | null
          audio_url_preview: string | null
          band_id: string
          content_flags: Json | null
          created_at: string | null
          credits: string | null
          duration_seconds: number
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          hifi_audio_key: string | null
          id: string
          is_cover: boolean | null
          is_explicit: boolean | null
          isrc: string | null
          isrc_platform_assigned: boolean | null
          iswc: string | null
          lyrics: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          musicbrainz_work_id: string | null
          original_audio_key: string | null
          original_format: string | null
          preview_start_seconds: number | null
          spotify_track_id: string | null
          stream_count: number | null
          streaming_audio_key: string | null
          title: string
          total_streams: number | null
          track_number: number
          transcoding_status: string | null
          updated_at: string | null
          waveform_data: Json | null
        }
        Insert: {
          ai_declaration?: boolean | null
          album_id: string
          archive_audio_key?: string | null
          audio_key?: string | null
          audio_url?: string | null
          audio_url_preview?: string | null
          band_id: string
          content_flags?: Json | null
          created_at?: string | null
          credits?: string | null
          duration_seconds: number
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          hifi_audio_key?: string | null
          id?: string
          is_cover?: boolean | null
          is_explicit?: boolean | null
          isrc?: string | null
          isrc_platform_assigned?: boolean | null
          iswc?: string | null
          lyrics?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          musicbrainz_work_id?: string | null
          original_audio_key?: string | null
          original_format?: string | null
          preview_start_seconds?: number | null
          spotify_track_id?: string | null
          stream_count?: number | null
          streaming_audio_key?: string | null
          title: string
          total_streams?: number | null
          track_number: number
          transcoding_status?: string | null
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Update: {
          ai_declaration?: boolean | null
          album_id?: string
          archive_audio_key?: string | null
          audio_key?: string | null
          audio_url?: string | null
          audio_url_preview?: string | null
          band_id?: string
          content_flags?: Json | null
          created_at?: string | null
          credits?: string | null
          duration_seconds?: number
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          hifi_audio_key?: string | null
          id?: string
          is_cover?: boolean | null
          is_explicit?: boolean | null
          isrc?: string | null
          isrc_platform_assigned?: boolean | null
          iswc?: string | null
          lyrics?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          musicbrainz_work_id?: string | null
          original_audio_key?: string | null
          original_format?: string | null
          preview_start_seconds?: number | null
          spotify_track_id?: string | null
          stream_count?: number | null
          streaming_audio_key?: string | null
          title?: string
          total_streams?: number | null
          track_number?: number
          transcoding_status?: string | null
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transcoding_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          started_at: string | null
          status: string
          track_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          started_at?: string | null
          status?: string
          track_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          started_at?: string | null
          status?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcoding_queue_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_track_to_playlist: {
        Args: { p_playlist_id: string; p_track_id: string }
        Returns: boolean
      }
      allocate_platform_isrc: { Args: { p_band_id: string }; Returns: string }
      approve_track: {
        Args: { p_notes?: string; p_track_id: string }
        Returns: boolean
      }
      assign_platform_isrc_to_track: {
        Args: { p_isrc: string; p_track_id: string }
        Returns: boolean
      }
      check_free_play_allowance: { Args: never; Returns: string }
      follow_band: { Args: { p_band_id: string }; Returns: boolean }
      generate_playlist_share_token: {
        Args: { p_playlist_id: string }
        Returns: string
      }
      get_band_streams_by_country: {
        Args: { p_band_id: string; p_days?: number }
        Returns: {
          country_code: string
          stream_count: number
          total_duration: number
        }[]
      }
      get_followed_bands: {
        Args: never
        Returns: {
          band_id: string
          band_name: string
          band_slug: string
          followed_at: string
        }[]
      }
      get_free_tier_status: {
        Args: never
        Returns: {
          is_subscribed: boolean
          plays_remaining: number
          plays_used: number
          resets_at: string
        }[]
      }
      get_liked_track_ids: {
        Args: { p_track_ids: string[] }
        Returns: string[]
      }
      get_listening_distribution: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          band_id: string
          band_name: string
          listening_seconds: number
          percentage: number
        }[]
      }
      increment_band_earnings: {
        Args: { p_amount: number; p_band_id: string }
        Returns: undefined
      }
      is_album_saved: { Args: { p_album_id: string }; Returns: boolean }
      is_following_band: { Args: { p_band_id: string }; Returns: boolean }
      is_track_liked: { Args: { p_track_id: string }; Returns: boolean }
      like_track: { Args: { p_track_id: string }; Returns: boolean }
      record_stream: {
        Args: {
          p_country_code?: string
          p_duration_seconds: number
          p_is_free_play?: boolean
          p_track_id: string
        }
        Returns: boolean
      }
      reject_track: {
        Args: { p_notes: string; p_track_id: string }
        Returns: boolean
      }
      release_platform_isrc: { Args: { p_track_id: string }; Returns: boolean }
      remove_track_from_playlist: {
        Args: { p_playlist_id: string; p_track_id: string }
        Returns: boolean
      }
      request_track_revision: {
        Args: { p_notes: string; p_track_id: string }
        Returns: boolean
      }
      save_album: { Args: { p_album_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unfollow_band: { Args: { p_band_id: string }; Returns: boolean }
      unlike_track: { Args: { p_track_id: string }; Returns: boolean }
      unsave_album: { Args: { p_album_id: string }; Returns: boolean }
      use_free_play: { Args: never; Returns: boolean }
      user_owns_track_band: { Args: { p_track_id: string }; Returns: boolean }
    }
    Enums: {
      moderation_status:
        | "pending"
        | "approved"
        | "rejected"
        | "revision_requested"
        | "pending_update"
      release_type: "album" | "ep" | "single" | "compilation"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      subscription_tier: "free" | "standard" | "premium"
      user_role: "user" | "band" | "admin"
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
      moderation_status: [
        "pending",
        "approved",
        "rejected",
        "revision_requested",
        "pending_update",
      ],
      release_type: ["album", "ep", "single", "compilation"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      subscription_tier: ["free", "standard", "premium"],
      user_role: ["user", "band", "admin"],
    },
  },
} as const

// ============================================================================
// Convenience Type Aliases
// ============================================================================

// Table row types (what you get from SELECT)
export type Album = Database['public']['Tables']['albums']['Row']
export type Band = Database['public']['Tables']['bands']['Row']
export type Track = Database['public']['Tables']['tracks']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Playlist = Database['public']['Tables']['playlists']['Row']
export type PlaylistTrack = Database['public']['Tables']['playlist_tracks']['Row']
export type PlaylistCollaborator = Database['public']['Tables']['playlist_collaborators']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type LikedTrack = Database['public']['Tables']['liked_tracks']['Row']
export type SavedAlbum = Database['public']['Tables']['saved_albums']['Row']
export type ListeningHistory = Database['public']['Tables']['listening_history']['Row']
export type StreamEvent = Database['public']['Tables']['stream_events']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type TrackCredit = Database['public']['Tables']['track_credits']['Row']
export type ModerationQueueItem = Database['public']['Tables']['moderation_queue']['Row']
export type ArtistBalance = Database['public']['Tables']['artist_balances']['Row']
export type ArtistEarning = Database['public']['Tables']['artist_earnings']['Row']
export type Payout = Database['public']['Tables']['payouts']['Row']
export type ImpactShare = Database['public']['Tables']['impact_shares']['Row']
export type TranscodingQueueItem = Database['public']['Tables']['transcoding_queue']['Row']

// Insert types (what you pass to INSERT)
export type AlbumInsert = Database['public']['Tables']['albums']['Insert']
export type BandInsert = Database['public']['Tables']['bands']['Insert']
export type TrackInsert = Database['public']['Tables']['tracks']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type PlaylistInsert = Database['public']['Tables']['playlists']['Insert']
export type PlaylistTrackInsert = Database['public']['Tables']['playlist_tracks']['Insert']

// Update types (what you pass to UPDATE)
export type AlbumUpdate = Database['public']['Tables']['albums']['Update']
export type BandUpdate = Database['public']['Tables']['bands']['Update']
export type TrackUpdate = Database['public']['Tables']['tracks']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type PlaylistUpdate = Database['public']['Tables']['playlists']['Update']

// Enum types
export type ModerationStatus = Database['public']['Enums']['moderation_status']
export type ReleaseType = Database['public']['Enums']['release_type']
export type SubscriptionStatus = Database['public']['Enums']['subscription_status']
export type SubscriptionTier = Database['public']['Enums']['subscription_tier']
export type UserRole = Database['public']['Enums']['user_role']
