// Comandos personalizados para testing de wizard state

/**
 * Limpia historia de prueba de la base de datos
 */
Cypress.Commands.add('cleanupStory', (storyId) => {
  cy.task('db:query', {
    query: 'SELECT delete_full_story($1)',
    values: [storyId]
  });
});

/**
 * Configura personajes para testing
 */
Cypress.Commands.add('setupCharacters', (options) => {
  const { storyId, count = 3 } = options;
  
  for (let i = 1; i <= count; i++) {
    cy.task('db:query', {
      query: `
        INSERT INTO characters (id, user_id, name, description, thumbnail_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `,
      values: [
        `test-char-${i}-${storyId.slice(-6)}`,
        'test-user-id',
        `Test Character ${i}`,
        `Description for character ${i}`,
        `test-thumbnail-${i}.jpg`
      ]
    });

    cy.task('db:query', {
      query: `
        INSERT INTO story_characters (story_id, character_id)
        VALUES ($1, $2)
        ON CONFLICT (story_id, character_id) DO NOTHING
      `,
      values: [storyId, `test-char-${i}-${storyId.slice(-6)}`]
    });
  }
});

/**
 * Configura estado completo del wizard
 */
Cypress.Commands.add('setupWizardState', (options) => {
  const { storyId, state } = options;
  
  cy.task('db:query', {
    query: 'UPDATE stories SET wizard_state = $1 WHERE id = $2',
    values: [JSON.stringify(state), storyId]
  });
});

/**
 * Establece estado en la base de datos
 */
Cypress.Commands.add('setDatabaseState', (options) => {
  const { storyId, wizard_state } = options;
  
  cy.task('db:query', {
    query: 'UPDATE stories SET wizard_state = $1 WHERE id = $2',
    values: [JSON.stringify(wizard_state), storyId]
  });
});

/**
 * Verifica estado en la base de datos
 */
Cypress.Commands.add('verifyDatabaseState', (storyId) => {
  return cy.task('db:query', {
    query: 'SELECT wizard_state FROM stories WHERE id = $1',
    values: [storyId]
  }).then((result) => {
    return result.rows[0] || null;
  });
});

/**
 * Verifica si una historia fue eliminada
 */
Cypress.Commands.add('verifyStoryDeleted', (storyId) => {
  return cy.task('db:query', {
    query: 'SELECT id FROM stories WHERE id = $1',
    values: [storyId]
  }).then((result) => {
    return result.rows.length === 0;
  });
});

/**
 * Verifica si una historia existe
 */
Cypress.Commands.add('verifyStoryExists', (storyId) => {
  return cy.task('db:query', {
    query: 'SELECT id FROM stories WHERE id = $1',
    values: [storyId]
  }).then((result) => {
    return result.rows.length > 0;
  });
});

/**
 * Inserta estado corrupto para testing
 */
Cypress.Commands.add('setCorruptDatabaseState', (storyId) => {
  cy.task('db:query', {
    query: 'UPDATE stories SET wizard_state = $1 WHERE id = $2',
    values: ['{"invalid": "json", "structure":', storyId] // JSON inválido
  });
});

/**
 * Completa wizard hasta el final para testing
 */
Cypress.Commands.add('completeWizard', (storyId) => {
  const completeState = {
    personajes: { estado: 'completado', personajesAsignados: 3 },
    cuento: 'completado',
    diseno: 'completado',
    vistaPrevia: 'borrador'
  };

  cy.setupWizardState({ storyId, state: completeState });
  cy.setupCharacters({ storyId, count: 3 });

  // Agregar páginas de prueba
  cy.task('db:query', {
    query: `
      INSERT INTO story_pages (id, story_id, page_number, text, image_url, prompt)
      VALUES 
        ($1, $2, 0, 'Cover Page', 'cover.jpg', 'cover prompt'),
        ($3, $2, 1, 'Page 1 content', 'page1.jpg', 'page 1 prompt'),
        ($4, $2, 2, 'Page 2 content', 'page2.jpg', 'page 2 prompt')
      ON CONFLICT (id) DO NOTHING
    `,
    values: [
      `cover-${storyId}`,
      storyId,
      `page1-${storyId}`,
      `page2-${storyId}`
    ]
  });
});