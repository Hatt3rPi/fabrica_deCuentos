#!/bin/bash

# Script para actualizar CORS en todas las Edge Functions
# Automatiza la migración al sistema centralizado de CORS

echo "🚀 Iniciando actualización de CORS en Edge Functions..."

# Directorio de funciones
FUNCTIONS_DIR="supabase/functions"

# Función para actualizar imports
update_imports() {
    local file="$1"
    echo "📝 Actualizando imports en $file"
    
    # Agregar import de CORS si no existe
    if ! grep -q "cors.ts" "$file"; then
        # Buscar línea de último import para insertar después
        last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$last_import_line" ]; then
            sed -i "${last_import_line}a\\import { handleCorsPreflightResponse, corsResponse, corsErrorResponse } from '../_shared/cors.ts';" "$file"
        fi
    fi
    
    # Remover declaración de corsHeaders
    sed -i '/^const corsHeaders = {/,/^};$/d' "$file"
}

# Función para actualizar manejo de OPTIONS
update_options_handler() {
    local file="$1"
    echo "🔄 Actualizando manejo de OPTIONS en $file"
    
    # Reemplazar el manejo de OPTIONS
    sed -i 's/return new Response('\''ok'\'', { headers: corsHeaders });/return handleCorsPreflightResponse(req);/g' "$file"
}

# Función para actualizar responses
update_responses() {
    local file="$1"
    echo "🔧 Actualizando responses en $file"
    
    # Esto es más complejo y requiere análisis manual para cada función
    # Por ahora solo hacemos los cambios básicos
    echo "⚠️  Revisar manualmente responses en $file"
}

# Procesar cada función
for func_dir in "$FUNCTIONS_DIR"/*; do
    if [ -d "$func_dir" ] && [ "$(basename "$func_dir")" != "_shared" ]; then
        func_name=$(basename "$func_dir")
        index_file="$func_dir/index.ts"
        
        if [ -f "$index_file" ]; then
            echo "🔨 Procesando función: $func_name"
            
            # Crear backup
            cp "$index_file" "$index_file.backup"
            
            # Aplicar cambios
            update_imports "$index_file"
            update_options_handler "$index_file"
            update_responses "$index_file"
            
            echo "✅ Completado: $func_name"
        fi
    fi
done

echo ""
echo "🎉 Actualización de CORS completada!"
echo ""
echo "📋 Pasos siguientes:"
echo "1. Revisar manualmente cada función para actualizar responses"
echo "2. Probar las funciones actualizadas"
echo "3. Eliminar archivos .backup una vez confirmado"
echo ""
echo "💡 Usa 'corsResponse()' y 'corsErrorResponse()' para responses consistentes"