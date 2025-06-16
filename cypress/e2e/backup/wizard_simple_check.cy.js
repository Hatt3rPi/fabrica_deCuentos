/// <reference types="cypress" />

describe('🔍 CHECK SIMPLE: Wizard State sin BD', () => {
  
  const targetStoryId = '58313f6e-7a66-4d46-a205-278afe6d17e7';
  
  it('Verificar carga del wizard y estado paso a paso', () => {
    console.log('='.repeat(60));
    console.log('🔍 WIZARD SIMPLE CHECK');
    console.log('='.repeat(60));
    
    // STEP 1: Login
    cy.visit('/');
    cy.get('input[type="email"]').type('fabarca212@gmail.com');
    cy.get('input[type="password"]').type('test123');
    cy.get('button[type="submit"]').click();
    cy.wait(2000);
    
    console.log('✅ Step 1: Login completado');
    
    // STEP 2: Check if we can access stories
    cy.visit('/stories');
    cy.wait(1000);
    
    cy.url().then(url => {
      console.log(`📍 URL después de /stories: ${url}`);
    });
    
    // Check what's visible on stories page
    cy.get('body').then($body => {
      const bodyText = $body.text();
      console.log('📋 Contenido en /stories:');
      console.log(`  Contiene "Mis Cuentos": ${bodyText.includes('Mis Cuentos')}`);
      console.log(`  Contiene "Continuar": ${bodyText.includes('Continuar')}`);
      console.log(`  Contiene story ID: ${bodyText.includes(targetStoryId.substr(-6))}`);
      
      // Look for any story cards
      const storyCards = $body.find('[data-testid*="story"], .story-card, a[href*="/wizard/"]');
      console.log(`  Story cards encontradas: ${storyCards.length}`);
      
      if (storyCards.length > 0) {
        console.log('  📊 Story cards details:');
        storyCards.each((i, card) => {
          const $card = Cypress.$(card);
          const href = $card.attr('href') || '';
          const text = $card.text().substring(0, 100);
          console.log(`    ${i + 1}. HREF: ${href} | TEXT: ${text}...`);
        });
      }
    });
    
    console.log('\n✅ Step 2: Stories page verificada');
    
    // STEP 3: Try to access wizard directly
    console.log(`\n🎯 Step 3: Navegando a /wizard/${targetStoryId}`);
    cy.visit(`/wizard/${targetStoryId}`);
    cy.wait(3000);
    
    // Check URL after navigation
    cy.url().then(url => {
      console.log(`📍 URL después de navegar al wizard: ${url}`);
      console.log(`  ¿Contiene /wizard/?: ${url.includes('/wizard/')}`);
      console.log(`  ¿Contiene story ID?: ${url.includes(targetStoryId)}`);
    });
    
    // Check what loads in the wizard
    cy.get('body').then($body => {
      const bodyText = $body.text();
      console.log('\n📋 Contenido cargado en wizard:');
      console.log(`  Contiene "personajes": ${bodyText.includes('personajes')}`);
      console.log(`  Contiene "Personajes": ${bodyText.includes('Personajes')}`);
      console.log(`  Contiene "Añadir": ${bodyText.includes('Añadir')}`);
      console.log(`  Contiene "Crear": ${bodyText.includes('Crear')}`);
      console.log(`  Contiene "historia": ${bodyText.includes('historia')}`);
      console.log(`  Contiene "Loading": ${bodyText.includes('Loading')}`);
      console.log(`  Contiene "Error": ${bodyText.includes('Error')}`);
      
      // Check for specific wizard elements
      const buttons = $body.find('button');
      const inputs = $body.find('input');
      const cards = $body.find('.card, .bg-white, .rounded');
      
      console.log(`  Botones: ${buttons.length}`);
      console.log(`  Inputs: ${inputs.length}`);
      console.log(`  Cards/elementos: ${cards.length}`);
      
      // Look for wizard navigation or steps
      const stepIndicators = $body.find('[data-testid*="step"], .step, .wizard');
      console.log(`  Indicadores de paso: ${stepIndicators.length}`);
      
      if (buttons.length > 0) {
        console.log('  📊 Primeros 3 botones:');
        buttons.slice(0, 3).each((i, btn) => {
          const $btn = Cypress.$(btn);
          const text = $btn.text().trim();
          const disabled = $btn.is(':disabled');
          console.log(`    ${i + 1}. "${text}" (disabled: ${disabled})`);
        });
      }
    });
    
    // STEP 4: Check localStorage
    cy.window().then(win => {
      console.log('\n📦 Step 4: Verificando localStorage:');
      
      const allKeys = Object.keys(win.localStorage);
      console.log(`  Total keys en localStorage: ${allKeys.length}`);
      
      const storyKeys = allKeys.filter(k => k.includes('story'));
      console.log(`  Keys relacionadas con story: ${storyKeys.length}`);
      storyKeys.forEach(key => console.log(`    - ${key}`));
      
      const targetKey = `story_draft_${targetStoryId}`;
      const targetData = win.localStorage.getItem(targetKey);
      
      console.log(`\n  📊 Data para ${targetKey}:`);
      console.log(`    Existe: ${!!targetData}`);
      
      if (targetData) {
        try {
          const parsed = JSON.parse(targetData);
          console.log('    ✅ JSON válido');
          console.log(`    Characters: ${parsed.state?.characters?.length || 0}`);
          console.log(`    Flow personajes estado: ${parsed.flow?.personajes?.estado}`);
          console.log(`    Flow personajes asignados: ${parsed.flow?.personajes?.personajesAsignados}`);
          console.log(`    Flow cuento: ${parsed.flow?.cuento}`);
        } catch (e) {
          console.log(`    ❌ Error parsing: ${e.message}`);
        }
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ WIZARD SIMPLE CHECK COMPLETADO');
    console.log('='.repeat(60));
  });
});