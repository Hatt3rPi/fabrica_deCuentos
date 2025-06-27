import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { showToast } from '../utils/toast';

interface NotificacionesPedidos {
  pedidosPendientes: number;
  nuevosPedidos: number;
  resetearNuevos: () => void;
}

export const useNotificacionesPedidos = (): NotificacionesPedidos => {
  const isAdmin = useAdmin();
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [nuevosPedidos, setNuevosPedidos] = useState(0);
  const [ultimaVerificacion, setUltimaVerificacion] = useState<Date>(new Date());

  // Cargar conteo inicial de pedidos pendientes
  const cargarPedidosPendientes = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { count } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .eq('fulfillment_status', 'pendiente');

      setPedidosPendientes(count || 0);
    } catch (error) {
      console.error('Error cargando pedidos pendientes:', error);
    }
  }, [isAdmin]);

  // Verificar si un pedido es nuevo (creado después de la última verificación)
  const verificarPedidoNuevo = useCallback((completedAt: string) => {
    const fechaCompletado = new Date(completedAt);
    return fechaCompletado > ultimaVerificacion;
  }, [ultimaVerificacion]);

  // Manejar nuevos pedidos
  const handleNuevoPedido = useCallback((payload: any) => {
    if (payload.new.status === 'completed' && payload.new.fulfillment_status === 'pendiente') {
      // Incrementar contador de nuevos pedidos
      setNuevosPedidos(prev => prev + 1);
      
      // Mostrar notificación toast
      showToast({
        type: 'info',
        message: `📦 Nuevo pedido recibido: ${payload.new.title}`,
        duration: 5000
      });

      // Reproducir sonido de notificación (opcional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignorar errores de reproducción (ej: autoplay bloqueado)
        });
      } catch {
        // Ignorar si no hay archivo de audio
      }

      // Actualizar contador de pendientes
      cargarPedidosPendientes();
    }
  }, [cargarPedidosPendientes]);

  // Resetear contador de nuevos
  const resetearNuevos = useCallback(() => {
    setNuevosPedidos(0);
    setUltimaVerificacion(new Date());
  }, []);

  // Solicitar permisos de notificación del navegador
  const solicitarPermisosNotificacion = useCallback(async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permisos de notificación concedidos');
      }
    }
  }, []);

  // Mostrar notificación del navegador
  const mostrarNotificacionNavegador = useCallback((titulo: string, mensaje: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      const notification = new Notification(titulo, {
        body: mensaje,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'nuevo-pedido',
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'Ver pedidos' }
        ]
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/admin/pedidos';
        notification.close();
      };

      // Auto-cerrar después de 10 segundos
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      // Fallback a notificación simple si las avanzadas no están soportadas
      new Notification(titulo, {
        body: mensaje,
        icon: '/icon-192.png'
      });
    }
  }, []);

  // Configurar suscripciones en tiempo real
  useEffect(() => {
    if (!isAdmin) return;

    // Cargar estado inicial
    cargarPedidosPendientes();
    solicitarPermisosNotificacion();

    // Suscribirse a cambios en stories
    const channel = supabase
      .channel('pedidos_notificaciones')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: 'status=eq.completed'
        },
        (payload) => {
          handleNuevoPedido(payload);
          
          // Mostrar notificación del navegador si está habilitada
          if (Notification.permission === 'granted' && payload.new.title) {
            mostrarNotificacionNavegador(
              '📦 Nuevo pedido recibido',
              `${payload.new.title} está listo para procesar`
            );
          }
        }
      )
      .subscribe();

    // Verificar pedidos pendientes cada 5 minutos
    const interval = setInterval(cargarPedidosPendientes, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAdmin, cargarPedidosPendientes, handleNuevoPedido, solicitarPermisosNotificacion, mostrarNotificacionNavegador]);

  return {
    pedidosPendientes,
    nuevosPedidos,
    resetearNuevos
  };
};