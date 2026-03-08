import { USER_API_URL } from '../config';

const API_BASE = `${USER_API_URL}/api`;
const TOKEN_KEY = 'jwt_token';

export interface CommentData {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export interface RatingData {
  average_rating: number;
  rating_count: number;
  user_rating: number | null;
}

export interface RatingResponse {
  message: string;
  average_rating: number;
  rating_count: number;
}

export interface CommentedSongData {
  song_id: number;
  comment_count: number;
}

export interface RatedSongData {
  song_id: number;
  average_rating: number;
  rating_count: number;
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

export async function getComments(songId: number): Promise<CommentData[]> {
  return request<CommentData[]>(`/songs/${songId}/comments`);
}

export async function addComment(
  songId: number,
  content: string
): Promise<{ message: string }> {
  return request<{ message: string }>(`/songs/${songId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getRatings(songId: number): Promise<RatingData> {
  return request<RatingData>(`/songs/${songId}/ratings`);
}

export async function addOrUpdateRating(
  songId: number,
  rating: number
): Promise<RatingResponse> {
  return request<RatingResponse>(`/songs/${songId}/ratings`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });
}

export async function getMostCommented(): Promise<CommentedSongData[]> {
  return request<CommentedSongData[]>('/most-commented');
}

export async function getBestRated(): Promise<RatedSongData[]> {
  return request<RatedSongData[]>('/best-rated');
}
