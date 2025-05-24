Épica: Home
Categoría: improvement/Reposicionar notificaciones
Notas para devs: Este cambio afecta la experiencia de usuario pero no modifica la funcionalidad de las notificaciones.

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/src/components/Notifications/NotificationBell.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Notifications/NotificationCenter.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Layout/Header.tsx (posible)

🧠 Contexto:
Actualmente, las notificaciones aparecen en la parte derecha de la pantalla cuando el usuario hace clic en el icono de la campana. Se requiere cambiar la posición para mejorar la visibilidad y la experiencia de usuario, mostrándolas en la parte superior izquierda, justo debajo del header.

📐 Objetivo:
Reposicionar el centro de notificaciones para que aparezca en la esquina superior izquierda de la pantalla, justo debajo del header, manteniendo toda la funcionalidad actual.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

    El componente NotificationCenter debe aparecer en la esquina superior izquierda, debajo del header
    
    La animación de apertura debe ser fluida y coherente con la nueva posición
    
    El contador de notificaciones no leídas debe seguir siendo visible en el icono de la campana
    
    La funcionalidad completa de las notificaciones debe mantenerse (marcar como leído, eliminar, etc.)
    
    El diseño debe ser responsivo y adaptarse correctamente a dispositivos móviles

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

    Las notificaciones no deben superponerse con otros elementos de la interfaz
    
    No debe haber problemas de z-index que oculten las notificaciones detrás de otros componentes
    
    No debe perderse funcionalidad al cambiar la posición
    
    No debe haber problemas de rendimiento al abrir/cerrar el panel de notificaciones

🧪 QA / Casos de prueba esperados:

    Hacer clic en el icono de la campana → el panel de notificaciones debe abrirse en la esquina superior izquierda
    
    Verificar en diferentes tamaños de pantalla → el panel debe adaptarse correctamente
    
    Hacer clic fuera del panel → debe cerrarse correctamente
    
    Verificar que las pruebas de Cypress relacionadas con notificaciones siguen funcionando

EXTRAS:

    Considerar agregar una transición suave para la apertura del panel en la nueva posición
    
    Asegurar que el panel no obstaculice elementos importantes de la interfaz en la nueva posición
    
    Verificar la accesibilidad del componente en la nueva posición (navegación por teclado, lectores de pantalla)
