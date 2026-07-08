import { supabase, type DBUser } from '@/lib/supabase';
import type { AuthUser, UserProfile } from '@/features/auth/types/user';

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';

/** Status de aprovação do cadastro (ver migration 0006_user_approval.sql). */
export async function getUserStatus(userId: string): Promise<UserApprovalStatus | null> {
  const { data, error } = await supabase.from('users').select('status').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data?.status as UserApprovalStatus | undefined) ?? null;
}

/** Assina o evento de troca de sessão (login/logout). Retorna a função de unsubscribe. */
export function onAuthChange(callback: (user: AuthUser | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    callback(u ? { id: u.id, email: u.email ?? '' } : null);
  });
  return () => subscription.unsubscribe();
}

// ─── Perfil (tabela `users`) ──────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar, phone')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as DBUser;
  return { id: row.id, name: row.name, email: row.email, avatarUrl: row.avatar ?? undefined, phone: row.phone ?? undefined };
}

export async function upsertProfile(profile: UserProfile & { id: string }): Promise<void> {
  const { error } = await supabase.from('users').upsert({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatarUrl ?? null,
    phone: profile.phone ?? null,
  });
  if (error) throw error;
}
