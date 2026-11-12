export type Role = 'user' | 'admin';

export type UserRef = { _id: string; name: string };

export type User = UserRef & { email: string; role: Role; interests: string[]; updatedAt: string };

export type Note = {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: string | (UserRef & { email: string }) | null;
};

export type Post = { _id: string; title: string; body: string; createdAt: string; author?: UserRef | null };

export type InterestGroup = { interest: string; count: number; users: UserRef[] };

export type Page<T> = { items: T[]; page: number; limit: number; total: number; totalPages: number };

export type AuthResult = { token: string; user: User };
