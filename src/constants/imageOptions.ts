export const openaiQualityOptions: Record<string, string[]> = {
  'gpt-image-1': ['auto', 'high', 'medium', 'low'],
  'dall-e-3': ['hd', 'standard'],
  'dall-e-2': ['standard'],
};

export const openaiSizeOptions: Record<string, string[]> = {
  'gpt-image-1': ['auto', '1024x1024', '1536x1024', '1024x1536'],
  'dall-e-3': ['1024x1024', '1792x1024', '1024x1792'],
  'dall-e-2': ['256x256', '512x512', '1024x1024'],
};
