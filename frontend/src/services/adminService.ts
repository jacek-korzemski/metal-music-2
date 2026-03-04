const API_BASE = '/api/admin';
const TOKEN_KEY = 'jwt_token';

export interface AdminComment {
  id: number;
  song_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export interface AdminRating {
  id: number;
  song_id: number;
  user_name: string;
  rating: number;
  created_at: string;
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw errorData;
  }

  return response.json();
}

export async function getAllComments(): Promise<AdminComment[]> {
  return request<AdminComment[]>('/comments');
}

export async function deleteComment(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/comments/${id}`, {
    method: 'DELETE',
  });
}

export async function getAllRatings(): Promise<AdminRating[]> {
  return request<AdminRating[]>('/ratings');
}

export async function deleteRating(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/ratings/${id}`, {
    method: 'DELETE',
  });
}
