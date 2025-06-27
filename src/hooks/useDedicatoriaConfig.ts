import { useState, useEffect } from 'react';
import { styleConfigService } from '../services/styleConfigService';
import { DedicatoriaConfig } from '../types/styleConfig';

interface UseDedicatoriaConfigReturn {
  dedicatoriaConfig: DedicatoriaConfig | null;
  backgroundImageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useDedicatoriaConfig = (): UseDedicatoriaConfigReturn => {
  const [dedicatoriaConfig, setDedicatoriaConfig] = useState<DedicatoriaConfig | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDedicatoriaConfig = async () => {
      try {
        setIsLoading(true);
        const styleConfig = await styleConfigService.getActiveStyle();
        
        if (styleConfig?.dedicatoriaConfig) {
          setDedicatoriaConfig(styleConfig.dedicatoriaConfig);
          
          // Usar imagen de fondo si está configurada
          if (styleConfig.dedicatoriaConfig.backgroundImageUrl) {
            setBackgroundImageUrl(styleConfig.dedicatoriaConfig.backgroundImageUrl);
          } else {
            // Fallback a imagen por defecto de dedicatoria
            const defaultImage = await styleConfigService.getDedicatoriaSampleImage();
            setBackgroundImageUrl(defaultImage);
          }
        } else {
          // Si no hay configuración, usar imagen por defecto
          const defaultImage = await styleConfigService.getDedicatoriaSampleImage();
          setBackgroundImageUrl(defaultImage);
        }
      } catch (err) {
        console.error('Error cargando configuración de dedicatoria:', err);
        setError('No se pudo cargar la configuración de dedicatoria');
        // Usar fallback en caso de error
        setBackgroundImageUrl('https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=1200&h=800&fit=crop');
      } finally {
        setIsLoading(false);
      }
    };

    loadDedicatoriaConfig();
  }, []);

  return { dedicatoriaConfig, backgroundImageUrl, isLoading, error };
};