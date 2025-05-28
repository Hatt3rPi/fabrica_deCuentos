#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando sincronización con Supabase${NC}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor, instálalo primero.${NC}"
    exit 1
fi

# Verificar si supabase-cli está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  La CLI de Supabase no está instalada. Instalando...${NC}"
    npm install -g supabase
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias...${NC}"
    npm install dotenv
fi

# Verificar si el directorio de scripts existe
if [ ! -d "scripts" ]; then
    echo -e "${RED}❌ No se encontró el directorio de scripts.${NC}"
    exit 1
fi

# Verificar si el archivo de script existe
if [ ! -f "scripts/sync-supabase.mjs" ]; then
    echo -e "${RED}❌ No se encontró el script de sincronización.${NC}"
    exit 1
fi

# Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No se encontró el archivo .env. Asegúrate de tener las variables necesarias.${NC}"
else
    # Cargar variables de entorno
    set -a
    source .env
    set +a
    
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
        echo -e "${YELLOW}⚠️  Las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son requeridas.${NC}"
    fi
fi

# Ejecutar el script de sincronización
echo -e "${GREEN}✅ Iniciando sincronización...${NC}"
node scripts/sync-supabase.mjs

# Verificar el resultado
exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ Sincronización completada con éxito${NC}"
else
    echo -e "${RED}❌ Error durante la sincronización (código: $exit_code)${NC}"
    exit $exit_code
fi
