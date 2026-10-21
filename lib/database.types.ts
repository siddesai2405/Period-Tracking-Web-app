export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_seed: string;
          avg_cycle_length: number;
          avg_period_length: number;
          birth_year: number | null;
          accent_theme: string;
          diet_preference: string;
          health_goal: string;
          activity_level: string | null;
          height: number | null;
          weight: number | null;
          medical_conditions: string[];
          food_allergies: string[];
          stress_level: number | null;
          is_admin: boolean;
          is_active: boolean;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          avatar_seed?: string;
          avg_cycle_length?: number;
          avg_period_length?: number;
          birth_year?: number | null;
          accent_theme?: string;
          diet_preference?: string;
          health_goal?: string;
          activity_level?: string | null;
          height?: number | null;
          weight?: number | null;
          medical_conditions?: string[];
          food_allergies?: string[];
          stress_level?: number | null;
          is_admin?: boolean;
          is_active?: boolean;
          onboarded?: boolean;
        };
        Update: {
          name?: string;
          avatar_seed?: string;
          avg_cycle_length?: number;
          avg_period_length?: number;
          birth_year?: number | null;
          accent_theme?: string;
          diet_preference?: string;
          health_goal?: string;
          activity_level?: string | null;
          height?: number | null;
          weight?: number | null;
          medical_conditions?: string[];
          food_allergies?: string[];
          stress_level?: number | null;
          is_admin?: boolean;
          is_active?: boolean;
          onboarded?: boolean;
        };
      };
      cycles: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          start_date: string;
          end_date?: string | null;
        };
        Update: {
          end_date?: string | null;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          flow: string | null;
          mood: string | null;
          symptoms: string[];
          sleep_hrs: number | null;
          water_cups: number | null;
          notes: string | null;
        };
        Insert: {
          user_id: string;
          date: string;
          flow?: string | null;
          mood?: string | null;
          symptoms?: string[];
          sleep_hrs?: number | null;
          water_cups?: number | null;
          notes?: string | null;
        };
        Update: {
          flow?: string | null;
          mood?: string | null;
          symptoms?: string[];
          sleep_hrs?: number | null;
          water_cups?: number | null;
          notes?: string | null;
        };
      };
      pcos_assessments: {
        Row: {
          id: string;
          user_id: string;
          answers: Json;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          answers?: Json;
          completed_at?: string | null;
        };
        Update: {
          answers?: Json;
          completed_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: "user" | "assistant";
          content: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
