/// <reference types="cypress" />

describe('Prueba de Edge Function', function() {
  it('Debe limpiar historias de prueba correctamente', function() {
    // Obtener el email del usuario de prueba
    const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'tester@lacuenteria.cl';
    
    // Verificar que las variables de entorno estén configuradas
    cy.log('Verificando variables de entorno...');
    cy.wrap(Cypress.env('CLEANUP_API_KEY')).should('not.be.undefined');
    cy.wrap(Cypress.env('VITE_SUPABASE_URL')).should('not.be.undefined');
    
    // Ejecutar la limpieza usando la Edge Function
    cy.log(`Limpiando historias para: ${testUserEmail}`);
    cy.cleanupTestStories(testUserEmail, { useBackup: true }).then((result) => {
      // Mostrar información detallada del resultado
      cy.log(`Resultado de la limpieza: ${JSON.stringify(result, null, 2)}`);
      
      // Verificar que la respuesta tenga la estructura esperada
      cy.wrap(result).should('have.property', 'success');
      
      if (result.usingBackup) {
        cy.log('⚠️ Se utilizó el método de respaldo');
      } else {
        cy.log('✅ Se utilizó la Edge Function correctamente');
      }
    });
  });
});
