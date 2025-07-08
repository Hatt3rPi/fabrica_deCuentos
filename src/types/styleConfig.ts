// Tipos para el sistema de configuración de estilos

export interface TextStyle {
  fontSize: string;
  fontFamily: string;
  fontWeight: string | number;
  lineHeight?: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textShadow: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface ContainerStyle {
  background: string;
  padding: string;
  margin?: string;
  borderRadius?: string;
  maxWidth?: string;
  minHeight?: string;
  border?: string;
  boxShadow?: string;
  backdropFilter?: string;
}

export interface TitleConfig {
  fontSize: string;
  fontFamily: string;
  fontWeight: string | number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  textShadow: string;
  position: 'top' | 'center' | 'bottom';
  horizontalPosition?: 'left' | 'center' | 'right';
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  containerStyle: ContainerStyle;
}

export interface PageTextConfig {
  fontSize: string;
  fontFamily: string;
  fontWeight: string | number;
  lineHeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textShadow: string;
  position: 'top' | 'center' | 'bottom';
  horizontalPosition?: 'left' | 'center' | 'right';
  verticalAlign?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  containerStyle: ContainerStyle;
}

export interface CoverConfig {
  title: TitleConfig;
}

export interface PageConfig {
  text: PageTextConfig;
}

export interface DedicatoriaConfig {
  text: PageTextConfig;
  imageSize: 'pequena' | 'mediana' | 'grande';
  allowedLayouts: ('imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha')[];
  allowedAlignments: ('centro' | 'izquierda' | 'derecha')[];
  backgroundImageUrl?: string; // URL de imagen de fondo para páginas de dedicatoria
  backgroundImagePosition?: 'cover' | 'contain' | 'center'; // Cómo se muestra la imagen de fondo
}

export interface StoryStyleConfig {
  id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  coverConfig: CoverConfig;
  pageConfig: PageConfig;
  dedicatoriaConfig?: DedicatoriaConfig;
  coverBackgroundUrl?: string;
  pageBackgroundUrl?: string;
  dedicatoriaBackgroundUrl?: string;
  coverSampleText?: string;
  pageSampleText?: string;
  dedicatoriaSampleText?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  version?: number;
}

export interface StyleTemplate {
  id: string;
  name: string;
  category: 'classic' | 'modern' | 'playful' | 'elegant';
  thumbnailUrl?: string;
  configData: {
    cover_config: CoverConfig;
    page_config: PageConfig;
    dedicatoria_config?: DedicatoriaConfig;
  };
  customImages?: {
    cover_url?: string;
    page_url?: string;
    dedicatoria_url?: string;
  };
  customTexts?: {
    cover_text?: string;
    page_text?: string;
    dedicatoria_text?: string;
  };
  isPremium: boolean;
  isActive?: boolean;
  createdAt: string;
}

// Valores por defecto
export const DEFAULT_COVER_CONFIG: CoverConfig = {
  title: {
    fontSize: '4rem',
    fontFamily: 'Indie Flower',
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
    position: 'center',
    horizontalPosition: 'center',
    containerStyle: {
      background: 'transparent',
      padding: '2rem 3rem',
      borderRadius: '0',
      maxWidth: '85%'
    }
  }
};

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  text: {
    fontSize: '2.2rem',
    fontFamily: 'Indie Flower',
    fontWeight: '600',
    lineHeight: '1.4',
    color: '#ffffff',
    textAlign: 'center',
    textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
    position: 'bottom',
    horizontalPosition: 'center',
    verticalAlign: 'flex-end',
    containerStyle: {
      background: 'transparent',
      padding: '1rem 2rem 6rem 2rem',
      minHeight: '25%'
    }
  }
};

export const DEFAULT_DEDICATORIA_CONFIG: DedicatoriaConfig = {
  text: {
    fontSize: '2rem',
    fontFamily: 'Indie Flower',
    fontWeight: '500',
    lineHeight: '1.6',
    color: '#4a5568',
    textAlign: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'center',
    horizontalPosition: 'center',
    verticalAlign: 'center',
    containerStyle: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '2rem 3rem',
      borderRadius: '1rem',
      maxWidth: '600px',
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)'
    }
  },
  imageSize: 'mediana',
  allowedLayouts: ['imagen-arriba', 'imagen-abajo', 'imagen-izquierda', 'imagen-derecha'],
  allowedAlignments: ['centro', 'izquierda', 'derecha']
};

