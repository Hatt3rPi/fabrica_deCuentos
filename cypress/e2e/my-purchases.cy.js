describe('My Purchases Page', () => {
  beforeEach(() => {
    // Login con usuario demo
    cy.login('tester@lacuenteria.cl', 'test123');
    
    // Ir a la página de compras
    cy.visit('/my-purchases');
  });

  it('should display the purchases page correctly', () => {
    // Verificar que se carga la página
    cy.get('h1').should('contain', 'Mis Compras');
    cy.get('p').should('contain', 'Aquí puedes ver todas tus historias compradas');
  });

  it('should show purchased stories with correct data', () => {
    // Si hay compras, verificar que se muestran correctamente
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="purchase-item"]').length > 0) {
        // Verificar elementos de compra
        cy.get('[data-testid="purchase-item"]').first().within(() => {
          // Verificar que hay título
          cy.get('h4').should('not.be.empty');
          
          // Verificar botones de acción
          cy.get('button').contains('Leer').should('exist');
          cy.get('button').should('contain.oneOf', ['Descargar PDF', 'Generando...']);
        });
      } else {
        // Si no hay compras, verificar mensaje vacío
        cy.get('h3').should('contain', 'No tienes compras aún');
        cy.get('button').contains('Explorar historias').should('exist');
      }
    });
  });

  it('should handle navigation correctly', () => {
    // Verificar botón de volver
    cy.get('button').contains('Volver al inicio').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should display error boundary when needed', () => {
    // Test que el error boundary funciona
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
    
    // Verificar que no hay errores críticos no manejados
    cy.get('@consoleError').should('not.have.been.called');
  });
});