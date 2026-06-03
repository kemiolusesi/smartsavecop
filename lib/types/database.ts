// Auto-generated types based on Supabase schema

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  bvn: string;
  bvn_verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_submitted_at: string | null;
  kyc_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsPlan {
  id: string;
  user_id: string;
  plan_type: '6-month' | '12-month';
  principal_amount: number;
  annual_rate: number;
  accrued_interest: number;
  start_date: string;
  mature_date: string;
  status: 'active' | 'matured' | 'withdrawn' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  savings_plan_id: string | null;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'fee' | 'interest_accrual';
  status: 'success' | 'pending' | 'failed';
  reference: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          user_id: string;
          full_name: string;
          phone: string;
          bvn: string;
          bvn_verified?: boolean;
          kyc_status?: string;
          kyc_submitted_at?: string | null;
          kyc_approved_at?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string;
          bvn?: string;
          bvn_verified?: boolean;
          kyc_status?: string;
          kyc_submitted_at?: string | null;
          kyc_approved_at?: string | null;
        };
      };
      savings_plans: {
        Row: SavingsPlan;
        Insert: {
          user_id: string;
          plan_type: '6-month' | '12-month';
          principal_amount: number;
          annual_rate: number;
          start_date: string;
          mature_date: string;
          status?: string;
        };
        Update: {
          status?: string;
          accrued_interest?: number;
        };
      };
      transactions: {
        Row: Transaction;
        Insert: {
          user_id: string;
          savings_plan_id?: string | null;
          amount: number;
          type: string;
          status?: string;
          description?: string;
        };
        Update: {
          status?: string;
        };
      };
    };
  };
};
