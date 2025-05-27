# Changelog

All notable changes to this project will be documented in this file.

## [2023-10-27] - 2023-10-27

### Changed
- **Wizard Character Management:**
    - Revamped the "Characters" step in the story wizard for a more streamlined experience.
    - Characters are now displayed as static cards in a grid (`CharacterCard` component).
    - Character creation and editing are now handled through a unified modal dialog powered by the `CharacterForm` component. This modal is managed by `CharactersStep`.
    - The system now generates a unique `storyId` as soon as a user initiates a "+ Nuevo cuento", ensuring all subsequent character associations are correctly linked from the beginning of the wizard.
    - Enforces a maximum limit of 3 characters per story, visually represented by the presence or absence of an "Add Character" card.
    - The "Next" step in the wizard (navigation to subsequent steps) is only enabled if at least one character is "complete" (has a name, a description, and a generated thumbnail image). This validation is handled in `CharactersStep` and communicated to the `WizardContext`.

### Removed
- Removed old routes related to direct character management outside the wizard: `/nuevo-cuento/personajes`, `/nuevo-cuento/personaje/nuevo`, and `/nuevo-cuento/personaje/:id/editar`. These functionalities are now consolidated within the `/wizard/:storyId/personajes` step.

### Added
- New documentation file `docs/components/CharactersStep.md`.
- New section "Gestión de Personajes en el Wizard" in `docs/user-manual.md`.

### Updated
- `docs/components/CharacterForm.md` updated to reflect its new props (`characterId`, `storyId`, `onSave`, `onCancel`) and usage within a modal.
- `src/App.tsx` routes updated to reflect the new wizard-centric character management.
- `src/components/Wizard/steps/CharactersStep.tsx` refactored to manage character display, modal interaction for CRUD, character limit, and step validation.
- `src/components/Character/CharacterCard.tsx` updated to support an `isAddCard` variant and make the entire card clickable for editing.
- `src/components/Character/CharacterForm.tsx` refactored to work with props and callbacks instead of URL parameters, suitable for modal usage.
- `src/components/UI/Modal.tsx` (if it wasn't generic before, it's now used by `CharactersStep`).
