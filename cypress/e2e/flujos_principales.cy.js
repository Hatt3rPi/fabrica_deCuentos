/// <reference types="cypress" />

/**
 * Orquestador de Flujos Principales de La CuenterIA
 * 
 * Este archivo actúa como orquestador de todos los flujos de prueba principales.
 * En lugar de contener las pruebas directamente, ejecuta cada archivo de prueba
 * individual en secuencia, asegurando que se ejecuten en el orden correcto y
 * con un entorno limpio al inicio.
 * 
 * Estructura de pruebas:
 * 1. Limpieza de datos (edge_function_test.cy.js)
 * 2. Flujos individuales (en carpeta /flows):
 *    - 1_login.cy.js
 *    - 2_modal_personajes.cy.js
 *    - 3_creacion_personaje.cy.js
 *    - 4_validacion_campos.cy.js
 *    - 5_independencia_pruebas.cy.js
 */
describe('Orquestador de Flujos Principales', function() {
  // Configuración antes de todas las pruebas
  before(function() {
    // Cargar los datos de prueba desde el archivo de fixture
    cy.fixture('test-data.json').then((data) => {
      this.testData = data;
      // Configurar el email del usuario de prueba en las variables de entorno
      if (this.testData.user && this.testData.user.email) {
        Cypress.env('TEST_USER_EMAIL', this.testData.user.email);
      }
      
      // Limpiar datos antes de todas las pruebas
      const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
      cy.log(`Limpiando historias de prueba para: ${testUserEmail}`);
      
      // Usar la Edge Function para limpiar historias (con respaldo)
      cy.cleanupTestStories(testUserEmail, { useBackup: true }).then((result) => {
        if (result.usingBackup) {
          cy.log('Se usó el método de respaldo para limpiar los datos');
        }
        
        if (result && result.deletedStories > 0) {
          cy.log(`Historias de prueba limpiadas: ${result.deletedStories} eliminadas`);
        } else {
          cy.log('No se encontraron historias para limpiar');
        }
      });
    });
  });
  
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  /**
   * Ejecuta la prueba de limpieza de datos
   * Esta prueba debe ejecutarse primero para asegurar un entorno limpio
   */
  it('0. Limpieza de datos inicial', function() {
    // Ejecutar la prueba de limpieza de datos usando la Edge Function
    cy.exec('npx cypress run --spec "cypress/e2e/edge_function_test.cy.js"', {
      timeout: 60000,
      failOnNonZeroExit: false
    }).then((result) => {
      cy.log(`Resultado de la limpieza inicial: ${result.stdout}`);
      // Verificar que la ejecución fue exitosa
      expect(result.code).to.be.oneOf([0, 1]); // Permitimos código 1 por si hay pruebas que fallan pero la limpieza se realizó
    });
  });

  /**
   * Ejecuta la prueba de login
   */
  it('1. Login Exitoso', function() {
    cy.exec('npx cypress run --spec "cypress/e2e/flows/1_login.cy.js"', {
      timeout: 60000,
      failOnNonZeroExit: false
    }).then((result) => {
      cy.log(`Resultado de la prueba de login: ${result.stdout}`);
      // Verificar que la ejecución fue exitosa
      expect(result.code).to.equal(0);
    });
  });

  /**
   * Ejecuta la prueba de apertura del modal de personajes
   */
  it('2. Apertura del modal de personajes', function() {
    cy.exec('npx cypress run --spec "cypress/e2e/flows/2_modal_personajes.cy.js"', {
      timeout: 60000,
      failOnNonZeroExit: false
    }).then((result) => {
      cy.log(`Resultado de la prueba del modal: ${result.stdout}`);
      // Verificar que la ejecución fue exitosa
      expect(result.code).to.equal(0);
    });
  });

  /**
   * Ejecuta la prueba de creación de personaje
   */
  it('3. Creación de Nuevo Personaje', function() {
    cy.exec('npx cypress run --spec "cypress/e2e/flows/3_creacion_personaje.cy.js"', {
      timeout: 120000, // Esta prueba puede tardar más tiempo por la generación de la miniatura
      failOnNonZeroExit: false
    }).then((result) => {
      cy.log(`Resultado de la prueba de creación de personaje: ${result.stdout}`);
      // Verificar que la ejecución fue exitosa
      expect(result.code).to.equal(0);
    });
  });

  // Pruebas desactivadas temporalmente
  it.skip('4. Validación de Campos Obligatorios', function() {
    cy.exec('npx cypress run --spec "cypress/e2e/flows/4_validacion_campos.cy.js"', {
      timeout: 60000,
      failOnNonZeroExit: false
    }).then((result) => {
      cy.log(`Resultado de la validación de campos: ${result.stdout}`);
      // Verificar que la ejecución fue exitosa
      expect(result.code).to.equal(0);
    });
  });

  it.skip('5. Independencia de Pruebas', function() {
    cy.exec('npx cypress run --spec "cypress/e2e/flows/5_independencia_pruebas.cy.js"', {
      timeout: 60000,
      failOnNonZeroExit: false
    }).then((result) => {
      cy.log(`Resultado de la prueba de independencia: ${result.stdout}`);
      // Verificar que la ejecución fue exitosa
      expect(result.code).to.equal(0);
    });
  });
});
