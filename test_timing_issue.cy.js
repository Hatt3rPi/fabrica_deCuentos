/// <reference types="cypress" />

describe('🔍 TEST TIMING: Wizard State Reset Issue', () => {
  
  const targetStoryId = '58313f6e-7a66-4d46-a205-278afe6d17e7';
  
  it('Verificar timing de resetEstado vs persistStory', () => {
    console.log('='.repeat(60));
    console.log('🔍 TESTING WIZARD STATE RESET TIMING ISSUE');
    console.log('='.repeat(60));
    
    // STEP 1: Login and go to wizard
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(2000);
    
    // STEP 2: Capture initial wizard state
    cy.window().then((win) => {
      console.log('\n📊 STEP 1 - ESTADO INICIAL DEL WIZARD:');
      
      const draftData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log('  📋 localStorage wizard_state:');
        console.log(`    Personajes: ${parsed.flow?.personajes?.estado} (${parsed.flow?.personajes?.personajesAsignados || 0} asignados)`);
      }
    });
    
    // STEP 3: Go to characters step if not already there
    cy.get('body').then(($body) => {
      const hasAddButton = $body.find('button:contains("Añadir personaje"), button:contains("Crear nuevo")').length > 0;
      if (!hasAddButton) {
        // Try to navigate to characters step
        cy.visit(`/wizard/${targetStoryId}`);
        cy.wait(1000);
      }
    });
    
    // STEP 4: Add a character and monitor the sequence
    cy.get('body').then(($body) => {
      console.log('\n🔍 STEP 2 - AÑADIR PERSONAJE Y MONITOREAR SECUENCIA:');
      
      // Look for add character button
      const addButtons = $body.find('button:contains("Añadir personaje"), [aria-label*="Añadir"], [aria-label*="Crear nuevo"]');
      console.log(`  Botones de añadir encontrados: ${addButtons.length}`);
      
      if (addButtons.length > 0) {
        cy.wrap(addButtons.first()).click();
        cy.wait(500);
        
        // Look for existing characters in modal
        cy.get('body').then(($modalBody) => {
          const characterCards = $modalBody.find('[data-testid*="character"], .character-card, .aspect-square').not(':contains("Crear nuevo")');
          console.log(`  Personajes disponibles en modal: ${characterCards.length}`);
          
          if (characterCards.length > 0) {
            console.log('  🔄 Asignando primer personaje disponible...');
            
            // Capture state BEFORE assignment
            cy.window().then((win) => {
              const beforeData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
              const beforeFlow = beforeData ? JSON.parse(beforeData).flow : null;
              console.log('  📊 Estado ANTES de asignar:');
              console.log(`    Personajes: ${beforeFlow?.personajes?.estado} (${beforeFlow?.personajes?.personajesAsignados || 0})`);
              
              // Click on first character
              cy.wrap(characterCards.first()).click();
              
              // Wait and capture immediately after assignment
              cy.wait(100);
              cy.window().then((win2) => {
                const afterData = win2.localStorage.getItem(`story_draft_${targetStoryId}`);
                const afterFlow = afterData ? JSON.parse(afterData).flow : null;
                console.log('  📊 Estado INMEDIATAMENTE después de asignar:');
                console.log(`    Personajes: ${afterFlow?.personajes?.estado} (${afterFlow?.personajes?.personajesAsignados || 0})`);
                
                // Wait for auto-save delay and check again
                cy.wait(1500); // More than auto-save delay
                cy.window().then((win3) => {
                  const finalData = win3.localStorage.getItem(`story_draft_${targetStoryId}`);
                  const finalFlow = finalData ? JSON.parse(finalData).flow : null;
                  console.log('  📊 Estado DESPUÉS de auto-save delay:');
                  console.log(`    Personajes: ${finalFlow?.personajes?.estado} (${finalFlow?.personajes?.personajesAsignados || 0})`);
                });
              });
            });
            
          } else {
            console.log('  ❌ No hay personajes disponibles para asignar');
          }
        });
        
      } else {
        console.log('  ❌ No se encontró botón de añadir personaje');
      }
    });
    
    // STEP 5: Navigate away and check for reset
    cy.wait(3000); // Wait for all async operations
    console.log('\n🔍 STEP 3 - NAVEGACIÓN FUERA DEL WIZARD:');
    
    cy.window().then((win) => {
      const beforeNavData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      const beforeNavFlow = beforeNavData ? JSON.parse(beforeNavData).flow : null;
      console.log('  📊 Estado ANTES de navegar fuera del wizard:');
      console.log(`    Personajes: ${beforeNavFlow?.personajes?.estado} (${beforeNavFlow?.personajes?.personajesAsignados || 0})`);
    });
    
    // Navigate to stories page (this should trigger WizardContext unmount)
    cy.visit('/stories');
    cy.wait(1000);
    
    cy.window().then((win) => {
      const afterNavData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      const afterNavFlow = afterNavData ? JSON.parse(afterNavData).flow : null;
      console.log('  📊 Estado DESPUÉS de navegar fuera del wizard:');
      console.log(`    Personajes: ${afterNavFlow?.personajes?.estado} (${afterNavFlow?.personajes?.personajesAsignados || 0})`);
    });
    
    // STEP 6: Go back to wizard and check final state
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(2000);
    
    cy.window().then((win) => {
      const finalData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      const finalFlow = finalData ? JSON.parse(finalData).flow : null;
      console.log('\n📊 STEP 4 - ESTADO FINAL DESPUÉS DE VOLVER AL WIZARD:');
      console.log(`    Personajes: ${finalFlow?.personajes?.estado} (${finalFlow?.personajes?.personajesAsignados || 0})`);
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ TIMING TEST COMPLETADO');
      console.log('🔍 Revisar logs para identificar cuándo se resetea el estado');
      console.log('='.repeat(60));
    });
  });
});