import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '../../../context/AuthContext'; // Adjust path
import { NotificationsProvider } from '../../../hooks/useNotifications'; // Assuming this is how you provide notifications
import CharacterForm from '../CharacterForm';
import { Character } from '../../../types';

// Mocks
jest.mock('../../../context/AuthContext', () => ({
  ...jest.requireActual('../../../context/AuthContext'),
  useAuth: () => ({
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      }
    },
    user: { id: 'test-user-id' },
  }),
}));

jest.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    createNotification: jest.fn(),
  }),
}));

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: any) => {
    const getInputProps = () => ({
      onClick: (event: React.MouseEvent<HTMLElement>) => event.preventDefault(), // Mock to prevent issues
    });
    const getRootProps = () => ({
      onClick: () => { // Simulate drop by calling onDrop
        const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
        onDrop([file]);
      }
    });
    return { getRootProps, getInputProps };
  }
}));

// Mock Supabase Edge Functions (analyze-character, describe-and-sketch)
global.fetch = jest.fn((url) => {
  if (url.toString().endsWith('/analyze-character')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ description: { es: 'Analyzed Description', en: 'Analyzed Description EN' } }),
    });
  }
  if (url.toString().endsWith('/describe-and-sketch')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ thumbnailUrl: 'http://example.com/generated-thumbnail.png' }),
    });
  }
  return Promise.reject(new Error(`Unhandled fetch call: ${url}`));
}) as jest.Mock;


