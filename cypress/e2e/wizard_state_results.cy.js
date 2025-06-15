/// <reference types="cypress" />

describe('📊 RESULTADOS: Wizard State Test', () => {
  
  const targetStoryId = 'f7fb775d-42ce-4077-906c-8bdbac5f6a9a';
  let testResults = {};
  
  it('Capturar resultados del test de wizard_state', () => {
    // Login
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    
    // Ir a stories
    cy.visit('/stories');
    cy.wait(1000);
    
    // RESULTADO 1: Estado inicial
    cy.window().then((win) => {
      const targetData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (targetData) {
        const parsed = JSON.parse(targetData);
        testResults.estadoInicial = parsed.flow;
        
        cy.writeFile('cypress/results/wizard_state_inicial.json', {
          storyId: targetStoryId,
          timestamp: new Date().toISOString(),
          estadoInicial: parsed.flow
        });
      }
    });
    
    // RESULTADO 2: Navegación al wizard
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(2000);
    
    cy.url().then((url) => {
      testResults.urlDespuesDeNavegar = url;
    });
    
    cy.window().then((win) => {
      const targetData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (targetData) {
        const parsed = JSON.parse(targetData);
        testResults.estadoDespuesDeNavegar = parsed.flow;
      }
    });
    
    // RESULTADO 3: Verificar indicadores visuales
    cy.get('body').then(($body) => {
      const content = $body.text().toLowerCase();
      testResults.indicadoresVisuales = {
        contiene_personajes: content.includes('personajes'),
        contiene_historia: content.includes('historia') || content.includes('cuento'),
        contiene_diseño: content.includes('diseño'),
        contiene_vista_previa: content.includes('vista previa'),
        contiene_exportar: content.includes('exportar')
      };
    });
    
    // RESULTADO 4: Verificar botón siguiente
    cy.get('body').then(($body) => {
      const nextButtons = $body.find('button:contains("Siguiente"), button:contains("siguiente")');
      testResults.botonSiguiente = {
        encontrado: nextButtons.length > 0,
        deshabilitado: nextButtons.length > 0 ? (nextButtons.first().is(':disabled') || nextButtons.first().hasClass('disabled')) : null
      };
    });
    
    // RESULTADO 5: Intentar avanzar si es posible
    cy.get('body').then(($body) => {
      const nextButtons = $body.find('button:contains("Siguiente"), button:contains("siguiente")');
      
      if (nextButtons.length > 0 && !nextButtons.first().is(':disabled')) {
        cy.window().then((win) => {
          const beforeData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
          const beforeFlow = beforeData ? JSON.parse(beforeData).flow : null;
          testResults.estadoAntesDeAvanzar = beforeFlow;
          
          cy.wrap(nextButtons.first()).click();
          cy.wait(3000);
          
          cy.window().then((win2) => {
            const afterData = win2.localStorage.getItem(`story_draft_${targetStoryId}`);
            const afterFlow = afterData ? JSON.parse(afterData).flow : null;
            testResults.estadoDespuesDeAvanzar = afterFlow;
            
            // Detectar cambios
            testResults.cambiosDetectados = {};
            if (beforeFlow && afterFlow) {
              Object.keys(beforeFlow).forEach(key => {
                const oldVal = key === 'personajes' ? beforeFlow[key]?.estado : beforeFlow[key];
                const newVal = key === 'personajes' ? afterFlow[key]?.estado : afterFlow[key];
                if (oldVal !== newVal) {
                  testResults.cambiosDetectados[key] = { antes: oldVal, despues: newVal };
                }
              });
            }
          });
        });
      } else {
        testResults.avanceRealizado = false;
        testResults.razonNoAvance = nextButtons.length === 0 ? 'Botón no encontrado' : 'Botón deshabilitado';
      }
    });
    
    // RESULTADO 6: Volver al home y verificar persistencia
    cy.wait(2000);
    cy.visit('/stories');
    cy.wait(1000);
    
    cy.window().then((win) => {
      const finalData = win.localStorage.getItem(`story_draft_${targetStoryId}`);
      if (finalData) {
        const parsed = JSON.parse(finalData);
        testResults.estadoFinal = parsed.flow;
      }
    });
    
    // RESULTADO 7: Segundo click en continuar
    cy.get('body').then(($body) => {
      const continueLink = $body.find(`a[href*="/wizard/${targetStoryId}"]`);
      if (continueLink.length > 0) {
        cy.wrap(continueLink.first()).click();
        cy.url().then((finalUrl) => {
          testResults.urlSegundoContinuar = finalUrl;
          
          // Guardar todos los resultados
          cy.writeFile('cypress/results/wizard_state_completo.json', {
            storyId: targetStoryId,
            timestamp: new Date().toISOString(),
            resultados: testResults,
            conclusion: {
              estadoInicialCargado: !!testResults.estadoInicial,
              navegacionCorrecta: testResults.urlDespuesDeNavegar?.includes(`/wizard/${targetStoryId}`),
              etapaDetectada: determinarEtapaActual(testResults.indicadoresVisuales),
              cambiosEnEstado: Object.keys(testResults.cambiosDetectados || {}).length > 0,
              persistenciaFunciona: JSON.stringify(testResults.estadoDespuesDeAvanzar) === JSON.stringify(testResults.estadoFinal),
              segundaNavegacionCorrecta: testResults.urlSegundoContinuar?.includes(`/wizard/${targetStoryId}`)
            }
          });
          
          // Mostrar resumen en consola
          cy.log('🎯 RESUMEN DE RESULTADOS:');
          cy.log(`   Estado inicial cargado: ${!!testResults.estadoInicial}`);
          cy.log(`   Navegación correcta: ${testResults.urlDespuesDeNavegar?.includes(`/wizard/${targetStoryId}`)}`);
          cy.log(`   Cambios detectados: ${Object.keys(testResults.cambiosDetectados || {}).length}`);
          cy.log(`   Persistencia funciona: ${JSON.stringify(testResults.estadoDespuesDeAvanzar) === JSON.stringify(testResults.estadoFinal)}`);
        });
      }
    });
  });
});

function determinarEtapaActual(indicadores) {
  if (indicadores.contiene_exportar) return 'export';
  if (indicadores.contiene_vista_previa) return 'preview';
  if (indicadores.contiene_diseño) return 'design';
  if (indicadores.contiene_historia) return 'story';
  if (indicadores.contiene_personajes) return 'characters';
  return 'unknown';
}