// Helpers para conversión
export function convertToReactStyle(config: TitleConfig | PageTextConfig): React.CSSProperties {
  return {
    fontSize: config.fontSize,
    fontFamily: config.fontFamily,
    fontWeight: config.fontWeight,
    color: config.color,
    textAlign: config.textAlign,
    textShadow: config.textShadow,
    letterSpacing: config.letterSpacing,
    lineHeight: 'lineHeight' in config ? config.lineHeight : undefined,
    textTransform: 'textTransform' in config ? config.textTransform as any : undefined,
  };
}

export function convertContainerToReactStyle(containerStyle: ContainerStyle): React.CSSProperties {
  return {
    background: containerStyle.background,
    padding: containerStyle.padding,
    margin: containerStyle.margin,
    borderRadius: containerStyle.borderRadius,
    maxWidth: containerStyle.maxWidth,
    minHeight: containerStyle.minHeight,
    border: containerStyle.border,
    boxShadow: containerStyle.boxShadow,
    backdropFilter: containerStyle.backdropFilter,
  };
}

// Tipos para componentes dinámicos
export interface ComponentConfig {
  id: string;
  name: string;
  type: 'text' | 'image';
  pageType: 'cover' | 'page' | 'dedicatoria';
  position: 'top' | 'center' | 'bottom';
  horizontalPosition: 'left' | 'center' | 'right';
  // Posicionamiento preciso en píxeles (opcional, tiene prioridad sobre position/horizontalPosition)
  x?: number;
  y?: number;
  zIndex?: number;
  visible?: boolean;
  isDefault?: boolean; // Marca componentes por defecto (título, texto principal, etc.)
}

export interface TextComponentConfig extends ComponentConfig {
  type: 'text';
  content: string;
  isDefault?: boolean;
  style?: {
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    textShadow?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textTransform?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    opacity?: number;
    border?: string;
    boxShadow?: string;
    backdropFilter?: string;
  };
}

export interface ImageComponentConfig extends ComponentConfig {
  type: 'image';
  url?: string;
  width?: string;
  height?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  size?: 'small' | 'medium' | 'large' | 'custom';
  imageType: 'fixed' | 'dynamic';
  style?: {
    borderRadius?: string;
    opacity?: number;
    border?: string;
    boxShadow?: string;
    backdropFilter?: string;
  };
}

// Componentes por defecto para elementos principales
export const DEFAULT_COMPONENTS = {
  cover: [
    {
      id: 'cover-title',
      name: 'Título del Cuento',
      type: 'text' as const,
      pageType: 'cover' as const,
      position: 'center' as const,
      horizontalPosition: 'center' as const,
      zIndex: 10,
      visible: true,
      content: '',
      isDefault: true, // Marca este como componente por defecto
      style: {
        fontSize: '4rem',
        fontFamily: 'Indie Flower',
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
        backgroundColor: 'transparent',
        padding: '2rem 3rem',
        borderRadius: '0'
      }
    }
  ],
  page: [
    {
      id: 'page-text',
      name: 'Texto del Cuento',
      type: 'text' as const,
      pageType: 'page' as const,
      position: 'bottom' as const,
      horizontalPosition: 'center' as const,
      zIndex: 10,
      visible: true,
      content: '',
      isDefault: true,
      style: {
        fontSize: '2.2rem',
        fontFamily: 'Indie Flower',
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
        lineHeight: '1.4',
        backgroundColor: 'transparent',
        padding: '1rem 2rem 6rem 2rem'
      }
    }
  ],
  dedicatoria: [
    {
      id: 'dedicatoria-text',
      name: 'Texto de Dedicatoria',
      type: 'text' as const,
      pageType: 'dedicatoria' as const,
      position: 'center' as const,
      horizontalPosition: 'center' as const,
      zIndex: 10,
      visible: true,
      content: '',
      isDefault: true,
      style: {
        fontSize: '2rem',
        fontFamily: 'Indie Flower',
        fontWeight: '500',
        color: '#4a5568',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        lineHeight: '1.6',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '2rem 3rem',
        borderRadius: '1rem',
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }
    }
  ]
};

