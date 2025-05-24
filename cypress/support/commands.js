// ***********************************************
// Comandos personalizados para las pruebas de La CuenterIA
// ***********************************************

// -- Comando para iniciar sesión --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('input[id="email"]').type(email);
  cy.get('input[id="password"]').type(password);
  cy.contains('button', 'Iniciar sesión').click();
  // Esperar a que se redirija a la página de inicio
  cy.url().should('include', '/home');
  // Verificar que se muestra el mensaje de bienvenida (header con el logo)
  cy.get('header').should('be.visible');
  cy.get('header').find('h1').should('contain', 'La CuenterIA');
});

// -- Comando para crear un nuevo personaje --
Cypress.Commands.add('createCharacter', (name, age, description, imagePath = 'cypress/fixtures/test-avatar.png') => {
  // Navegar a la página de creación de personaje
  cy.contains('+ Nuevo cuento').click();
  cy.contains('+ Crear nuevo').click();
  
  // Completar el formulario
  cy.get('input[placeholder="Nombre del personaje"]').type(name);
  cy.get('input[placeholder="Edad del personaje"]').type(age);
  cy.get('textarea[placeholder="Describe al personaje..."]').type(description);
  
  // Subir imagen si se proporciona una ruta
  if (imagePath) {
    cy.get('input[type="file"]').selectFile(imagePath, { force: true });
    // Esperar a que se cargue la imagen
    cy.get('img[alt="Referencia"]').should('be.visible');
  }
  
  // Generar miniatura
  cy.contains('button', 'Generar miniatura').click();
  
  // Esperar a que se genere la miniatura (esto puede tardar)
  cy.get('img[alt="Miniatura"]', { timeout: 30000 }).should('be.visible');
  
  // Guardar personaje
  cy.contains('button', 'Guardar personaje').click();
  
  // Verificar que se ha redirigido a la pantalla de diseño de historia
  cy.url().should('include', '/nuevo-cuento/personajes');
});

// -- Comando para abrir el modal de personajes --
Cypress.Commands.add('openNewStoryModal', () => {
  // Esperar a que la página esté completamente cargada
  cy.url().should('include', '/home');
  
  // Hacer clic para abrir el modal
  cy.contains('button', 'Nuevo cuento')
    .should('be.visible')
    .click();

  // Verificar que el modal aparece y es visible
  const modal = cy.get('[data-testid="modal-personajes"]', { timeout: 10000 });
  
  return modal.should(($el) => {
    // Verificar que el modal está visible
    expect($el).to.be.visible;
    
    // Verificar que no está oculto por CSS
    const display = $el.css('display');
    const opacity = parseFloat($el.css('opacity'));
    
    expect(display).to.not.equal('none');
    expect(opacity).to.be.greaterThan(0);
  });
});

// -- Comando para verificar que el modal está abierto --
Cypress.Commands.add('verifyModalIsOpen', () => {
  return cy.get('[data-testid="modal-personajes"]')
    .should('exist')
    .and('be.visible')
    .and(($el) => {
      const display = $el.css('display');
      expect(display).to.not.equal('none');
      expect($el.css('opacity')).to.be.greaterThan('0');
    });
});

// -- Comando para crear un nuevo personaje desde el modal --
Cypress.Commands.add('createNewCharacterFromModal', () => {
  // Esperar a que el modal esté completamente cargado
  cy.get('[data-testid="modal-personajes"]', { timeout: 15000 }).should('be.visible');
  
  // Tomar una captura de pantalla para depuración
  cy.screenshot('modal-personajes-visible');
  
  // Intentar encontrar el botón con el texto exacto 'Crear nuevo' (en minúsculas)
  const possibleButtonTexts = [
    'Crear nuevo',  // Texto exacto del botón en la interfaz
    'Crear Nuevo',  // Versión con mayúscula por si acaso
    'Crear nuevo personaje',
    'Nuevo personaje',
    'Crear personaje',
    'Agregar personaje',
    '+ Nuevo',
    'Nuevo',
    'Crear',
    'Agregar'
  ];
  
  // Función para intentar hacer clic en el botón
  const tryClickButton = (index = 0) => {
    if (index >= possibleButtonTexts.length) {
      // Tomar captura de pantalla para depuración
      cy.screenshot('no-se-encontro-boton-crear-personaje');
      // Listar todos los botones visibles para depuración
      cy.get('button').each(($btn, i) => {
        cy.log(`Botón ${i}:`, $btn.text().trim());
      });
      throw new Error('No se pudo encontrar el botón de creación de personaje');
    }
    
    const buttonText = possibleButtonTexts[index];
    cy.log(`Buscando botón con texto: "${buttonText}"`);
    
    // Buscar el botón por texto
    cy.get('button:visible', { timeout: 5000 })
      .contains(buttonText)
      .then($buttons => {
        if ($buttons.length > 0) {
          cy.log(`Botón encontrado: "${$buttons.first().text().trim()}"`);
          // Encontramos el botón, hacer clic
          cy.wrap($buttons.first())
            .should('be.visible')
            .should('not.be.disabled')
            .click({ force: true });
          
          // Verificar que la navegación ocurrió
          cy.url({ timeout: 10000 }).should('include', '/nuevo-cuento/personaje/nuevo');
        } else {
          // Intentar con el siguiente texto posible
          tryClickButton(index + 1);
        }
      });
  };
  
  // Iniciar el proceso de búsqueda del botón
  tryClickButton(0);
  
  // Esperar a que el formulario de creación de personaje esté listo
  cy.get('input[placeholder="Nombre del personaje"]', { timeout: 15000 })
    .should('be.visible');
});

