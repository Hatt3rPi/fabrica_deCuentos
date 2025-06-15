import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storyService } from '../storyService';

// Mock Supabase
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();
const mockRpc = vi.fn();

const mockChain = {
  update: mockUpdate,
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  order: mockOrder,
  in: mockIn
};

const mockFrom = vi.fn(() => mockChain);

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn()
      }))
    },
    auth: {
      getSession: vi.fn(() => ({
        data: { session: { access_token: 'mock-token' } }
      }))
    }
  }
}));

// Mock useWizardFlowStore
const mockEstado = {
  personajes: { estado: 'completado', personajesAsignados: 3 },
  cuento: 'completado',
  diseno: 'borrador',
  vistaPrevia: 'no_iniciada'
};

vi.mock('../../stores/wizardFlowStore', () => ({
  useWizardFlowStore: {
    getState: vi.fn(() => ({ estado: mockEstado }))
  }
}));

describe('storyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('persistStory', () => {
    it('debe persistir historia con wizard_state del store', async () => {
      const storyId = 'test-story-id';
      const fields = {
        title: 'Test Story',
        theme: 'adventure',
        target_age: '5-7'
      };

      mockUpdate.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockSingle.mockResolvedValue({ data: { id: storyId }, error: null });

      await storyService.persistStory(storyId, fields);

      expect(mockFrom).toHaveBeenCalledWith('stories');
      expect(mockUpdate).toHaveBeenCalledWith({
        ...fields,
        wizard_state: mockEstado
      });
      expect(mockEq).toHaveBeenCalledWith('id', storyId);
      expect(mockSingle).toHaveBeenCalled();
    });

    it('debe manejar errores de persistencia', async () => {
      const storyId = 'test-story-id';
      const fields = { title: 'Test' };

      mockUpdate.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await storyService.persistStory(storyId, fields);
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database error');
    });
  });

  describe('getStoryDraft', () => {
    const mockStoryId = 'test-story-id';

    it('debe cargar historia completa con wizard_state', async () => {
      const mockStory = {
        id: mockStoryId,
        title: 'Test Story',
        wizard_state: mockEstado,
        theme: 'adventure',
        target_age: '5-7'
      };

      const mockLinks = [
        { character_id: 'char-1' },
        { character_id: 'char-2' }
      ];

      const mockCharacters = [
        { id: 'char-1', name: 'Hero', thumbnail_url: 'hero.jpg' },
        { id: 'char-2', name: 'Friend', thumbnail_url: 'friend.jpg' }
      ];

      const mockDesign = {
        story_id: mockStoryId,
        visual_style: 'cartoon',
        color_palette: 'bright'
      };

      const mockPages = [
        { id: 'page-1', page_number: 1, text: 'Once upon a time...' }
      ];

      // Mock story query
      mockSelect.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockStory, error: null });

      // Mock character links query
      mockSelect.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockLinks, error: null });

      // Mock characters query
      mockSelect.mockReturnValue(mockChain);
      mockIn.mockReturnValue(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockCharacters, error: null });

      // Mock design query
      mockSelect.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockMaybeSingle.mockResolvedValueOnce({ data: mockDesign, error: null });

      // Mock pages query
      mockSelect.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockOrder.mockReturnValue(mockChain);
      mockOrder.mockResolvedValueOnce({ data: mockPages, error: null });

      const result = await storyService.getStoryDraft(mockStoryId);

      expect(result.story).toEqual(mockStory);
      expect(result.characters).toHaveLength(2);
      expect(result.characters[0].thumbnailUrl).toBe('hero.jpg');
      expect(result.design).toEqual(mockDesign);
      expect(result.pages).toEqual(mockPages);
    });

    it('debe manejar historia sin wizard_state', async () => {
      const mockStory = {
        id: mockStoryId,
        title: 'Test Story',
        wizard_state: null
      };

      mockSelect.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockStory, error: null });
      
      // Mock empty results for other queries
      mockSingle.mockResolvedValue({ data: [], error: null });
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await storyService.getStoryDraft(mockStoryId);

      expect(result.story.wizard_state).toBeNull();
      expect(result.characters).toEqual([]);
      expect(result.design).toBeNull();
      expect(result.pages).toEqual([]);
    });

    it('debe manejar errores al cargar historia', async () => {
      mockSelect.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockSingle.mockRejectedValue(new Error('Story not found'));

      await expect(storyService.getStoryDraft(mockStoryId))
        .rejects.toThrow('Story not found');
    });
  });

  describe('generateStory', () => {
    const mockParams = {
      storyId: 'test-story-id',
      theme: 'adventure',
      characters: [
        { id: 'char-1', name: 'Hero', thumbnailUrl: 'hero.jpg' }
      ],
      settings: {
        targetAge: '5-7',
        literaryStyle: 'simple',
        centralMessage: 'friendship',
        additionalDetails: 'fun story'
      }
    };

    it('debe generar historia exitosamente', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          pages: [{ id: 'page-1', text: 'Story text' }]
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await storyService.generateStory(mockParams);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/generate-story'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(mockParams.storyId)
        })
      );

      expect(result.success).toBe(true);
    });

    it('debe manejar errores de generación', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(storyService.generateStory(mockParams))
        .rejects.toThrow('Story generation failed');
    });
  });

  describe('deleteStoryWithCharacters', () => {
    it('debe eliminar historia y limpiar archivos', async () => {
      const storyId = 'test-story-id';
      const mockFiles = ['path/to/file1.jpg', 'path/to/file2.png'];

      mockRpc.mockResolvedValue({ data: mockFiles, error: null });

      await storyService.deleteStoryWithCharacters(storyId);

      expect(mockRpc).toHaveBeenCalledWith('delete_full_story', { story_id: storyId });
    });

    it('debe manejar errores de eliminación', async () => {
      const storyId = 'test-story-id';
      mockRpc.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

      await expect(storyService.deleteStoryWithCharacters(storyId))
        .rejects.toThrow();
    });
  });

  describe('generatePageImage', () => {
    it('debe generar imagen de página exitosamente', async () => {
      const storyId = 'test-story-id';
      const pageId = 'page-1';
      const mockImageUrl = 'https://example.com/image.jpg';

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          imageUrl: mockImageUrl
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await storyService.generatePageImage(storyId, pageId);

      expect(result).toBe(mockImageUrl);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/generate-image-pages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ story_id: storyId, page_id: pageId })
        })
      );
    });

    it('debe manejar errores de generación de imagen', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Image generation failed'
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(storyService.generatePageImage('story-id', 'page-id'))
        .rejects.toThrow('Image generation failed');
    });
  });

  describe('updateCoverImage', () => {
    it('debe actualizar imagen de portada exitosamente', async () => {
      const storyId = 'test-story-id';
      const imageUrl = 'https://example.com/cover.jpg';

      mockUpdate.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockEq.mockResolvedValue({ error: null });

      await storyService.updateCoverImage(storyId, imageUrl);

      expect(mockFrom).toHaveBeenCalledWith('story_pages');
      expect(mockUpdate).toHaveBeenCalledWith({ image_url: imageUrl });
      expect(mockEq).toHaveBeenCalledWith('story_id', storyId);
      expect(mockEq).toHaveBeenCalledWith('page_number', 0);
    });

    it('debe manejar errores de actualización', async () => {
      const storyId = 'test-story-id';
      const imageUrl = 'https://example.com/cover.jpg';

      mockUpdate.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockEq.mockResolvedValue({ error: { message: 'Update failed' } });

      await expect(storyService.updateCoverImage(storyId, imageUrl))
        .rejects.toThrow();
    });
  });
});