import { Side, SizeOption, Quality, OutputFormat } from './illustration';

export interface Character {
  id: string;
  user_id: string;
  name: string;
  description: {
    es: string;
    en: string;
  } | string;
  age: string;
  images: string[];
  thumbnailUrl: string | null;
  reference_urls?: string[];
  frontal_view_url?: string | null;
  side_view_url?: string | null;
  back_view_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CharacterIdentity {
  name: string;
  age: string;
  description: string;
}

export interface CharacterScene {
  background: string;
  pose: string;
  style: string;
  palette: string;
}

export interface GenerateCharacterParams {
  identity: CharacterIdentity;
  scene: CharacterScene;
  side?: Side;
  size?: SizeOption;
  quality?: Quality;
  output?: OutputFormat;
  referencedImageIds: string[];
}