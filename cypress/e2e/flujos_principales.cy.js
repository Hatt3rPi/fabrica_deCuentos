/// <reference types="cypress" />

describe('Flujos principales de La CuenterIA', () => {
  beforeEach(() => {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('1. Login Exitoso', function() {
    // Visitar la página de login
    cy.visit('/');
    
    // Verificar que estamos en la página de login
    cy.contains('h2', 'La CuenterIA').should('be.visible');
    
    // Ingresar credenciales
    cy.get('input[id="email"]').type(this.testData.user.email);
    cy.get('input[id="password"]').type(this.testData.user.password);
    
    // Hacer clic en el botón de iniciar sesión
    cy.contains('button', 'Iniciar sesión').click();
    
    // Verificar redirección a la página de inicio
    cy.url().should('include', '/home');
    
    // Verificar que se muestra el mensaje de bienvenida (header con el logo)
    cy.get('header').should('be.visible');
    cy.get('header').find('h1').should('contain', 'La CuenterIA');
  });

  it('2. Creación de Nuevo Cuento', function() {
    // Iniciar sesión usando el comando personalizado
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Verificar que el botón "+ Nuevo cuento" existe y es visible
    cy.contains('+ Nuevo cuento')
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });
    
    // Verificar que el modal se ha abierto
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    
    // Verificar que el botón "+ Crear nuevo" existe y es visible
    cy.contains('+ Crear nuevo')
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });
    
    // Completar el formulario del personaje
    cy.get('input[placeholder="Nombre del personaje"]').type(this.testData.character.name);
    cy.get('input[placeholder="Edad del personaje"]').type(this.testData.character.age);
    cy.get('textarea[placeholder="Describe al personaje..."]').type(this.testData.character.description);
    
    // Subir una imagen de prueba
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-avatar.png', { force: true });
    
    // Verificar que la imagen se ha cargado
    cy.get('img[alt="Referencia"]').should('be.visible');
    
    // Hacer clic en "Generar miniatura"
    cy.contains('button', 'Generar miniatura').click();
    
    // Esperar a que se genere la miniatura (esto puede tardar)
    cy.get('img[alt="Miniatura"]', { timeout: 30000 }).should('be.visible');
    
    // Hacer clic en "Guardar personaje"
    cy.contains('button', 'Guardar personaje').click();
    
    // Verificar que se ha redirigido a la pantalla de diseño de historia
    cy.url().should('include', '/nuevo-cuento/personajes');
    
    // Verificar que el personaje se ha guardado correctamente
    cy.contains(this.testData.character.name).should('be.visible');
  });

  it('3. Validación de Campos Obligatorios', function() {
    // Iniciar sesión usando el comando personalizado
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Navegar a la creación de personaje
    cy.contains('+ Nuevo cuento').click();
    cy.contains('+ Crear nuevo').click();
    
    // Intentar avanzar sin completar los campos obligatorios
    cy.contains('button', 'Generar miniatura').click();
    
    // Verificar que se muestran mensajes de error
    cy.contains('El nombre es obligatorio').should('be.visible');
    cy.contains('La edad es obligatoria').should('be.visible');
    
    // Verificar que el botón "Generar miniatura" está deshabilitado o no funciona
    cy.contains('button', 'Generar miniatura').should('be.disabled')
      .then(($btn) => {
        if (!$btn.prop('disabled')) {
          // Si el botón no está deshabilitado, verificar que no funciona
          cy.wrap($btn).click();
          cy.get('img[alt="Miniatura"]').should('not.exist');
        }
      });
  });

  // Prueba adicional para verificar la independencia de las pruebas
  it('4. Las pruebas son independientes', function() {
    // Esta prueba verifica que podemos ejecutar el flujo de login nuevamente
    // sin depender del estado de las pruebas anteriores
    cy.login(this.testData.user.email, this.testData.user.password);
    cy.url().should('include', '/home');
  });
});
