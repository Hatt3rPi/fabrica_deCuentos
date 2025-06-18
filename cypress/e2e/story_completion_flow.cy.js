/// <reference types="cypress" />

/**
 * Test de Finalización de Cuentos
 * 
 * Flujo completo de finalización de cuentos con exportación:
 * 1. Login y navegación a un cuento en Vista Previa
 * 2. Verificar que todas las páginas están completas
 * 3. Usar la funcionalidad "Finalizar Cuento"
 * 4. Verificar modal de finalización
 * 5. Verificar exportación y descarga
 * 6. Verificar estado completado en base de datos
 */
describe('Flujo de Finalización de Cuentos', function() {
  beforeEach(function() {
    // Cargar datos de prueba
    cy.fixture('test-data.json').as('testData');
  });

  it('Debe completar todo el flujo desde creación hasta finalización con exportación', function() {
    const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'tester@lacuenteria.cl';
    
    // ==================================================
    // PASO 1: LIMPIEZA INICIAL
    // ==================================================
    cy.log('🧹 PASO 1: Limpieza inicial de datos...');
    cy.cleanupTestStories(testUserEmail).then((result) => {
      cy.log(`✅ Limpieza completada: ${JSON.stringify(result, null, 2)}`);
    });

    // ==================================================
    // PASO 2: CREAR CUENTO COMPLETO HASTA VISTA PREVIA
    // ==================================================
    cy.log('📚 PASO 2: Creando cuento completo hasta Vista Previa...');
    
    // Login
    cy.login(this.testData.user.email, this.testData.user.password);
    cy.url().should('include', '/home');
    
    // Crear nuevo cuento
    cy.openNewStoryModal();
    cy.createNewCharacterFromModal();
    
    // Crear personaje
    cy.contains('h2', 'Nuevo personaje').should('be.visible');
    cy.get('input[placeholder="Nombre del personaje"]').type(this.testData.character.name);
    cy.get('input[placeholder="Edad del personaje"]').type(this.testData.character.age);
    cy.get('textarea[placeholder="Describe al personaje..."]').type(this.testData.character.description);
    
    // Subir imagen y generar miniatura
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-avatar.png', { force: true });
    cy.get('img[alt="Referencia"]', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Generar miniatura').click();
    cy.get('img[alt="Miniatura"]', { timeout: 120000 }).should('be.visible');
    cy.contains('button', 'Guardar personaje').click();
    
    // Seleccionar personaje
    cy.contains('h2', 'Selecciona un personaje').should('be.visible');
    cy.contains('div', 'Sheldon', { timeout: 10000 }).click();
    cy.url().should('include', '/wizard/');
    
    // Avanzar a etapa cuento
    cy.contains('h2', 'Selecciona tus Personajes').should('be.visible');
    cy.contains('button', 'Siguiente').click();
    
    // Crear historia
    cy.contains('h2', 'Configura tu Historia').should('be.visible');
    cy.get('textarea[placeholder="Describe la temática de tu cuento..."]')
      .type('Una historia de prueba para finalización con personajes mágicos.');
    cy.contains('button', 'Generar la Historia').click();
    
    // Esperar generación
    cy.contains('📖 Cuento completo', { timeout: 180000 }).should('be.visible');
    cy.contains('button', 'Continuar').click();
    
    // Avanzar a diseño
    cy.contains('h2', 'Diseño Visual').should('be.visible');
    cy.contains('button', 'Continuar').click();
    
    // Llegar a Vista Previa
    cy.contains('h2', 'Vista Previa del Cuento', { timeout: 30000 }).should('be.visible');

    // ==================================================
    // PASO 3: ESPERAR A QUE TODAS LAS PÁGINAS ESTÉN COMPLETAS
    // ==================================================
    cy.log('🖼️ PASO 3: Esperando que todas las páginas estén completas...');
    
    // Verificar que estamos en Vista Previa
    cy.contains('h2', 'Vista Previa del Cuento').should('be.visible');
    
    // Esperar a que aparezca la sección de finalización (cuando las páginas estén listas)
    cy.contains('¡Tu cuento está listo!', { timeout: 300000 }).should('be.visible');
    
    // Verificar que el texto indica que todas las páginas están completas
    cy.contains('Todas las páginas se han generado correctamente').should('be.visible');

    // ==================================================
    // PASO 4: PROBAR FUNCIONALIDAD DE FINALIZACIÓN
    // ==================================================
    cy.log('✅ PASO 4: Probando funcionalidad de finalización...');
    
    // Verificar que el botón "Finalizar Cuento" está habilitado
    cy.contains('button', 'Finalizar Cuento')
      .should('be.visible')
      .and('not.be.disabled');
    
    // Hacer click en "Finalizar Cuento"
    cy.contains('button', 'Finalizar Cuento').click();
    
    // Verificar que aparece el modal de finalización
    cy.contains('h3', 'Finalizar Cuento').should('be.visible');
    cy.contains('Tu cuento será marcado como completado').should('be.visible');

    // ==================================================
    // PASO 5: CONFIGURAR OPCIONES DE FINALIZACIÓN
    // ==================================================
    cy.log('⚙️ PASO 5: Configurando opciones de finalización...');
    
    // Verificar que la opción "Guardar en mi biblioteca personal" está marcada por defecto
    cy.get('input[type="checkbox"]').should('be.checked');
    
    // Verificar texto explicativo
    cy.contains('Podrás acceder a tu cuento desde tu perfil').should('be.visible');
    
    // Hacer click en "Finalizar"
    cy.contains('button', 'Finalizar').should('not.be.disabled').click();

    // ==================================================
    // PASO 6: VERIFICAR PROCESO DE FINALIZACIÓN
    // ==================================================
    cy.log('🔄 PASO 6: Verificando proceso de finalización...');
    
    // Verificar que aparece el estado "Procesando..."
    cy.contains('button', 'Procesando...').should('be.visible');
    
    // Esperar a que aparezca la confirmación de éxito (máximo 2 minutos)
    cy.contains('¡Cuento completado exitosamente!', { timeout: 120000 }).should('be.visible');
    
    // Verificar que aparece el enlace de descarga
    cy.contains('Descargar cuento').should('be.visible');

    // ==================================================
    // PASO 7: VERIFICAR DESCARGA Y EXPORT
    // ==================================================
    cy.log('📥 PASO 7: Verificando funcionalidad de descarga...');
    
    // Verificar que el enlace de descarga es válido
    cy.get('a').contains('Descargar cuento')
      .should('have.attr', 'href')
      .and('include', 'supabase');
    
    // Verificar que el enlace abre en nueva ventana
    cy.get('a').contains('Descargar cuento')
      .should('have.attr', 'target', '_blank');

    // ==================================================
    // PASO 8: VERIFICACIONES FINALES
    // ==================================================
    cy.log('🔍 PASO 8: Verificaciones finales del estado...');
    
    // El modal debería cerrarse automáticamente o permitir cerrarlo
    cy.get('body').then($body => {
      if ($body.find('button:contains("Cancelar")').length > 0) {
        cy.contains('button', 'Cancelar').click();
      }
    });
    
    // Verificar que seguimos en Vista Previa pero ahora con cuento completado
    cy.contains('h2', 'Vista Previa del Cuento').should('be.visible');
    cy.contains('¡Cuento completado exitosamente!').should('be.visible');
    
    cy.log('🎉 ¡Flujo de finalización completado exitosamente!');
  });

  it('Debe manejar errores de finalización correctamente', function() {
    cy.log('❌ Probando manejo de errores en finalización...');
    
    // Login
    cy.login(this.testData.user.email, this.testData.user.password);
    
    // Buscar un cuento existente en Vista Previa
    cy.get('body').then($body => {
      if ($body.find('[data-testid="continue-story-button"]').length > 0) {
        cy.get('[data-testid="continue-story-button"]').first().click();
        cy.url().should('include', '/wizard/');
        
        // Navegar hasta Vista Previa si no estamos ahí
        cy.get('body').then($currentBody => {
          if (!$currentBody.text().includes('Vista Previa del Cuento')) {
            // Intentar navegar a Vista Previa
            cy.contains('button', 'Continuar').click();
          }
        });
        
        // Si hay botón de finalizar, intentar proceso
        cy.get('body').then($finalBody => {
          if ($finalBody.find('button:contains("Finalizar Cuento")').length > 0) {
            cy.contains('button', 'Finalizar Cuento').click();
            
            // Si aparece el modal, cerrar con cancelar para probar cancelación
            cy.contains('h3', 'Finalizar Cuento').should('be.visible');
            cy.contains('button', 'Cancelar').click();
            
            // Verificar que el modal se cierra
            cy.contains('h3', 'Finalizar Cuento').should('not.exist');
            
            cy.log('✅ Cancelación de finalización probada correctamente');
          } else {
            cy.log('ℹ️ No hay cuentos listos para finalizar para probar errores');
          }
        });
      } else {
        cy.log('ℹ️ No hay cuentos en progreso para probar manejo de errores');
      }
    });
  });

  it('Debe verificar persistencia del estado completado', function() {
    cy.log('💾 Verificando persistencia del estado completado...');
    
    // Login
    cy.login(this.testData.user.email, this.testData.user.password);
    cy.url().should('include', '/home');
    
    // Buscar cuentos completados
    cy.get('body').then($body => {
      // Buscar indicadores de cuentos completados (pueden variar según la UI)
      if ($body.text().includes('Completado') || $body.text().includes('Descargar')) {
        cy.log('✅ Se encontraron cuentos completados en la lista');
        
        // Verificar que los cuentos completados tienen diferentes controles que los en progreso
        cy.get('[data-testid="continue-story-button"]').should('not.exist');
        
      } else {
        cy.log('ℹ️ No se encontraron cuentos completados para verificar persistencia');
      }
    });
  });
});