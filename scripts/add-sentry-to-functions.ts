#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script para agregar monitoreo básico de Sentry a todas las Edge Functions
 * que aún no lo tienen implementado.
 */

const FUNCTIONS_DIR = '/home/customware/lacuenteria/Lacuenteria/supabase/functions';

// Funciones que ya tienen Sentry implementado (las críticas)
const IMPLEMENTED_FUNCTIONS = [
  'generate-story',
  'story-export', 
  'generate-cover',
  '_shared' // directorio compartido
];

// Plantilla básica de Sentry para agregar a cada función
const SENTRY_IMPORT = `import { configureForEdgeFunction, captureException, setUser, setTags } from '../_shared/sentry.ts';`;

const SENTRY_CONFIG_TEMPLATE = `
  // Configurar Sentry para esta Edge Function
  configureForEdgeFunction('FUNCTION_NAME', req);
`;

const SENTRY_USER_CONFIG_TEMPLATE = `
    // Configurar contexto de usuario en Sentry
    if (userId) {
      setUser({ id: userId });
    }
    
    // Configurar tags básicos
    setTags({
      'function.name': 'FUNCTION_NAME'
    });
`;

const SENTRY_CATCH_TEMPLATE = `
    // Capturar error en Sentry
    await captureException(err as Error, {
      function: 'FUNCTION_NAME',
      userId,
      elapsed: Date.now() - start
    });
`;

async function getFunctionDirectories(): Promise<string[]> {
  const dirs: string[] = [];
  
  for await (const dirEntry of Deno.readDir(FUNCTIONS_DIR)) {
    if (dirEntry.isDirectory && !IMPLEMENTED_FUNCTIONS.includes(dirEntry.name)) {
      dirs.push(dirEntry.name);
    }
  }
  
  return dirs;
}

async function addSentryToFunction(functionName: string): Promise<void> {
  const functionPath = `${FUNCTIONS_DIR}/${functionName}/index.ts`;
  
  try {
    let content = await Deno.readTextFile(functionPath);
    
    // 1. Agregar import de Sentry si no existe
    if (!content.includes('from \'../_shared/sentry.ts\'')) {
      const importMatch = content.match(/import.*from.*['"]\.\.\/._shared\/.*?['"];/);
      if (importMatch) {
        const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, lastImportIndex) + '\n' + SENTRY_IMPORT + content.slice(lastImportIndex);
      } else {
        // Si no hay imports de _shared, agregar después de los imports normales
        const importSection = content.match(/import.*?;[\s\n]*(?=\n(?:const|let|var|interface|type|\/\/|\/\*|\n))/s);
        if (importSection) {
          const importEndIndex = importSection.index! + importSection[0].length;
          content = content.slice(0, importEndIndex) + '\n' + SENTRY_IMPORT + '\n' + content.slice(importEndIndex);
        }
      }
    }
    
    // 2. Agregar configuración de Sentry después de Deno.serve
    if (!content.includes('configureForEdgeFunction')) {
      const denoServeMatch = content.match(/Deno\.serve\(async \(req\) => \{[\s\n]*(?=\s*if|\/\/|const|let|var)/);
      if (denoServeMatch) {
        const insertIndex = denoServeMatch.index! + denoServeMatch[0].length;
        const sentryConfig = SENTRY_CONFIG_TEMPLATE.replace('FUNCTION_NAME', functionName);
        content = content.slice(0, insertIndex) + sentryConfig + content.slice(insertIndex);
      }
    }
    
    // 3. Agregar configuración de usuario después de obtener userId
    if (!content.includes('setUser({ id: userId })') && content.includes('getUserId')) {
      const userIdMatch = content.match(/userId\s*=\s*await\s+getUserId\(req\);[\s\n]*/);
      if (userIdMatch) {
        const insertIndex = userIdMatch.index! + userIdMatch[0].length;
        const userConfig = SENTRY_USER_CONFIG_TEMPLATE.replace(/FUNCTION_NAME/g, functionName);
        content = content.slice(0, insertIndex) + userConfig + content.slice(insertIndex);
      }
    }
    
    // 4. Agregar captura de errores en catch blocks
    if (!content.includes('captureException')) {
      const catchBlocks = content.matchAll(/} catch \((.*?)\) \{[\s\n]*console\.error/g);
      let offset = 0;
      
      for (const catchMatch of catchBlocks) {
        const insertIndex = catchMatch.index! + catchMatch[0].length + offset;
        const sentryCapture = SENTRY_CATCH_TEMPLATE.replace(/FUNCTION_NAME/g, functionName);
        content = content.slice(0, insertIndex) + sentryCapture + content.slice(insertIndex);
        offset += sentryCapture.length;
      }
    }
    
    // Escribir el archivo actualizado
    await Deno.writeTextFile(functionPath, content);
    console.log(`✅ Sentry agregado a ${functionName}`);
    
  } catch (error) {
    console.error(`❌ Error procesando ${functionName}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Agregando Sentry a Edge Functions...\n');
  
  const functionDirs = await getFunctionDirectories();
  console.log(`📁 Funciones encontradas: ${functionDirs.join(', ')}\n`);
  
  for (const functionName of functionDirs) {
    await addSentryToFunction(functionName);
  }
  
  console.log(`\n🎉 Proceso completado. Se procesaron ${functionDirs.length} funciones.`);
  console.log('\n📋 Próximos pasos:');
  console.log('1. Revisar manualmente las funciones para ajustes específicos');
  console.log('2. Probar las funciones en desarrollo');
  console.log('3. Validar que los errores se capturen correctamente en Sentry');
}

if (import.meta.main) {
  await main();
}