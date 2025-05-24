/// <reference types="cypress" />

/**
 * Test de Validación de Campos Obligatorios
 * 
 * Verifica que el formulario de creación de personajes
 * valida correctamente los campos obligatorios.
 */
describe('4. Validación de Campos Obligatorios', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe validar los campos obligatorios en el formulario de personaje', function() {
    // Iniciar sesión usando el comando personalizado
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Navegar directamente al formulario de creación
    cy.visit('/nuevo-cuento/personaje/nuevo');
    
    // Esperar a que la página esté completamente cargada
    cy.url().should('include', '/nuevo-cuento/personaje/nuevo');
    
    // Esperar a que el formulario esté listo
    cy.get('form', { timeout: 15000 }).should('be.visible');
    
    // Verificar que los campos obligatorios están presentes
    const nameField = 'input[placeholder="Nombre del personaje"]';
    const ageField = 'input[placeholder="Edad del personaje"]';
    
    // Verificar que los campos están visibles
    cy.get(nameField).should('be.visible');
    cy.get(ageField).should('be.visible');
    
    // Intentar generar sin completar campos obligatorios
    cy.contains('button', 'Generar miniatura').click();
    
    // Verificar que se muestran mensajes de error para los campos obligatorios
    cy.contains(/El nombre (es obligatorio|no puede estar vacío)/i).should('be.visible');
    cy.contains(/(La edad es obligatoria|La edad no puede estar vacía)/i).should('be.visible');
    
    // Verificar que no se ha generado ninguna miniatura
    cy.get('img[alt="Miniatura"]').should('not.exist');
    
    // Probar llenando solo el nombre
    cy.get(nameField).type('Personaje de prueba');
    
    // Intentar generar de nuevo
    cy.contains('button', 'Generar miniatura').click();
    
    // Verificar que seguimos en la misma página
    cy.url().should('include', '/nuevo-cuento/personaje/nuevo');
    
    // Limpiar el nombre y probar solo con la edad
    cy.get(nameField).clear();
    cy.get(ageField).type('10');
    
    // Intentar generar de nuevo
    cy.contains('button', 'Generar miniatura').click();
    
    // Verificar que seguimos en la misma página
    cy.url().should('include', '/nuevo-cuento/personaje/nuevo');
  });
});
