export type Side = "derecho" | "izquierdo" | "central";
export type SizeOption = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
export type Quality = "low" | "medium" | "high" | "auto";
export type OutputFormat = "png" | "jpeg" | "webp";

export interface Identity {
  name: string;
  age: string;
  description: string;
}

export interface Scene {
  background: string;
  pose: string;
  style: string;
  palette: string;
}

export interface GenerateIllustrationParams {
  identity: Identity;
  scene: Scene;
  side?: Side;
  size?: SizeOption;
  quality?: Quality;
  output?: OutputFormat;
  referencedImageIds: string[];
}