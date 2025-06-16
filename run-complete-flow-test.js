#!/usr/bin/env node

/**
 * Script para ejecutar el test completo del flujo de historia
 * 
 * Uso:
 *   node run-complete-flow-test.js
 *   npm run test:complete-flow
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando test completo del flujo de historia...\n');

try {
  // Ejecutar el test específico
  const command = 'npx cypress run --spec "cypress/e2e/complete_story_flow.cy.js" --headless';
  
  console.log(`Ejecutando: ${command}\n`);
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Test completo ejecutado exitosamente');
  
} catch (error) {
  console.error('\n❌ Error ejecutando el test:', error.message);
  process.exit(1);
}