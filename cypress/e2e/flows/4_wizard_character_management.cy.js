/// <reference types="cypress" />

import { 표준_테스트_유저 } from '../../../src/constants/testUser'; // Adjust path based on your project structure
const testUser = 표준_테스트_유저;

describe('Wizard - Character Management Flow', () => {
  let storyId;

  beforeEach(() => {
    // Login before each test
    cy.login(testUser.email, testUser.password);

    // Intercept Supabase function calls for stable tests
    cy.intercept('POST', '**/describe-and-sketch', {
      statusCode: 200,
      body: { thumbnailUrl: 'http://example.com/mocked-thumbnail.png' }, // Mocked response
    }).as('describeAndSketch');

    cy.intercept('POST', '**/storage/v1/object/reference-images/**', { // Looser match for reference images
      statusCode: 200,
      body: { Key: 'mocked-image.png' }, 
    }).as('uploadReferenceImage');
    
    cy.intercept('POST', '**/storage/v1/object/thumbnails/**', { // Looser match for thumbnails
      statusCode: 200,
      body: { Key: 'mocked-thumbnail-storage.png' },
    }).as('uploadThumbnail');


    // Navigate to home and start a new story to get a storyId for most tests
    // Some tests might want to control this differently.
    cy.visit('/home');
    cy.get('button').contains('+ Nuevo Cuento').click();
    cy.url().should('include', '/wizard/').then((url) => {
      const parts = url.split('/');
      storyId = parts[parts.indexOf('wizard') + 1];
      cy.log(`Created story with ID: ${storyId}`);
      cy.url().should('include', `/wizard/${storyId}/personajes`);
    });
    cy.get('[data-testid="wizard-nav-item-personajes"].font-bold').should('exist');
  });

  it('should handle initial state, character creation, editing, limit, and navigation validation', () => {
    // 1. Initial State
    cy.log('Verifying initial state...');
    cy.get('[data-testid^="character-card-"]').should('not.exist'); // No character cards initially
    cy.get('[data-testid="add-character-card"]').should('be.visible');
    cy.get('[data-testid="wizard-next-button"]').should('be.disabled');

    // --- Helper function to create a character ---
    const createCharacter = (name, age, description, imageFixture = 'test-avatar.png') => {
      cy.get('[data-testid="add-character-card"]').click();
      cy.get('[data-testid="modal"]').should('be.visible');
      cy.get('[data-testid="character-form"]').should('be.visible');
      
      cy.get('input[placeholder="Nombre del personaje"]').type(name);
      cy.get('input[placeholder="Edad del personaje"]').type(age);
      cy.get('textarea[placeholder="Describe al personaje..."]').type(description);
      
      // Image upload
      cy.get('input[type="file"]').selectFile(`cypress/fixtures/${imageFixture}`, { force: true });
      cy.wait('@uploadReferenceImage'); // Wait for the mocked upload
      
      // Thumbnail generation
      cy.get('button').contains('Generar Miniatura').click();
      cy.wait('@describeAndSketch');
      cy.wait('@uploadThumbnail'); // Wait for the mocked thumbnail storage
      
      cy.get('button').contains('Crear Personaje').click();
      cy.get('[data-testid="modal"]').should('not.exist');
      cy.contains(`[data-testid^="character-card-"]`, name).should('be.visible');
    };

    // 2. Create First Character
    cy.log('Creating first character...');
    createCharacter('Gandalf', '2019', 'Un mago poderoso y sabio.');
    cy.get('[data-testid^="character-card-"]').should('have.length', 1);
    cy.get('[data-testid="wizard-next-button"]').should('be.enabled');

    // 3. Edit Character
    cy.log('Editing character...');
    cy.get('[data-testid^="character-card-"]').contains('Gandalf').click(); // Click the card to edit
    cy.get('[data-testid="modal"]').should('be.visible');
    cy.get('input[placeholder="Nombre del personaje"]').should('have.value', 'Gandalf').clear().type('Gandalf el Gris');
    cy.get('button').contains('Guardar Cambios').click();
    cy.get('[data-testid="modal"]').should('not.exist');
    cy.contains(`[data-testid^="character-card-"]`, 'Gandalf el Gris').should('be.visible');
    cy.get('[data-testid^="character-card-"]').should('have.length', 1); // Still one character

    // 4. Character Limit
    cy.log('Testing character limit...');
    createCharacter('Frodo', '50', 'Portador del anillo.');
    cy.get('[data-testid^="character-card-"]').should('have.length', 2);
    cy.get('[data-testid="add-character-card"]').should('be.visible');

    createCharacter('Aragorn', '87', 'Heredero de Gondor.');
    cy.get('[data-testid^="character-card-"]').should('have.length', 3);
    cy.get('[data-testid="add-character-card"]').should('not.exist'); // Add card should disappear

    // 5. Navigation Validation (incomplete character makes "Next" disabled)
    cy.log('Testing navigation validation...');
    cy.contains(`[data-testid^="character-card-"]`, 'Aragorn').click();
    cy.get('[data-testid="modal"]').should('be.visible');
    cy.get('textarea[placeholder="Describe al personaje..."]').clear(); // Remove description
    cy.get('button').contains('Guardar Cambios').click();
    cy.get('[data-testid="modal"]').should('not.exist');
    cy.get('[data-testid="wizard-next-button"]').should('be.disabled'); // Next should be disabled

    // Make character complete again
    cy.contains(`[data-testid^="character-card-"]`, 'Aragorn').click();
    cy.get('[data-testid="modal"]').should('be.visible');
    cy.get('textarea[placeholder="Describe al personaje..."]').type('Heredero de Gondor, fuerte y valiente.');
    cy.get('button').contains('Guardar Cambios').click();
    cy.get('[data-testid="modal"]').should('not.exist');
    cy.get('[data-testid="wizard-next-button"]').should('be.enabled'); // Next should be enabled again
  });

  it('should not allow adding characters if storyId is "new" (direct navigation scenario)', () => {
    // This test simulates a scenario where a user might land on /wizard/new/personajes
    // The UI should prevent character addition.
    cy.visit(`/wizard/new/personajes`);
    cy.get('[data-testid="wizard-nav-item-personajes"].font-bold').should('exist');
    cy.get('[data-testid="add-character-card"]').should('not.exist');
    cy.contains('Gestiona los personajes de tu cuento.').should('be.visible'); // Check title is there
    // Check if there's any specific UI element indicating disabled state for new story (optional)
    // e.g., a message or the "Add Character" button being visibly disabled if it were rendered.
    // Based on current CharactersStep logic, the add card is simply not rendered.
  });

});
