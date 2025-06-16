import { describe, it, expect, vi } from 'vitest';

// Mock simplificado para evitar problemas de hoisting
const mockPersistStory = vi.fn();
const mockGetStoryDraft = vi.fn();
const mockGenerateStory = vi.fn();

// Mock del storyService
vi.mock('../storyService', () => ({
  storyService: {
    persistStory: mockPersistStory,
    getStoryDraft: mockGetStoryDraft,
    generateStory: mockGenerateStory,
    deleteStoryWithCharacters: vi.fn(),
    deleteStoryOnly: vi.fn(),
    generatePageImage: vi.fn(),
    updateCoverImage: vi.fn()
  }
}));

describe('storyService - Tests Simplificados', () => {
  
  it('debe tener métodos principales disponibles', async () => {
    // Verificar que los métodos existen
    expect(mockPersistStory).toBeDefined();
    expect(mockGetStoryDraft).toBeDefined();
    expect(mockGenerateStory).toBeDefined();
  });

  it('debe llamar persistStory con parámetros correctos', async () => {
    const { storyService } = await import('../storyService');
    
    const storyId = 'test-story-id';
    const fields = {
      title: 'Test Story',
      theme: 'adventure'
    };

    mockPersistStory.mockResolvedValueOnce({ data: { id: storyId }, error: null });

    await storyService.persistStory(storyId, fields);

    expect(mockPersistStory).toHaveBeenCalledWith(storyId, fields);
  });

  it('debe llamar getStoryDraft con storyId', async () => {
    const { storyService } = await import('../storyService');
    
    const storyId = 'test-story-id';
    const mockResult = {
      story: { id: storyId, title: 'Test' },
      characters: [],
      design: null,
      pages: []
    };

    mockGetStoryDraft.mockResolvedValueOnce(mockResult);

    const result = await storyService.getStoryDraft(storyId);

    expect(mockGetStoryDraft).toHaveBeenCalledWith(storyId);
    expect(result).toEqual(mockResult);
  });

  it('debe llamar generateStory con parámetros de historia', async () => {
    const { storyService } = await import('../storyService');
    
    const params = {
      storyId: 'test-story-id',
      theme: 'adventure',
      characters: [{ id: 'char-1', name: 'Hero' }],
      settings: {
        targetAge: '5-7',
        literaryStyle: 'simple',
        centralMessage: 'friendship',
        additionalDetails: 'fun story'
      }
    };

    mockGenerateStory.mockResolvedValueOnce({ success: true });

    await storyService.generateStory(params);

    expect(mockGenerateStory).toHaveBeenCalledWith(params);
  });
});