// Test E2E para Admin Style Editor con sistema TDD
// Verifica el cambio de posición de elementos usando el nuevo sistema unificado

describe('Admin Style Editor - Sistema TDD', () => {
  beforeEach(() => {
    // Login como admin
    cy.visit('/');
    cy.get('[data-testid="email-input"]').type('tester@lacuenteria.cl');
    cy.get('[data-testid="password-input"]').type('test123');
    cy.get('[data-testid="login-button"]').click();
    
    // Esperar a que cargue el dashboard
    cy.url().should('include', '/crear-historia');
    
    // Navegar a admin
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    
    // Navegar a estilos
    cy.get('[data-testid="admin-nav-styles"]').click();
    cy.url().should('include', '/admin/style');
  });

  it('debe permitir cambiar la posición de un componente usando el grid 3x3', () => {
    // Seleccionar página de portada
    cy.get('[data-testid="page-type-selector"]').select('cover');
    
    // Verificar que se muestra el título de portada
    cy.get('[data-testid="cover-title"]').should('be.visible');
    
    // Hacer click en el título para seleccionarlo
    cy.get('[data-testid="cover-title"]').click();
    
    // Verificar que el panel de posición está visible
    cy.get('[data-testid="position-panel"]').should('be.visible');
    
    // Verificar grid 3x3
    cy.get('[data-testid="grid-3x3"]').should('be.visible');
    cy.get('[data-testid^="position-"]').should('have.length', 9);
    
    // Verificar posición inicial (top-center)
    cy.get('[data-testid="position-top-center"]').should('have.class', 'bg-blue-200');
    
    // Cambiar posición a bottom-right
    cy.get('[data-testid="position-bottom-right"]').click();
    
    // Verificar que la posición cambió visualmente
    cy.get('[data-testid="position-bottom-right"]').should('have.class', 'bg-blue-200');
    cy.get('[data-testid="position-top-center"]').should('not.have.class', 'bg-blue-200');
    
    // Verificar que el componente se movió en el preview
    cy.get('[data-testid="story-preview"]').within(() => {
      cy.get('[data-testid="cover-title"]')
        .parent()
        .should('have.class', 'position-bottom-right');
    });
    
    // Cambiar offset X
    cy.get('[data-testid="offset-x"]').clear().type('50');
    cy.get('[data-testid="offset-x"]').blur();
    
    // Verificar que el transform se aplicó
    cy.get('[data-testid="story-preview"]').within(() => {
      cy.get('[data-testid="cover-title"]')
        .parent()
        .should('have.css', 'transform')
        .and('include', 'translate(50px');
    });
  });

  it('debe mantener separación de responsabilidades entre paneles', () => {
    // Seleccionar un componente
    cy.get('[data-testid="cover-title"]').click();
    
    // Verificar que cada panel maneja solo su responsabilidad
    
    // Panel de tipografía
    cy.get('[data-testid="typography-panel"]').within(() => {
      cy.get('[data-testid="font-size-input"]').should('exist');
      cy.get('[data-testid="font-family-select"]').should('exist');
      cy.get('[data-testid="text-align-controls"]').should('exist');
      
      // No debe tener controles de posición o contenedor
      cy.get('[data-testid="grid-3x3"]').should('not.exist');
      cy.get('[data-testid="background-color-input"]').should('not.exist');
    });
    
    // Panel de contenedor
    cy.get('[data-testid="container-panel"]').within(() => {
      cy.get('[data-testid="background-color-input"]').should('exist');
      cy.get('[data-testid="padding-input"]').should('exist');
      cy.get('[data-testid="border-radius-input"]').should('exist');
      
      // No debe tener controles de tipografía o posición
      cy.get('[data-testid="font-size-input"]').should('not.exist');
      cy.get('[data-testid="grid-3x3"]').should('not.exist');
    });
    
    // Panel de posición
    cy.get('[data-testid="position-panel"]').within(() => {
      cy.get('[data-testid="grid-3x3"]').should('exist');
      cy.get('[data-testid="offset-x"]').should('exist');
      cy.get('[data-testid="offset-y"]').should('exist');
      
      // No debe tener controles de tipografía o contenedor
      cy.get('[data-testid="font-size-input"]').should('not.exist');
      cy.get('[data-testid="background-color-input"]').should('not.exist');
    });
  });

  it('debe aplicar design tokens correctamente', () => {
    // Seleccionar componente
    cy.get('[data-testid="cover-title"]').click();
    
    // Cambiar tamaño de fuente
    cy.get('[data-testid="font-size-input"]').clear().type('6rem');
    cy.get('[data-testid="font-size-input"]').blur();
    
    // Verificar que se aplicó en el preview
    cy.get('[data-testid="story-preview"]').within(() => {
      cy.get('[data-testid="cover-title"]')
        .should('have.css', 'font-size', '96px'); // 6rem = 96px
    });
    
    // Cambiar color de fondo del contenedor
    cy.get('[data-testid="background-color-input"]').clear().type('#ff0000');
    cy.get('[data-testid="background-color-input"]').blur();
    
    // Verificar que se aplicó
    cy.get('[data-testid="story-preview"]').within(() => {
      cy.get('[data-testid="cover-title"]')
        .parent()
        .should('have.css', 'background-color', 'rgb(255, 0, 0)');
    });
  });

  it('debe guardar cambios y persistir después de recargar', () => {
    // Hacer cambios
    cy.get('[data-testid="cover-title"]').click();
    cy.get('[data-testid="position-center-center"]').click();
    cy.get('[data-testid="font-size-input"]').clear().type('5rem');
    cy.get('[data-testid="font-size-input"]').blur();
    
    // Guardar cambios
    cy.get('[data-testid="save-styles-button"]').click();
    cy.get('[data-testid="save-success-message"]').should('be.visible');
    
    // Recargar página
    cy.reload();
    
    // Verificar que los cambios persisten
    cy.get('[data-testid="page-type-selector"]').select('cover');
    cy.get('[data-testid="cover-title"]').click();
    
    // Verificar posición
    cy.get('[data-testid="position-center-center"]').should('have.class', 'bg-blue-200');
    
    // Verificar tamaño de fuente
    cy.get('[data-testid="font-size-input"]').should('have.value', '5rem');
  });

  it('debe manejar migración de configuración legacy sin interrupciones', () => {
    // Simular carga de configuración legacy
    cy.window().then((win) => {
      // Inyectar configuración legacy en localStorage
      const legacyConfig = {
        cover: {
          components: [{
            id: "legacy-title",
            type: "text",
            content: "Título Legacy",
            style: {
              fontSize: "3rem",
              color: "#333333",
              padding: "1rem",
              backgroundColor: "rgba(255,255,255,0.8)"
            },
            position: "bottom",
            horizontalPosition: "left",
            x: 20,
            y: -30
          }]
        }
      };
      
      win.localStorage.setItem('legacy-style-config', JSON.stringify(legacyConfig));
    });
    
    // Trigger migración
    cy.get('[data-testid="migrate-legacy-button"]').click();
    
    // Verificar que la migración se completó
    cy.get('[data-testid="migration-success"]').should('be.visible');
    
    // Verificar que los datos migrados están correctos
    cy.get('[data-testid="legacy-title"]').click();
    
    // Verificar posición migrada (bottom-left)
    cy.get('[data-testid="position-bottom-left"]').should('have.class', 'bg-blue-200');
    
    // Verificar offsets
    cy.get('[data-testid="offset-x"]').should('have.value', '20');
    cy.get('[data-testid="offset-y"]').should('have.value', '-30');
    
    // Verificar estilos separados
    cy.get('[data-testid="font-size-input"]').should('have.value', '3rem');
    cy.get('[data-testid="padding-input"]').should('have.value', '1rem');
  });
});