// -- Comando para esperar a que termine el autoguardado --
Cypress.Commands.add('waitForAutosave', () => {
  // Esperar un tiempo razonable para que se complete el autoguardado
  // Esto puede necesitar ajustes según el tiempo que tarde el autoguardado
  cy.wait(1000);
  
  // También puedes verificar si hay algún indicador de carga o estado de guardado
  // Por ejemplo, si hay un mensaje de "Guardando..." o un spinner
  // cy.get('.saving-indicator').should('not.exist');
  
  // O si hay un estado específico en el DOM que indique que el guardado ha terminado
  // cy.get('[data-status="saved"]').should('exist');
});

// -- Comando para limpiar las historias de prueba de un usuario por su ID --
Cypress.Commands.add('cleanupTestStories', (userId = 'f0f2ff5b-826a-4d43-aa21-8094e1cf584e') => {
  cy.log(`Iniciando limpieza de historias para el usuario ID: ${userId}`);
  
  // Usar el comando task para ejecutar la limpieza en Node.js
  return cy.task('deleteTestStories', { userId })
    .then((result) => {
      const count = result?.rowCount || 0;
      cy.log(`✅ Se eliminaron ${count} historias de prueba para el usuario ${userId}`);
      return result;
    })
    .catch((error) => {
      cy.log('❌ Error al limpiar historias de prueba:', error.message);
      throw error;
    });
});

// -- Comando para eliminar todos los datos de prueba de un usuario por su email --
Cypress.Commands.add('cleanupAllTestData', (email) => {
  if (!email) {
    const message = '⚠️  No se proporcionó un email para limpiar los datos de prueba';
    cy.log(message);
    return cy.wrap({ rowCount: 0, message });
  }
  
  cy.log(`Iniciando limpieza de todos los datos para el usuario: ${email}`);
  
  // Usar cy.task para ejecutar la limpieza en Node.js
  return cy.task('deleteAllTestData', { email }, { timeout: 10000 })
    .then((result) => {
      const count = result?.rowCount || 0;
      const userId = result?.userId || 'no-encontrado';
      const message = `✅ Se eliminaron ${count} registros de prueba para el usuario ${email} (ID: ${userId})`;
      cy.log(message);
      // En lugar de retornar un objeto directamente, usamos cy.wrap
      return cy.wrap({ ...result, message });
    });
});

// -- Comando para limpiar los datos después de cada prueba --
Cypress.Commands.add('cleanupAfterEach', () => {
  afterEach(() => {
    // Obtener el email del usuario de prueba de las variables de entorno o usar un valor por defecto
    const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
    cy.cleanupAllTestData(testUserEmail);
  });
});

// -- Comando para limpiar los datos después de todas las pruebas --
Cypress.Commands.add('cleanupAfterAll', () => {
  after(() => {
    // Obtener el email del usuario de prueba de las variables de entorno o usar un valor por defecto
    const testUserEmail = Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
    cy.cleanupAllTestData(testUserEmail);
  });
});

// -- Comando para verificar que un elemento está visible y hacer clic --
Cypress.Commands.add('clickIfVisible', (selector, options = {}) => {
  cy.get(selector, { timeout: 10000 })
    .should('be.visible')
    .click(options);
});

// -- Comando para verificar que un elemento existe y es visible --
Cypress.Commands.add('verifyElementExists', (selector, options = {}) => {
  return cy.get(selector, { timeout: 10000 })
    .should('exist')
    .and('be.visible');
});

