import React, { useEffect, useState, useMemo } from 'react';
import { Package, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { fulfillmentService } from '../../services/fulfillmentService';
import { CuentoConPedido, EstadoFulfillment, ESTADOS_FULFILLMENT } from '../../types';
import TarjetaPedido from '../../components/Admin/TarjetaPedido';
import ModalEnvio from '../../components/Admin/ModalEnvio';
import EstadisticasPedidos from '../../components/Admin/EstadisticasPedidos';
import { supabase } from '../../lib/supabase';

const AdminPedidos: React.FC = () => {
  // Proteger la página con roles - admins y operadores pueden gestionar pedidos
  const { isAuthorized, isLoading: roleLoading } = useRoleGuard({
    requiredPermissions: ['orders.view'],
    redirectTo: '/unauthorized'
  });
  
  const [pedidos, setPedidos] = useState<CuentoConPedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoFulfillment | 'todos'>('todos');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<CuentoConPedido | null>(null);
  const [mostrarModalEnvio, setMostrarModalEnvio] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  // Cargar pedidos
  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const filtros = filtroEstado !== 'todos' ? { estado: filtroEstado } : undefined;
      const data = await fulfillmentService.obtenerCuentosConPedido(filtros);
      setPedidos(data);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Buscar pedidos
  const buscarPedidos = async () => {
    if (!textoBusqueda.trim()) {
      cargarPedidos();
      return;
    }

    try {
      setCargando(true);
      const data = await fulfillmentService.buscarPedidos(textoBusqueda);
      setPedidos(data);
    } catch (error) {
      console.error('Error buscando pedidos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Actualizar estado de pedido
  const actualizarEstado = async (pedidoId: string, nuevoEstado: EstadoFulfillment, notas?: string) => {
    try {
      setActualizando(true);
      await fulfillmentService.actualizarEstadoFulfillment(pedidoId, nuevoEstado, notas);
      
      // Actualizar lista local
      setPedidos(prev => prev.map(p => 
        p.id === pedidoId 
          ? { ...p, fulfillment_status: nuevoEstado }
          : p
      ));

      // Si hay un pedido seleccionado, actualizarlo también
      if (pedidoSeleccionado?.id === pedidoId) {
        setPedidoSeleccionado(prev => prev ? { ...prev, fulfillment_status: nuevoEstado } : null);
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    } finally {
      setActualizando(false);
    }
  };

  // Exportar pedidos
  const exportarPedidos = async () => {
    try {
      const filtros = filtroEstado !== 'todos' ? { estado: filtroEstado } : undefined;
      const csv = await fulfillmentService.exportarPedidos(filtros);
      
      // Descargar archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exportando pedidos:', error);
    }
  };

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!isAuthorized || roleLoading) return;

    cargarPedidos();

    // Suscribirse a cambios en stories completadas
    const channel = supabase
      .channel('pedidos_nuevos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: 'status=eq.completed'
        },
        () => {
          cargarPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized, roleLoading, filtroEstado]);

  // Filtrar pedidos localmente por búsqueda
  const pedidosFiltrados = useMemo(() => {
    if (!textoBusqueda.trim()) return pedidos;
    
    const texto = textoBusqueda.toLowerCase();
    return pedidos.filter(p => 
      p.title?.toLowerCase().includes(texto) ||
      p.user_name?.toLowerCase().includes(texto) ||
      p.user_email?.toLowerCase().includes(texto) ||
      p.shipping_info?.tracking_number?.toLowerCase().includes(texto)
    );
  }, [pedidos, textoBusqueda]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const stats = {
      total: pedidosFiltrados.length,
      porEstado: {} as Record<EstadoFulfillment, number>,
      pendientes: 0
    };

    pedidosFiltrados.forEach(p => {
      if (p.fulfillment_status) {
        stats.porEstado[p.fulfillment_status] = (stats.porEstado[p.fulfillment_status] || 0) + 1;
        if (p.fulfillment_status === 'pendiente') {
          stats.pendientes++;
        }
      }
    });

    return stats;
  }, [pedidosFiltrados]);

  // Mostrar loader mientras se verifica autorización
  if (roleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si no está autorizado, el hook ya redirigirá
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={cargarPedidos}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={cargando}
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={exportarPedidos}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <EstadisticasPedidos estadisticas={estadisticas} />

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-4">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, usuario, email o tracking..."
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarPedidos()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoFulfillment | 'todos')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            {Object.entries(ESTADOS_FULFILLMENT).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron pedidos</p>
          </div>
        ) : (
          pedidosFiltrados.map(pedido => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              onActualizarEstado={actualizarEstado}
              onVerDetalles={() => {
                setPedidoSeleccionado(pedido);
                setMostrarModalEnvio(true);
              }}
              actualizando={actualizando}
            />
          ))
        )}
      </div>

      {/* Modal de envío */}
      {mostrarModalEnvio && pedidoSeleccionado && (
        <ModalEnvio
          pedido={pedidoSeleccionado}
          onClose={() => {
            setMostrarModalEnvio(false);
            setPedidoSeleccionado(null);
          }}
          onUpdate={cargarPedidos}
        />
      )}
    </div>
  );
};

export default AdminPedidos;