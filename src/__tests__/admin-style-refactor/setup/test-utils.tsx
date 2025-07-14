import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Providers mock para testing
const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

// Custom render que incluye providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });

// Funciones helper para testing
export const createMockComponent = (overrides = {}) => ({
  id: 'test-component',
  type: 'text',
  content: 'Test Content',
  style: {
    fontSize: '2rem',
    color: '#000000'
  },
  x: 100,
  y: 50,
  position: 'center',
  horizontalPosition: 'center',
  ...overrides
});

export const createMockTextComponent = (overrides = {}) => ({
  id: 'test-text',
  type: 'text',
  content: 'Test Text',
  style: {
    fontSize: '1.5rem',
    fontFamily: 'Arial',
    textAlign: 'center',
    color: '#333333'
  },
  ...overrides
});

export const createMockUnifiedConfig = () => ({
  version: "2.0",
  designTokens: {
    typography: {
      'title-large': {
        fontFamily: 'Ribeye',
        fontSize: '4rem',
        fontWeight: '700',
        color: '#ffffff'
      },
      'text-medium': {
        fontFamily: 'Georgia',
        fontSize: '1.8rem',
        color: '#333333'
      }
    },
    containers: {
      'glass-effect': {
        backgroundColor: 'rgba(0,0,0,0.1)',
        backdropFilter: 'blur(3px)',
        borderRadius: '2rem',
        padding: '2rem 3rem'
      }
    },
    positioning: {
      'top-center': {
        region: 'top-center' as const,
        offset: { x: 0, y: 40 }
      }
    }
  },
  pageTypes: {
    cover: {
      background: { type: 'gradient', colors: ['#ff0000', '#00ff00'] },
      components: [
        {
          id: 'cover-title',
          type: 'text',
          content: 'Test Story Title',
          typography: 'title-large',
          container: 'glass-effect',
          positioning: 'top-center'
        }
      ]
    },
    page: {
      background: { type: 'solid', color: '#ffffff' },
      components: [
        {
          id: 'page-text',
          type: 'text',
          content: 'Page content',
          typography: 'text-medium'
        }
      ]
    }
  }
});

// Mock functions comunes
export const mockOnUpdate = vi.fn();
export const mockOnSelect = vi.fn();
export const mockOnComponentSelect = vi.fn();

// Re-exportar todo de testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Exportar custom render como default
export { customRender as render };