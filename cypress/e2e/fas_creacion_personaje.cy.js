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
 cy.get('[data-testid="character-card-b3f4f1f1-1cad-4927-ad75-7c9130aa734f"]').click();
 cy.get('.aspect-square > .w-full').click();
 cy.get('[data-testid="wizard-next-button"]').click();
 cy.get('[data-testid="story-theme"]').click();
 cy.get('[data-testid="story-theme"]').clear();
 cy.get('[data-testid="story-theme"]').type('un paseo por la savana');
 cy.get('[data-testid="generate-story"]').click();
 cy.get('[data-testid="wizard-next-button"]').click();
 /* ==== End Cypress Studio ==== */
});