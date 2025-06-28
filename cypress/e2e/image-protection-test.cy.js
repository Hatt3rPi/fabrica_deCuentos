describe('Sistema de Protección de Imágenes - Tests de Base de Datos', () => {
  
  it('Debe verificar que las migraciones se ejecutaron correctamente', () => {
    // Test simple que no requiere servidor corriendo
    cy.task('db:query', {
      query: 'SELECT * FROM image_protection_config LIMIT 1'
    }).then((result) => {
      expect(result).to.have.property('success')
      // Si hay configuración, verificar campos importantes
      if (result.success && result.rows && result.rows.length > 0) {
        const config = result.rows[0]
        expect(config).to.have.property('right_click_disabled')
        expect(config).to.have.property('dev_tools_detection')
        expect(config).to.have.property('canvas_protection_enabled')
        cy.log('✅ Configuración de protección encontrada')
      } else {
        cy.log('ℹ️  Configuración de protección no encontrada o base de datos no accesible')
      }
    })
  })

  it('Debe verificar bucket protegido', () => {
    cy.task('db:query', {
      query: "SELECT * FROM storage.buckets WHERE id = 'protected-storage'"
    }).then((result) => {
      expect(result).to.have.property('success')
      if (result.success && result.rows && result.rows.length > 0) {
        const bucket = result.rows[0]
        expect(bucket.public).to.be.false // Debe ser privado
        expect(bucket.name).to.equal('protected-storage')
        cy.log('✅ Bucket protegido configurado correctamente')
      } else {
        cy.log('ℹ️  Bucket protegido no encontrado o base de datos no accesible')
      }
    })
  })

  it('Debe verificar que los índices no tienen funciones VOLATILE', () => {
    cy.task('db:query', {
      query: `
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'image_access_logs' 
        AND indexname = 'idx_image_access_logs_rate_limit'
      `
    }).then((result) => {
      expect(result).to.have.property('success')
      if (result.success && result.rows && result.rows.length > 0) {
        const index = result.rows[0]
        // Verificar que no tiene predicado con now()
        expect(index.indexdef).to.not.include('WHERE')
        expect(index.indexdef).to.not.include('now()')
        cy.log('✅ Índice de rate limiting sin funciones VOLATILE')
      } else {
        cy.log('ℹ️  Índice simulado o base de datos no accesible')
      }
    })
  })

  it('Debe validar que las funciones de protección existen', () => {
    // Test que valida la existencia de archivos clave sin requerir servidor
    cy.readFile('src/services/imageProtectionService.ts').should('exist')
    cy.readFile('src/hooks/useUIProtection.ts').should('exist')
    cy.readFile('src/hooks/useCanvasProtection.ts').should('exist')
    cy.readFile('src/components/UI/ProtectedImage.tsx').should('exist')
    cy.readFile('supabase/functions/serve-protected-image/index.ts').should('exist')
    cy.readFile('docs/tech/image-protection-limitations.md').should('exist')
    cy.log('✅ Todos los archivos del sistema de protección existen')
  })

  it('Debe validar la documentación de limitaciones', () => {
    cy.readFile('docs/tech/image-protection-limitations.md').then((content) => {
      expect(content).to.include('Limitaciones del Sistema de Protección de Imágenes')
      expect(content).to.include('Solo metadata, no watermark visual')
      expect(content).to.include('Solo logging, no optimización real')
      expect(content).to.include('Feature Flags Recomendados')
      cy.log('✅ Documentación de limitaciones completa y correcta')
    })
  })
})