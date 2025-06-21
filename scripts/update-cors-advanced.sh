#!/bin/bash

# Script avanzado para migración completa de CORS en Edge Functions
# Incluye transformaciones específicas de responses

echo "🚀 Iniciando migración avanzada de CORS en Edge Functions..."

# Directorio de funciones
FUNCTIONS_DIR="supabase/functions"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con colores
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Función para actualizar imports
update_imports() {
    local file="$1"
    log_info "Actualizando imports en $file"
    
    # Verificar si ya tiene el import correcto
    if grep -q "getSmartCorsHeaders\|handleCorsPreflightResponse\|corsResponse\|corsErrorResponse" "$file"; then
        log_warning "Ya tiene imports de CORS actualizados, omitiendo..."
        return 0
    fi
    
    # Agregar import de CORS si no existe
    if ! grep -q "cors.ts" "$file"; then
        # Buscar línea de último import para insertar después
        last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$last_import_line" ]; then
            sed -i "${last_import_line}a\\import { handleCorsPreflightResponse, corsResponse, corsErrorResponse } from '../_shared/cors.ts';" "$file"
            log_success "Import agregado"
        else
            log_error "No se encontraron imports existentes"
            return 1
        fi
    fi
    
    # Remover declaración de corsHeaders antigua
    if grep -q "const corsHeaders = {" "$file"; then
        sed -i '/^const corsHeaders = {/,/^};$/d' "$file"
        log_success "corsHeaders antiguo removido"
    fi
}

# Función para actualizar manejo de OPTIONS
update_options_handler() {
    local file="$1"
    log_info "Actualizando manejo de OPTIONS en $file"
    
    # Reemplazar el manejo de OPTIONS
    sed -i 's/return new Response('\''ok'\'', { headers: corsHeaders });/return handleCorsPreflightResponse(req);/g' "$file"
    sed -i 's/return new Response('\''ok'\'', { headers: corsHeaders })/return handleCorsPreflightResponse(req)/g' "$file"
    
    log_success "Manejo de OPTIONS actualizado"
}

# Función para actualizar responses exitosos
update_success_responses() {
    local file="$1"
    log_info "Actualizando responses exitosos en $file"
    
    # Patrón 1: Response con JSON.stringify y corsHeaders
    perl -i -pe '
        s/return new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+),?\s*headers:\s*\{\s*\.\.\.corsHeaders,?\s*([^}]*)\s*\}\s*\}\s*\);/return corsResponse($1, req, { status: $2 });/g;
        s/return new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*headers:\s*\{\s*\.\.\.corsHeaders,?\s*([^}]*)\s*\}\s*\}\s*\);/return corsResponse($1, req);/g;
    ' "$file"
    
    # Patrón 2: Response simple con corsHeaders
    perl -i -pe '
        s/return new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+)?,?\s*headers:\s*corsHeaders\s*\}\s*\);/return corsResponse($1, req, { status: $2 });/g;
    ' "$file"
    
    log_success "Responses exitosos actualizados"
}

# Función para actualizar responses de error
update_error_responses() {
    local file="$1"
    log_info "Actualizando responses de error en $file"
    
    # Patrón 1: Error con JSON.stringify, status y corsHeaders
    perl -i -pe '
        s/return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+),?\s*headers:\s*\{\s*\.\.\.corsHeaders,?\s*([^}]*)\s*\}\s*\}\s*\);/return corsErrorResponse($1, req, $2);/g;
    ' "$file"
    
    # Patrón 2: Error simple con corsHeaders
    perl -i -pe '
        s/return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+)?,?\s*headers:\s*corsHeaders\s*\}\s*\);/return corsErrorResponse($1, req, $2);/g;
    ' "$file"
    
    # Patrón 3: Errores con variables
    sed -i 's/return new Response(\s*JSON\.stringify({ error: \(.*\) }),\s*{ status: \([0-9]*\), headers: { \.\.\.corsHeaders.*} }\s*);/return corsErrorResponse(\1, req, \2);/g' "$file"
    
    log_success "Responses de error actualizados"
}

