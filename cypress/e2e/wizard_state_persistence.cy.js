/// <reference types="cypress" />

describe('Wizard State Persistence', () => {
  let storyId;
  
  beforeEach(() => {
    // Limpiar localStorage y base de datos
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    
    // Login y crear nueva historia
    cy.visit('/');
    cy.get('[data-testid="email-input"]').type('demo@lacuenteria.com');
    cy.get('[data-testid="password-input"]').type('demo123');
    cy.get('[data-testid="login-button"]').click();
    
    // Esperar redirección y crear nueva historia
    cy.url().should('include', '/stories');
    cy.get('[data-testid="new-story-button"]').click();
    
    // Capturar story ID de la URL
    cy.url().then((url) => {
      const match = url.match(/\/wizard\/([a-f0-9-]+)/);
      storyId = match ? match[1] : null;
      expect(storyId).to.not.be.null;
    });
  });

  afterEach(() => {
    // Limpiar historia de prueba
    if (storyId) {
      cy.task('cleanupStory', storyId);
    }
  });

  describe('Persistencia de Estados del Wizard', () => {
    it('debe persistir estado inicial correctamente', () => {
      // Verificar estado inicial en localStorage
      cy.window().then((win) => {
        const savedState = win.localStorage.getItem(`story_draft_${storyId}`);
        expect(savedState).to.not.be.null;
        
        const parsed = JSON.parse(savedState);
        expect(parsed.flow.personajes.estado).to.equal('no_iniciada');
        expect(parsed.flow.cuento).to.equal('no_iniciada');
        expect(parsed.flow.diseno).to.equal('no_iniciada');
        expect(parsed.flow.vistaPrevia).to.equal('no_iniciada');
      });

      // Verificar que se muestra paso de personajes
      cy.get('[data-testid="step-indicator-characters"]').should('have.class', 'active');
      cy.get('[data-testid="characters-step"]').should('be.visible');
    });

    it('debe persistir transición personajes → cuento', () => {
      // Agregar 3 personajes para completar etapa
      for (let i = 1; i <= 3; i++) {
        cy.get('[data-testid="add-character-button"]').click();
        cy.get('[data-testid="character-name-input"]').type(`Personaje ${i}`);
        cy.get('[data-testid="character-description-input"]').type(`Descripción del personaje ${i}`);
        cy.get('[data-testid="generate-thumbnail-button"]').click();
        
        // Esperar generación de thumbnail
        cy.get('[data-testid="character-thumbnail"]', { timeout: 30000 }).should('be.visible');
        cy.get('[data-testid="save-character-button"]').click();
        
        // Esperar que se guarde
        cy.wait(2000);
      }

      // Verificar transición de estado en localStorage
      cy.window().then((win) => {
        const savedState = win.localStorage.getItem(`story_draft_${storyId}`);
        const parsed = JSON.parse(savedState);
        
        expect(parsed.flow.personajes.estado).to.equal('completado');
        expect(parsed.flow.personajes.personajesAsignados).to.equal(3);
        expect(parsed.flow.cuento).to.equal('borrador');
      });

      // Avanzar al siguiente paso
      cy.get('[data-testid="next-step-button"]').should('not.be.disabled').click();
      
      // Verificar que se muestra paso de cuento
      cy.get('[data-testid="step-indicator-story"]').should('have.class', 'active');
      cy.get('[data-testid="story-step"]').should('be.visible');
    });

    it('debe persistir transición cuento → diseño', () => {
      // Completar personajes primero
      cy.task('setupCharacters', { storyId, count: 3 });
      
      // Navegar a paso de cuento
      cy.get('[data-testid="story-step"]').should('be.visible');
      
      // Configurar tema del cuento
      cy.get('[data-testid="story-theme-input"]').type('Una aventura mágica');
      cy.get('[data-testid="target-age-select"]').select('5-7');
      cy.get('[data-testid="literary-style-select"]').select('simple');
      cy.get('[data-testid="central-message-input"]').type('La importancia de la amistad');
      
      // Generar cuento
      cy.get('[data-testid="generate-story-button"]').click();
      
      // Esperar generación del cuento
      cy.get('[data-testid="generated-story"]', { timeout: 60000 }).should('be.visible');
      
      // Verificar transición de estado
      cy.window().then((win) => {
        const savedState = win.localStorage.getItem(`story_draft_${storyId}`);
        const parsed = JSON.parse(savedState);
        
        expect(parsed.flow.cuento).to.equal('completado');
        expect(parsed.flow.diseno).to.equal('borrador');
      });

      // Avanzar al diseño
      cy.get('[data-testid="next-step-button"]').should('not.be.disabled').click();
      cy.get('[data-testid="design-step"]').should('be.visible');
    });

    it('debe persistir configuración de diseño', () => {
      // Preparar estado hasta diseño
      cy.task('setupWizardState', {
        storyId,
        state: {
          personajes: { estado: 'completado', personajesAsignados: 3 },
          cuento: 'completado',
          diseno: 'borrador',
          vistaPrevia: 'no_iniciada'
        }
      });

      cy.reload();
      
      // Seleccionar estilo visual
      cy.get('[data-testid="visual-style-acuarela"]').click();
      cy.get('[data-testid="color-palette-pastel"]').click();
      
      // Esperar auto-save
      cy.wait(2000);
      
      // Verificar persistencia en localStorage
      cy.window().then((win) => {
        const savedState = win.localStorage.getItem(`story_draft_${storyId}`);
        const parsed = JSON.parse(savedState);
        
        expect(parsed.state.designSettings.visualStyle).to.equal('acuarela');
        expect(parsed.state.designSettings.colorPalette).to.equal('pastel_vibrant');
      });

      // Verificar persistencia después de reload
      cy.reload();
      cy.get('[data-testid="visual-style-acuarela"]').should('have.class', 'selected');
      cy.get('[data-testid="color-palette-pastel"]').should('have.class', 'selected');
    });
  });

  describe('Recuperación de Estado', () => {
    it('debe recuperar estado desde localStorage después de refresh', () => {
      // Configurar estado en localStorage
      cy.window().then((win) => {
        const mockState = {
          state: {
            characters: [
              { id: 'char-1', name: 'Test Character', description: 'Test desc', thumbnailUrl: 'test.jpg' }
            ],
            meta: { title: 'Test Story', theme: 'adventure' }
          },
          flow: {
            personajes: { estado: 'completado', personajesAsignados: 1 },
            cuento: 'borrador',
            diseno: 'no_iniciada',
            vistaPrevia: 'no_iniciada'
          }
        };
        win.localStorage.setItem(`story_draft_${storyId}`, JSON.stringify(mockState));
      });

      // Reload página
      cy.reload();
      
      // Verificar que se recuperó el estado
      cy.get('[data-testid="character-card"]').should('contain', 'Test Character');
      cy.get('[data-testid="next-step-button"]').should('not.be.disabled');
    });

    it('debe recuperar desde backup si falla guardado principal', () => {
      cy.window().then((win) => {
        const backupState = {
          state: {
            characters: [
              { id: 'char-backup', name: 'Backup Character', description: 'Backup desc', thumbnailUrl: 'backup.jpg' }
            ]
          },
          flow: {
            personajes: { estado: 'completado', personajesAsignados: 1 },
            cuento: 'no_iniciada',
            diseno: 'no_iniciada',
            vistaPrevia: 'no_iniciada'
          },
          timestamp: Date.now()
        };
        
        // Solo backup, sin estado principal
        win.localStorage.setItem(`story_draft_${storyId}_backup`, JSON.stringify(backupState));
      });

      cy.reload();
      
      // Verificar recuperación desde backup
      cy.get('[data-testid="character-card"]').should('contain', 'Backup Character');
    });

    it('debe recuperar desde Supabase si no hay localStorage', () => {
      // Limpiar localStorage
      cy.window().then((win) => {
        win.localStorage.clear();
      });

      // Simular estado en BD
      cy.task('setDatabaseState', {
        storyId,
        wizard_state: {
          personajes: { estado: 'completado', personajesAsignados: 2 },
          cuento: 'completado',
          diseno: 'borrador',
          vistaPrevia: 'no_iniciada'
        }
      });

      cy.reload();
      
      // Verificar que se cargó desde BD
      cy.get('[data-testid="step-indicator-design"]').should('have.class', 'active');
      cy.get('[data-testid="design-step"]').should('be.visible');
    });
  });

  describe('Sincronización con Base de Datos', () => {
    it('debe sincronizar wizard_state con BD cada segundo', () => {
      // Agregar personaje para activar auto-save
      cy.get('[data-testid="add-character-button"]').click();
      cy.get('[data-testid="character-name-input"]').type('Test Character');
      cy.get('[data-testid="character-description-input"]').type('Test description');
      cy.get('[data-testid="save-character-button"]').click();

      // Esperar auto-save (1 segundo + buffer)
      cy.wait(2000);

      // Verificar que se guardó en BD
      cy.task('verifyDatabaseState', storyId).then((dbState) => {
        expect(dbState.wizard_state).to.not.be.null;
        expect(dbState.wizard_state.personajes.personajesAsignados).to.equal(1);
      });
    });

    it('debe crear backup en localStorage si falla guardado en BD', () => {
      // Simular fallo de red
      cy.intercept('POST', '**/stories**', { forceNetworkError: true }).as('saveStoryFail');
      
      // Intentar guardar cambios
      cy.get('[data-testid="add-character-button"]').click();
      cy.get('[data-testid="character-name-input"]').type('Test Character');
      cy.get('[data-testid="save-character-button"]').click();

      // Esperar intento de guardado
      cy.wait(3000);

      // Verificar que se creó backup
      cy.window().then((win) => {
        const backup = win.localStorage.getItem(`story_draft_${storyId}_backup`);
        expect(backup).to.not.be.null;
        
        const parsed = JSON.parse(backup);
        expect(parsed.timestamp).to.be.a('number');
        expect(parsed.state.characters).to.have.length(1);
      });
    });
  });

  describe('Limpieza de Estado', () => {
    it('debe limpiar estado al salir del wizard sin personajes', () => {
      // Salir sin agregar personajes
      cy.visit('/stories');
      
      // Verificar que se ejecutó limpieza
      cy.task('verifyStoryDeleted', storyId).then((deleted) => {
        expect(deleted).to.be.true;
      });
    });

    it('debe preservar historia con personajes al salir', () => {
      // Agregar personajes
      cy.task('setupCharacters', { storyId, count: 2 });
      
      // Salir del wizard
      cy.visit('/stories');
      
      // Verificar que NO se eliminó
      cy.task('verifyStoryExists', storyId).then((exists) => {
        expect(exists).to.be.true;
      });
    });

    it('debe limpiar localStorage al completar wizard', () => {
      // Completar wizard hasta el final
      cy.task('completeWizard', storyId);
      
      // Ir a export y finalizar
      cy.get('[data-testid="download-pdf-button"]').click();
      
      // Verificar limpieza de localStorage
      cy.window().then((win) => {
        const mainDraft = win.localStorage.getItem(`story_draft_${storyId}`);
        const backup = win.localStorage.getItem(`story_draft_${storyId}_backup`);
        
        expect(mainDraft).to.be.null;
        expect(backup).to.be.null;
      });
    });
  });

  describe('Estados Edge Cases', () => {
    it('debe manejar wizard_state corrupto en BD', () => {
      // Insertar estado corrupto
      cy.task('setCorruptDatabaseState', storyId);
      
      cy.reload();
      
      // Debe resetear a estado inicial
      cy.get('[data-testid="step-indicator-characters"]').should('have.class', 'active');
      
      // Verificar estado limpio en localStorage
      cy.window().then((win) => {
        const savedState = win.localStorage.getItem(`story_draft_${storyId}`);
        const parsed = JSON.parse(savedState);
        expect(parsed.flow.personajes.estado).to.equal('no_iniciada');
      });
    });

    it('debe manejar UUID inválido en localStorage', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('current_story_draft_id', 'invalid-uuid');
      });

      // No debe intentar guardar con UUID inválido
      cy.get('[data-testid="add-character-button"]').click();
      cy.get('[data-testid="character-name-input"]').type('Test');
      
      // No debe haber errores en consola relacionados con UUID
      cy.window().then((win) => {
        cy.spy(win.console, 'error').should('not.have.been.calledWith', 
          Cypress.sinon.match(/Invalid storyId format/));
      });
    });

    it('debe manejar conflictos de estado entre localStorage y BD', () => {
      // Estado diferente en localStorage vs BD
      const localState = {
        flow: {
          personajes: { estado: 'completado', personajesAsignados: 3 },
          cuento: 'completado',
          diseno: 'no_iniciada',
          vistaPrevia: 'no_iniciada'
        }
      };

      const dbState = {
        personajes: { estado: 'borrador', personajesAsignados: 1 },
        cuento: 'no_iniciada',
        diseno: 'no_iniciada',
        vistaPrevia: 'no_iniciada'
      };

      cy.window().then((win) => {
        win.localStorage.setItem(`story_draft_${storyId}`, JSON.stringify(localState));
      });

      cy.task('setDatabaseState', { storyId, wizard_state: dbState });
      
      cy.reload();
      
      // localStorage debe tener prioridad
      cy.get('[data-testid="step-indicator-story"]').should('have.class', 'active');
    });
  });
});