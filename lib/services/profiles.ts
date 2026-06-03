import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types/database';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProfile(
  userId: string,
  profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ ...profile, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitKYC(
  userId: string,
  fullName: string,
  phone: string,
  bvn: string
): Promise<Profile> {
  return updateProfile(userId, {
    full_name: fullName,
    phone,
    bvn,
    kyc_status: 'pending',
    kyc_submitted_at: new Date().toISOString(),
  });
}

export async function verifyBVN(userId: string, bvn: string): Promise<Profile> {
  return updateProfile(userId, {
    bvn_verified: true,
  });
}
