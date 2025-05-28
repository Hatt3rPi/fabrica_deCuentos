/// <reference types="cypress" />

/**
 * Test de Apertura del Modal de Personajes
 * 
 * Verifica que el usuario puede abrir correctamente el modal
 * de personajes desde la página de inicio.
 */
describe('2. Apertura del modal de personajes', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe abrir el modal de selección de personajes al iniciar un cuento', function() {
    // Iniciar sesión
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Verificar que estamos en la página de inicio
    cy.url().should('include', '/home');
    
    // Usar el comando personalizado para abrir el wizard y el modal
    cy.openNewStoryModal();

    // Verificar que el modal de selección aparece
    cy.contains('h2', 'Selecciona un personaje', { timeout: 10000 })
      .should('be.visible');
    
    // Tomar una captura de pantalla para depuración
    cy.screenshot('modal-personajes-visible');
  });
  
  it('Debe mostrar el formulario para crear un nuevo personaje', function() {
    // Iniciar sesión y abrir el modal
    cy.login(this.testData.user.email, this.testData.user.password);
    cy.openNewStoryModal();

    // Abrir el formulario de creación
    cy.createNewCharacterFromModal();

    // Verificar que el formulario se muestra dentro del modal
    cy.contains('h2', 'Nuevo personaje').should('be.visible');
  });
});