// Presets para casos de uso comunes
export const COMPONENT_PRESETS = {
  text: {
    author: {
      name: 'Autor del libro',
      content: 'Por [Nombre del Autor]',
      style: {
        fontSize: '1.5rem',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '400',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
      },
      position: 'bottom' as const,
      horizontalPosition: 'center' as const
    },
    subtitle: {
      name: 'Subtítulo',
      content: 'Una historia mágica',
      style: {
        fontSize: '1.8rem',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '300',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
      },
      position: 'center' as const,
      horizontalPosition: 'center' as const
    }
  },
  image: {
    logo: {
      name: 'Logo/Marca',
      imageType: 'fixed' as const,
      size: 'small' as const,
      objectFit: 'contain' as const,
      position: 'top' as const,
      horizontalPosition: 'right' as const,
      style: {
        opacity: 0.8
      }
    },
    userImageReference: {
      name: 'Imagen de usuario (referencia)',
      imageType: 'dynamic' as const,
      size: 'medium' as const,
      objectFit: 'cover' as const,
      position: 'center' as const,
      horizontalPosition: 'center' as const,
      style: {
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }
    }
  }
};

// Tipo para especificar página
export type PageType = 'cover' | 'page' | 'dedicatoria';

// Helper para crear componentes por defecto
export function createDefaultComponents(pageType: PageType): ComponentConfig[] {
  const defaults = DEFAULT_COMPONENTS[pageType] || [];
  return defaults.map(component => ({
    ...component,
    id: `${component.id}-${Date.now()}` // Asegurar IDs únicos
  }));
}

// Helper para migrar configuración antigua a componentes
export function migrateConfigToComponents(
  config: StoryStyleConfig, 
  pageType: PageType, 
  sampleText: string
): TextComponentConfig {
  const defaultComponent = DEFAULT_COMPONENTS[pageType]?.[0];
  
  if (!defaultComponent) {
    throw new Error(`No default component found for page type: ${pageType}`);
  }

  let migratedStyle = { ...defaultComponent.style };
  
  // Migrar estilos de la configuración antigua
  if (pageType === 'cover' && config.coverConfig?.title) {
    const titleConfig = config.coverConfig.title;
    migratedStyle = {
      ...migratedStyle,
      fontSize: titleConfig.fontSize,
      fontFamily: titleConfig.fontFamily,
      fontWeight: titleConfig.fontWeight,
      color: titleConfig.color,
      textAlign: titleConfig.textAlign,
      textShadow: titleConfig.textShadow,
      letterSpacing: titleConfig.letterSpacing,
      textTransform: titleConfig.textTransform,
      backgroundColor: titleConfig.containerStyle.background,
      padding: titleConfig.containerStyle.padding,
      borderRadius: titleConfig.containerStyle.borderRadius,
      border: titleConfig.containerStyle.border,
      boxShadow: titleConfig.containerStyle.boxShadow
    };
  } else if (pageType === 'page' && config.pageConfig?.text) {
    const textConfig = config.pageConfig.text;
    migratedStyle = {
      ...migratedStyle,
      fontSize: textConfig.fontSize,
      fontFamily: textConfig.fontFamily,
      fontWeight: textConfig.fontWeight,
      color: textConfig.color,
      textAlign: textConfig.textAlign,
      textShadow: textConfig.textShadow,
      lineHeight: textConfig.lineHeight,
      letterSpacing: textConfig.letterSpacing,
      textTransform: textConfig.textTransform,
      backgroundColor: textConfig.containerStyle.background,
      padding: textConfig.containerStyle.padding,
      borderRadius: textConfig.containerStyle.borderRadius,
      border: textConfig.containerStyle.border,
      boxShadow: textConfig.containerStyle.boxShadow
    };
  } else if (pageType === 'dedicatoria' && config.dedicatoriaConfig?.text) {
    const textConfig = config.dedicatoriaConfig.text;
    migratedStyle = {
      ...migratedStyle,
      fontSize: textConfig.fontSize,
      fontFamily: textConfig.fontFamily,
      fontWeight: textConfig.fontWeight,
      color: textConfig.color,
      textAlign: textConfig.textAlign,
      textShadow: textConfig.textShadow,
      lineHeight: textConfig.lineHeight,
      letterSpacing: textConfig.letterSpacing,
      textTransform: textConfig.textTransform,
      backgroundColor: textConfig.containerStyle.background,
      padding: textConfig.containerStyle.padding,
      borderRadius: textConfig.containerStyle.borderRadius,
      border: textConfig.containerStyle.border,
      boxShadow: textConfig.containerStyle.boxShadow
    };
  }

  return {
    ...defaultComponent,
    id: `${defaultComponent.id}-migrated-${Date.now()}`,
    content: sampleText,
    style: migratedStyle
  } as TextComponentConfig;
}