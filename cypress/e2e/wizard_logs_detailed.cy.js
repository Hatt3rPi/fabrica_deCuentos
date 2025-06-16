/// <reference types="cypress" />

describe('🔍 LOGS DETALLADOS: Wizard State Flow', () => {
  
  const targetStoryId = '58313f6e-7a66-4d46-a205-278afe6d17e7';
  
  it('Capturar todos los logs del wizard flow específicamente', () => {
    // Override console.log to capture wizard-specific logs
    cy.window().then((win) => {
      const originalLog = win.console.log;
      const wizardLogs = [];
      
      win.console.log = function(...args) {
        const message = args.join(' ');
        // Only capture wizard-related logs
        if (message.includes('[WizardFlow') || 
            message.includes('WizardContext') || 
            message.includes('setPersonajes') ||
            message.includes('wizard_state') ||
            message.includes('loadStoryCharacters') ||
            message.includes('CharacterSelectionModal')) {
          wizardLogs.push(`${new Date().toISOString().substr(11, 12)} - ${message}`);
          cy.log(`WIZARD LOG: ${message}`);
        }
        return originalLog.apply(win.console, args);
      };
      
      // Store logs for later access
      win.wizardLogs = wizardLogs;
    });
    
    console.log('='.repeat(80));
    console.log('🔍 INICIANDO CAPTURA DETALLADA DE LOGS DEL WIZARD');
    console.log('='.repeat(80));
    
    // STEP 1: Login
    cy.visit('/');
    cy.login('fabarca212@gmail.com', 'test123');
    cy.log('✅ Login completado');
    
    // STEP 2: Go directly to the problematic story
    cy.log(`🎯 Navegando directamente a wizard/${targetStoryId}`);
    cy.visit(`/wizard/${targetStoryId}`);
    
    // Wait and capture initial logs
    cy.wait(3000);
    cy.log('⏳ Esperando carga inicial del wizard...');
    
    // STEP 3: Check what we can see in the UI
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      cy.log('📋 CONTENIDO VISIBLE EN UI:');
      cy.log(`  Contiene "personajes": ${bodyText.includes('personajes')}`);
      cy.log(`  Contiene "Añadir personaje": ${bodyText.includes('Añadir personaje')}`);
      cy.log(`  Contiene "historia": ${bodyText.includes('historia')}`);
      cy.log(`  Contiene "cuento": ${bodyText.includes('cuento')}`);
      cy.log(`  Contiene "Crear nuevo": ${bodyText.includes('Crear nuevo')}`);
      
      // Check for character cards
      const characterCards = $body.find('.character-card, [data-testid*="character"]').not(':contains("Añadir")');
      cy.log(`  📊 Character cards encontradas: ${characterCards.length}`);
      
      if (characterCards.length > 0) {
        characterCards.each((index, card) => {
          const cardText = Cypress.$(card).text();
          cy.log(`    Card ${index + 1}: ${cardText.substring(0, 50)}...`);
        });
      }
    });
    
    // STEP 4: Check localStorage
    cy.window().then((win) => {
      cy.log('📦 VERIFICANDO LOCALSTORAGE:');
      
      const draftKey = `story_draft_${targetStoryId}`;
      const backupKey = `${draftKey}_backup`;
      
      const draftData = win.localStorage.getItem(draftKey);
      const backupData = win.localStorage.getItem(backupKey);
      
      cy.log(`  ${draftKey}: ${draftData ? 'EXISTS' : 'NOT FOUND'}`);
      cy.log(`  ${backupKey}: ${backupData ? 'EXISTS' : 'NOT FOUND'}`);
      
      if (draftData) {
        try {
          const parsed = JSON.parse(draftData);
          cy.log('  📊 CONTENIDO DE DRAFT:');
          cy.log(`    Characters length: ${parsed.state?.characters?.length || 0}`);
          cy.log(`    Flow personajes estado: ${parsed.flow?.personajes?.estado}`);
          cy.log(`    Flow personajes asignados: ${parsed.flow?.personajes?.personajesAsignados}`);
          cy.log(`    Flow cuento: ${parsed.flow?.cuento}`);
          
          if (parsed.state?.characters?.length > 0) {
            cy.log('    📋 CHARACTERS EN STATE:');
            parsed.state.characters.forEach((char, i) => {
              cy.log(`      ${i + 1}. ${char.name} (${char.id?.substr(-6)})`);
            });
          }
        } catch (e) {
          cy.log(`  ❌ Error parsing draft: ${e.message}`);
        }
      }
    });
    
    // STEP 5: Check current URL and routing
    cy.url().then((currentUrl) => {
      cy.log(`🌐 URL ACTUAL: ${currentUrl}`);
      
      // Check if we're in the right place
      if (currentUrl.includes('/wizard/')) {
        const urlStoryId = currentUrl.split('/wizard/')[1];
        cy.log(`  Story ID en URL: ${urlStoryId}`);
        cy.log(`  ¿Coincide con objetivo?: ${urlStoryId === targetStoryId}`);
      }
    });
    
    // STEP 6: Try to interact with character elements
    cy.get('body').then(($body) => {
      cy.log('🔍 INTENTANDO INTERACCIONES:');
      
      // Look for any clickable elements
      const buttons = $body.find('button');
      const links = $body.find('a');
      
      cy.log(`  Botones encontrados: ${buttons.length}`);
      cy.log(`  Links encontrados: ${links.length}`);
      
      // Try to find character-related elements
      const addButtons = $body.find('button:contains("Añadir"), button:contains("Crear")');
      if (addButtons.length > 0) {
        cy.log(`  ✅ Botón de añadir encontrado: ${addButtons.first().text()}`);
        
        // Try clicking it
        cy.wrap(addButtons.first()).click();
        cy.wait(1000);
        
        // Check if modal opened
        cy.get('body').then(($modalBody) => {
          const hasModal = $modalBody.find('.modal, [role="dialog"], .fixed.inset-0').length > 0;
          cy.log(`  Modal abierto: ${hasModal}`);
          
          if (hasModal) {
            const charactersInModal = $modalBody.find('.character-card, .aspect-square').not(':contains("Crear nuevo")');
            cy.log(`  Personajes en modal: ${charactersInModal.length}`);
          }
        });
      } else {
        cy.log('  ❌ No se encontró botón de añadir');
      }
    });
    
    // STEP 7: Capture final wizard logs
    cy.window().then((win) => {
      if (win.wizardLogs && win.wizardLogs.length > 0) {
        cy.log('📋 LOGS DEL WIZARD CAPTURADOS:');
        win.wizardLogs.forEach((log, i) => {
          cy.log(`  ${i + 1}. ${log}`);
        });
      } else {
        cy.log('⚠️ No se capturaron logs del wizard');
      }
    });
    
    cy.log('='.repeat(80));
    cy.log('✅ CAPTURA DE LOGS DETALLADOS COMPLETADA');
    cy.log('='.repeat(80));
  });
});