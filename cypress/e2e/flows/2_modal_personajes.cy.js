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

  it('Debe abrir el modal de personajes desde la página de inicio', function() {
    // Iniciar sesión
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Verificar que estamos en la página correcta
    cy.url().should('include', '/home');
    
    // Usar el comando personalizado para abrir el modal
    cy.openNewStoryModal();
    
    // Verificar que el modal está visible
    cy.get('[data-testid="modal-personajes"]', { timeout: 10000 })
      .should('be.visible')
      .and(($el) => {
        // Verificar que el modal está visible
        const display = $el.css('display');
        const opacity = parseFloat($el.css('opacity'));
        
        expect(display).to.not.equal('none');
        expect(opacity).to.be.greaterThan(0);
      });
    
    // Tomar una captura de pantalla para depuración
    cy.screenshot('modal-personajes-visible');
  });
  
  it('Debe mostrar el botón para crear un nuevo personaje', function() {
    // Iniciar sesión y abrir el modal
    cy.login(this.testData.user.email, this.testData.user.password);
    cy.openNewStoryModal();
    
    // Verificar que el botón interno "Crear nuevo personaje" está disponible
    cy.createNewCharacterFromModal();
    
    // Verificar que nos redirige a la página de creación de personaje
    cy.url().should('include', '/nuevo-cuento/personaje/nuevo');
  });
});
