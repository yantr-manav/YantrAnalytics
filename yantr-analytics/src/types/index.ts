// TypeScript interfaces for all API responses

export interface RadarScores {
  hook_strength: number;
  visual_quality: number;
  seo: number;
  engagement: number;
  consistency: number;
  community: number;
}

export interface VideoItem {
  title: string;
  views: number;
  likes?: number;
  url: string;
  video_id?: string;
  date?: string;
  duration: number;
  thumbnail: string;
  type: 'Video' | 'Short';
}

export interface ChannelStats {
  total_videos_scanned: number;
  total_shorts_scanned: number;
  total_posts_scanned: number;
  avg_views_videos: number;
  avg_views_shorts: number;
  dominant_format: string;
  engagement_rate: number;
  upload_frequency_days?: number;
}

export interface ChannelProfile {
  handle: string;
  subscribers?: number;
  videos: VideoItem[];
  shorts: VideoItem[];
  community_posts: Record<string, unknown>[];
  stats: ChannelStats;
}

export interface AnalysisResult {
  niche: string;
  sub_niche: string;
  authority_type: string;
  viral_probability_score: number;
  hook_score: number;
  content_pillars: string[];
  top_keywords: string[];
  radar_scores: RadarScores;
  growth_potential: 'Low' | 'Medium' | 'High' | 'Explosive';
  estimated_monthly_views: number;
  report_markdown: string;
}

export interface CompetitorVideo {
  title: string;
  views: number;
  duration: number;
  date?: string;
}

export interface Competitor {
  name: string;
  url: string;
  sample_views: number;
  recent_videos: CompetitorVideo[];
}

export interface CompetitorResult {
  competitors: Competitor[];
  report: string;
}

export interface TrendItem {
  query: string;
  value: number;
  type: 'rising' | 'top';
}

export interface FullAnalysis {
  handle: string;
  profile: ChannelProfile;
  analysis: AnalysisResult;
  competitors: CompetitorResult;
  trends: TrendItem[];
  mermaid_diagram: string;
  cached: boolean;
}

export interface TitleVariation {
  title: string;
  ctr_score: number;
  hook_type: string;
  seo_keywords_used: string[];
  why_it_works: string;
}

export interface CalendarEntry {
  day: number;
  date_label: string;
  format: string;
  title: string;
  hook: string;
  rationale: string;
}

export interface ContentCalendar {
  handle: string;
  niche: string;
  calendar: CalendarEntry[];
  weekly_themes: Record<string, string>;
  total_entries: number;
}
