/* ==== Test Created with Cypress Studio ==== */
it('lacuenteria.cl', function() {
  /* ==== Generated with Cypress Studio ==== */
  cy.visit('http://localhost:5174/');
  /* ==== End Cypress Studio ==== */
  /* ==== Generated with Cypress Studio ==== */
  cy.get('.whitespace-nowrap').click();
  cy.get('#email').clear('te');
  cy.get('#email').type('tester@lacuenteria.cl');
  cy.get('#password').clear();
  cy.get('#password').type('test123');
  cy.get('.py-3').click();
  cy.get('.group > .lucide').click();
  cy.get('[data-testid="create-new-character-button"]').click();
  cy.get('[data-testid="character-name-input"]').clear('E');
  cy.get('[data-testid="character-name-input"]').type('Emi');
  cy.get('[data-testid="character-age-input"]').clear('2');
  cy.get('[data-testid="character-age-input"]').type('2');
  cy.get('[data-testid="character-description-input"]').click();
  cy.get('[data-testid="character-description-input"]').clear();
  cy.get('[data-testid="character-description-input"]').type('Una niña muy inteligente y curiosa');

  // Cargar imagen de referencia
  cy.get('input[type="file"]').first()
    .selectFile('cypress/fixtures/test-avatar.png', { force: true });

  cy.get('[data-testid="generate-thumbnail-button"]').click();
  cy.get('[data-testid="save-character-button"] > span', { timeout: 60000 }).click();
  cy.get('[data-testid="wizard-next-button"] > span').click();
  cy.get('.flex-wrap > :nth-child(1)').click();
  cy.get('[data-testid="story-theme-input"]').click();
  cy.get('[data-testid="story-theme-input"]').clear();
  cy.get('[data-testid="story-theme-input"]').type('un paseo por la savana');
  cy.get('[data-testid="generate-story-button"]').click();

  /* ==== End Cypress Studio ==== */
  /* ==== Generated with Cypress Studio ==== */
  cy.get('[data-testid="generate-story-button"]').click();
  /* ==== End Cypress Studio ==== */
});