/// <reference types="cypress" />

/**
 * Test Completo del Flujo de Historia
 * 
 * Flujo completo desde login hasta la generación de historia:
 * 1. Limpieza de datos del usuario
 * 2. Login -> Home -> Nuevo cuento
 * 3. Crear personaje (igual que 3_creacion_personaje.cy.js)
 * 4. Avanzar hasta cuento y crear historia
 * 5. Esperar que aparezca en "Tu cuento completo"
 * 6. Verificar que botón siguiente esté disponible
 */
describe('Flujo Completo de Historia', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe completar el flujo desde limpieza hasta generación de historia', function() {
    const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'tester@lacuenteria.cl';
    
    // ==================================================
    // PASO 1: LIMPIEZA DE DATOS DEL USUARIO (SOLO UNA VEZ)
    // ==================================================
    cy.log('🧹 PASO 1: Limpiando datos del usuario ÚNICAMENTE AL INICIO...');
    cy.cleanupTestStories(testUserEmail).then((result) => {
      cy.log(`✅ Limpieza inicial completada: ${JSON.stringify(result, null, 2)}`);
      cy.wrap(result).should('have.property', 'success');
      cy.log('🚫 NO se ejecutará más limpieza durante este test');
    });

    // ==================================================
    // PASO 2: LOGIN -> HOME -> NUEVO CUENTO
    // ==================================================
    cy.log('🔐 PASO 2: Login y navegación inicial...');
    
    // Login usando comando personalizado
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Verificar que estamos en home
    cy.url().should('include', '/home');
    
    // Abrir modal de nuevo cuento
    cy.openNewStoryModal();

    // ==================================================
    // PASO 3: CREAR PERSONAJE
    // ==================================================
    cy.log('👤 PASO 3: Creando personaje...');
    
    // Abrir formulario de creación de personaje
    cy.createNewCharacterFromModal();
    
    // Verificar que el formulario esté visible
    cy.contains('h2', 'Nuevo personaje').should('be.visible');
    
    // Completar formulario del personaje
    cy.get('input[placeholder="Nombre del personaje"]').type(this.testData.character.name);
    cy.get('input[placeholder="Edad del personaje"]').type(this.testData.character.age);
    cy.get('textarea[placeholder="Describe al personaje..."]').type(this.testData.character.description);
    
    // Subir imagen de referencia
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-avatar.png', { force: true });
    cy.get('img[alt="Referencia"]', { timeout: 20000 }).should('be.visible');
    
    // Generar miniatura
    cy.contains('button', 'Generar miniatura')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Esperar a que se genere la miniatura (máximo 120 segundos)
    // Nota: Usar img[alt="Miniatura"] porque no hay data-testid en el componente
    cy.get('img[alt="Miniatura"]', { timeout: 120000 })
      .should('be.visible');
    
    // Guardar personaje
    cy.contains('button', 'Guardar personaje')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Verificar que volvemos al modal de selección
    cy.contains('h2', 'Selecciona un personaje').should('be.visible');
    
    // Seleccionar uno de los personajes disponibles (por nombre que se ve en la imagen)
    cy.contains('div', 'Sheldon', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // El modal debería cerrarse automáticamente y deberíamos estar en el wizard
    cy.url().should('include', '/wizard/');

    // ==================================================
    // PASO 4: NAVEGAR HASTA ETAPA "CUENTO"
    // ==================================================
    cy.log('📖 PASO 4: Cerrando modal y navegando a etapa Cuento...');
    
    // Verificar que estamos en el wizard (el modal se debe haber cerrado)
    cy.url().should('include', '/wizard/');
    
    // Verificar que estamos en la etapa de personajes del wizard principal
    cy.contains('h2', 'Selecciona tus Personajes').should('be.visible');
    
    // Esperar medio segundo como solicitado antes de avanzar
    cy.wait(500);
    
    // Hacer click en "Siguiente" (WizardNav) para avanzar a la etapa cuento
    cy.contains('button', 'Siguiente')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Verificar que llegamos a la etapa de cuento
    cy.contains('h2', 'Configura tu Historia').should('be.visible');

    // ==================================================
    // PASO 5: CREAR HISTORIA
    // ==================================================
    cy.log('✍️ PASO 5: Creando historia...');
    
    // Verificar que el campo de temática está visible
    cy.get('textarea[placeholder="Describe la temática de tu cuento..."]')
      .should('be.visible');
    
    // Escribir temática del cuento
    cy.get('textarea[placeholder="Describe la temática de tu cuento..."]')
      .type(this.testData.story.theme || 'Una aventura mágica en un bosque encantado donde nuestro personaje descubre poderes especiales y ayuda a los animales del bosque.');
    
    // Verificar que el botón "Generar la Historia" esté habilitado
    cy.contains('button', 'Generar la Historia')
      .should('be.visible')
      .and('not.be.disabled');
    
    // Hacer click en generar historia
    cy.contains('button', 'Generar la Historia').click();
    
    // Verificar que aparece el estado de "Generando..."
    cy.contains('button', 'Generando...').should('be.visible');

    // ==================================================
    // PASO 6: ESPERAR GENERACIÓN Y VERIFICAR RESULTADO
    // ==================================================
    cy.log('⏳ PASO 6: Esperando generación de historia...');
    
    // Esperar a que aparezca el cuento completo (máximo 3 minutos)
    cy.contains('📖 Cuento completo', { timeout: 180000 }).should('be.visible');
    
    // Verificar que el textarea con el cuento tenga contenido
    cy.contains('Tu cuento completo')
      .parent()
      .find('textarea[readonly]')
      .should('not.be.empty')
      .and('contain.text', this.testData.character.name);
    
    // Verificar que el botón "Continuar" esté disponible
    cy.contains('button', 'Continuar')
      .should('be.visible')
      .and('not.be.disabled');

    // ==================================================
    // PASO 7: VERIFICACIONES FINALES
    // ==================================================
    cy.log('✅ PASO 7: Verificaciones finales...');
    
    // Verificar que podemos continuar a la siguiente etapa
    cy.contains('button', 'Continuar').click();
    
    // Verificar que llegamos a la etapa de diseño
    cy.contains('h2', 'Diseño Visual', { timeout: 10000 }).should('be.visible');
    
    cy.log('🎉 ¡Flujo completo ejecutado exitosamente!');
  });

  // Test adicional para verificar persistencia
  it('Debe mantener el progreso al recargar la página', function() {
    cy.log('🔄 Verificando persistencia del progreso...');
    
    // Login
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Ir a home y verificar que hay historias en progreso
    cy.url().should('include', '/home');
    
    // Buscar historias con botón "Continuar"
    cy.get('body').then($body => {
      if ($body.find('[data-testid="continue-story-button"]').length > 0) {
        // Hay historias en progreso, hacer click en continuar
        cy.get('[data-testid="continue-story-button"]').first().click();
        
        // Verificar que podemos continuar desde donde quedamos
        cy.url().should('include', '/wizard/');
        
        // Recargar página para verificar persistencia
        cy.reload();
        
        // Verificar que el estado se mantiene
        cy.url().should('include', '/wizard/');
        
        cy.log('✅ Persistencia verificada correctamente');
      } else {
        cy.log('ℹ️ No hay historias en progreso para verificar persistencia');
      }
    });
  });
});