export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
