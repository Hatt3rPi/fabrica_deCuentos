// Mock data para tests del rediseño admin/style

// Legacy JSON structure (formato actual)
export const mockLegacyConfig = {
  "cover": {
    "components": [
      {
        "id": "cover-title",
        "type": "text",
        "content": "{storyTitle}",
        "x": 115,
        "y": 40,
        "position": "top",
        "horizontalPosition": "center",
        "style": {
          "fontSize": "4rem",
          "fontFamily": "Ribeye",
          "fontWeight": "700",
          "color": "#ffffff",
          "padding": "2rem 3rem",
          "backgroundColor": "rgba(0,0,0,0.1)",
          "backdropFilter": "blur(3px)",
          "borderRadius": "2rem"
        },
        "containerStyle": {
          "verticalAlignment": "center",
          "horizontalAlignment": "center",
          "maxWidth": "85%"
        }
      }
    ]
  },
  "page": {
    "components": [
      {
        "id": "page-text",
        "type": "text", 
        "content": "{pageText}",
        "x": 50,
        "y": 60,
        "position": "center",
        "horizontalPosition": "left",
        "style": {
          "fontSize": "1.8rem",
          "fontFamily": "Georgia",
          "color": "#333333",
          "textAlign": "justify",
          "lineHeight": "1.6"
        }
      }
    ]
  }
};

// Unified JSON structure (nuevo formato)
export const mockUnifiedConfig = {
  "version": "2.0",
  "designTokens": {
    "typography": {
      "title-large": {
        "fontFamily": "Ribeye",
        "fontSize": "4rem", 
        "fontWeight": "700",
        "color": "#ffffff"
      },
      "text-medium": {
        "fontFamily": "Georgia",
        "fontSize": "1.8rem",
        "color": "#333333",
        "textAlign": "justify",
        "lineHeight": "1.6"
      }
    },
    "containers": {
      "glass-effect": {
        "backgroundColor": "rgba(0,0,0,0.1)",
        "backdropFilter": "blur(3px)",
        "borderRadius": "2rem",
        "padding": "2rem 3rem"
      }
    },
    "positioning": {
      "top-center": {
        "region": "top-center",
        "offset": { "x": 0, "y": 40 },
        "constraints": { "maxWidth": "85%" }
      },
      "center-left": {
        "region": "center-left", 
        "offset": { "x": 50, "y": 60 }
      }
    }
  },
  "pageTypes": {
    "cover": {
      "background": {
        "type": "gradient",
        "colors": ["#ff6b6b", "#4ecdc4"]
      },
      "components": [
        {
          "id": "cover-title",
          "type": "text",
          "content": "{storyTitle}",
          "typography": "title-large",
          "container": "glass-effect", 
          "positioning": "top-center"
        }
      ]
    },
    "page": {
      "background": {
        "type": "solid",
        "color": "#ffffff"
      },
      "components": [
        {
          "id": "page-text",
          "type": "text",
          "content": "{pageText}",
          "typography": "text-medium",
          "positioning": "center-left"
        }
      ]
    }
  }
};

// Test data para diferentes contextos de renderizado
export const mockStoryData = {
  title: "La Aventura del Dragón",
  pages: [
    {
      text: "Había una vez un pequeño dragón que vivía en un castillo muy alto.",
      imageUrl: "https://example.com/dragon-image.jpg"
    },
    {
      text: "El dragón tenía escamas brillantes y ojos color esmeralda.",
      imageUrl: "https://example.com/dragon-scales.jpg"
    }
  ]
};

// Mock para contextos de renderizado
export type RenderContext = 'admin-edit' | 'wizard-preview' | 'pdf-generation';

export const mockContextProps = {
  'admin-edit': {
    selectedComponentId: 'cover-title',
    onComponentSelect: vi.fn(),
    allowSelection: true
  },
  'wizard-preview': {
    selectedComponentId: undefined,
    onComponentSelect: undefined,
    allowSelection: false
  },
  'pdf-generation': {
    selectedComponentId: undefined, 
    onComponentSelect: undefined,
    allowSelection: false
  }
};

// Expected styles after conversion
export const expectedConvertedStyles = {
  typography: {
    fontSize: '4rem',
    fontFamily: 'Ribeye',
    fontWeight: '700',
    color: '#ffffff'
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    backdropFilter: 'blur(3px)',
    borderRadius: '2rem',
    padding: '2rem 3rem'
  },
  positioning: {
    maxWidth: '85%'
  }
};

// Grid regions for position testing
export const GRID_REGIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center-center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right'
] as const;

export type GridRegion = typeof GRID_REGIONS[number];