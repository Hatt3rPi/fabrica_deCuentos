import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutosave } from '../useAutosave';
import type { WizardState, EstadoFlujo } from '../../types';

// Mock dependencies
const mockUpsert = vi.fn();
const mockPersistStory = vi.fn();
const mockAuth = {
  supabase: {
    from: vi.fn(() => ({
      upsert: mockUpsert.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }))
  },
  user: { id: 'test-user-id' }
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth
}));

vi.mock('../../services/storyService', () => ({
  storyService: {
    persistStory: mockPersistStory
  }
}));

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useAutosave', () => {
  const mockState: WizardState = {
    characters: [
      {
        id: 'char-1',
        name: 'Test Character',
        age: '8',
        description: 'A brave hero',
        thumbnailUrl: 'test.jpg',
        reference_urls: []
      }
    ],
    styles: [],
    spreads: [],
    meta: {
      title: 'Test Story',
      synopsis: '',
      theme: 'adventure',
      targetAge: '5-7',
      literaryStyle: 'simple',
      centralMessage: 'friendship',
      additionalDetails: '',
      status: 'draft'
    }
  };

  const mockFlow: EstadoFlujo = {
    personajes: { estado: 'completado', personajesAsignados: 1 },
    cuento: 'borrador',
    diseno: 'no_iniciada',
    vistaPrevia: 'no_iniciada'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockPersistStory.mockResolvedValue({ error: null });
    mockUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Inicialización', () => {
    it('debe establecer storyId válido', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      
      renderHook(() => useAutosave(mockState, mockFlow, validUUID));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'current_story_draft_id',
        validUUID
      );
    });

    it('debe ignorar storyId inválido', () => {
      const invalidId = 'invalid-uuid';
      
      renderHook(() => useAutosave(mockState, mockFlow, invalidId));

      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'current_story_draft_id',
        invalidId
      );
    });

    it('debe usar localStorage como fallback si no hay storyId inicial', () => {
      const savedId = '123e4567-e89b-12d3-a456-426614174000';
      mockLocalStorage.getItem.mockReturnValue(savedId);
      
      renderHook(() => useAutosave(mockState, mockFlow, null));

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'current_story_draft_id'
      );
    });
  });

  describe('Auto-save', () => {
    it('debe guardar en localStorage inmediatamente', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `story_draft_${storyId}`,
          JSON.stringify({ state: mockState, flow: mockFlow })
        );
      });
    });

    it('debe persistir personajes en Supabase', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'char-1',
            user_id: 'test-user-id',
            name: 'Test Character',
            thumbnail_url: 'test.jpg'
          })
        );
      });
    });

    it('debe persistir historia con wizard_state', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockPersistStory).toHaveBeenCalledWith(
          storyId,
          expect.objectContaining({
            title: 'Test Story',
            theme: 'adventure',
            target_age: '5-7',
            status: 'draft'
          })
        );
      });
    });

    it('debe limpiar backup después de guardado exitoso', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          `story_draft_${storyId}_backup`
        );
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe crear backup en localStorage al fallar guardado', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      mockPersistStory.mockRejectedValueOnce(new Error('Network error'));
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `story_draft_${storyId}_backup`,
          expect.stringContaining('"timestamp"')
        );
      });
    });

    it('debe reintentar guardado hasta MAX_RETRIES', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      mockPersistStory
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ error: null });
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockPersistStory).toHaveBeenCalledTimes(4);
      }, { timeout: 10000 });
    });

    it('debe fallar después de MAX_RETRIES intentos', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      mockPersistStory.mockRejectedValue(new Error('Persistent error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      await waitFor(() => {
        expect(mockPersistStory).toHaveBeenCalledTimes(3);
      }, { timeout: 15000 });

      consoleSpy.mockRestore();
    });
  });

  describe('Recuperación de backup', () => {
    it('recoverFromBackup debe retornar backup si existe', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      const backupData = { state: mockState, flow: mockFlow };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(backupData));
      
      const { result } = renderHook(() => useAutosave(mockState, mockFlow, storyId));

      const recovered = await result.current.recoverFromBackup(storyId);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        `story_draft_${storyId}_backup`
      );
      expect(recovered).toEqual(mockState);
    });

    it('recoverFromBackup debe usar emergency como fallback', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      const emergencyData = { state: mockState, flow: mockFlow };
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(null) // backup
        .mockReturnValueOnce(JSON.stringify(emergencyData)); // emergency
      
      const { result } = renderHook(() => useAutosave(mockState, mockFlow, storyId));

      const recovered = await result.current.recoverFromBackup(storyId);
      
      expect(recovered).toEqual(mockState);
    });

    it('recoverFromBackup debe retornar null si no hay backups', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useAutosave(mockState, mockFlow, storyId));

      const recovered = await result.current.recoverFromBackup(storyId);
      
      expect(recovered).toBeNull();
    });
  });

  describe('currentStoryId', () => {
    it('debe exponer currentStoryId actual', () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      const { result } = renderHook(() => useAutosave(mockState, mockFlow, storyId));

      expect(result.current.currentStoryId).toBe(storyId);
    });
  });

  describe('Debounce', () => {
    it('debe debounce múltiples cambios en 1 segundo', async () => {
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      const { rerender } = renderHook(
        ({ state }) => useAutosave(state, mockFlow, storyId),
        { initialProps: { state: mockState } }
      );

      // Múltiples cambios rápidos
      const updatedState1 = { ...mockState, meta: { ...mockState.meta, title: 'Updated 1' } };
      const updatedState2 = { ...mockState, meta: { ...mockState.meta, title: 'Updated 2' } };

      rerender({ state: updatedState1 });
      rerender({ state: updatedState2 });

      // Solo debe persistir una vez después del debounce
      await waitFor(() => {
        expect(mockPersistStory).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Sin usuario', () => {
    it('no debe guardar si no hay usuario', () => {
      const mockAuthNoUser = { ...mockAuth, user: null };
      vi.mocked(require('../../context/AuthContext').useAuth).mockReturnValue(mockAuthNoUser);
      
      const storyId = '123e4567-e89b-12d3-a456-426614174000';
      
      renderHook(() => useAutosave(mockState, mockFlow, storyId));

      expect(mockPersistStory).not.toHaveBeenCalled();
    });
  });
});