// -- Comando para limpiar datos de prueba --
Cypress.Commands.add('cleanupTestData', () => {
  // Este comando se puede implementar para eliminar datos de prueba
  // después de que se ejecuten las pruebas
  // Por ejemplo, eliminar personajes creados durante las pruebas
  
  // Nota: Esta implementación dependerá de cómo se accede a la API o BD
  // Por ahora, es un placeholder
  cy.log('Limpiando datos de prueba...');
  
  // Ejemplo de implementación futura:
  // cy.request({
  //   method: 'DELETE',
  //   url: '/api/test-data',
  //   headers: {
  //     Authorization: `Bearer ${Cypress.env('API_TOKEN')}`
  //   }
  // });
});

// -- Comando para verificar campos obligatorios --
Cypress.Commands.add('checkRequiredFields', () => {
  // Navegar a la página de creación de personaje
  cy.contains('+ Nuevo cuento').click();
  cy.contains('+ Crear nuevo').click();
  
  // Verificar que los campos requeridos muestran mensaje de error
  cy.get('input[placeholder="Nombre del personaje"]').type(' ').clear();
  cy.contains('button', 'Generar miniatura').click();
  cy.contains('El nombre es requerido').should('be.visible');
  
  cy.get('input[placeholder="Edad del personaje"]').type(' ').clear();
  cy.contains('button', 'Generar miniatura').click();
  cy.contains('La edad es requerida').should('be.visible');
  
  cy.get('textarea[placeholder="Describe al personaje..."]').type(' ').clear();
  cy.contains('button', 'Generar miniatura').click();
  cy.contains('La descripción es requerida').should('be.visible');
  
  // Verificar que no se muestra la miniatura
  cy.get('img[alt="Miniatura"]').should('not.exist');
});

/**
 * Elimina todas las historias de prueba de un usuario usando la Edge Function
 * @param {string} email - Email del usuario cuyas historias se eliminarán
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.useBackup - Si es true, usará cleanupAllTestData como respaldo si la Edge Function falla
 * @returns {Cypress.Chainable} - Cadena de comandos de Cypress con la respuesta
 */
Cypress.Commands.add('cleanupTestStories', (email, options = {}) => {
  const apiKey = Cypress.env('CLEANUP_API_KEY');
  const supabaseUrl = Cypress.env('VITE_SUPABASE_URL');
  const functionUrl = `${supabaseUrl}/functions/v1/delete-test-stories`;
  const useBackup = options.useBackup !== false; // Por defecto, usar respaldo si no se especifica lo contrario

  if (!email) {
    cy.log('⚠️ No se proporcionó un email para limpiar historias');
    return cy.wrap({ success: false, deletedStories: 0, error: 'Email no proporcionado' });
  }

  cy.log(`🧹 Eliminando historias de prueba para: ${email}`);

  // Verificar si tenemos las variables necesarias para la Edge Function
  if (!apiKey || !supabaseUrl) {
    cy.log('⚠️ Faltan variables de entorno para la Edge Function, usando método de respaldo...');
    if (useBackup) {
      return cy.cleanupAllTestData(email).then(result => {
        return cy.wrap({
          success: result.rowCount > 0,
          deletedStories: result.rowCount || 0,
          userId: result.userId,
          usingBackup: true
        });
      });
    } else {
      return cy.wrap({ success: false, deletedStories: 0, error: 'Configuración incompleta' });
    }
  }

  // Intentar usar la Edge Function
  return cy.request({
    method: 'POST',
    url: functionUrl,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: { email },
    failOnStatusCode: false,
    timeout: 60000 // 60 segundos de timeout
  }).then((response) => {
    cy.log(`🔍 Respuesta de la Edge Function: ${response.status}`);
    
    // Si hay error en la Edge Function y tenemos habilitado el respaldo
    if (response.status >= 400 && useBackup) {
      const errorMsg = response.body?.error || 'Error desconocido';
      cy.log(`⚠️ Error en Edge Function: ${errorMsg}. Usando método de respaldo...`);
      
      return cy.cleanupAllTestData(email).then(result => {
        return cy.wrap({
          success: result.rowCount > 0,
          deletedStories: result.rowCount || 0,
          userId: result.userId,
          usingBackup: true
        });
      });
    }
    
    // Si hay error y no usamos respaldo
    if (response.status >= 400 && !useBackup) {
      const errorMsg = response.body?.error || 'Error desconocido';
      cy.log(`❌ Error al limpiar historias: ${errorMsg}`);
      return cy.wrap({ success: false, error: errorMsg, deletedStories: 0 });
    }

    // Procesar respuesta exitosa
    const { success, deletedStories, userId } = response.body;
    if (success) {
      cy.log(`✅ Se eliminaron ${deletedStories} historias para el usuario ${userId}`);
    } else {
      cy.log('⚠️ No se eliminaron historias o no se encontró el usuario');
    }
    
    return cy.wrap(response.body);
  });
});
