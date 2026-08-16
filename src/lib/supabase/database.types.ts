/**
 * Generated-friendly database types.
 * These mirror the schema in `supabase/schema.sql`. Keep them in sync when the
 * schema changes. They can be regenerated with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/lib/supabase/database.types.ts
 */

export type UserRole = "customer" | "worker";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone: string;
          role: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      worker_profiles: {
        Row: {
          id: string;
          description: string | null;
          experience_years: number;
          service_radius_km: number;
          is_available: boolean;
          lat: number | null;
          lng: number | null;
          location_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          description?: string | null;
          experience_years?: number;
          service_radius_km?: number;
          is_available?: boolean;
          lat?: number | null;
          lng?: number | null;
          location_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string | null;
          experience_years?: number;
          service_radius_km?: number;
          is_available?: boolean;
          lat?: number | null;
          lng?: number | null;
          location_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      worker_services: {
        Row: {
          id: string;
          worker_id: string;
          service_id: string;
          price_hourly: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          service_id: string;
          price_hourly?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          service_id?: string;
          price_hourly?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          worker_id: string;
          service_id: string;
          job_description: string;
          preferred_time: string;
          status: BookingStatus;
          address: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          worker_id: string;
          service_id: string;
          job_description: string;
          preferred_time: string;
          status?: BookingStatus;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          worker_id?: string;
          service_id?: string;
          job_description?: string;
          preferred_time?: string;
          status?: BookingStatus;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          worker_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          worker_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          customer_id?: string;
          worker_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_nearby_workers: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_service_slug: string;
        };
        Returns: Array<{
          worker_id: string;
          full_name: string;
          avatar_url: string | null;
          service_name: string;
          description: string | null;
          experience_years: number;
          rating: number;
          completed_jobs: number;
          distance_km: number;
        }>;
      };
      get_own_location: {
        Args: Record<string, never>;
        Returns: Array<{
          lat: number | null;
          lng: number | null;
          location_updated_at: string | null;
        }>;
      };
      get_booking_contact: {
        Args: {
          p_booking_id: string;
        };
        Returns: Array<{
          other_party_phone: string | null;
          other_party_name: string | null;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

