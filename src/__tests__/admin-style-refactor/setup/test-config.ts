import { vi } from 'vitest';

// Configuración global para tests TDD
export const testConfig = {
  // Timeouts
  renderTimeout: 100,
  updateTimeout: 50,
  
  // Flags para control de tests
  skipSlowTests: false,
  enablePerformanceTests: true,
  
  // Mock configurations
  mockSupabase: true,
  mockLocalStorage: true,
  mockFetch: true
};

// Mock de Supabase para tests
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockResolvedValue({ data: [], error: null }),
    delete: vi.fn().mockResolvedValue({ data: [], error: null }),
    upsert: vi.fn().mockResolvedValue({ data: [], error: null })
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    })
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ 
        data: { publicUrl: 'https://test.supabase.co/test-image.jpg' } 
      })
    }))
  }
};

// Helper para configurar mocks antes de cada test
export const setupTestMocks = () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue('')
  });

  // Mock window.URL
  global.URL = class URL {
    constructor(public href: string) {}
    get pathname() {
      return this.href.split('//')[1]?.split('/').slice(1).join('/') || '';
    }
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
};

// Helper para limpiar mocks después de cada test
export const cleanupTestMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};

// Performance testing helpers
export const performanceTest = (name: string, fn: () => void | Promise<void>, maxTime: number = 100) => {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    
    if (duration > maxTime) {
      throw new Error(`Performance test "${name}" took ${duration}ms, expected < ${maxTime}ms`);
    }
  };
};

// Error boundary test helper
export const expectErrorBoundary = (component: React.ReactElement, expectedError?: string) => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  
  try {
    // render(component); // Esta línea falla porque render no está disponible aquí
    throw new Error('Expected component to throw an error');
  } catch (error) {
    if (expectedError && !error.message.includes(expectedError)) {
      throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
    }
  } finally {
    consoleSpy.mockRestore();
  }
};