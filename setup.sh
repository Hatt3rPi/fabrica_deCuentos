#!/bin/bash

# Instala dependencias de Node y la CLI de Supabase
# Este script se ejecuta durante el setup del entorno (por ejemplo Codex)
# para dejar todo instalado antes de perder acceso a la red.

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Instalar dependencias del proyecto
if [ -f package-lock.json ]; then
  echo -e "${YELLOW}• Instalando dependencias (npm ci)...${NC}"
  npm ci
else
  echo -e "${YELLOW}• Instalando dependencias (npm install)...${NC}"
  npm install
fi

# Instalar la CLI de Supabase si no está disponible
if ! command -v supabase >/dev/null 2>&1; then
  echo -e "${YELLOW}• Instalando Supabase CLI...${NC}"
  npm install -g supabase
fi

echo -e "${GREEN}✓ Entorno listo${NC}"
