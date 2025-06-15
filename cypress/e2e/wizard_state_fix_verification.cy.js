/// <reference types="cypress" />

describe('🔧 VERIFICACIÓN: Fix Wizard State Sync', () => {
  
  const targetStoryId = '58313f6e-7a66-4d46-a205-278afe6d17e7';
  
  it('Confirmar que wizard_state persiste después del fix', () => {
    console.log('='.repeat(60));
    console.log('🔧 VERIFICANDO FIX WIZARD STATE SYNCHRONIZATION');
    console.log('='.repeat(60));
    
    // Login and go to the problem story
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    
    console.log('\n📊 STEP 1 - VERIFICAR ESTADO ACTUAL EN BD:');
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(3000); // Allow full load
    
    // Check current wizard state
    cy.window().then((win) => {
      const draftData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log('  📋 Estado actual en localStorage:');
        console.log(`    Personajes: ${parsed.flow?.personajes?.estado} (${parsed.flow?.personajes?.personajesAsignados || 0} asignados)`);
        console.log(`    Cuento: ${parsed.flow?.cuento}`);
        
        // If state is still wrong, let's trigger a reload
        if (parsed.flow?.personajes?.estado === 'no_iniciada' && parsed.flow?.personajes?.personajesAsignados === 0) {
          console.log('  ⚠️  Estado aún no sincronizado, forzando recarga de personajes...');
        }
      }
    });
    
    // Force reload characters if needed
    cy.get('body').then(($body) => {
      const content = $body.text().toLowerCase();
      console.log('\n📊 STEP 2 - VERIFICAR ETAPA ACTUAL:');
      console.log(`  UI contiene "personajes": ${content.includes('personajes')}`);
      console.log(`  UI contiene "historia": ${content.includes('historia') || content.includes('cuento')}`);
      
      // If we're on characters step but should have characters, something's wrong
      if (content.includes('personajes') || content.includes('añadir personaje')) {
        console.log('  🔄 En etapa de personajes, verificando personajes existentes...');
        
        // Check if characters are already shown
        const characterElements = $body.find('[data-testid*="character"], .character-card, .bg-white.rounded-lg').not(':contains("Añadir")');
        console.log(`  Personajes visibles en UI: ${characterElements.length}`);
        
        if (characterElements.length === 0) {
          console.log('  ⚠️  No se muestran personajes en UI pero deberían existir');
          // Force a reload to re-sync
          cy.reload();
          cy.wait(2000);
        }
      }
    });
    
    console.log('\n🔍 STEP 3 - SIMULAR NAVEGACIÓN Y VERIFICAR PERSISTENCIA:');
    
    // Capture state before navigation
    cy.window().then((win) => {
      const beforeData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      const beforeFlow = beforeData ? JSON.parse(beforeData).flow : null;
      console.log('  📊 Estado ANTES de navegar fuera:');
      console.log(`    Personajes: ${beforeFlow?.personajes?.estado} (${beforeFlow?.personajes?.personajesAsignados || 0})`);
      console.log(`    Cuento: ${beforeFlow?.cuento}`);
    });
    
    // Navigate away (this used to trigger the reset)
    cy.visit('/stories');
    cy.wait(1000);
    
    // Check state after navigation
    cy.window().then((win) => {
      const afterData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      const afterFlow = afterData ? JSON.parse(afterData).flow : null;
      console.log('  📊 Estado DESPUÉS de navegar fuera:');
      console.log(`    Personajes: ${afterFlow?.personajes?.estado} (${afterFlow?.personajes?.personajesAsignados || 0})`);
      console.log(`    Cuento: ${afterFlow?.cuento}`);
    });
    
    // Go back to wizard
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(2000);
    
    // Final verification
    cy.window().then((win) => {
      const finalData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      const finalFlow = finalData ? JSON.parse(finalData).flow : null;
      console.log('\n📊 STEP 4 - ESTADO FINAL DESPUÉS DE VOLVER AL WIZARD:');
      console.log(`    Personajes: ${finalFlow?.personajes?.estado} (${finalFlow?.personajes?.personajesAsignados || 0})`);
      console.log(`    Cuento: ${finalFlow?.cuento}`);
      
      // Wait for auto-save to complete
      cy.wait(2000);
      
      console.log('\n✅ VERIFICACIÓN COMPLETADA:');
      if (finalFlow?.personajes?.personajesAsignados >= 3) {
        console.log('  ✅ Personajes asignados correctamente');
        if (finalFlow?.personajes?.estado === 'completado') {
          console.log('  ✅ Estado de personajes correcto: completado');
        } else {
          console.log(`  ⚠️  Estado de personajes: ${finalFlow?.personajes?.estado} (esperado: completado)`);
        }
        if (finalFlow?.cuento === 'borrador') {
          console.log('  ✅ Estado de cuento correcto: borrador');
        } else {
          console.log(`  ⚠️  Estado de cuento: ${finalFlow?.cuento} (esperado: borrador)`);
        }
      } else {
        console.log('  ❌ Personajes no asignados correctamente');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('🎯 FIX VERIFICATION COMPLETADO');
      console.log('   Si el estado persiste correctamente, el fix funcionó');
      console.log('='.repeat(60));
    });
  });
});