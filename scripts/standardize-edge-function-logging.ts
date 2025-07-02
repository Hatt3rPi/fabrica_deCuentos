#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script para estandarizar el logging en todas las Edge Functions
 * Reemplaza console.log/error directos con el sistema de logging centralizado
 */

const FUNCTIONS_DIR = '/home/customware/lacuenteria/Lacuenteria/supabase/functions';

// Funciones ya actualizadas o que no necesitan actualización
const UPDATED_FUNCTIONS = [
  'generate-story', // Ya actualizada manualmente
  '_shared',        // directorio compartido
  'send-reset-email' // función simple que no requiere logging complejo
];

const LOGGER_IMPORT = `import { createEdgeFunctionLogger } from '../_shared/logger.ts';`;

async function getFunctionDirectories(): Promise<string[]> {
  const dirs: string[] = [];
  
  for await (const dirEntry of Deno.readDir(FUNCTIONS_DIR)) {
    if (dirEntry.isDirectory && !UPDATED_FUNCTIONS.includes(dirEntry.name)) {
      dirs.push(dirEntry.name);
    }
  }
  
  return dirs;
}

async function standardizeLoggingInFunction(functionName: string): Promise<void> {
  const functionPath = `${FUNCTIONS_DIR}/${functionName}/index.ts`;
  
  try {
    let content = await Deno.readTextFile(functionPath);
    let modified = false;
    
    // 1. Agregar import del logger si no existe
    if (!content.includes('createEdgeFunctionLogger')) {
      const lastImportMatch = content.match(/import.*from.*['"]\.\.\/.*?['"];/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastImportIndex) + '\n' + LOGGER_IMPORT + content.slice(lastImportIndex);
        modified = true;
      }
    }
    
    // 2. Agregar inicialización del logger en Deno.serve
    if (!content.includes('createEdgeFunctionLogger(')) {
      const denoServeMatch = content.match(/Deno\.serve\(async \(req\) => \{[\s\n]*(?=\s*if|\/\/|const|let|var)/);
      if (denoServeMatch) {
        const insertIndex = denoServeMatch.index! + denoServeMatch[0].length;
        const loggerInit = `\n  const logger = createEdgeFunctionLogger('${functionName}');\n`;
        content = content.slice(0, insertIndex) + loggerInit + content.slice(insertIndex);
        modified = true;
      }
    }
    
    // 3. Reemplazar console.log con logger.info (solo los más obvios y seguros)
    const consoleLogMatches = content.matchAll(/console\.log\(['"](.+?)['"](?:,\s*(.+?))?\);/g);
    let offset = 0;
    
    for (const match of consoleLogMatches) {
      const originalCall = match[0];
      const message = match[1];
      const data = match[2] || 'undefined';
      
      // Solo reemplazar logs simples, no los que contienen datos sensibles
      if (!message.toLowerCase().includes('payload') && 
          !message.toLowerCase().includes('request') &&
          !message.toLowerCase().includes('response')) {
        
        const replacement = data !== 'undefined' 
          ? `logger.info('${message}', { data: ${data} });`
          : `logger.info('${message}');`;
        
        const matchIndex = match.index! + offset;
        content = content.slice(0, matchIndex) + replacement + content.slice(matchIndex + originalCall.length);
        offset += replacement.length - originalCall.length;
        modified = true;
      }
    }
    
    // 4. Reemplazar console.error con logger.error (más conservador)
    const consoleErrorMatches = content.matchAll(/console\.error\(['"](.+?)['"](?:,\s*(.+?))?\);/g);
    offset = 0;
    
    for (const match of consoleErrorMatches) {
      const originalCall = match[0];
      const message = match[1];
      const errorVar = match[2];
      
      if (errorVar && (errorVar === 'error' || errorVar === 'err' || errorVar === 'e')) {
        const replacement = `logger.error('${message}', ${errorVar});`;
        const matchIndex = match.index! + offset;
        content = content.slice(0, matchIndex) + replacement + content.slice(matchIndex + originalCall.length);
        offset += replacement.length - originalCall.length;
        modified = true;
      }
    }
    
    if (modified) {
      await Deno.writeTextFile(functionPath, content);
      console.log(`✅ Logging estandarizado en ${functionName}`);
    } else {
      console.log(`⏭️  ${functionName} no necesita cambios`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${functionName}:`, error.message);
  }
}

async function main() {
  console.log('🔧 Estandarizando logging en Edge Functions...\n');
  
  const functionDirs = await getFunctionDirectories();
  console.log(`📁 Funciones a procesar: ${functionDirs.join(', ')}\n`);
  
  for (const functionName of functionDirs) {
    await standardizeLoggingInFunction(functionName);
  }
  
  console.log(`\n🎉 Proceso completado. Se procesaron ${functionDirs.length} funciones.`);
  console.log('\n📋 Próximos pasos:');
  console.log('1. Revisar manualmente las funciones para ajustes específicos');
  console.log('2. Probar las funciones en desarrollo');
  console.log('3. Validar que el logging funcione correctamente');
}

if (import.meta.main) {
  await main();
}