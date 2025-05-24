/// <reference types="cypress" />

/**
 * Test de Independencia de Pruebas
 * 
 * Verifica que las pruebas son independientes entre sí
 * y no dependen del estado de pruebas anteriores.
 */
describe('5. Las pruebas son independientes', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe poder iniciar sesión independientemente del estado de otras pruebas', function() {
    // Esta prueba verifica que podemos ejecutar el flujo de login nuevamente
    // sin depender del estado de las pruebas anteriores
    cy.login(this.testData.user.email, this.testData.user.password);
    cy.url().should('include', '/home');
  });
  
  it('Debe poder navegar a la página de creación de personaje directamente', function() {
    // Iniciar sesión
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Navegar directamente a la página de creación de personaje
    cy.visit('/nuevo-cuento/personaje/nuevo');
    
    // Verificar que la página carga correctamente
    cy.url().should('include', '/nuevo-cuento/personaje/nuevo');
    cy.get('input[placeholder="Nombre del personaje"]').should('be.visible');
  });
});
