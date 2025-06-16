/// <reference types="cypress" />

describe('🔍 TEST FINAL: Wizard State Persistence', () => {
  
  const targetStoryId = '58313f6e-7a66-4d46-a205-278afe6d17e7';
  
  it('Prueba completa de persistencia wizard_state', () => {
    console.log('='.repeat(60));
    console.log('🔍 INICIANDO ANÁLISIS DE WIZARD STATE PERSISTENCE');
    console.log('='.repeat(60));
    
    // PASO 1: Login
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    console.log('✅ Login exitoso');
    
    // PASO 2: Ir a stories y analizar localStorage inicial
    cy.visit('/stories');
    cy.wait(1000);
    
    cy.window().then((win) => {
      console.log('\n📦 PASO 1 - ANÁLISIS INICIAL DE localStorage:');
      const allKeys = Object.keys(win.localStorage);
      const storyKeys = allKeys.filter(k => k.includes('story_draft'));
      
      console.log(`  Total localStorage keys: ${allKeys.length}`);
      console.log(`  Story draft keys: ${storyKeys.length}`);
      storyKeys.forEach(key => console.log(`    - ${key}`));
      
      // Analizar el cuento objetivo específicamente
      const targetKey = `story_draft_${targetStoryId}`;
      const targetData = win.localStorage.getItem(targetKey);
      
      console.log(`\n🎯 CUENTO OBJETIVO (${targetStoryId}):`);
      console.log(`  Existe en localStorage: ${!!targetData}`);
      
      if (targetData) {
        try {
          const parsed = JSON.parse(targetData);
          console.log('  📊 Estado actual:');
          if (parsed.flow) {
            console.log(`    Personajes: ${parsed.flow.personajes?.estado} (${parsed.flow.personajes?.personajesAsignados || 0} asignados)`);
            console.log(`    Cuento: ${parsed.flow.cuento}`);
            console.log(`    Diseño: ${parsed.flow.diseno}`);
            console.log(`    Vista Previa: ${parsed.flow.vistaPrevia}`);
          }
        } catch (e) {
          console.log(`  ❌ Error parsing: ${e.message}`);
        }
      }
    });
    
    // PASO 3: Click en "Continuar" del primer cuento (arriba izquierda)
    console.log('\n🔍 PASO 2 - CLICK EN "CONTINUAR" DEL PRIMER CUENTO:');
    console.log(`  Buscando cuento ID: ${targetStoryId}`);
    console.log('  Posición esperada: Primer cuento (arriba a la izquierda)');
    
    cy.get('body').then(($body) => {
      // Buscar específicamente el primer link de continuar
      const allWizardLinks = $body.find('a[href*="/wizard/"]');
      console.log(`  Total links al wizard encontrados: ${allWizardLinks.length}`);
      
      if (allWizardLinks.length > 0) {
        const firstLink = allWizardLinks.first();
        const href = firstLink.attr('href');
        const actualStoryId = href.split('/wizard/')[1];
        
        console.log(`  Primer cuento encontrado: ${actualStoryId}`);
        console.log(`  ¿Coincide con objetivo?: ${actualStoryId === targetStoryId}`);
        
        if (actualStoryId === targetStoryId) {
          cy.wrap(firstLink).click();
          console.log('  ✅ Click en continuar del primer cuento ejecutado');
        } else {
          console.log(`  ⚠️  El primer cuento no coincide. Navegando directamente al objetivo.`);
          cy.visit(`/wizard/${targetStoryId}`);
        }
      } else {
        console.log('  ❌ No se encontraron links al wizard. Navegando directamente.');
        cy.visit(`/wizard/${targetStoryId}`);
      }
    });
    
    // PASO 4: Verificar que navega a la etapa correcta
    cy.url().should('include', `/wizard/${targetStoryId}`);
    cy.wait(2000); // Esperar carga completa
    
    cy.window().then((win) => {
      console.log('\n📊 PASO 3 - VERIFICACIÓN DE ETAPA ACTUAL:');
      console.log(`  URL actual: ${win.location.pathname}`);
      
      // Analizar estado después de cargar
      const draftData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log('  📋 Estado después de cargar wizard:');
        if (parsed.flow) {
          console.log(`    Personajes: ${parsed.flow.personajes?.estado}`);
          console.log(`    Cuento: ${parsed.flow.cuento}`);
          console.log(`    Diseño: ${parsed.flow.diseno}`);
          console.log(`    Vista Previa: ${parsed.flow.vistaPrevia}`);
          
          // Determinar etapa esperada
          let expectedStep = 'characters';
          if (parsed.flow.personajes?.estado === 'completado' && parsed.flow.cuento !== 'completado') {
            expectedStep = 'story';
          } else if (parsed.flow.cuento === 'completado' && parsed.flow.diseno !== 'completado') {
            expectedStep = 'design';
          } else if (parsed.flow.diseno === 'completado') {
            expectedStep = 'preview';
          }
          
          console.log(`  🎯 Etapa esperada según wizard_state: ${expectedStep}`);
        }
      }
      
      // Verificar indicadores visuales de la etapa actual
      cy.get('body').then(($wizardBody) => {
        const content = $wizardBody.text().toLowerCase();
        console.log('  👁️  Indicadores visuales en la UI:');
        console.log(`    Contiene "personajes": ${content.includes('personajes')}`);
        console.log(`    Contiene "historia/cuento": ${content.includes('historia') || content.includes('cuento')}`);
        console.log(`    Contiene "diseño": ${content.includes('diseño')}`);
        console.log(`    Contiene "vista previa": ${content.includes('vista previa')}`);
        console.log(`    Contiene "exportar": ${content.includes('exportar')}`);
      });
    });
    
    // PASO 5: Intentar avanzar a la siguiente etapa
    console.log('\n🔍 PASO 4 - INTENTANDO AVANZAR ETAPA:');
    
    cy.get('body').then(($wizardBody) => {
      const nextButtons = $wizardBody.find('button:contains("Siguiente"), button:contains("siguiente")');
      console.log(`  Botones "Siguiente" encontrados: ${nextButtons.length}`);
      
      if (nextButtons.length > 0) {
        const btn = nextButtons.first();
        const isDisabled = btn.is(':disabled') || btn.hasClass('disabled');
        console.log(`  Botón está deshabilitado: ${isDisabled}`);
        
        if (!isDisabled) {
          console.log('  🔄 Ejecutando click en "Siguiente"...');
          
          // Capturar estado ANTES de avanzar
          cy.window().then((win) => {
            const beforeData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
            const beforeFlow = beforeData ? JSON.parse(beforeData).flow : null;
            
            console.log('  📊 Estado ANTES de avanzar:', JSON.stringify(beforeFlow, null, 2));
            
            // CLICK EN SIGUIENTE
            cy.wrap(btn).click();
            cy.wait(3000); // Esperar auto-save
            
            // Verificar cambios DESPUÉS de avanzar
            cy.window().then((win2) => {
              const afterData = win2.localStorage.getItem(`story_draft_${targetStoryId}`);
              const afterFlow = afterData ? JSON.parse(afterData).flow : null;
              
              console.log('\n  📊 Estado DESPUÉS de avanzar:', JSON.stringify(afterFlow, null, 2));
              
              // Detectar cambios específicos
              if (beforeFlow && afterFlow) {
                console.log('\n  🔄 CAMBIOS DETECTADOS:');
                let hasChanges = false;
                
                Object.keys(beforeFlow).forEach(key => {
                  const oldVal = key === 'personajes' ? beforeFlow[key]?.estado : beforeFlow[key];
                  const newVal = key === 'personajes' ? afterFlow[key]?.estado : afterFlow[key];
                  
                  if (oldVal !== newVal) {
                    console.log(`    ✅ ${key}: ${oldVal} → ${newVal}`);
                    hasChanges = true;
                  }
                });
                
                if (!hasChanges) {
                  console.log('    ⚠️  No se detectaron cambios en el estado');
                }
              }
            });
          });
        } else {
          console.log('  ❌ Botón deshabilitado - no se puede avanzar en esta etapa');
        }
      } else {
        console.log('  ❌ No se encontró botón "Siguiente"');
      }
    });
    
    // PASO 6: Volver al home y verificar persistencia
    cy.wait(2000);
    console.log('\n🔍 PASO 5 - VERIFICANDO PERSISTENCIA (VOLVER AL HOME):');
    
    cy.visit('/stories');
    cy.wait(1000);
    
    cy.window().then((win) => {
      const finalData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (finalData) {
        const parsed = JSON.parse(finalData);
        console.log('  📊 Estado FINAL en localStorage:');
        if (parsed.flow) {
          console.log(`    Personajes: ${parsed.flow.personajes?.estado}`);
          console.log(`    Cuento: ${parsed.flow.cuento}`);
          console.log(`    Diseño: ${parsed.flow.diseno}`);
          console.log(`    Vista Previa: ${parsed.flow.vistaPrevia}`);
        }
      }
    });
    
    // PASO 7: Click en "Continuar" nuevamente para verificar navegación correcta
    console.log('\n🔍 PASO 6 - VERIFICACIÓN FINAL (SEGUNDO CLICK EN CONTINUAR):');
    
    cy.get('body').then(($body) => {
      const finalContinueLink = $body.find(`a[href*="/wizard/${targetStoryId}"]`);
      if (finalContinueLink.length > 0) {
        cy.wrap(finalContinueLink.first()).click();
        cy.url().should('include', `/wizard/${targetStoryId}`);
        
        cy.url().then((finalUrl) => {
          console.log(`  📍 URL final después del segundo continuar: ${finalUrl}`);
          
          // Verificar que la etapa sigue siendo correcta
          cy.get('body').then(($finalBody) => {
            const content = $finalBody.text().toLowerCase();
            console.log('  👁️  Etapa final verificada:');
            console.log(`    Contiene "personajes": ${content.includes('personajes')}`);
            console.log(`    Contiene "historia/cuento": ${content.includes('historia') || content.includes('cuento')}`);
            console.log(`    Contiene "diseño": ${content.includes('diseño')}`);
            console.log(`    Contiene "vista previa": ${content.includes('vista previa')}`);
          });
          
          console.log('\n' + '='.repeat(60));
          console.log('✅ ANÁLISIS COMPLETADO CON ÉXITO');
          console.log('🔍 Revisar logs para verificar:');
          console.log('  1. Estado inicial del wizard_state');
          console.log('  2. Navegación a etapa más avanzada');
          console.log('  3. Transición de estado al avanzar');
          console.log('  4. Persistencia después de volver al home');
          console.log('  5. Navegación correcta en segundo continuar');
          console.log('='.repeat(60));
        });
      }
    });
  });
});