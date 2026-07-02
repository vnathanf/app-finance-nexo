export type CollabRole = 'Editor' | 'Leitor';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: CollabRole;
  invitedBy: string;
  /** Resolvido a partir de `public.users`; pode faltar (ex: contas via Google que nunca gravaram perfil). */
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  email: string;
  role: CollabRole;
  invitedBy: string;
  createdAt: string;
  /** Resolvidos client-side só para o banner de "convites recebidos". */
  projectName?: string;
  ownerName?: string;
}
