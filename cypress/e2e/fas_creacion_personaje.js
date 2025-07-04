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
  
});