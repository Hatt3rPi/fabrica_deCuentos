/// <reference types="cypress" />

describe('🔍 VERIFICAR: Datos de Historia en BD', () => {
  
  const targetStoryId = '58313f6e-7a66-4d46-a205-278afe6d17e7';
  
  it('Verificar que la historia existe y tiene personajes en BD', () => {
    console.log('='.repeat(80));
    console.log('🔍 VERIFICANDO DATOS DE HISTORIA EN BASE DE DATOS');
    console.log('='.repeat(80));
    
    // Login first
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    
    // Use the test database commands to check story data
    cy.task('db:query', {
      query: 'SELECT id, title, theme, wizard_state, created_at, updated_at FROM stories WHERE id = $1',
      values: [targetStoryId]
    }).then((result) => {
      console.log('\n📊 DATOS DE LA HISTORIA:');
      if (result.rows && result.rows.length > 0) {
        const story = result.rows[0];
        console.log(`  ✅ Historia encontrada:`);
        console.log(`    ID: ${story.id}`);
        console.log(`    Título: ${story.title || 'Sin título'}`);
        console.log(`    Tema: ${story.theme || 'Sin tema'}`);
        console.log(`    Creada: ${story.created_at}`);
        console.log(`    Actualizada: ${story.updated_at}`);
        console.log(`    Wizard State: ${JSON.stringify(story.wizard_state, null, 2)}`);
      } else {
        console.log('  ❌ Historia NO encontrada en BD');
      }
    });
    
    // Check story_characters relationship
    cy.task('db:query', {
      query: `
        SELECT sc.story_id, sc.character_id, c.name, c.description 
        FROM story_characters sc 
        JOIN characters c ON sc.character_id = c.id 
        WHERE sc.story_id = $1
      `,
      values: [targetStoryId]
    }).then((result) => {
      console.log('\n👥 PERSONAJES ASIGNADOS:');
      if (result.rows && result.rows.length > 0) {
        console.log(`  ✅ ${result.rows.length} personajes encontrados:`);
        result.rows.forEach((char, i) => {
          console.log(`    ${i + 1}. ${char.name} (${char.character_id.substr(-6)})`);
          console.log(`       Descripción: ${typeof char.description === 'string' ? char.description.substring(0, 50) : JSON.stringify(char.description).substring(0, 50)}...`);
        });
      } else {
        console.log('  ❌ NO se encontraron personajes asignados a esta historia');
      }
    });
    
    // Check if user owns this story
    cy.task('db:query', {
      query: `
        SELECT s.id, s.title, u.email 
        FROM stories s 
        JOIN auth.users u ON s.user_id = u.id 
        WHERE s.id = $1
      `,
      values: [targetStoryId]
    }).then((result) => {
      console.log('\n👤 PROPIETARIO DE LA HISTORIA:');
      if (result.rows && result.rows.length > 0) {
        const owner = result.rows[0];
        console.log(`  Propietario: ${owner.email}`);
        console.log(`  ¿Es el usuario correcto?: ${owner.email === 'fabarca212@gmail.com'}`);
      } else {
        console.log('  ❌ No se pudo determinar el propietario');
      }
    });
    
    // Check recent wizard_state updates
    cy.task('db:query', {
      query: `
        SELECT wizard_state, updated_at 
        FROM stories 
        WHERE id = $1 
        ORDER BY updated_at DESC
      `,
      values: [targetStoryId]
    }).then((result) => {
      console.log('\n🕒 ESTADO ACTUAL DE WIZARD_STATE:');
      if (result.rows && result.rows.length > 0) {
        const current = result.rows[0];
        console.log(`  Última actualización: ${current.updated_at}`);
        console.log(`  Estado actual: ${JSON.stringify(current.wizard_state, null, 2)}`);
        
        if (current.wizard_state) {
          const ws = current.wizard_state;
          console.log('\n  📊 ANÁLISIS DEL ESTADO:');
          console.log(`    Personajes estado: ${ws.personajes?.estado}`);
          console.log(`    Personajes asignados: ${ws.personajes?.personajesAsignados}`);
          console.log(`    Cuento: ${ws.cuento}`);
          console.log(`    Diseño: ${ws.diseno}`);
          console.log(`    Vista Previa: ${ws.vistaPrevia}`);
          
          // Validate consistency
          console.log('\n  🔍 VALIDACIÓN DE CONSISTENCIA:');
          const characterCount = result.rows.length; // This should be from the characters query above
          console.log(`    Personajes en BD vs wizard_state: BD=? vs WS=${ws.personajes?.personajesAsignados || 0}`);
        }
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICACIÓN DE DATOS COMPLETADA');
    console.log('   Revisar logs para entender el estado real de la historia');
    console.log('='.repeat(80));
  });
});