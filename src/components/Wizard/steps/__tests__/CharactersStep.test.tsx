import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../../context/AuthContext'; // Adjust path as needed
import { WizardProvider, useWizard } from '../../../../context/WizardContext'; // Adjust path
import CharactersStep from '../CharactersStep';
import { Character } from '../../../../types';

// Mocks
jest.mock('../../../../context/AuthContext', () => ({
  ...jest.requireActual('../../../../context/AuthContext'),
  useAuth: () => ({
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
    },
    user: { id: 'test-user-id' },
  }),
}));

jest.mock('../../../../context/WizardContext', () => ({
  ...jest.requireActual('../../../../context/WizardContext'),
  useWizard: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ storyId: 'test-story-id' }),
}));

jest.mock('../../../Character/CharacterCard', () => ({ character, onEdit, onDelete, isAddCard, onClick }: any) => (
  <div data-testid={isAddCard ? 'add-character-card' : `character-card-${character?.id}`} onClick={isAddCard ? onClick : () => onEdit(character.id)}>
    {isAddCard ? 'Add Character' : character?.name}
    {!isAddCard && <button data-testid={`delete-${character?.id}`} onClick={(e) => { e.stopPropagation(); onDelete(character.id); }}>Delete</button>}
  </div>
));

jest.mock('../../../UI/Modal', () => ({ isOpen, onClose, title, children }: any) => (
  isOpen ? <div data-testid="modal"><h3>{title}</h3>{children}<button onClick={onClose}>Close Modal</button></div> : null
));

jest.mock('../../../Character/CharacterForm', () => ({ characterId, storyId, onSave, onCancel }: any) => (
  <div data-testid="character-form">
    <p>Character Form (Character ID: {characterId || 'new'})</p>
    <button onClick={() => onSave({ id: characterId || 'new-char-id-from-form', name: 'Saved Character' })}>Save</button>
    <button onClick={onCancel}>Cancel</button>
  </div>
));


