/// <reference types="cypress" />

describe('Debug: Wizard State Analysis', () => {
  
  it('📊 Análisis detallado del wizard_state', () => {
    // Login con cuenta específica
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    
    // Ir a stories
    cy.visit('/stories');
    cy.wait(1000);
    
    const targetStoryId = 'f7fb775d-42ce-4077-906c-8bdbac5f6a9a';
    
    // ANÁLISIS 1: Estado inicial
    cy.window().then((win) => {
      const storyKeys = Object.keys(win.localStorage).filter(k => k.includes('story_draft'));
      console.log('=== ANÁLISIS INICIAL ===');
      console.log('Story keys encontrados:', storyKeys);
      
      storyKeys.forEach(key => {
        const data = win.localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const storyId = key.replace('story_draft_', '').replace('_backup', '');
            console.log(`\n📖 HISTORIA ${storyId}:`);
            if (parsed.flow) {
              console.log(`  Personajes: ${parsed.flow.personajes?.estado} (${parsed.flow.personajes?.personajesAsignados || 0} asignados)`);
              console.log(`  Cuento: ${parsed.flow.cuento}`);
              console.log(`  Diseño: ${parsed.flow.diseno}`);
              console.log(`  Vista Previa: ${parsed.flow.vistaPrevia}`);
            }
          } catch (e) {
            console.log(`  Error: ${e.message}`);
          }
        }
      });
    });
    
    // ANÁLISIS 2: Buscar historia específica
    console.log(`\n=== BUSCANDO HISTORIA ESPECÍFICA ===`);
    console.log(`ID objetivo: ${targetStoryId}`);
    
    // Verificar si existe en localStorage
    cy.window().then((win) => {
      const targetKey = `story_draft_${targetStoryId}`;
      const targetData = win.localStorage.getItem(targetKey);
      
      console.log(`Existe en localStorage: ${!!targetData}`);
      
      if (targetData) {
        const parsed = JSON.parse(targetData);
        console.log(`Estado del cuento objetivo:`, JSON.stringify(parsed.flow, null, 2));
      }
    });
    
    // NAVEGACIÓN DIRECTA al cuento específico
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(2000);
        
    // ANÁLISIS 3: Estado al cargar el wizard
    cy.window().then((win) => {
      const draftData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log(`\n=== ESTADO AL CARGAR WIZARD ===`);
        console.log('Flow completo:', JSON.stringify(parsed.flow, null, 2));
        
        // Determinar etapa esperada según el estado
        let expectedStep = 'characters';
        if (parsed.flow) {
          if (parsed.flow.personajes?.estado === 'completado' && parsed.flow.cuento !== 'completado') {
            expectedStep = 'story';
          } else if (parsed.flow.cuento === 'completado' && parsed.flow.diseno !== 'completado') {
            expectedStep = 'design';
          } else if (parsed.flow.diseno === 'completado') {
            expectedStep = 'preview';
          }
        }
        console.log(`🎯 Etapa esperada según wizard_state: ${expectedStep}`);
      }
    });
        
        // ANÁLISIS 3: Verificar etapa actual
        cy.url().then((url) => {
          console.log(`\n=== DESPUÉS DE CONTINUAR ===`);
          console.log(`URL actual: ${url}`);
        });
        
        // Buscar indicadores visuales de la etapa
        cy.get('body').then(($wizardBody) => {
          const content = $wizardBody.text().toLowerCase();
          console.log(`\nIndicadores de etapa:`);
          console.log(`  Contiene "personajes": ${content.includes('personajes')}`);
          console.log(`  Contiene "historia": ${content.includes('historia')}`);
          console.log(`  Contiene "cuento": ${content.includes('cuento')}`);
          console.log(`  Contiene "diseño": ${content.includes('diseño')}`);
          console.log(`  Contiene "vista previa": ${content.includes('vista previa')}`);
          console.log(`  Contiene "exportar": ${content.includes('exportar')}`);
        });
        
        // INTENTAR AVANZAR
        cy.get('body').then(($wizardBody) => {
          const nextBtns = $wizardBody.find('button:contains("Siguiente"), button:contains("siguiente")');
          console.log(`\n=== BOTÓN SIGUIENTE ===`);
          console.log(`Botones encontrados: ${nextBtns.length}`);
          
          if (nextBtns.length > 0) {
            const btn = nextBtns.first();
            const isDisabled = btn.is(':disabled') || btn.hasClass('disabled');
            console.log(`Está deshabilitado: ${isDisabled}`);
            
            if (!isDisabled) {
              console.log('🔄 Haciendo click en siguiente...');
              
              // Capturar estado antes
              cy.window().then((win) => {
                const beforeData = win.localStorage.getItem(`story_draft_${storyId}`);
                const beforeFlow = beforeData ? JSON.parse(beforeData).flow : null;
                
                cy.wrap(btn).click();
                cy.wait(3000); // Esperar auto-save
                
                // Verificar cambios
                cy.window().then((win2) => {
                  const afterData = win2.localStorage.getItem(`story_draft_${storyId}`);
                  const afterFlow = afterData ? JSON.parse(afterData).flow : null;
                  
                  console.log(`\n=== CAMBIOS DESPUÉS DE AVANZAR ===`);
                  console.log('Antes:', JSON.stringify(beforeFlow, null, 2));
                  console.log('Después:', JSON.stringify(afterFlow, null, 2));
                  
                  if (beforeFlow && afterFlow) {
                    Object.keys(beforeFlow).forEach(key => {
                      const oldVal = key === 'personajes' ? beforeFlow[key]?.estado : beforeFlow[key];
                      const newVal = key === 'personajes' ? afterFlow[key]?.estado : afterFlow[key];
                      if (oldVal !== newVal) {
                        console.log(`🔄 CAMBIO: ${key}: ${oldVal} → ${newVal}`);
                      }
                    });
                  }
                });
              });
            }
          }
        });
        
        // VOLVER AL HOME Y VERIFICAR
        cy.wait(2000);
        cy.visit('/stories');
        cy.wait(1000);
        
        cy.window().then((win) => {
          const finalData = win.localStorage.getItem(`story_draft_${storyId}`);
          if (finalData) {
            const parsed = JSON.parse(finalData);
            console.log(`\n=== ESTADO FINAL ===`);
            console.log('Flow final:', JSON.stringify(parsed.flow, null, 2));
          }
        });
        
        // CLICK FINAL EN CONTINUAR
        cy.get(`a[href*="/wizard/${storyId}"]`).first().click();
        cy.url().should('include', `/wizard/${storyId}`);
        
        cy.url().then((finalUrl) => {
          console.log(`\n=== VERIFICACIÓN FINAL ===`);
          console.log(`URL después de segundo continuar: ${finalUrl}`);
          console.log('✅ ANÁLISIS COMPLETADO');
        });
        
      } else {
        console.log('❌ No hay historias existentes');
      }
    });
  });
});