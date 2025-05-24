/// <reference types="cypress" />

/**
 * Test de Login Exitoso
 * 
 * Verifica que el usuario puede iniciar sesión correctamente
 * en la aplicación La CuenterIA.
 */
describe('1. Login Exitoso', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe permitir iniciar sesión con credenciales válidas', function() {
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
});
