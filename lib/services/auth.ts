import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/lib/utils/authError';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  fullName: string;
}

function getSiteUrl() {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || '';
}

export const authService = {
  async signUp(data: SignUpData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?type=signup`,
      },
    });

    if (error) throw new Error(getAuthErrorMessage(error));
    return authData;
  },

  async signIn(credentials: AuthCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw new Error(getAuthErrorMessage(error));
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(getAuthErrorMessage(error));
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?type=recovery`,
    });

    if (error) throw new Error(getAuthErrorMessage(error));
  },
};
