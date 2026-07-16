// Auto-generated types based on Supabase schema

export interface Profile {
  id: string;
  user_id: string;
  email?: string;
  full_name: string;
  phone_number?: string | null;
  kyc_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  kyc_submitted_at: string | null;
  kyc_verified_at?: string | null;
  kyc_rejection_reason?: string | null;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  has_paid?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  nin?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  state_of_residence?: string | null;
  occupation?: string | null;
  employment_status?: string | null;
  monthly_income_range?: string | null;
  kyc_document_url?: string | null;
  kyc_document_type?: string | null;
  kyc_document_number?: string | null;
  kyc_expiry_date?: string | null;
  kyc_selfie_url?: string | null;
  next_of_kin_name?: string | null;
  next_of_kin_relationship?: string | null;
  next_of_kin_phone?: string | null;
  next_of_kin_email?: string | null;
  terms_accepted?: boolean;
  terms_accepted_at?: string | null;
  is_admin?: boolean;
  is_active?: boolean;
  balance?: number | string | null;
  avatar_url?: string | null;
  registration_fee_paid?: boolean | null;
  activated_at?: string | null;
  activated_by?: string | null;
  deactivated_at?: string | null;
  notes?: string | null;
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
  type: 'deposit' | 'withdrawal' | 'registration_fee' | 'fee' | 'interest_accrual' | 'loan_repayment' | 'loan_disbursement' | 'manual_adjustment' | 'interest_credit';
  status: 'success' | 'approved' | 'completed' | 'pending' | 'processing' | 'failed' | 'rejected' | 'transferred';
  reference: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MfaBackupCode {
  id: string;
  user_id: string;
  code_hash: string;
  used: boolean;
  created_at: string;
  used_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          user_id: string;
          full_name: string;
          phone_number?: string | null;
          kyc_status?: string;
          kyc_submitted_at?: string | null;
          kyc_verified_at?: string | null;
          kyc_rejection_reason?: string | null;
          approval_status?: string;
          nin?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          state_of_residence?: string | null;
          occupation?: string | null;
          employment_status?: string | null;
          monthly_income_range?: string | null;
          kyc_document_url?: string | null;
          kyc_document_type?: string | null;
          kyc_document_number?: string | null;
          kyc_expiry_date?: string | null;
          kyc_selfie_url?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_relationship?: string | null;
          next_of_kin_phone?: string | null;
          next_of_kin_email?: string | null;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
        };
        Update: {
          full_name?: string;
          phone_number?: string | null;
          kyc_status?: string;
          kyc_submitted_at?: string | null;
          kyc_verified_at?: string | null;
          kyc_rejection_reason?: string | null;
          approval_status?: string;
          nin?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          state_of_residence?: string | null;
          occupation?: string | null;
          employment_status?: string | null;
          monthly_income_range?: string | null;
          kyc_document_url?: string | null;
          kyc_document_type?: string | null;
          kyc_document_number?: string | null;
          kyc_expiry_date?: string | null;
          kyc_selfie_url?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_relationship?: string | null;
          next_of_kin_phone?: string | null;
          next_of_kin_email?: string | null;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
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
      mfa_backup_codes: {
        Row: MfaBackupCode;
        Insert: {
          user_id: string;
          code_hash: string;
          used?: boolean;
          created_at?: string;
          used_at?: string | null;
        };
        Update: {
          used?: boolean;
          used_at?: string | null;
        };
      };
    };
  };
};
