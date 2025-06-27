import { supabase } from '../lib/supabase';
import { CuentoConPedido, EstadoFulfillment, InformacionEnvio } from '../types';

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
    
    // Debug temporal para verificar export_url
    console.log('[fulfillmentService] Cuentos obtenidos:', data?.map(c => ({
      id: c.id,
      title: c.title,
      export_url: c.export_url
    })));
    
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
    
    // Debug temporal para verificar export_url en búsqueda
    console.log('[fulfillmentService] Búsqueda - Cuentos encontrados:', data?.map(c => ({
      id: c.id,
      title: c.title,
      export_url: c.export_url
    })));
    
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
  }
};