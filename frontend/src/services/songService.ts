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

export interface ReviewAuthor {
  name: string;
}

export interface ReviewListItem {
  id: number;
  song_id: number;
  /** Denormalizowany tytuł z user-backend (null u starych rekordów). */
  song_title: string | null;
  updated_at: string;
  created_at: string;
  author: ReviewAuthor;
}

export interface ReviewDetail {
  id: number;
  song_id: number;
  song_title: string | null;
  content_html: string;
  created_at: string;
  updated_at: string;
  author: ReviewAuthor;
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

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
}

export async function listReviews(): Promise<ReviewListItem[]> {
  return request<ReviewListItem[]>('/reviews');
}

export async function getReviewBySong(
  songId: number
): Promise<ReviewDetail | null> {
  const response = await fetch(`${API_BASE}/songs/${songId}/review`, {
    headers: { Accept: 'application/json' },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw errorData;
  }
  return response.json() as Promise<ReviewDetail>;
}

export async function upsertReview(
  songId: number,
  contentHtml: string,
  songTitle?: string | null
): Promise<ReviewDetail> {
  const body: { content_html: string; song_title?: string } = {
    content_html: contentHtml,
  };
  if (songTitle != null && String(songTitle).trim() !== '') {
    body.song_title = String(songTitle).trim();
  }
  const response = await fetchWithAuth(`/admin/songs/${songId}/review`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw errorData;
  }
  return response.json() as Promise<ReviewDetail>;
}

export async function deleteReview(reviewId: number): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/admin/reviews/${reviewId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw errorData;
  }
  return response.json() as Promise<{ message: string }>;
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
