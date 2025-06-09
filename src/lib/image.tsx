import React from 'react';

export interface ImageOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export function getOptimizedImageUrl(path: string, options: ImageOptions = {}): string {
  if (!path) return '';

  let url = path;
  if (!/^https?:/i.test(path)) {
    const base = import.meta.env.VITE_SUPABASE_URL;
    url = `${base}/storage/v1/object/public/${path.replace(/^\//, '')}`;
  }

  try {
    const u = new URL(url);
    if (options.width) u.searchParams.set('width', String(options.width));
    if (options.quality) u.searchParams.set('quality', String(options.quality));
    if (options.format) u.searchParams.set('format', options.format);
    return u.toString();
  } catch {
    return url;
  }
}

export interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement>, ImageOptions {
  path: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ path, width, quality, format, ...props }) => {
  const src = getOptimizedImageUrl(path, { width, quality, format });
  return <img src={src} {...props} />;
};
