#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Configuración
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const SUPABASE_DIR = path.join(ROOT_DIR, 'supabase');
const TYPES_DIR = path.join(ROOT_DIR, 'src', 'types');
const PROJECT_REF = 'ogegdctdniijmublbmgy';

// Cargar variables de entorno
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function logStep(step) {
  console.log(`\n${colors.cyan}${colors.bright}${step}${colors.reset}`);
  console.log(`${'-'.repeat(step.length)}`);
}

function runCommand(command, cwd = ROOT_DIR) {
  console.log(`$ ${colors.yellow}${command}${colors.reset}`);
  try {
    const output = execSync(command, { stdio: 'inherit', cwd });
    return { success: true, output };
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error };
  }
}

async function main() {
  console.log(`\n${colors.blue}${colors.bright}🚀 Iniciando sincronización con Supabase${colors.reset}\n`);

  // 1. Sincronizar migraciones
  logStep('1. Sincronizando migraciones de la base de datos');
  runCommand('npx supabase migration list');
  
  // 2. Aplicar migraciones pendientes
  logStep('2. Aplicando migraciones pendientes');
  runCommand('npx supabase db push');

  // 3. Desplegar Edge Functions
  logStep('3. Desplegando Edge Functions');
  const functionsDir = path.join(SUPABASE_DIR, 'functions');
  if (fs.existsSync(functionsDir)) {
    const functions = fs.readdirSync(functionsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_'))
      .map(dirent => dirent.name);

    for (const func of functions) {
      console.log(`\nDesplegando función: ${colors.green}${func}${colors.reset}`);
      runCommand(`npx supabase functions deploy ${func} --project-ref ${PROJECT_REF}`);
    }
  }

  // 4. Sincronizar Storage
  logStep('4. Sincronizando configuración de Storage');
  // Aquí iría la lógica para sincronizar buckets
  // Por ahora solo mostramos un mensaje
  console.log('Nota: La sincronización de buckets debe hacerse manualmente desde el dashboard de Supabase');

  // 5. Generar tipos de TypeScript
  logStep('5. Generando tipos de TypeScript');
  if (!fs.existsSync(TYPES_DIR)) {
    fs.mkdirSync(TYPES_DIR, { recursive: true });
  }
  runCommand(`npx supabase gen types typescript --project-id ${PROJECT_REF} --schema public > ${TYPES_DIR}/supabase.ts`);

  console.log(`\n${colors.green}${colors.bright}✅ Sincronización completada con éxito${colors.reset}\n`);
}

main().catch(error => {
  console.error('Error durante la sincronización:', error);
  process.exit(1);
});
