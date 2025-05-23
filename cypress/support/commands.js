// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- Comando para iniciar sesión --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('input[id="email"]').type(email);
  cy.get('input[id="password"]').type(password);
  cy.contains('button', 'Iniciar sesión').click();
  // Esperar a que se redirija a la página de inicio
  cy.url().should('include', '/home');
  // Verificar que se muestra el mensaje de bienvenida (header con el logo)
  cy.get('header').should('be.visible');
  cy.get('header').find('h1').should('contain', 'La CuenterIA');
});

// -- Comando para crear un nuevo personaje --
Cypress.Commands.add('createCharacter', (name, age, description, imagePath) => {
  // Navegar a la página de creación de personaje
  cy.contains('+ Nuevo cuento').click();
  cy.contains('+ Crear nuevo').click();
  
  // Completar el formulario
  cy.get('input[placeholder="Nombre del personaje"]').type(name);
  cy.get('input[placeholder="Edad del personaje"]').type(age);
  cy.get('textarea[placeholder="Describe al personaje..."]').type(description);
  
  // Subir imagen si se proporciona una ruta
  if (imagePath) {
    cy.get('input[type="file"]').selectFile(imagePath, { force: true });
    // Esperar a que se cargue la imagen
    cy.get('img[alt="Referencia"]').should('be.visible');
  }
  
  // Generar miniatura
  cy.contains('button', 'Generar miniatura').click();
  
  // Esperar a que se genere la miniatura (esto puede tardar)
  cy.get('img[alt="Miniatura"]', { timeout: 30000 }).should('be.visible');
  
  // Guardar personaje
  cy.contains('button', 'Guardar personaje').click();
  
  // Verificar que se ha redirigido a la pantalla de diseño de historia
  cy.url().should('include', '/nuevo-cuento/personajes');
});

// -- Comando para limpiar datos de prueba --
Cypress.Commands.add('cleanupTestData', () => {
  // Este comando se puede implementar para eliminar datos de prueba
  // después de que se ejecuten las pruebas
  // Por ejemplo, eliminar personajes creados durante las pruebas
  
  // Nota: Esta implementación dependerá de cómo se accede a la API o BD
  // Por ahora, es un placeholder
  cy.log('Limpiando datos de prueba...');
  
  // Ejemplo de implementación futura:
  // cy.request({
  //   method: 'DELETE',
  //   url: '/api/test-data',
  //   headers: {
  //     Authorization: `Bearer ${Cypress.env('API_TOKEN')}`
  //   }
  // });
});

// -- Comando para verificar campos obligatorios --
Cypress.Commands.add('checkRequiredFields', () => {
  // Navegar a la página de creación de personaje
  cy.contains('+ Nuevo cuento').click();
  cy.contains('+ Crear nuevo').click();
  
  // Intentar avanzar sin completar campos
  cy.contains('button', 'Generar miniatura').click();
  
  // Verificar mensajes de error
  cy.contains('El nombre es obligatorio').should('be.visible');
  cy.contains('La edad es obligatoria').should('be.visible');
  
  // Verificar que el botón está deshabilitado o no funciona
  cy.contains('button', 'Generar miniatura').should('be.disabled')
    .then(($btn) => {
      if (!$btn.prop('disabled')) {
        // Si el botón no está deshabilitado, verificar que no funciona
        cy.wrap($btn).click();
        cy.get('img[alt="Miniatura"]').should('not.exist');
      }
    });
});