describe('CharacterForm Component', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  const mockSupabase = require('../../../context/AuthContext').useAuth().supabase;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset specific mocks for each test if needed
    mockSupabase.from('characters').select().single.mockReset();
    mockSupabase.from('characters').insert.mockReset();
    mockSupabase.from('characters').update.mockReset();
    mockSupabase.storage.from('storage').upload.mockReset();
    mockSupabase.storage.from('storage').getPublicUrl.mockReset();

    // Default mock for storage upload and getPublicUrl
    mockSupabase.storage.from('storage').upload.mockResolvedValue({ error: null, data: { path: 'test-path.png' } });
    mockSupabase.storage.from('storage').getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/uploaded-image.png' } });
  });

  const TestProviders: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <AuthProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </AuthProvider>
  );

  test('renders in create mode when no characterId is provided', () => {
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );
    expect(screen.getByPlaceholderText('Nombre del personaje')).toHaveValue('');
    expect(screen.getByText('Generar Miniatura')).toBeInTheDocument(); // Initial button
  });

  test('renders in edit mode and loads character data when characterId is provided', async () => {
    const mockCharacter: Character = {
      id: 'char1', name: 'Test Character', age: '100', user_id: 'test-user-id',
      description: { es: 'Existing Description', en: '' },
      reference_urls: ['http://example.com/ref.png'],
      thumbnail_url: 'http://example.com/thumb.png',
    };
    mockSupabase.from('characters').select().single.mockResolvedValueOnce({ data: mockCharacter, error: null });

    render(
      <TestProviders>
        <CharacterForm characterId="char1" storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nombre del personaje')).toHaveValue('Test Character');
      expect(screen.getByPlaceholderText('Edad del personaje')).toHaveValue('100');
      expect(screen.getByPlaceholderText('Describe al personaje...')).toHaveValue('Existing Description');
      // Check if thumbnail is displayed (implies thumbnailGenerated is true and save button appears)
      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });
  });

  test('updates form data on input change', () => {
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );
    const nameInput = screen.getByPlaceholderText('Nombre del personaje');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(nameInput).toHaveValue('New Name');
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  test('handles image upload via dropzone', async () => {
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );

    // Simulate dropzone click (which calls onDrop in our mock)
    const dropzone = screen.getByText('Arrastra o selecciona una imagen').closest('div'); // Find the dropzone area
    if (dropzone) fireEvent.click(dropzone);

    await waitFor(() => {
      expect(mockSupabase.storage.from('storage').upload).toHaveBeenCalled();
      expect(mockSupabase.storage.from('storage').getPublicUrl).toHaveBeenCalled();
      // Check if image is displayed (formData.reference_urls[0] should be set)
      // This depends on how your component displays the image. Our mock doesn't show actual image.
    });
  });

  test('generates thumbnail successfully', async () => {
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );
    // Fill required fields for thumbnail generation
    fireEvent.change(screen.getByPlaceholderText('Nombre del personaje'), { target: { value: 'Thumb Char' } });
    fireEvent.change(screen.getByPlaceholderText('Describe al personaje...'), { target: { value: 'A character for thumbnail' } });

    fireEvent.click(screen.getByText('Generar Miniatura'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/describe-and-sketch'), expect.any(Object));
      // Check if the "Save" button appears instead of "Generate Thumbnail"
      expect(screen.getByText('Crear Personaje')).toBeInTheDocument(); // or "Guardar Cambios" if in edit mode
    });
  });

  test('calls onSave with character data on successful submission (create mode)', async () => {
    mockSupabase.from('characters').insert.mockResolvedValueOnce({ 
      data: [{ id: 'new-char-uuid', name: 'New Character', age: '25', description: {es: 'A new hero'}, thumbnail_url: 'http://example.com/new-thumb.png', user_id: 'test-user-id' }], 
      error: null 
    });
    
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );

    // Simulate filling form and generating thumbnail
    fireEvent.change(screen.getByPlaceholderText('Nombre del personaje'), { target: { value: 'New Character' } });
    fireEvent.change(screen.getByPlaceholderText('Edad del personaje'), { target: { value: '25' } });
    fireEvent.change(screen.getByPlaceholderText('Describe al personaje...'), { target: { value: 'A new hero' } });
    
    // Simulate thumbnail generation
    fireEvent.click(screen.getByText('Generar Miniatura'));
    await waitFor(() => expect(screen.getByText('Crear Personaje')).toBeInTheDocument());

    // Submit form
    fireEvent.click(screen.getByText('Crear Personaje'));

    await waitFor(() => {
      expect(mockSupabase.from('characters').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Character',
          // id will be a UUID, so we check for its presence
          id: expect.any(String) 
        })
      );
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Character' })
      );
    });
  });

  test('calls onSave with updated character data on successful submission (edit mode)', async () => {
    const initialCharacter: Character = {
      id: 'charEdit1', name: 'Initial Name', age: '50', user_id: 'test-user-id',
      description: { es: 'Initial Desc', en: '' }, thumbnail_url: 'http://example.com/initial-thumb.png'
    };
    mockSupabase.from('characters').select().single.mockResolvedValueOnce({ data: initialCharacter, error: null });
    mockSupabase.from('characters').update.mockResolvedValueOnce({ 
      data: [{ ...initialCharacter, name: 'Updated Name' }], 
      error: null 
    });

    render(
      <TestProviders>
        <CharacterForm characterId="charEdit1" storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Nombre del personaje')).toHaveValue('Initial Name'));

    fireEvent.change(screen.getByPlaceholderText('Nombre del personaje'), { target: { value: 'Updated Name' } });
    
    // Thumbnail already generated, so "Guardar Cambios" should be visible
    fireEvent.click(screen.getByText('Guardar Cambios'));

    await waitFor(() => {
      expect(mockSupabase.from('characters').update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' })
      );
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name', id: 'charEdit1' })
      );
    });
  });

  test('shows error if trying to save without generating thumbnail', () => {
    render(
      <TestProviders>
        <CharacterForm storyId="story1" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestProviders>
    );
    fireEvent.change(screen.getByPlaceholderText('Nombre del personaje'), { target: { value: 'Test Char No Thumb' } });
    // Attempt to submit (assuming the button would be "Crear Personaje" but it's disabled / changes to "Generate Thumbnail")
    // The UI logic should prevent submission if thumbnail is not generated.
    // We check if an error message appears or if the save button is disabled.
    // The button changes text, so if it's still "Generar Miniatura", we can't click a "Save" button.
    // Let's assume the button is "Generate Thumbnail" and we try to save by other means (not possible in UI)
    // Or, if the "Save" button *was* there and clicked:
    // fireEvent.click(screen.getByText('Crear Personaje')); // This button won't be there if thumbnail isn't generated
    // For this test, we'll check that an error appears if thumbnailGenerated is false and submit is somehow triggered.
    // The form's internal handleSubmit checks `thumbnailGenerated`.
    
    // Manually trigger submit to test the internal check
    const form = screen.getByPlaceholderText('Nombre del personaje').closest('form');
    if (form) fireEvent.submit(form);

    expect(screen.getByText('Debes generar una miniatura antes de guardar el personaje.')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

});
