Épica: WIZARD - [1] CREACIÓN DE PERSONAJE
Categoría: feature/Generación múltiple de miniaturas con estilos
Notas para devs: Esta funcionalidad debe implementarse con tareas asíncronas transparentes para el usuario

Archivos afectados:
- src/components/Wizard/CharacterCreation/GenerateThumbnail.tsx
- src/components/Wizard/CharacterCreation/CharacterForm.tsx
- src/services/characterService.ts (posible nuevo archivo)
- src/services/promptService.ts (posible nuevo archivo)
- src/types/character.ts
- src/hooks/useCharacter.ts

🧠 Contexto:
Actualmente, al crear un personaje solo se genera una miniatura principal. Se requiere ampliar esta funcionalidad para generar automáticamente varias versiones de miniaturas en diferentes estilos y vistas, sin que el usuario deba interactuar explícitamente para cada una. Estas miniaturas adicionales se utilizarán posteriormente en diferentes secciones de la aplicación para enriquecer la experiencia visual.

📐 Objetivo:
Implementar un sistema de generación asíncrona de múltiples miniaturas de personaje con distintos estilos y vistas cuando el usuario hace clic en "generar miniatura". El proceso debe ocurrir en segundo plano sin afectar la experiencia del usuario, manteniendo el estándar de código actual.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

    La generación de todas las miniaturas adicionales se inicia automáticamente tras hacer clic en "generar miniatura"
    
    El proceso ocurre en segundo plano sin bloquear la interfaz de usuario
    
    Se generan miniaturas con 7 estilos/vistas diferentes: Kawaii, Acuarela Digital, Bordado, Mano, Recortes, Vista Trasera, Vista Lateral
    
    Cada miniatura se almacena correctamente en el bucket de storage siguiendo la estructura propuesta
    
    Se actualiza la base de datos con las referencias a todas las miniaturas generadas
    
    El código mantiene la estructura y estándares actuales del proyecto
    
    Las tareas asíncronas manejan correctamente errores sin interrumpir el flujo principal

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

    El usuario no debe percibir lentitud o bloqueo en la interfaz durante la generación
    
    No deben aparecer errores visibles al usuario durante el proceso de generación múltiple
    
    No debe interrumpirse el flujo normal de creación de personaje
    
    No debe haber duplicación de miniaturas o inconsistencias en la base de datos
    
    Las pruebas de Cypress no deben fallar tras esta implementación

🧪 QA / Casos de prueba esperados:

    Hacer clic en "generar miniatura" → la miniatura principal se muestra correctamente y el usuario puede continuar con el flujo
    
    Verificar que tras generar la miniatura principal, las tareas asíncronas se inician correctamente
    
    Comprobar que todas las miniaturas adicionales se generan y almacenan correctamente en sus ubicaciones correspondientes
    
    Verificar que las miniaturas generadas son accesibles desde las rutas de storage definidas
    
    Comprobar que los registros en la base de datos se actualizan correctamente con todas las URLs de las miniaturas
    
    Verificar que las pruebas end-to-end de Cypress siguen funcionando con la nueva implementación

EXTRAS:

    ### Obtención de Prompts
    Los prompts se obtendrán de la tabla `public.prompts` usando los siguientes tipos:
    - PROMPT_ESTILO_KAWAII
    - PROMPT_ESTILO_ACUARELADIGITAL
    - PROMPT_ESTILO_BORDADO
    - PROMPT_ESTILO_MANO
    - PROMPT_ESTILO_RECORTES
    - PROMPT_VARIANTE_TRASERA
    - PROMPT_VARIANTE_LATERAL

    ### Proceso de Generación
    1. Obtener todos los prompts necesarios en una sola consulta al iniciar el proceso
    2. Combinar cada prompt con la miniatura principal
    3. Enviar las solicitudes de generación en paralelo
    4. Esperar a que todas las generaciones terminen (éxito o fallo)
    5. Actualizar la base de datos con los resultados

    ### Estructura de Almacenamiento
    - thumbnails/{id_usuario}/{id_personaje}_principal.png (miniatura principal)
    - thumbnails/{id_usuario}/{id_personaje}_kawaii.png
    - thumbnails/{id_usuario}/{id_personaje}_acuarela.png
    - thumbnails/{id_usuario}/{id_personaje}_bordado.png
    - thumbnails/{id_usuario}/{id_personaje}_mano.png
    - thumbnails/{id_usuario}/{id_personaje}_recortes.png
    - thumbnails/{id_usuario}/{id_personaje}_trasera.png
    - thumbnails/{id_usuario}/{id_personaje}_lateral.png
    
    ### Modelo de Datos
    Crear tabla relacionada `character_thumbnails`:
    ```sql
    CREATE TABLE public.character_thumbnails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
      style_type TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(character_id, style_type)
    );
    ```
    
    Las generaciones de miniaturas deben ejecutarse en paralelo para optimizar el tiempo de respuesta.
    
    Implementar manejo de errores con reintentos automáticos en caso de fallos.
    
    Agregar logs detallados para facilitar la depuración en caso de problemas con la generación asíncrona.