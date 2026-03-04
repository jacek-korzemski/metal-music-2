export interface Video {
  id: number;
  channel_id: string;
  video_id: string;
  title: string;
  url: string;
  published_at: string;
  default_thumbnail: string;
  medium_thumbnail: string;
  high_thumbnail: string;
  channel_title: string;
  hide: boolean | null;
  deleted: boolean | null;
}
