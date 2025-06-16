/// <reference types="cypress" />

describe('Wizard State Persistence Test', () => {
  
  before(() => {
    // Login usando comando existente
    cy.visit('/');
    cy.login('tester@lacuenteria.cl', 'test123');
  });

  it('🔍 ANÁLISIS COMPLETO: wizard_state persistence flow', () => {
    cy.log('=== INICIANDO ANÁLISIS DE WIZARD STATE ===');
    
    // PASO 1: Ir a la página de historias
    cy.visit('/stories');
    cy.wait(2000);
    
    // PASO 2: Analizar localStorage inicial
    cy.window().then((win) => {
      const allKeys = Object.keys(win.localStorage);
      const storyKeys = allKeys.filter(k => k.includes('story_draft'));
      
      cy.log('📦 PASO 1 - localStorage inicial:');
      cy.log(`   Total keys: ${allKeys.length}`);
      cy.log(`   Story draft keys: ${storyKeys.length}`);
      storyKeys.forEach(key => cy.log(`   - ${key}`));
      
      // Analizar cada story draft
      storyKeys.forEach(key => {
        const data = win.localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const storyId = key.replace('story_draft_', '').replace('_backup', '');
            cy.log(`📊 Historia ${storyId}:`);
            if (parsed.flow) {
              cy.log(`   Personajes: ${parsed.flow.personajes?.estado || 'undefined'} (${parsed.flow.personajes?.personajesAsignados || 0})`);
              cy.log(`   Cuento: ${parsed.flow.cuento || 'undefined'}`);
              cy.log(`   Diseño: ${parsed.flow.diseno || 'undefined'}`);
              cy.log(`   Vista Previa: ${parsed.flow.vistaPrevia || 'undefined'}`);
            }
          } catch (e) {
            cy.log(`   ❌ Error parsing data: ${e.message}`);
          }
        }
      });
    });
    
    // PASO 3: Buscar historias en la UI
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      cy.log('📋 PASO 2 - Contenido de la página:');
      cy.log(`   Contiene "Continuar": ${bodyText.includes('Continuar')}`);
      cy.log(`   Contiene "continuar": ${bodyText.includes('continuar')}`);
      cy.log(`   Contiene "Nueva": ${bodyText.includes('Nueva')}`);
      
      // Buscar cualquier link que vaya al wizard
      const wizardLinks = $body.find('a[href*="/wizard/"]');
      cy.log(`   Links al wizard encontrados: ${wizardLinks.length}`);
      
      if (wizardLinks.length > 0) {
        // Hay historias existentes - hacer click en la primera
        const firstLink = wizardLinks.first();
        const href = firstLink.attr('href');
        const storyId = href.split('/wizard/')[1];
        
        cy.log(`🎯 PASO 3 - Historia encontrada: ${storyId}`);
        
        // Analizar estado antes de navegar
        cy.window().then((win) => {
          const draftKey = `story_draft_${storyId}`;
          const draftData = win.localStorage.getItem(draftKey);
          
          if (draftData) {
            const parsed = JSON.parse(draftData);
            cy.log('📊 Estado ANTES de hacer click en continuar:');
            if (parsed.flow) {
              cy.log(`   Personajes: ${parsed.flow.personajes?.estado}`);
              cy.log(`   Cuento: ${parsed.flow.cuento}`);
              cy.log(`   Diseño: ${parsed.flow.diseno}`);
              cy.log(`   Vista Previa: ${parsed.flow.vistaPrevia}`);
              
              // Determinar etapa esperada
              let expectedStep = 'characters';
              if (parsed.flow.personajes?.estado === 'completado' && parsed.flow.cuento !== 'completado') {
                expectedStep = 'story';
              } else if (parsed.flow.cuento === 'completado' && parsed.flow.diseno !== 'completado') {
                expectedStep = 'design';
              } else if (parsed.flow.diseno === 'completado') {
                expectedStep = 'preview';
              }
              
              cy.log(`🎯 Etapa esperada: ${expectedStep}`);
              cy.wrap(expectedStep).as('expectedStep');
              cy.wrap(parsed.flow).as('initialFlow');
            }
          }
        });
        
        // Click en continuar
        cy.wrap(firstLink).click();
        
        // PASO 4: Verificar navegación correcta
        cy.url().should('include', `/wizard/${storyId}`);
        cy.wait(2000); // Esperar carga del wizard
        
        // Verificar que estamos en la etapa correcta
        cy.get('@expectedStep').then((expectedStep) => {
          cy.log(`🔍 PASO 4 - Verificando etapa actual vs esperada: ${expectedStep}`);
          
          // Verificar URL o contenido para confirmar etapa
          cy.url().then((url) => {
            cy.log(`   URL actual: ${url}`);
          });
          
          // Buscar indicadores de la etapa actual
          cy.get('body').then(($wizardBody) => {
            const content = $wizardBody.text();
            cy.log(`   Contiene "personajes": ${content.toLowerCase().includes('personajes')}`);
            cy.log(`   Contiene "historia": ${content.toLowerCase().includes('historia')}`);
            cy.log(`   Contiene "diseño": ${content.toLowerCase().includes('diseño')}`);
            cy.log(`   Contiene "vista previa": ${content.toLowerCase().includes('vista previa')}`);
          });
        });
        
        // PASO 5: Intentar avanzar una etapa
        cy.log('🔍 PASO 5 - Intentando avanzar etapa');
        
        // Buscar botón de siguiente
        cy.get('body').then(($wizardBody) => {
          const nextButtons = $wizardBody.find('button:contains("Siguiente"), button:contains("siguiente"), [data-testid*="next"]');
          
          if (nextButtons.length > 0) {
            const nextBtn = nextButtons.first();
            const isDisabled = nextBtn.is(':disabled') || nextBtn.hasClass('disabled');
            
            cy.log(`   Botón siguiente encontrado: ${nextButtons.length}`);
            cy.log(`   Está deshabilitado: ${isDisabled}`);
            
            if (!isDisabled) {
              // Capturar estado antes de avanzar
              cy.get('@initialFlow').then((initialFlow) => {
                cy.wrap(nextBtn).click();
                cy.wait(3000); // Esperar auto-save
                
                // PASO 6: Verificar cambio de estado
                cy.window().then((win) => {
                  const storyId = win.location.pathname.split('/wizard/')[1];
                  const updatedData = win.localStorage.getItem(`story_draft_${storyId}`);
                  
                  if (updatedData) {
                    const parsed = JSON.parse(updatedData);
                    cy.log('📊 Estado DESPUÉS de avanzar:');
                    if (parsed.flow) {
                      cy.log(`   Personajes: ${parsed.flow.personajes?.estado}`);
                      cy.log(`   Cuento: ${parsed.flow.cuento}`);
                      cy.log(`   Diseño: ${parsed.flow.diseno}`);
                      cy.log(`   Vista Previa: ${parsed.flow.vistaPrevia}`);
                      
                      // Comparar cambios
                      cy.log('🔄 CAMBIOS DETECTADOS:');
                      Object.keys(initialFlow).forEach(key => {
                        const oldVal = key === 'personajes' ? initialFlow[key]?.estado : initialFlow[key];
                        const newVal = key === 'personajes' ? parsed.flow[key]?.estado : parsed.flow[key];
                        if (oldVal !== newVal) {
                          cy.log(`   ${key}: ${oldVal} → ${newVal}`);
                        }
                      });
                    }
                  }
                });
              });
            } else {
              cy.log('   ❌ Botón deshabilitado - no se puede avanzar');
            }
          } else {
            cy.log('   ❌ No se encontró botón de siguiente');
          }
        });
        
        // PASO 7: Volver al home y verificar persistencia
        cy.log('🔍 PASO 6 - Verificando persistencia final');
        cy.visit('/stories');
        cy.wait(2000);
        
        // Re-analizar localStorage
        cy.window().then((win) => {
          const finalData = win.localStorage.getItem(`story_draft_${storyId}`);
          if (finalData) {
            const parsed = JSON.parse(finalData);
            cy.log('📊 Estado FINAL en localStorage:');
            if (parsed.flow) {
              cy.log(`   Personajes: ${parsed.flow.personajes?.estado}`);
              cy.log(`   Cuento: ${parsed.flow.cuento}`);
              cy.log(`   Diseño: ${parsed.flow.diseno}`);
              cy.log(`   Vista Previa: ${parsed.flow.vistaPrevia}`);
            }
          }
        });
        
        // Click en continuar nuevamente para verificar navegación
        cy.get(`a[href*="/wizard/${storyId}"]`).first().click();
        cy.url().should('include', `/wizard/${storyId}`);
        
        cy.log('✅ === ANÁLISIS COMPLETADO ===');
        
      } else {
        cy.log('❌ No se encontraron historias existentes');
        cy.log('ℹ️  Creando nueva historia para testing...');
        
        // Buscar botón de nueva historia
        cy.get('body').then(($body2) => {
          const newStoryButtons = $body2.find('button:contains("Nueva"), a:contains("Nueva"), [data-testid*="new"]');
          if (newStoryButtons.length > 0) {
            cy.wrap(newStoryButtons.first()).click();
            cy.url().should('include', '/wizard/');
            cy.log('✅ Nueva historia creada para testing');
          }
        });
      }
    });
  });
});