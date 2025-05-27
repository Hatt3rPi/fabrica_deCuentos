# CharactersStep Component

## Overview
Manages the display and modification of characters within the story wizard. It shows characters associated with a specific story in a grid format and utilizes a modal dialog containing the `CharacterForm` for creating new characters or editing existing ones. This step is crucial for defining the cast of the story.

## Props
This component typically does not receive props directly within the wizard flow. It retrieves the `storyId` from the URL parameters using `useParams()` from `react-router-dom` and interacts with shared wizard state via the `useWizard()` context.

## State
- `characters: Character[]`: An array holding the character objects fetched for the current `storyId`. This list is displayed in the grid.
- `isFormOpen: boolean`: A boolean state that controls the visibility of the modal containing `CharacterForm`. True opens the modal, false closes it.
- `editingCharacterId: string | null`: Stores the ID of the character currently being edited. If `null`, it indicates that the form is open for creating a new character.
- `isLoading: boolean`: Indicates if character data is currently being fetched.
- `error: string | null`: Stores any error messages related to fetching characters or other operations within the step.

## Functionality
- **Data Fetching**: On mount or when `storyId` changes (and is not 'new'), it fetches characters associated with the `storyId` from the `story_characters` table (which links to the `characters` table).
- **Character Display**: Renders a grid of `CharacterCard` components, one for each character in the `characters` state.
- **Add Character**:
    - If the number of characters is less than 3 and the `storyId` is not 'new', it displays an "Add Character" card (`CharacterCard` with `isAddCard={true}`).
    - Clicking this card calls the `handleAdd` function, which sets `editingCharacterId` to `null` and `isFormOpen` to `true`, thereby opening the `CharacterForm` in "create" mode.
- **Edit Character**:
    - Each `CharacterCard` is clickable (or has an edit button). Clicking it calls the `handleEdit` function with the character's ID.
    - `handleEdit` sets `editingCharacterId` to the selected character's ID and `isFormOpen` to `true`, opening `CharacterForm` in "edit" mode, pre-filled with that character's data.
- **Delete Character**:
    - Each `CharacterCard` has a delete button. Clicking it calls `handleDeleteCharacter`.
    - This function removes the character's association with the story from the `story_characters` table and updates the local and wizard character states.
- **Modal Interaction**:
    - Manages the `isFormOpen` state to show/hide the modal.
    - Passes necessary props to `CharacterForm` within the modal, including `characterId` (if editing), `storyId`, `onSave`, and `onCancel`.
- **Save Character Handling (`handleSaveCharacter`)**:
    - This function is passed as the `onSave` callback to `CharacterForm`.
    - When a new character is created and saved via `CharacterForm`, `handleSaveCharacter` is responsible for creating the link in the `story_characters` table between the `storyId` and the newly created character's ID.
    - After saving (new or edit), it reloads the character list and closes the modal.
- **Wizard Navigation Validation**:
    - Interacts with `WizardContext` (via `useWizard` hook, using `setStepStatus` and `currentStep`).
    - Implements a `useEffect` hook that monitors the `characters` list.
    - The step is considered valid for navigation if `characters.length > 0` AND at least one character has a name, a description (`description.es`), and a `thumbnail_url`.
    - Updates the wizard context with this validity status, enabling/disabling the "Next" button in the wizard navigation.
- **Handling New Stories (`storyId === 'new'`)**:
    - Does not attempt to load characters if `storyId` is 'new'.
    - Disables the "Add Character" functionality.
    - Sets the step as invalid in the `WizardContext` because characters cannot be meaningfully added or validated before a story is saved and has a persistent ID.

## Usage Example (Conceptual JSX Structure)
```tsx
// Inside CharactersStep.tsx render method:

<div className="space-y-8">
  <div className="text-center">
    <h2 className="text-2xl font-bold text-purple-800 mb-2">Personajes de tu Historia</h2>
    <p className="text-gray-600">Gestiona los personajes de tu cuento. (Máximo 3)</p>
  </div>

  {isLoading && <p className="text-center py-4">Cargando personajes...</p>}
  {error && <p className="text-red-500 text-center py-4">{error}</p>}

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {characters.map((character) => (
      <CharacterCard
        key={character.id}
        character={character}
        onEdit={handleEdit}
        onDelete={handleDeleteCharacter}
      />
    ))}

    {characters.length < 3 && storyId !== 'new' && (
      <CharacterCard
        isAddCard={true}
        onClick={handleAdd}
      />
    )}
  </div>

  {isFormOpen && storyId && storyId !== 'new' && (
    <Modal 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        title={editingCharacterId ? "Editar Personaje" : "Añadir Nuevo Personaje"}
    >
      <CharacterForm
        characterId={editingCharacterId}
        storyId={storyId}
        onSave={handleSaveCharacter}
        onCancel={handleCloseForm}
      />
    </Modal>
  )}
</div>
```
