/// <reference types="cypress" />

describe('Manual Test: Wizard State Persistence Flow', () => {
  let testStoryId;
  
  before(() => {
    // Login con credenciales de test
    cy.visit('/');
    
    // Navegar al login si es necesario
    cy.get('body').then(($body) => {
      if ($body.find('input[id="email"]').length === 0) {
        // Buscar botón de login si estamos en landing
        cy.get('body').then(($body2) => {
          if ($body2.find('a[href*="login"], button:contains("Iniciar")').length > 0) {
            cy.get('a[href*="login"], button:contains("Iniciar")').first().click();
          }
        });
      }
    });
    
    // Verificar que estamos en el formulario de login
    cy.contains('h2', 'La CuenterIA').should('be.visible');
    
    // Ingresar credenciales
    cy.get('input[id="email"]').type('tester@lacuenteria.cl');
    cy.get('input[id="password"]').type('test123');
    
    // Hacer clic en el botón de iniciar sesión
    cy.contains('button', 'Iniciar sesión').click();
    
    // Esperar redirección al home
    cy.url().should('include', '/home');
    
    // Navegar a stories si no estamos ahí
    cy.visit('/stories');
  });

  it('STEP 1: Analizar wizard_state de historia existente', () => {
    cy.log('🔍 PASO 1: Analizando estado inicial');
    
    // Verificar si hay historias existentes
    cy.get('body').then(($body) => {
      // Buscar tarjetas de historia con diferentes selectores posibles
      const storySelectors = [
        '[data-testid="story-card"]',
        '.story-card', 
        '[class*="story"]',
        'article',
        '.card'
      ];
      
      let storyCards = null;
      for (const selector of storySelectors) {
        if ($body.find(selector).length > 0) {
          storyCards = cy.get(selector);
          break;
        }
      }
      
      if (storyCards) {
        cy.log('✅ Historias existentes encontradas');
        
        // Buscar botón de continuar con diferentes selectores
        storyCards.first().within(() => {
          const continueSelectors = [
            '[data-testid="continue-story"]',
            'button:contains("Continuar")',
            'a:contains("Continuar")',
            'button:contains("continuar")',
            'a[href*="/wizard/"]'
          ];
          
          for (const selector of continueSelectors) {
            cy.get('body').then(($cardBody) => {
              if ($cardBody.find(selector).length > 0) {
                cy.get(selector).first().invoke('attr', 'href').then((href) => {
                  if (href && href.includes('/wizard/')) {
                    testStoryId = href.split('/wizard/')[1];
                    cy.log(`📋 Story ID capturado: ${testStoryId}`);
                  }
                });
                return false; // Break loop
              }
            });
          }
        });
          
        // Inspeccionar localStorage antes de continuar
        cy.window().then((win) => {
          const storageKeys = Object.keys(win.localStorage).filter(k => k.includes('story_draft'));
          cy.log(`📦 Keys en localStorage: ${storageKeys.join(', ')}`);
          
          if (testStoryId) {
            const draftKey = `story_draft_${testStoryId}`;
            const draftData = win.localStorage.getItem(draftKey);
            if (draftData) {
              const parsed = JSON.parse(draftData);
              cy.log('🎯 Estado inicial del wizard:');
              cy.log(`   Personajes: ${parsed.flow?.personajes?.estado || 'no encontrado'}`);
              cy.log(`   Cuento: ${parsed.flow?.cuento || 'no encontrado'}`);
              cy.log(`   Diseño: ${parsed.flow?.diseno || 'no encontrado'}`);
              cy.log(`   Vista Previa: ${parsed.flow?.vistaPrevia || 'no encontrado'}`);
            }
          }
        });
        
      } else {
        cy.log('⚠️  No hay historias existentes, creando una nueva...');
        // Crear nueva historia para test
        cy.get('[data-testid="new-story-button"]').click();
        cy.url().then((url) => {
          testStoryId = url.match(/\/wizard\/([a-f0-9-]+)/)?.[1];
          cy.log(`📋 Nueva historia creada: ${testStoryId}`);
        });
      }
    });
  });

  it('STEP 2: Click en Continuar y verificar navegación', function() {
    cy.log('🔍 PASO 2: Testing navegación por continuación');
    
    // Volver al home si estamos en wizard
    cy.visit('/stories');
    
    // Click en continuar de la primera historia
    cy.get('[data-testid="story-card"]').first().within(() => {
      cy.get('[data-testid="continue-story"]').click();
    });
    
    // Verificar que navega al wizard
    cy.url().should('include', '/wizard/');
    
    // Capturar el paso actual del wizard
    cy.get('[data-testid="step-indicator"]').within(() => {
      cy.get('.active, [class*="active"]').then(($activeStep) => {
        const stepText = $activeStep.text() || $activeStep.attr('data-step') || 'unknown';
        cy.log(`🎯 Etapa actual del wizard: ${stepText}`);
        
        // Verificar que corresponde al estado más avanzado
        cy.window().then((win) => {
          const currentUrl = win.location.pathname;
          testStoryId = currentUrl.match(/\/wizard\/([a-f0-9-]+)/)?.[1];
          
          if (testStoryId) {
            const draftData = win.localStorage.getItem(`story_draft_${testStoryId}`);
            if (draftData) {
              const parsed = JSON.parse(draftData);
              cy.log('✅ Verificando coincidencia estado → UI:');
              cy.log(`   localStorage flow: ${JSON.stringify(parsed.flow)}`);
              cy.log(`   UI step actual: ${stepText}`);
            }
          }
        });
      });
    });
  });

  it('STEP 3: Avanzar a siguiente etapa', () => {
    cy.log('🔍 PASO 3: Avanzando a siguiente etapa');
    
    // Capturar estado antes de avanzar
    cy.window().then((win) => {
      const draftData = win.localStorage.getItem(`story_draft_${testStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        cy.wrap(parsed.flow).as('estadoAntes');
        cy.log('📊 Estado ANTES de avanzar:', parsed.flow);
      }
    });
    
    // Intentar avanzar al siguiente paso
    cy.get('[data-testid="next-step-button"], [data-testid="wizard-next"]').then(($btn) => {
      if ($btn.is(':disabled')) {
        cy.log('⚠️  Botón deshabilitado, completando paso actual...');
        
        // Lógica para completar el paso actual según el contexto
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="add-character-button"]').length > 0) {
            // Estamos en personajes
            cy.log('🎭 Completando paso de personajes...');
            // Lógica específica para personajes si es necesario
          } else if ($body.find('[data-testid="generate-story-button"]').length > 0) {
            // Estamos en historia
            cy.log('📖 Completando paso de historia...');
            // Lógica específica para historia si es necesario
          }
        });
      } else {
        cy.log('✅ Botón habilitado, avanzando...');
        cy.wrap($btn).click();
      }
    });
    
    // Verificar cambio de estado después de avanzar
    cy.wait(2000); // Esperar auto-save
    
    cy.window().then((win) => {
      const draftData = win.localStorage.getItem(`story_draft_${testStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        cy.log('📊 Estado DESPUÉS de avanzar:', parsed.flow);
        
        // Verificar que algún estado cambió a 'completado'
        cy.get('@estadoAntes').then((estadoAntes) => {
          const cambios = [];
          Object.keys(parsed.flow).forEach(key => {
            if (estadoAntes[key] !== parsed.flow[key]) {
              cambios.push(`${key}: ${estadoAntes[key]} → ${parsed.flow[key]}`);
            }
          });
          
          if (cambios.length > 0) {
            cy.log('✅ Cambios detectados en el estado:');
            cambios.forEach(cambio => cy.log(`   ${cambio}`));
          } else {
            cy.log('⚠️  No se detectaron cambios en el estado');
          }
        });
      }
    });
  });

  it('STEP 4: Volver al home y verificar persistencia', () => {
    cy.log('🔍 PASO 4: Verificando persistencia final');
    
    // Volver al home
    cy.visit('/stories');
    
    // Verificar que el estado se mantiene
    cy.window().then((win) => {
      const draftData = win.localStorage.getItem(`story_draft_${testStoryId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        cy.log('📊 Estado final en localStorage:', parsed.flow);
      }
    });
    
    // Click nuevamente en continuar para verificar navegación
    cy.get('[data-testid="story-card"]').first().within(() => {
      cy.get('[data-testid="continue-story"]').click();
    });
    
    // Verificar que navega al paso correcto
    cy.url().should('include', '/wizard/');
    
    cy.get('[data-testid="step-indicator"]').within(() => {
      cy.get('.active, [class*="active"]').then(($activeStep) => {
        const stepText = $activeStep.text() || $activeStep.attr('data-step') || 'unknown';
        cy.log(`🎯 Etapa final verificada: ${stepText}`);
        
        cy.log('✅ TEST COMPLETADO - Verificar logs para análisis completo');
      });
    });
  });
});