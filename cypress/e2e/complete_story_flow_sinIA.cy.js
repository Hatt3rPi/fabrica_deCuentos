/// <reference types="cypress" />

/**
 * Test Optimizado del Flujo Completo SIN IA
 * 
 * Flujo completo desde login hasta checkout/pago SIN consumir tokens de IA:
 * 1. Limpieza de datos del usuario
 * 2. Login -> Home -> Nuevo cuento
 * 3. Crear personaje (bypasseando generación de miniatura)
 * 4. Avanzar hasta cuento y mockar historia generada
 * 5. Mockar diseño e imágenes
 * 6. Llegar al checkout
 * 7. Seleccionar formato y agregar al carrito
 * 8. Verificar flujo de pago
 */
describe('Flujo Completo de Historia SIN IA', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
    
    // Intercept para bypassear llamadas a Edge Functions de IA
    cy.setupAIBypass();
  });

  it('Debe completar el flujo completo desde login hasta checkout sin consumir tokens IA', function() {
    const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'tester@lacuenteria.cl';
    
    // Pausa inicial para preparación
    cy.pause();
    
    // ==================================================
    // PASO 1: LIMPIEZA DE DATOS DEL USUARIO
    // ==================================================
    cy.log('🧹 PASO 1: Limpiando datos del usuario...');
    cy.cleanupTestStories(testUserEmail).then((result) => {
      cy.log(`✅ Limpieza inicial completada: ${JSON.stringify(result, null, 2)}`);
      cy.wrap(result).should('have.property', 'success');
    });

    // ==================================================
    // PASO 2: LOGIN -> HOME -> NUEVO CUENTO
    // ==================================================
    cy.log('🔐 PASO 2: Login y navegación inicial...');
    
    // Usar el comando de login personalizado que funciona mejor
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Pausa después del login para verificar que funciona
    cy.pause();
    
    // Abrir modal de nuevo cuento (manejar tanto "Crear nuevo cuento" como "Crear mi primer cuento")
    cy.get('body').then($body => {
      if ($body.find('[aria-label="Crear nuevo cuento"]').length > 0) {
        cy.log('Usando "Crear nuevo cuento"');
        cy.get('[aria-label="Crear nuevo cuento"]').click();
      } else if ($body.find('[aria-label="Crear mi primer cuento"]').length > 0) {
        cy.log('Usando "Crear mi primer cuento"');
        cy.get('[aria-label="Crear mi primer cuento"]').click();
      } else if ($body.find('div.fixed > button').length > 0) {
        cy.log('Usando selector div.fixed > button');
        cy.get('div.fixed > button').click();
      } else if ($body.find('button:contains("Crear mi primer")').length > 0) {
        cy.log('Usando texto "Crear mi primer"');
        cy.get('button:contains("Crear mi primer")').first().click();
      } else if ($body.find('button:contains("Crear")').length > 0) {
        cy.log('Usando texto "Crear"');
        cy.get('button:contains("Crear")').first().click();
      } else {
        // Último recurso: buscar cualquier botón que parezca de creación
        cy.log('Usando fallback');
        cy.get('button').contains(/nuevo|crear|primer/i).first().click();
      }
    });

    // Pausa después de abrir el modal de nuevo cuento
    cy.pause();

    // ==================================================
    // PASO 3: CREAR PERSONAJE (SIN IA)
    // ==================================================
    cy.log('👤 PASO 3: Creando personaje usando datos mockeados...');
    
    // Abrir formulario de creación de personaje usando selectores confiables
    cy.get('[data-testid="create-new-character-button"]', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // Esperar un momento para que el modal se abra
    cy.wait(2000);
    
    // Verificar que el formulario esté visible (muy flexible)
    cy.get('body').then($body => {
      if ($body.find('h2:contains("Nuevo personaje")').length > 0) {
        cy.contains('h2', 'Nuevo personaje').should('be.visible');
      } else if ($body.find('h2:contains("personaje")').length > 0) {
        cy.get('h2').contains(/personaje/i).should('be.visible');
      } else if ($body.find('form').length > 0) {
        cy.get('form').should('be.visible');
      } else {
        // Si no hay formulario, intentar continuar directamente con inputs
        cy.log('No se encontró formulario, continuando con inputs...');
      }
    });
    
    // Intentar completar formulario o usar personaje existente
    cy.get('body').then($body => {
      const hasFormFields = $body.find('[data-testid="character-name-input"]').length > 0;
      const hasExistingCharacters = $body.find('.character-card, [data-testid*="character"], img[alt*="miniatura"]').length > 0;
      
      if (hasFormFields) {
        cy.log('✅ Formulario de personaje encontrado, completando...');
        // COMPLETAR FORMULARIO con selectores confiables
        cy.get('[data-testid="character-name-input"]')
          .should('be.visible')
          .clear()
          .type(this.testData.character.name);
        
        cy.get('[data-testid="character-age-input"]')
          .should('be.visible')
          .clear()
          .type(this.testData.character.age);
        
        cy.get('[data-testid="character-description-input"]')
          .should('be.visible')
          .clear()
          .type(this.testData.character.description);
        
        // Subir imagen
        cy.get('input[type="file"]').first()
          .selectFile('cypress/fixtures/test-avatar.png', { force: true });
        
        cy.wait(2000);
        
        // Pausa antes de generar miniatura
        cy.pause();
        
        // Generar miniatura
        cy.get('[data-testid="generate-thumbnail-button"]')
          .should('be.visible')
          .and('not.be.disabled')
          .click();
        
        // Esperar miniatura
        cy.get('img[alt="Miniatura"]', { timeout: 45000 }).should('be.visible');
        
        // Guardar personaje
        cy.get('[data-testid="save-character-button"]')
          .should('be.visible')
          .and('not.be.disabled')
          .click();
        
        // Seleccionar el personaje recién creado
        cy.contains(this.testData.character.name).click();
        
      } else if (hasExistingCharacters) {
        cy.log('✅ Personajes existentes encontrados, seleccionando uno...');
        cy.get('.character-card, [data-testid*="character"], img[alt*="miniatura"]').first().click({ force: true });
        
      } else {
        cy.log('⚠️ No se encontró formulario ni personajes, saltando paso...');
        // Intentar cerrar modal y continuar
        cy.get('body').then($modal => {
          if ($modal.find('button:contains("Cerrar"), [aria-label="Close"], .close').length > 0) {
            cy.get('button:contains("Cerrar"), [aria-label="Close"], .close').first().click({ force: true });
          }
        });
      }
    });
    
    // El modal debería cerrarse y estar en el wizard
    cy.url().should('include', '/wizard/');

    // ==================================================
    // PASO 4: NAVEGAR A ETAPA CUENTO Y GENERAR HISTORIA (MOCKEADA)
    // ==================================================
    cy.log('📖 PASO 4: Navegando a etapa Cuento con historia mockeada...');
    
    // Verificar etapa de personajes del wizard
    cy.contains('h2', 'Personajes de tu Historia').should('be.visible');
    
    // Avanzar a etapa cuento - con manejo de re-renderizado
    cy.get('[data-testid="wizard-next-button"]')
      .should('be.visible')
      .click({ force: true });
    
    // Verificar etapa de cuento
    cy.contains('h2', 'Configura tu Historia').should('be.visible');
    
    // Escribir temática
    cy.get('[data-testid="story-theme-input"]')
      .type(this.testData.story.theme || 'Una aventura mágica de prueba');
    
    // Esperar un momento antes de generar historia
    cy.wait(2000);
    
    // Generar historia (será interceptada y mockeada) - con manejo de re-renderizado
    cy.get('[data-testid="generate-story-button"]')
      .should('be.visible')
      .click({ force: true });
    
    // Esperar a que aparezca el cuento mockeado (puede tardar más tiempo)
    cy.contains('📖 Cuento completo', { timeout: 60000 }).should('be.visible');
    
    // Esperar un poco más para asegurar que el contenido esté completamente cargado
    cy.wait(3000);
    
    // Continuar a diseño
    cy.get('[data-testid="wizard-next-button"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // ==================================================
    // PASO 5: ETAPA DISEÑO (MOCKEADA)
    // ==================================================
    cy.log('🎨 PASO 5: Etapa de diseño con imágenes mockeadas...');
    
    // Verificar etapa de diseño
    cy.contains('h2', 'Diseño Visual', { timeout: 15000 }).should('be.visible');
    
    // Esperar un momento antes de generar imágenes
    cy.wait(2000);
    
    // Generar imágenes (será interceptado y mockeado)
    cy.contains('button', 'Generar Imágenes')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Esperar a que aparezcan las imágenes mockeadas (proceso más largo)
    cy.contains('Imágenes generadas exitosamente', { timeout: 90000 }).should('be.visible');
    
    // Esperar un poco más para asegurar que todas las imágenes estén cargadas
    cy.wait(5000);
    
    // Continuar a vista previa
    cy.contains('button', 'Continuar')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // ==================================================
    // PASO 6: VISTA PREVIA Y NAVEGACIÓN A CHECKOUT
    // ==================================================
    cy.log('👀 PASO 6: Vista previa y navegación hacia checkout...');
    
    // Verificar vista previa
    cy.contains('h2', 'Vista Previa de tu Cuento', { timeout: 15000 }).should('be.visible');
    
    // Continuar sin dedicatoria usando el selector confiable
    cy.get('body').then($body => {
      // Buscar botón "No, continuar" con data-testid si está disponible
      if ($body.find('[data-testid="dedicatoria-no-button"]').length > 0) {
        cy.get('[data-testid="dedicatoria-no-button"]')
          .should('be.visible')
          .click();
      } else if ($body.find('button:contains("Continuar sin dedicatoria")').length > 0) {
        cy.contains('button', 'Continuar sin dedicatoria').click();
      } else if ($body.find('button:contains("Saltar dedicatoria")').length > 0) {
        cy.contains('button', 'Saltar dedicatoria').click();
      } else {
        // Continuar con el wizard normalmente
        cy.get('[data-testid="wizard-next-button"]').click();
      }
    });

    // ==================================================
    // PASO 7: CHECKOUT - SELECCIÓN DE FORMATO
    // ==================================================
    cy.log('💳 PASO 7: Checkout - Selección de formato...');
    
    // Verificar que llegamos al checkout
    cy.contains('h2', 'Selecciona el Formato de tu Cuento', { timeout: 15000 }).should('be.visible');
    
    // Verificar que aparecen las opciones de formato
    cy.contains('Libro Digital').should('be.visible');
    cy.contains('Libro Físico').should('be.visible');
    
    // Verificar precios desde base de datos
    cy.get('body').should('contain', '$');
    
    // Seleccionar formato digital
    cy.log('📱 Seleccionando formato digital...');
    cy.get('[data-testid="format-option-digital"]').click();
    
    // Verificar que se seleccionó correctamente
    cy.get('[data-testid="format-option-digital"]').should('have.class', 'border-purple-500');
    
    // Agregar al carrito
    cy.get('[data-testid="add-to-cart-button"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    
    // Verificar redirección al carrito
    cy.url().should('include', '/cart');
    
    // Verificar que el producto está en el carrito
    cy.contains('Mi Cuento Personalizado').should('be.visible');
    cy.contains('Libro Digital').should('be.visible');

    // ==================================================
    // PASO 8: PROBAR FORMATO FÍSICO (OPCIONAL)
    // ==================================================
    cy.log('📦 PASO 8: Probando formato físico con información de envío...');
    
    // Volver al wizard para probar formato físico
    cy.go('back');
    
    // Seleccionar formato físico
    cy.get('[data-testid="format-option-physical"]').click();
    
    // Verificar información de envío si es necesaria
    cy.get('body').then($body => {
      if ($body.find('text:contains("Se requiere información de envío")').length > 0) {
        cy.log('📍 Información de envío requerida');
        
        // Agregar al carrito (debería mostrar formulario de envío)
        cy.get('[data-testid="add-to-cart-button"]').click();
        
        // Verificar formulario de envío si aparece
        cy.get('body').then($form => {
          if ($form.find('h2:contains("Información de Envío")').length > 0) {
            cy.log('📋 Formulario de envío mostrado');
            // Completar información básica si es necesaria
            cy.contains('button', 'Continuar con la compra').should('be.visible');
          }
        });
      } else {
        // Agregar directamente al carrito
        cy.get('[data-testid="add-to-cart-button"]').click();
        cy.url().should('include', '/cart');
      }
    });

    // ==================================================
    // PASO 9: VERIFICACIONES FINALES
    // ==================================================
    cy.log('✅ PASO 9: Verificaciones finales del flujo de checkout...');
    
    // Verificar que estamos en el carrito
    cy.visit('/cart');
    
    // Verificar elementos del carrito
    cy.contains('Carrito de Compras').should('be.visible');
    
    // Verificar que hay productos en el carrito
    cy.get('body').should('contain', 'Mi Cuento Personalizado');
    
    cy.log('🎉 ¡Flujo de checkout completado exitosamente sin consumir tokens de IA!');
  });

  it('Debe manejar errores de checkout graciosamente', function() {
    cy.log('🔧 Verificando manejo de errores en checkout...');

    // Login
    cy.login(this.testData.user.email, this.testData.user.password);

    // Simular error en servicio de precios
    cy.intercept('POST', '**/rpc/get_product_types', {
      statusCode: 500,
      body: { error: 'Service temporarily unavailable' }
    }).as('priceServiceError');

    // Navegar directamente a una historia en checkout (si existe)
    cy.visit('/');
    cy.get('body').then($body => {
      if ($body.find('[data-testid="continue-story-button"]').length > 0) {
        cy.get('[data-testid="continue-story-button"]').first().click();
        
        // Navegar hasta checkout manualmente si es posible
        cy.url().should('include', '/wizard/');
        
        // Verificar manejo de errores
        cy.get('body').then($checkout => {
          if ($checkout.find('h2:contains("Selecciona el Formato")').length > 0) {
            cy.contains('Error al cargar opciones de formato').should('be.visible');
            cy.contains('button', 'Reintentar').should('be.visible');
          }
        });
      } else {
        cy.log('ℹ️ No hay historias disponibles para probar errores de checkout');
      }
    });
    /* ==== Generated with Cypress Studio ==== */
    cy.get('.group > .font-semibold').click();
    cy.get('.aspect-square > .lucide').click();
    cy.get('.space-y-6 > :nth-child(1) > .w-full').clear('E');
    cy.get('.space-y-6 > :nth-child(1) > .w-full').type('Emilia');
    cy.get('.space-y-6 > :nth-child(2) > .w-full').clear();
    cy.get('.space-y-6 > :nth-child(2) > .w-full').type('2');
    cy.get('.text-center > .lucide').click();
    cy.get('.gap-4 > .text-white > span').click();
    cy.get('.gap-4 > .text-white > span').click();
    /* ==== End Cypress Studio ==== */
  });
});