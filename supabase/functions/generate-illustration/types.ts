export interface GenerateIllustrationParams {
  identity: {
    name: string;
    age: string;
    description: string;
  };
  scene: {
    background: string;
    pose: string;
    style: string;
    palette: string;
  };
  side?: "central" | "left" | "right";
  size?: "auto" | "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "low" | "medium" | "high";
  output?: "png" | "jpg";
  referencedImageIds?: string[];
}