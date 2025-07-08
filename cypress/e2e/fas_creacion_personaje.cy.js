/* ==== Test Created with Cypress Studio ==== */
it('lacuenteria.cl', function() {
 /* ==== Generated with Cypress Studio ==== */
 cy.visit('http://localhost:5173/');
 /* ==== End Cypress Studio ==== */
 /* ==== Generated with Cypress Studio ==== */
 cy.get('.whitespace-nowrap').click();
 cy.get('#email').clear();
 cy.get('#email').type('tester@lacuenteria.cl');
 cy.get('#password').clear();
 cy.get('#password').type('test123');
 cy.get('.py-3').click();


 /* ==== Generated with Cypress Studio ==== 
 
  ==== End Cypress Studio ==== */
 /* ==== Generated with Cypress Studio ==== */
 cy.get('[data-testid="create-new-story"] > .text-sm').click();
 cy.get('[data-testid="character-card-df1eb4e2-6b1a-4936-bb2e-048221cc0693"]').click();
 //cy.get('.aspect-square > .w-full').click();
 cy.get('[data-testid="close-character-modal"]').click();
 cy.get('[data-testid="wizard-next-button"]').click();
 cy.get('[data-testid="story-theme"]').click();
 cy.get('[data-testid="story-theme"]').clear();
 cy.get('[data-testid="story-theme"]').type('un paseo por la savana');
 cy.get('[data-testid="generate-story"]').click();
 cy.get('[data-testid="wizard-next-button"]').click();
 /* ==== End Cypress Studio ==== */
});