/**
 * Servicio de Protección de Imágenes
 * 
 * Maneja la protección multi-capa de imágenes generadas por La CuenterIA
 * incluyendo URLs firmadas, watermarks, y medidas de seguridad frontend.
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface ProtectedImageConfig {
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  watermarkPosition: 'bottom-right' | 'center' | 'random' | 'top-left' | 'top-right' | 'bottom-left';
  signedUrlDuration: number; // en segundos
  rateLimitPerMinute: number;
  canvasProtectionEnabled: boolean;
  rightClickDisabled: boolean;
  devToolsDetection: boolean;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
  cached: boolean;
}

export interface ImageMetadata {
  originalPath: string;
  protectedPath: string;
  userId: string;
  storyId?: string;
  characterId?: string;
  type: 'cover' | 'page' | 'thumbnail' | 'dedicatoria' | 'background';
}

class ImageProtectionService {
  private config: ProtectedImageConfig | null = null;
  private configLoadPromise: Promise<ProtectedImageConfig> | null = null;

  /**
   * Obtiene la configuración de protección de imágenes
   */
  async getConfig(): Promise<ProtectedImageConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.configLoadPromise) {
      return this.configLoadPromise;
    }

    this.configLoadPromise = this.loadConfig();
    this.config = await this.configLoadPromise;
    this.configLoadPromise = null;

    return this.config;
  }

  private async loadConfig(): Promise<ProtectedImageConfig> {
    try {
      const { data, error } = await supabase
        .from('image_protection_config')
        .select('*')
        .single();

      if (error) {
        logger.warn('Error loading protection config, using defaults:', error);
        return this.getDefaultConfig();
      }

      return {
        watermarkEnabled: data.watermark_enabled,
        watermarkOpacity: data.watermark_opacity,
        watermarkPosition: data.watermark_position,
        signedUrlDuration: data.signed_url_duration,
        rateLimitPerMinute: data.rate_limit_per_minute,
        canvasProtectionEnabled: data.canvas_protection_enabled,
        rightClickDisabled: data.right_click_disabled,
        devToolsDetection: data.dev_tools_detection,
      };
    } catch (error) {
      logger.error('Failed to load protection config:', error);
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): ProtectedImageConfig {
    return {
      watermarkEnabled: true,
      watermarkOpacity: 0.15,
      watermarkPosition: 'bottom-right',
      signedUrlDuration: 300, // 5 minutos
      rateLimitPerMinute: 60,
      canvasProtectionEnabled: true,
      rightClickDisabled: true,
      devToolsDetection: true,
    };
  }

  /**
   * Genera una URL firmada para una imagen protegida
   */
  async getProtectedImageUrl(
    filePath: string,
    options: {
      expiresIn?: number;
      withWatermark?: boolean;
      width?: number;
      quality?: number;
    } = {}
  ): Promise<SignedUrlResult> {
    try {
      const config = await this.getConfig();
      const expiresIn = options.expiresIn || config.signedUrlDuration;

      // Intentar usar el cache primero
      const cached = await this.getCachedSignedUrl(filePath);
      if (cached && cached.isValid) {
        return {
          url: cached.url,
          expiresAt: cached.expiresAt,
          cached: true,
        };
      }

      // Generar nueva URL firmada
      const { data, error } = await supabase.storage
        .from('protected-storage')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Error creating signed URL: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL returned from Supabase');
      }

      let finalUrl = data.signedUrl;

      // Aplicar transformaciones si se solicitan
      if (options.withWatermark && config.watermarkEnabled) {
        finalUrl = this.addWatermarkToUrl(finalUrl, config);
      }

      if (options.width || options.quality) {
        finalUrl = this.addImageOptimizationToUrl(finalUrl, {
          width: options.width,
          quality: options.quality,
        });
      }

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Guardar en cache
      await this.cacheSignedUrl(filePath, finalUrl, expiresAt);

      return {
        url: finalUrl,
        expiresAt,
        cached: false,
      };
    } catch (error) {
      logger.error('Error generating protected image URL:', error);
      throw error;
    }
  }

  /**
   * Verifica si una URL firmada sigue siendo válida
   */
  private isUrlValid(url: string, expiresAt: Date): boolean {
    const now = new Date();
    const buffer = 30 * 1000; // 30 segundos de buffer
    return expiresAt.getTime() - now.getTime() > buffer;
  }

  /**
   * Obtiene una URL firmada del cache usando función separada
   */
  private async getCachedSignedUrl(
    filePath: string
  ): Promise<{ url: string; expiresAt: Date; isValid: boolean } | null> {
    try {
      const { data, error } = await supabase.rpc('get_cached_signed_url', {
        p_file_path: filePath,
      });

      if (error) {
        logger.debug('Error checking cache for protected URL:', error);
        return null;
      }

      if (data && data.length > 0) {
        const cached = data[0];
        return {
          url: cached.url,
          expiresAt: new Date(cached.expires_at),
          isValid: cached.is_valid,
        };
      }

      return null;
    } catch (error) {
      logger.debug('Cache miss for protected URL:', filePath);
      return null;
    }
  }

  /**
   * Guarda una URL firmada en el cache
   */
  private async cacheSignedUrl(
    filePath: string,
    signedUrl: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      await supabase.from('signed_urls_cache').upsert({
        file_path: filePath,
        signed_url: signedUrl,
        expires_at: expiresAt.toISOString(),
      });
    } catch (error) {
      logger.warn('Failed to cache signed URL:', error);
      // No arrojar error, el cache es opcional
    }
  }

  /**
   * Añade parámetros de watermark a una URL
   */
  private addWatermarkToUrl(url: string, config: ProtectedImageConfig): string {
    const watermarkParams = new URLSearchParams({
      watermark: 'true',
      opacity: config.watermarkOpacity.toString(),
      position: config.watermarkPosition,
    });

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${watermarkParams.toString()}`;
  }

  /**
   * Añade parámetros de optimización de imagen a una URL
   */
  private addImageOptimizationToUrl(
    url: string,
    options: { width?: number; quality?: number }
  ): string {
    const params = new URLSearchParams();

    if (options.width) {
      params.append('width', options.width.toString());
    }

    if (options.quality) {
      params.append('quality', options.quality.toString());
    }

    if (params.toString()) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${params.toString()}`;
    }

    return url;
  }

  /**
   * Migra una imagen del bucket público al bucket protegido
   */
  async migrateImageToProtected(
    publicPath: string,
    metadata: Omit<ImageMetadata, 'protectedPath'>
  ): Promise<string> {
    try {
      // Construir el path protegido
      const protectedPath = this.buildProtectedPath(metadata);

      // Descargar la imagen del bucket público
      const { data: publicData, error: downloadError } = await supabase.storage
        .from('storage')
        .download(publicPath);

      if (downloadError) {
        throw new Error(`Error downloading public image: ${downloadError.message}`);
      }

      // Subir al bucket protegido
      const { error: uploadError } = await supabase.storage
        .from('protected-storage')
        .upload(protectedPath, publicData, {
          contentType: publicData.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error uploading to protected storage: ${uploadError.message}`);
      }

      logger.info('Image migrated successfully:', {
        from: publicPath,
        to: protectedPath,
      });

      return protectedPath;
    } catch (error) {
      logger.error('Error migrating image to protected storage:', error);
      throw error;
    }
  }

  /**
   * Construye el path para el almacenamiento protegido
   */
  private buildProtectedPath(metadata: Omit<ImageMetadata, 'protectedPath'>): string {
    const { userId, storyId, characterId, type, originalPath } = metadata;
    const filename = originalPath.split('/').pop() || 'image';

    // Estructura: userId/type/[storyId|characterId]/filename
    if (storyId) {
      return `${userId}/${type}/${storyId}/${filename}`;
    }

    if (characterId) {
      return `${userId}/${type}/${characterId}/${filename}`;
    }

    return `${userId}/${type}/${filename}`;
  }

  /**
   * Limpia URLs expiradas del cache
   */
  async cleanupExpiredUrls(): Promise<number> {
    try {
      const { data } = await supabase.rpc('cleanup_expired_signed_urls');
      logger.info(`Cleaned up ${data || 0} expired signed URLs`);
      return data || 0;
    } catch (error) {
      logger.error('Error cleaning up expired URLs:', error);
      return 0;
    }
  }

  /**
   * Detecta si las herramientas de desarrollo están abiertas
   */
  detectDevTools(): boolean {
    if (typeof window === 'undefined') return false;

    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    return widthThreshold || heightThreshold;
  }

  /**
   * Aplica protecciones de UI a un elemento
   */
  applyUIProtections(element: HTMLElement, config?: ProtectedImageConfig): void {
    if (!element) return;

    const finalConfig = config || this.config || this.getDefaultConfig();

    if (finalConfig.rightClickDisabled) {
      element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }

    // Prevenir drag & drop
    element.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Prevenir selección
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';

    // Prevenir guardar imagen con teclas
    element.addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    });

    // Crear overlay invisible para bloquear interacciones
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'transparent';

    if (element.style.position === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(overlay);
  }

  /**
   * Genera posición aleatoria para watermark
   */
  generateRandomWatermarkPosition(): string {
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
    return positions[Math.floor(Math.random() * positions.length)];
  }
}

// Instancia singleton del servicio
export const imageProtectionService = new ImageProtectionService();

// Hooks y utilidades para usar en componentes React
export const useImageProtection = () => {
  return {
    getProtectedUrl: imageProtectionService.getProtectedImageUrl.bind(imageProtectionService),
    migrateImage: imageProtectionService.migrateImageToProtected.bind(imageProtectionService),
    applyProtections: imageProtectionService.applyUIProtections.bind(imageProtectionService),
    detectDevTools: imageProtectionService.detectDevTools.bind(imageProtectionService),
  };
};

export default imageProtectionService;