# Función para limpiar archivos después de transformaciones
cleanup_syntax() {
    local file="$1"
    log_info "Limpiando sintaxis en $file"
    
    # Remover headers corsHeaders sueltos que puedan haber quedado
    sed -i '/\.\.\.corsHeaders/d' "$file"
    
    # Arreglar calls mal formateados
    sed -i 's/corsErrorResponse(\([^,]*\), req, );/corsErrorResponse(\1, req, 500);/g' "$file"
    sed -i 's/corsResponse(\([^,]*\), req, { status:  });/corsResponse(\1, req);/g' "$file"
    
    log_success "Sintaxis limpiada"
}

# Función para validar el archivo después de cambios
validate_file() {
    local file="$1"
    log_info "Validando $file"
    
    # Verificar que tenga import de cors
    if ! grep -q "cors.ts" "$file"; then
        log_error "Falta import de cors.ts"
        return 1
    fi
    
    # Verificar que no tenga corsHeaders hardcodeado
    if grep -q "const corsHeaders = " "$file"; then
        log_warning "Aún tiene corsHeaders hardcodeado"
    fi
    
    # Verificar que use las nuevas funciones
    if grep -q "corsResponse\|corsErrorResponse\|handleCorsPreflightResponse" "$file"; then
        log_success "Usa nuevas funciones CORS"
    else
        log_warning "No se detectaron nuevas funciones CORS"
    fi
    
    # Verificar sintaxis básica de TypeScript
    if command -v tsc >/dev/null 2>&1; then
        if tsc --noEmit --skipLibCheck "$file" 2>/dev/null; then
            log_success "Sintaxis TypeScript válida"
        else
            log_warning "Posibles errores de sintaxis TypeScript"
        fi
    fi
}

# Función principal de migración
migrate_function() {
    local func_dir="$1"
    local func_name="$(basename "$func_dir")"
    local index_file="$func_dir/index.ts"
    
    echo ""
    echo "=================================================="
    log_info "Migrando función: $func_name"
    echo "=================================================="
    
    if [ ! -f "$index_file" ]; then
        log_error "No se encontró index.ts en $func_dir"
        return 1
    fi
    
    # Crear backup con timestamp
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$index_file.backup_$timestamp"
    cp "$index_file" "$backup_file"
    log_success "Backup creado: $backup_file"
    
    # Aplicar transformaciones en orden
    update_imports "$index_file" || { log_error "Falló actualización de imports"; return 1; }
    update_options_handler "$index_file"
    update_success_responses "$index_file"
    update_error_responses "$index_file"
    cleanup_syntax "$index_file"
    
    # Validar resultado
    validate_file "$index_file"
    
    log_success "Migración completada para: $func_name"
}

# Main execution
main() {
    echo "🔍 Buscando Edge Functions para migrar..."
    
    local count=0
    local success=0
    local failed=0
    
    for func_dir in "$FUNCTIONS_DIR"/*; do
        if [ -d "$func_dir" ] && [ "$(basename "$func_dir")" != "_shared" ]; then
            count=$((count + 1))
            
            if migrate_function "$func_dir"; then
                success=$((success + 1))
            else
                failed=$((failed + 1))
            fi
        fi
    done
    
    echo ""
    echo "=================================================="
    echo "🎉 MIGRACIÓN COMPLETADA"
    echo "=================================================="
    log_info "Total funciones procesadas: $count"
    log_success "Exitosas: $success"
    if [ $failed -gt 0 ]; then
        log_error "Fallidas: $failed"
    fi
    
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "1. Revisar logs de arriba para cualquier warning"
    echo "2. Probar funciones críticas manualmente"
    echo "3. Ejecutar tests: npm run cypress:run"
    echo "4. Si todo funciona, eliminar backups: rm supabase/functions/*/index.ts.backup_*"
    echo ""
    echo "💡 TROUBLESHOOTING:"
    echo "- Si algo falla, restaurar backup: cp archivo.backup_* archivo.ts"
    echo "- Verificar sintaxis: npx tsc --noEmit supabase/functions/nombre/index.ts"
    echo "- Revisar logs de Edge Functions en Supabase Dashboard"
}

# Verificar dependencias
if ! command -v perl >/dev/null 2>&1; then
    log_error "perl es requerido para las transformaciones regex avanzadas"
    exit 1
fi

# Ejecutar migración
main

echo ""
log_success "Script completado. Revisa los logs arriba para detalles."