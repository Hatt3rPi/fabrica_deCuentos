import { useState, useEffect, useMemo, useCallback } from 'react';
import { styleConfigService } from '../services/styleConfigService';
import { 
  StoryStyleConfig, 
  convertToReactStyle, 
  convertContainerToReactStyle 
} from '../types/styleConfig';

interface UseStoryStylesReturn {
  styleConfig: StoryStyleConfig | null;
  getTextStyles: (pageIndex: number) => React.CSSProperties;
  getContainerStyles: (pageIndex: number) => React.CSSProperties;
  getPosition: (pageIndex: number) => string;
  getBackgroundImage: (pageIndex: number, pageImageUrl?: string) => string | undefined;
}

export const useStoryStyles = (): UseStoryStylesReturn => {
  const [styleConfig, setStyleConfig] = useState<StoryStyleConfig | null>(null);

  useEffect(() => {
    const fetchStyleConfig = async () => {
      try {
        const config = await styleConfigService.getActiveStyle();
        if (config) {
          setStyleConfig(config);
        }
      } catch (error) {
        console.error('Error loading style config:', error);
        // Continue with default styles if loading fails
      }
    };

    fetchStyleConfig();
  }, []);

  const getTextStyles = useCallback((pageIndex: number): React.CSSProperties => {
    if (!styleConfig) return {};
    const config = pageIndex === 0 
      ? styleConfig.coverConfig.title 
      : styleConfig.pageConfig.text;
    return convertToReactStyle(config);
  }, [styleConfig]);

  const getContainerStyles = useCallback((pageIndex: number): React.CSSProperties => {
    if (!styleConfig) return {};
    const config = pageIndex === 0 
      ? styleConfig.coverConfig.title 
      : styleConfig.pageConfig.text;
    return convertContainerToReactStyle(config.containerStyle);
  }, [styleConfig]);

  const getPosition = useCallback((pageIndex: number): string => {
    if (!styleConfig) return pageIndex === 0 ? 'center' : 'bottom';
    const config = pageIndex === 0 
      ? styleConfig.coverConfig.title 
      : styleConfig.pageConfig.text;
    return config.position;
  }, [styleConfig]);

  const getBackgroundImage = useCallback((
    pageIndex: number, 
    pageImageUrl?: string
  ): string | undefined => {
    // First check for custom background images
    if (styleConfig) {
      if (pageIndex === 0 && styleConfig.coverBackgroundUrl) {
        return styleConfig.coverBackgroundUrl;
      } else if (pageIndex > 0 && styleConfig.pageBackgroundUrl) {
        return styleConfig.pageBackgroundUrl;
      }
    }
    // Fall back to story page image
    return pageImageUrl;
  }, [styleConfig]);

  return {
    styleConfig,
    getTextStyles,
    getContainerStyles,
    getPosition,
    getBackgroundImage
  };
};