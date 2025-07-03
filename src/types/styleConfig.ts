// Tipos para el sistema de configuración de estilos

// Tipos de página soportados (agregando contraportada)
export type PageType = 'cover' | 'page' | 'dedicatoria' | 'contraportada';

// Tipos de componentes dinámicos
export type ComponentType = 'text' | 'image' | 'signature' | 'qrcode';

// Configuración base para todos los componentes
export interface BaseComponentConfig {
  id: string;
  name: string; // Nombre descriptivo: "autor", "logo", "subtitulo", etc.
  type: ComponentType;
  enabled: boolean;
  position: 'top' | 'center' | 'bottom';
  horizontalPosition?: 'left' | 'center' | 'right';
  zIndex?: number;
}

// Configuración específica para componentes de texto
export interface TextComponentConfig extends BaseComponentConfig {
  type: 'text';
  content?: string; // Contenido del texto (puede venir de datos dinámicos)
  style: {
    fontSize: string;
    fontFamily: string;
    fontWeight: string | number;
    color: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    textShadow?: string;
    letterSpacing?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
  containerStyle: ContainerStyle;
}

// Configuración específica para componentes de imagen
export interface ImageComponentConfig extends BaseComponentConfig {
  type: 'image';
  imageUrl?: string;
  size: 'small' | 'medium' | 'large' | 'custom';
  customSize?: {
    width: string;
    height: string;
  };
  opacity?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  containerStyle?: Partial<ContainerStyle>;
}

// Unión de tipos de componentes
export type ComponentConfig = TextComponentConfig | ImageComponentConfig;

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

export interface ContraportadaConfig {
  text: PageTextConfig; // Texto principal de la contraportada
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
  contraportadaConfig?: ContraportadaConfig;
  // Sistema de componentes dinámicos por tipo de página
  components?: {
    [K in PageType]?: ComponentConfig[];
  };
  coverBackgroundUrl?: string;
  pageBackgroundUrl?: string;
  dedicatoriaBackgroundUrl?: string;
  contraportadaBackgroundUrl?: string;
  coverSampleText?: string;
  pageSampleText?: string;
  dedicatoriaSampleText?: string;
  contraportadaSampleText?: string;
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

export const DEFAULT_CONTRAPORTADA_CONFIG: ContraportadaConfig = {
  text: {
    fontSize: '1.8rem',
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
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '2rem 3rem',
      borderRadius: '1rem',
      maxWidth: '80%',
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }
  }
};

// Componentes por defecto para diferentes páginas
export const DEFAULT_AUTHOR_COMPONENT: TextComponentConfig = {
  id: 'author-default',
  name: 'autor',
  type: 'text',
  enabled: true,
  position: 'bottom',
  horizontalPosition: 'center',
  content: '', // Se llenará dinámicamente
  style: {
    fontSize: '1.8rem',
    fontFamily: 'Indie Flower',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    letterSpacing: '0.05em'
  },
  containerStyle: {
    background: 'transparent',
    padding: '1rem 2rem',
    margin: '2rem 0 0 0'
  }
};

export const DEFAULT_LOGO_COMPONENT: ImageComponentConfig = {
  id: 'logo-default',
  name: 'logo',
  type: 'image',
  enabled: false,
  position: 'bottom',
  horizontalPosition: 'right',
  size: 'small',
  opacity: 0.7,
  fit: 'contain',
  containerStyle: {
    padding: '1rem'
  }
};

export const DEFAULT_SIGNATURE_COMPONENT: TextComponentConfig = {
  id: 'signature-default',
  name: 'creado_con',
  type: 'text',
  enabled: true,
  position: 'bottom',
  horizontalPosition: 'center',
  content: 'Creado con La CuenterIA',
  style: {
    fontSize: '0.8rem',
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#999999',
    textAlign: 'center'
  },
  containerStyle: {
    background: 'transparent',
    padding: '0.5rem 1rem'
  }
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
    textTransform: 'textTransform' in config ? config.textTransform as React.CSSProperties['textTransform'] : undefined,
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