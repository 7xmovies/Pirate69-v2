export interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  link: string;
}

export interface SearchResponse {
  results: MediaItem[];
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
  error?: string;
}

export interface DownloadLink {
  label: string;
  url: string;
}

export interface PostDetails {
  title: string;
  thumbnail: string;
  screenshots: string[];
  downloadLinks: DownloadLink[];
}

export interface DetailsResponse {
  details?: PostDetails;
  error?: string;
}