describe('CharactersStep Component', () => {
  let mockSetStepStatus: jest.Mock;
  let mockSetCharactersWizard: jest.Mock;
  let mockSupabaseSelect: jest.Mock;

  beforeEach(() => {
    mockSetStepStatus = jest.fn();
    mockSetCharactersWizard = jest.fn();
    (useWizard as jest.Mock).mockReturnValue({
      currentStep: 0, // Assuming 'personajes' is the first step (index 0 or slug 'personajes')
      setStepStatus: mockSetStepStatus,
      setCharacters: mockSetCharactersWizard,
      characters: [], // Initial wizard characters
    });

    // Reset Supabase mock for each test
    const supabaseMock = require('../../../../context/AuthContext').useAuth().supabase;
    mockSupabaseSelect = supabaseMock.from('story_characters').select.mockReturnThis();
    supabaseMock.from('story_characters').eq.mockReturnThis();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <WizardProvider>
            <CharactersStep />
          </WizardProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders loading state and then characters', async () => {
    const mockCharacters: Character[] = [
      { id: '1', name: 'Character 1', description: {es: 'Desc 1'}, thumbnail_url: 'img1.png', age: '10', user_id: 'test-user-id' },
      { id: '2', name: 'Character 2', description: {es: 'Desc 2'}, thumbnail_url: 'img2.png', age: '20', user_id: 'test-user-id' },
    ];
    mockSupabaseSelect.mockResolvedValueOnce({ data: mockCharacters.map(c => ({ character_id: c.id, characters: c })), error: null });

    renderComponent();
    expect(screen.getByText('Cargando personajes...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Character 1')).toBeInTheDocument();
      expect(screen.getByText('Character 2')).toBeInTheDocument();
    });
    expect(screen.queryByText('Cargando personajes...')).not.toBeInTheDocument();
  });

  test('opens modal when "Add Character" card is clicked', async () => {
    mockSupabaseSelect.mockResolvedValueOnce({ data: [], error: null }); // No initial characters
    renderComponent();

    await waitFor(() => expect(screen.queryByText('Cargando personajes...')).not.toBeInTheDocument());
    
    const addCharacterCard = screen.getByTestId('add-character-card');
    fireEvent.click(addCharacterCard);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Añadir Nuevo Personaje')).toBeInTheDocument();
      expect(screen.getByText('Character Form (Character ID: new)')).toBeInTheDocument();
    });
  });

  test('opens modal with correct characterId when an existing character card is clicked', async () => {
    const mockCharacter: Character = { id: 'char123', name: 'Editable Character', description: {es: 'Desc'}, thumbnail_url: 'thumb.png', age: '30', user_id: 'test-user-id' };
    mockSupabaseSelect.mockResolvedValueOnce({ data: [{ character_id: mockCharacter.id, characters: mockCharacter }], error: null });
    renderComponent();

    await waitFor(() => expect(screen.getByText('Editable Character')).toBeInTheDocument());
    
    fireEvent.click(screen.getByTestId('character-card-char123'));

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Editar Personaje')).toBeInTheDocument();
      expect(screen.getByText('Character Form (Character ID: char123)')).toBeInTheDocument();
    });
  });

  test('conditionally renders "Add Character" card based on character count', async () => {
    // Case 1: Less than 3 characters
    const twoCharacters: Character[] = [
      { id: '1', name: 'Char 1', description: {es: 'D1'}, thumbnail_url: 't1.png', age: '10', user_id: 'test-user-id' },
      { id: '2', name: 'Char 2', description: {es: 'D2'}, thumbnail_url: 't2.png', age: '10', user_id: 'test-user-id' },
    ];
    mockSupabaseSelect.mockResolvedValueOnce({ data: twoCharacters.map(c => ({ character_id: c.id, characters: c })), error: null });
    const { rerender } = renderComponent();
    await waitFor(() => expect(screen.getByTestId('add-character-card')).toBeInTheDocument());

    // Case 2: Exactly 3 characters
    const threeCharacters: Character[] = [
      ...twoCharacters,
      { id: '3', name: 'Char 3', description: {es: 'D3'}, thumbnail_url: 't3.png', age: '10', user_id: 'test-user-id' },
    ];
     // Simulate loading these characters
    mockSupabaseSelect.mockResolvedValueOnce({ data: threeCharacters.map(c => ({ character_id: c.id, characters: c })), error: null });
    
    // Need to simulate a change that would cause a re-fetch or re-evaluation.
    // For simplicity in this unit test, we'll re-render with updated context if CharactersStep listened to context characters directly
    // Or, more realistically, simulate adding a character through the form, then check.
    // For this test, let's assume loadCharacters is called again by some parent action or prop change (not ideal for pure unit test)
    // A better way would be to simulate CharacterForm save and ensure CharactersStep reloads and updates.
    // For now, we'll just check the initial render with 3 characters.
    
    // To correctly test this, we'd need to simulate the character state changing.
    // Let's assume the component re-renders after characters are loaded.
    // This part of the test might be better as an integration test or by directly manipulating the characters state if possible.
    // For now, we just check that if 3 characters are passed, the add card is not there.
    // This requires CharactersStep to re-evaluate its rendering based on the new character count.
    // The current `CharactersStep` fetches its own data, so we need to mock the fetch.
    
    // Re-rendering with a new setup that will load 3 characters
    const supabaseMock = require('../../../../context/AuthContext').useAuth().supabase;
    supabaseMock.from('story_characters').select.mockResolvedValueOnce({ data: threeCharacters.map(c => ({ character_id: c.id, characters: c })), error: null });

    rerender(
        <BrowserRouter>
          <AuthProvider>
            <WizardProvider> {/* Ensure WizardProvider is re-instantiated or state is updated */}
              <CharactersStep />
            </WizardProvider>
          </AuthProvider>
        </BrowserRouter>
    );
    await waitFor(() => expect(screen.queryByTestId('add-character-card')).not.toBeInTheDocument());
  });

  test('calls setStepStatus from WizardContext with correct validity', async () => {
    // Scenario 1: No characters, step should be invalid
    mockSupabaseSelect.mockResolvedValueOnce({ data: [], error: null });
    renderComponent();
    await waitFor(() => {
      expect(mockSetStepStatus).toHaveBeenCalledWith('personajes', false);
    });
    mockSetStepStatus.mockClear(); // Clear previous calls

    // Scenario 2: One character, but incomplete (missing thumbnail)
    const incompleteChar: Character[] = [{ id: '1', name: 'Test', description: {es: 'Desc'}, thumbnail_url: '', age: '10', user_id: 'test-user-id' }];
    mockSupabaseSelect.mockResolvedValueOnce({ data: incompleteChar.map(c => ({ character_id: c.id, characters: c })), error: null });
    renderComponent(); // Rerender or trigger reload
    await waitFor(() => {
      expect(mockSetStepStatus).toHaveBeenCalledWith('personajes', false);
    });
    mockSetStepStatus.mockClear();

    // Scenario 3: One character, complete
    const completeChar: Character[] = [{ id: '2', name: 'Test Complete', description: {es: 'Real Desc'}, thumbnail_url: 'img.png', age: '10', user_id: 'test-user-id' }];
    mockSupabaseSelect.mockResolvedValueOnce({ data: completeChar.map(c => ({ character_id: c.id, characters: c })), error: null });
    renderComponent(); 
    await waitFor(() => {
      expect(mockSetStepStatus).toHaveBeenCalledWith('personajes', true);
    });
  });
  
  test('handles character deletion', async () => {
    const initialCharacters: Character[] = [
      { id: 'char1', name: 'Character One', description: {es: 'Desc 1'}, thumbnail_url: 'img1.png', age: '10', user_id: 'test-user-id'},
      { id: 'char2', name: 'Character Two', description: {es: 'Desc 2'}, thumbnail_url: 'img2.png', age: '20', user_id: 'test-user-id'},
    ];
    mockSupabaseSelect.mockResolvedValueOnce({ data: initialCharacters.map(c => ({ character_id: c.id, characters: c })), error: null });
    const supabaseMock = require('../../../../context/AuthContext').useAuth().supabase;
    const deleteMock = supabaseMock.from('story_characters').delete.mockResolvedValueOnce({ error: null });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Character One')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Character Two')).toBeInTheDocument());

    const deleteButton = screen.getByTestId('delete-char1');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalled();
      // Check that the character is removed from the UI
      expect(screen.queryByText('Character One')).not.toBeInTheDocument();
      expect(screen.getByText('Character Two')).toBeInTheDocument(); // The other character should still be there
    });
    
    // Verify step status is re-evaluated (assuming deleting a character might change validity)
    // If deleting 'Character One' makes the step invalid (e.g., if it was the only valid one)
    // This depends on the state of 'Character Two'
    await waitFor(() => {
        expect(mockSetStepStatus).toHaveBeenCalledWith('personajes', true); // Assuming Char2 is valid
    });
  });

});
