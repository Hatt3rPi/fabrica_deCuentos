/// <reference types="cypress" />

/**
 * Test de Creación de Nuevo Personaje
 * 
 * Verifica que el usuario puede crear un nuevo personaje
 * completando el formulario correspondiente.
 */
describe('3. Creación de Nuevo Personaje', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe permitir crear un nuevo personaje completando todos los campos', function() {
    // Usar el comando login personalizado
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Verificar que estamos en la página de inicio
    cy.url().should('include', '/home');
    
    // Abrir el modal de selección de personajes
    cy.openNewStoryModal();

    // Abrir el formulario de creación de personaje
    cy.createNewCharacterFromModal();

    // Verificar que el formulario esté visible
    cy.contains('h2', 'Nuevo personaje').should('be.visible');
    
    // Completar el formulario
    cy.get('input[placeholder="Nombre del personaje"]').type(this.testData.character.name);
    cy.get('input[placeholder="Edad del personaje"]').type(this.testData.character.age);
    cy.get('textarea[placeholder="Describe al personaje..."]').type(this.testData.character.description);
    
    // Subir imagen si está disponible en los datos de prueba
    if (this.testData.character.imagePath) {
      cy.get('input[type="file"]').selectFile(this.testData.character.imagePath, { force: true });
      cy.get('img[alt="Referencia"]', { timeout: 20000 }).should('be.visible');
    } else {
      // Si no hay ruta de imagen específica, usar una imagen de prueba por defecto
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-avatar.png', { force: true });
      cy.get('img[alt="Referencia"]', { timeout: 20000 }).should('be.visible');
    }
    
    // Generar miniatura
    cy.contains('button', 'Generar miniatura')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Esperar a que se genere la miniatura
    cy.get('img[alt="Miniatura"]', { timeout: 600000 }).should('be.visible');
    
    // Guardar el personaje
    cy.contains('button', 'Guardar personaje')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Esperar a volver al wizard
    cy.url({ timeout: 10000 }).should('match', /\/wizard\/[^/]+/);

    // Verificar que el personaje se ha agregado
    cy.contains(this.testData.character.name, { timeout: 15000 })
      .should('be.visible');
  });
});
