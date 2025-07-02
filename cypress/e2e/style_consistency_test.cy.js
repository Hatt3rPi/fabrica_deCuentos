// Test de consistencia visual del sistema de estilos unificado
// Verifica que Admin, Wizard y PDF usen los mismos estilos

describe('Consistencia Visual del Sistema de Estilos Unificado', () => {
  let storyId;
  let styleConfigId;
  
  // Configuración de ejemplo para tests
  const testStyleConfig = {
    name: 'Test Style Config',
    config_data: {
      cover_config: {
        title: {
          fontSize: '48px',
          fontFamily: 'Comic Sans MS',
          fontWeight: 'bold',
          color: '#ff6b35',
          textAlign: 'center',
          position: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          containerStyle: {
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '80%'
          }
        }
      },
      page_config: {
        text: {
          fontSize: '24px',
          fontFamily: 'Arial',
          fontWeight: '600',
          color: '#2c3e50',
          textAlign: 'left',
          position: 'bottom',
          lineHeight: '1.5',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          containerStyle: {
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '90%'
          }
        }
      }
    }
  };

  beforeEach(() => {
    // Limpiar datos de prueba
    cy.cleanupTestData();
    
    // Login
    cy.login('tester@lacuenteria.cl', 'test123');
    
    // Crear configuración de estilo de prueba
    cy.task('createTestStyleConfig', testStyleConfig).then((configId) => {
      styleConfigId = configId;
    });
  });

  afterEach(() => {
    // Limpiar datos después de cada test
    if (styleConfigId) {
      cy.task('deleteStyleConfig', styleConfigId);
    }
    if (storyId) {
      cy.task('deleteStory', storyId);
    }
    cy.cleanupTestData();
  });

  it('Debe mostrar estilos consistentes en Admin StylePreview', () => {
    cy.log('🎨 Verificando estilos en Admin StylePreview');
    
    // Ir a página de admin de estilos
    cy.visit('/admin/style');
    cy.wait(2000);
    
    // Verificar que la configuración de prueba esté activa
    cy.get('[data-testid="style-preview"]', { timeout: 10000 }).should('be.visible');
    
    // Capturar estilos aplicados al preview de portada
    cy.get('[data-testid="style-preview"]')
      .find('[data-page-type="cover"]')
      .should('have.css', 'font-size', '48px')
      .should('have.css', 'color', 'rgb(255, 107, 53)') // #ff6b35
      .should('have.css', 'text-align', 'center');
    
    // Verificar estilos del contenedor de portada
    cy.get('[data-testid="style-preview"]')
      .find('[data-page-type="cover"]')
      .parent()
      .should('have.css', 'background')
      .should('include', 'rgba(255, 255, 255, 0.8)');
    
    // Capturar estilos aplicados al preview de página
    cy.get('[data-testid="style-preview"]')
      .find('[data-page-type="page"]')
      .should('have.css', 'font-size', '24px')
      .should('have.css', 'color', 'rgb(44, 62, 80)') // #2c3e50
      .should('have.css', 'text-align', 'left');
      
    cy.log('✅ Estilos en Admin verificados correctamente');
  });

  it('Debe crear historia y verificar estilos en Wizard PreviewStep', () => {
    cy.log('🧙‍♂️ Verificando estilos en Wizard PreviewStep');
    
    // Crear historia completa para llegar al preview
    cy.task('createTestStory', {
      title: 'Historia de Test Visual',
      pages: [
        { page_number: 0, text: 'Título de Portada Test', image_url: 'https://example.com/cover.jpg' },
        { page_number: 1, text: 'Página de contenido test', image_url: 'https://example.com/page1.jpg' }
      ]
    }).then((createdStoryId) => {
      storyId = createdStoryId;
      
      // Ir al wizard en paso de preview
      cy.visit(`/wizard?story_id=${storyId}&step=preview`);
      cy.wait(3000);
      
      // Verificar que el StoryRenderer está siendo usado
      cy.get('[data-testid="story-renderer"]', { timeout: 10000 }).should('be.visible');
      
      // Verificar estilos del título de portada (página 0)
      cy.get('[data-testid="story-renderer"]')
        .find('[data-page-type="cover"]')
        .should('have.css', 'font-size', '48px')
        .should('have.css', 'color', 'rgb(255, 107, 53)')
        .should('have.css', 'text-align', 'center');
      
      // Navegar a página interior
      cy.get('[data-testid="next-page-button"]').click();
      cy.wait(1000);
      
      // Verificar estilos de página interior
      cy.get('[data-testid="story-renderer"]')
        .find('[data-page-type="page"]')
        .should('have.css', 'font-size', '24px')
        .should('have.css', 'color', 'rgb(44, 62, 80)')
        .should('have.css', 'text-align', 'left');
        
      cy.log('✅ Estilos en Wizard verificados correctamente');
    });
  });

  it('Debe generar PDF con estilos consistentes', () => {
    cy.log('📄 Verificando estilos en PDF generado');
    
    // Crear historia completa
    cy.task('createTestStory', {
      title: 'Historia de Test PDF',
      status: 'completed',
      pages: [
        { page_number: 0, text: 'Portada PDF Test', image_url: 'https://example.com/cover.jpg' },
        { page_number: 1, text: 'Contenido PDF test', image_url: 'https://example.com/page1.jpg' }
      ]
    }).then((createdStoryId) => {
      storyId = createdStoryId;
      
      // Exportar PDF y verificar que use estilos unificados
      cy.request({
        method: 'POST',
        url: `/api/v1/stories/${storyId}/export`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('SUPABASE_ANON_KEY')}`
        },
        body: {
          story_id: storyId,
          format: 'pdf',
          include_metadata: true
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.downloadUrl).to.exist;
        
        cy.log('✅ PDF generado exitosamente con sistema unificado');
        
        // Nota: La validación real de estilos en el PDF requeriría 
        // extraer y parsear el contenido HTML generado, lo cual está 
        // fuera del scope de este test básico
      });
    });
  });

  it('Debe mantener consistencia al cambiar configuración de estilos', () => {
    cy.log('🔄 Verificando consistencia tras cambios de configuración');
    
    // Crear segunda configuración de estilo
    const alternativeStyleConfig = {
      name: 'Alternative Test Style',
      config_data: {
        cover_config: {
          title: {
            fontSize: '36px',
            fontFamily: 'Times New Roman',
            fontWeight: 'normal',
            color: '#2ecc71',
            textAlign: 'left',
            position: 'top'
          }
        },
        page_config: {
          text: {
            fontSize: '18px',
            fontFamily: 'Helvetica',
            fontWeight: 'normal',
            color: '#e74c3c',
            textAlign: 'right',
            position: 'center',
            lineHeight: '1.6'
          }
        }
      }
    };
    
    cy.task('createTestStyleConfig', alternativeStyleConfig).then((altConfigId) => {
      // Activar la nueva configuración
      cy.task('activateStyleConfig', altConfigId);
      
      // Verificar cambios en Admin
      cy.visit('/admin/style');
      cy.wait(2000);
      
      cy.get('[data-testid="style-preview"]')
        .find('[data-page-type="cover"]')
        .should('have.css', 'font-size', '36px')
        .should('have.css', 'color', 'rgb(46, 204, 113)') // #2ecc71
        .should('have.css', 'text-align', 'left');
      
      // Crear nueva historia para verificar Wizard
      cy.task('createTestStory', {
        title: 'Historia Config Alternativa',
        pages: [
          { page_number: 0, text: 'Nuevo Título', image_url: 'https://example.com/cover2.jpg' }
        ]
      }).then((newStoryId) => {
        cy.visit(`/wizard?story_id=${newStoryId}&step=preview`);
        cy.wait(3000);
        
        // Verificar que el Wizard también refleja los cambios
        cy.get('[data-testid="story-renderer"]')
          .find('[data-page-type="cover"]')
          .should('have.css', 'font-size', '36px')
          .should('have.css', 'color', 'rgb(46, 204, 113)')
          .should('have.css', 'text-align', 'left');
          
        cy.log('✅ Consistencia mantenida tras cambio de configuración');
        
        // Limpiar configuración alternativa
        cy.task('deleteStyleConfig', altConfigId);
        cy.task('deleteStory', newStoryId);
      });
    });
  });

  it('Debe validar que no existen estilos hardcodeados en los componentes', () => {
    cy.log('🔍 Verificando ausencia de estilos hardcodeados');
    
    // Crear historia de prueba
    cy.task('createTestStory', {
      title: 'Test Hardcoded Styles',
      pages: [
        { page_number: 0, text: 'Test Title', image_url: 'https://example.com/test.jpg' }
      ]
    }).then((createdStoryId) => {
      storyId = createdStoryId;
      
      cy.visit(`/wizard?story_id=${storyId}&step=preview`);
      cy.wait(3000);
      
      // Verificar que los estilos vienen de la configuración, no hardcodeados
      cy.get('[data-testid="story-renderer"]')
        .find('[data-page-type="cover"]')
        .should('not.have.css', 'font-size', '32px') // Valor hardcodeado típico
        .should('not.have.css', 'color', 'rgb(255, 255, 255)') // Blanco hardcodeado
        .should('have.css', 'font-size', '48px') // Valor de configuración
        .should('have.css', 'color', 'rgb(255, 107, 53)'); // Color de configuración
        
      cy.log('✅ No se detectaron estilos hardcodeados');
    });
  });
});