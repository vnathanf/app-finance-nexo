import { supabase, type DBProjectMember, type DBProjectInvite, type DBUser } from '@/lib/supabase';
import type { ProjectMember, ProjectInvite, CollabRole } from '@/types/collaboration';

/** Busca nomes/e-mails/avatares em `public.users` pra um conjunto de ids, tolerando perfis ausentes. */
async function fetchProfilesByIds(userIds: string[]): Promise<Map<string, DBUser>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await supabase.from('users').select('id, name, email, avatar').in('id', userIds);
  if (error) throw error;
  return new Map((data as DBUser[]).map((row) => [row.id, row]));
}

function memberFromDB(row: DBProjectMember, profile?: DBUser): ProjectMember {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by,
    name: profile?.name,
    email: profile?.email,
    avatarUrl: profile?.avatar ?? undefined,
  };
}

function inviteFromDB(row: DBProjectInvite): ProjectInvite {
  return {
    id: row.id,
    projectId: row.project_id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}

export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data as DBProjectMember[];
  const profiles = await fetchProfilesByIds(rows.map((r) => r.user_id));
  return rows.map((row) => memberFromDB(row, profiles.get(row.user_id)));
}

export async function updateMemberRole(memberId: string, role: CollabRole): Promise<void> {
  const { error } = await supabase.from('project_members').update({ role }).eq('id', memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('project_members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function listInvites(projectId: string): Promise<ProjectInvite[]> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DBProjectInvite[]).map(inviteFromDB);
}

export async function inviteMember(
  projectId: string,
  email: string,
  role: CollabRole,
  invitedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('project_invites')
    .insert({ project_id: projectId, email: email.trim().toLowerCase(), role, invited_by: invitedBy });
  if (error) throw error;
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('project_invites').delete().eq('id', inviteId);
  if (error) throw error;
}

/** Convidado recusando o próprio convite — mesma operação de `cancelInvite`, permitida pela policy do convidado. */
export const declineInvite = cancelInvite;

/** Convites pendentes para o e-mail do usuário logado, com nome do projeto e de quem convidou resolvidos. */
export async function listMyInvites(email: string): Promise<ProjectInvite[]> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data as DBProjectInvite[];
  if (rows.length === 0) return [];

  const projectIds = Array.from(new Set(rows.map((r) => r.project_id)));
  const inviterIds = Array.from(new Set(rows.map((r) => r.invited_by)));

  const [{ data: projectRows, error: projectError }, profiles] = await Promise.all([
    supabase.from('projects').select('id, name').in('id', projectIds),
    fetchProfilesByIds(inviterIds),
  ]);
  if (projectError) throw projectError;

  const projectNames = new Map((projectRows as { id: string; name: string }[]).map((p) => [p.id, p.name]));

  return rows.map((row) => ({
    ...inviteFromDB(row),
    projectName: projectNames.get(row.project_id),
    ownerName: profiles.get(row.invited_by)?.name,
  }));
}

/** Aceita o convite via RPC (bypassa RLS de propósito — o convidado ainda não é membro do projeto). */
export async function acceptInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_project_invite', { p_invite_id: inviteId });
  if (error) throw error;
}
