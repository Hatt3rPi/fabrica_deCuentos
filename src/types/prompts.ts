export interface Prompt {
  id: string;
  type: string;
  content: string;
  endpoint?: string | null;
  model?: string | null;
  version: number;
  updated_at: string;
  updated_by?: string | null;
  // Image generation preferences
  size?: string | null;
  quality?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  created_at: string;
  created_by?: string | null;
}
