import { supabase } from '../lib/supabase';
import { CuentoConPedido, EstadoFulfillment, InformacionEnvio } from '../types';

// Tipos para órdenes de carrito
export interface OrderWithPayment {
  id: string;
  user_id: string;
  order_type: 'cart' | 'individual' | 'subscription';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_data: Record<string, any>;
  expires_at: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  story_id: string;
  story_title?: string;
  product_type_id: string;
  product_type_name?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  created_at: string;
}

export const fulfillmentService = {
  /**
   * Obtiene todos los cuentos completados con información de pedido
   */
  async obtenerCuentosConPedido(filtros?: {
    estado?: EstadoFulfillment;
    desde?: string;
    hasta?: string;
  }) {
    let query = supabase
      .from('pedidos_view')
      .select('*')
      .order('completed_at', { ascending: false });

    // Aplicar filtros opcionales
    if (filtros?.estado) {
      query = query.eq('fulfillment_status', filtros.estado);
    }
    
    if (filtros?.desde) {
      query = query.gte('completed_at', filtros.desde);
    }
    
    if (filtros?.hasta) {
      query = query.lte('completed_at', filtros.hasta);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as CuentoConPedido[];
  },

  /**
   * Actualiza el estado de fulfillment de un pedido
   */
  async actualizarEstadoFulfillment(
    storyId: string,
    nuevoEstado: EstadoFulfillment,
    notas?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuario no autenticado');

    // Usar la función RPC para actualizar con historial
    const { error } = await supabase.rpc('update_fulfillment_status', {
      p_story_id: storyId,
      p_new_status: nuevoEstado,
      p_user_id: user.id,
      p_notes: notas
    });

    if (error) throw error;
  },

  /**
   * Obtiene o crea información de envío para un pedido
   */
  async obtenerInformacionEnvio(storyId: string) {
    const { data, error } = await supabase
      .from('shipping_info')
      .select('*')
      .eq('story_id', storyId)
      .single();

    if (error && error.code !== 'PGRST116') { // No es error de "no encontrado"
      throw error;
    }

    return data as InformacionEnvio | null;
  },

  /**
   * Actualiza la información de envío
   */
  async actualizarInformacionEnvio(
    storyId: string,
    datosEnvio: Partial<InformacionEnvio>
  ) {
    const { data: existente } = await supabase
      .from('shipping_info')
      .select('id')
      .eq('story_id', storyId)
      .single();

    if (existente) {
      // Actualizar registro existente
      const { error } = await supabase
        .from('shipping_info')
        .update({
          ...datosEnvio,
          updated_at: new Date().toISOString()
        })
        .eq('story_id', storyId);

      if (error) throw error;
    } else {
      // Crear nuevo registro
      const { error } = await supabase
        .from('shipping_info')
        .insert({
          story_id: storyId,
          ...datosEnvio
        });

      if (error) throw error;
    }
  },

  /**
   * Obtiene estadísticas de pedidos
   */
  async obtenerEstadisticasPedidos() {
    const { data: pedidos } = await supabase
      .from('stories')
      .select('fulfillment_status')
      .eq('status', 'completed')
      .not('fulfillment_status', 'is', null);

    if (!pedidos) return {
      total: 0,
      porEstado: {},
      pendientes: 0
    };

    const estadisticas = pedidos.reduce((acc, pedido) => {
      const estado = pedido.fulfillment_status as EstadoFulfillment;
      acc.porEstado[estado] = (acc.porEstado[estado] || 0) + 1;
      if (estado === 'pendiente') {
        acc.pendientes++;
      }
      return acc;
    }, {
      total: pedidos.length,
      porEstado: {} as Record<EstadoFulfillment, number>,
      pendientes: 0
    });

    return estadisticas;
  },

  /**
   * Busca pedidos por texto (título, usuario, tracking)
   */
  async buscarPedidos(textoBusqueda: string) {
    // Búsqueda en múltiples campos usando OR
    const { data, error } = await supabase
      .from('pedidos_view')
      .select('*')
      .or(`title.ilike.%${textoBusqueda}%,user_name.ilike.%${textoBusqueda}%,user_email.ilike.%${textoBusqueda}%,tracking_number.ilike.%${textoBusqueda}%`)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data as CuentoConPedido[];
  },

  /**
   * Exporta pedidos a formato CSV
   */
  async exportarPedidos(filtros?: {
    estado?: EstadoFulfillment;
    desde?: string;
    hasta?: string;
  }) {
    const pedidos = await this.obtenerCuentosConPedido(filtros);
    
    // Convertir a CSV
    const headers = [
      'ID Pedido',
      'Título',
      'Usuario',
      'Email',
      'Estado',
      'Fecha Completado',
      'Ciudad',
      'Región',
      'Número Tracking',
      'Courier'
    ];

    const rows = pedidos.map(p => [
      p.id,
      p.title,
      p.user_name || '',
      p.user_email || '',
      p.fulfillment_status || '',
      p.completed_at || '',
      p.shipping_info?.city || '',
      p.shipping_info?.region || '',
      p.shipping_info?.tracking_number || '',
      p.shipping_info?.courier || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  },

  // ==========================================
  // MÉTODOS PARA ÓRDENES DE CARRITO
  // ==========================================

  /**
   * Obtiene órdenes con información de pago y items
   */
  async obtenerOrdenesConPago(filtros?: {
    status?: string;
    orderType?: string;
    desde?: string;
    hasta?: string;
    limit?: number;
  }): Promise<OrderWithPayment[]> {
    const { data, error } = await supabase
      .from('orders_with_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filtros?.limit || 50);

    if (error) throw error;
    return data as OrderWithPayment[];
  },

  /**
   * Crea registros de fulfillment para todas las historias de una orden
   */
  async crearFulfillmentParaOrden(orderId: string): Promise<void> {
    // Obtener items de la orden
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        story_id,
        quantity,
        orders!inner(
          user_id,
          payment_method,
          total_amount
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    if (!orderItems || orderItems.length === 0) {
      throw new Error('No se encontraron items para la orden');
    }

    // Actualizar fulfillment_status para todas las historias de la orden
    const storyIds = orderItems.map(item => item.story_id);
    
    const { error: updateError } = await supabase
      .from('stories')
      .update({ 
        fulfillment_status: 'pendiente',
        updated_at: new Date().toISOString()
      })
      .in('id', storyIds)
      .is('fulfillment_status', null); // Solo actualizar si no tiene estado

    if (updateError) throw updateError;

    // Crear historial de fulfillment para cada historia
    const historialEntries = orderItems.map(item => ({
      story_id: item.story_id,
      from_status: null,
      to_status: 'pendiente' as EstadoFulfillment,
      notes: `Orden de carrito procesada. ID: ${orderId.slice(0, 8)}...`
    }));

    const { error: historyError } = await supabase
      .from('fulfillment_history')
      .insert(historialEntries);

    if (historyError) throw historyError;
  },

  /**
   * Obtiene órdenes con fulfillment pendiente
   */
  async obtenerOrdenesPendientes(): Promise<OrderWithPayment[]> {
    const { data, error } = await supabase
      .from('orders_with_items')
      .select('*')
      .eq('status', 'paid')
      .order('paid_at', { ascending: true });

    if (error) throw error;
    
    // Filtrar órdenes que tienen historias con fulfillment pendiente
    const ordenesConPendientes = [];
    
    for (const orden of data) {
      if (orden.items && orden.items.length > 0) {
        // Verificar si alguna historia de la orden tiene fulfillment pendiente
        const storyIds = orden.items.map(item => item.story_id);
        
        const { data: stories, error: storiesError } = await supabase
          .from('stories')
          .select('id, fulfillment_status')
          .in('id', storyIds);

        if (!storiesError && stories) {
          const tienePendientes = stories.some(story => 
            story.fulfillment_status === 'pendiente' || story.fulfillment_status === null
          );
          
          if (tienePendientes) {
            ordenesConPendientes.push(orden);
          }
        }
      }
    }

    return ordenesConPendientes as OrderWithPayment[];
  },

  /**
   * Actualiza el estado de fulfillment para todas las historias de una orden
   */
  async actualizarFulfillmentOrden(
    orderId: string,
    nuevoEstado: EstadoFulfillment,
    notas?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener historias de la orden
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('story_id')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;
    if (!orderItems || orderItems.length === 0) {
      throw new Error('No se encontraron historias para la orden');
    }

    // Actualizar cada historia usando la función RPC
    for (const item of orderItems) {
      await this.actualizarEstadoFulfillment(
        item.story_id,
        nuevoEstado,
        notas ? `${notas} (Orden: ${orderId.slice(0, 8)}...)` : `Actualización masiva de orden ${orderId.slice(0, 8)}...`
      );
    }
  },

  /**
   * Obtiene estadísticas combinadas (historias individuales + órdenes)
   */
  async obtenerEstadisticasCompletas() {
    const [estadisticasIndividuales, ordenesData] = await Promise.all([
      this.obtenerEstadisticasPedidos(),
      this.obtenerOrdenesConPago({ limit: 1000 })
    ]);

    const ordenesStats = {
      totalOrdenes: ordenesData.length,
      ordenesPagadas: ordenesData.filter(o => o.status === 'paid').length,
      ordenesPendientes: ordenesData.filter(o => o.status === 'pending').length,
      ingresosTotales: ordenesData
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0)
    };

    return {
      ...estadisticasIndividuales,
      ordenes: ordenesStats
    };
  }
};