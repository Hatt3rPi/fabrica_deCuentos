import { supabase } from '../lib/supabase';

// Tipos para el sistema de precios
export interface ProductType {
  id: string;
  name: string;
  description: string;
  category: 'digital' | 'physical' | 'premium';
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  id: string;
  product_type_id: string;
  price: number;
  currency: string;
  valid_from: string;
  valid_to: string | null;
  discount_percentage: number;
  final_price: number;
  created_by: string | null;
  created_at: string;
  notes: string | null;
}

export interface PriceInfo {
  price: number;
  final_price: number;
  currency: string;
}

export interface Order {
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
}

export interface OrderItem {
  id: string;
  order_id: string;
  story_id: string;
  product_type_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  created_at: string;
}

export interface CreateOrderData {
  storyIds: string[];
  productTypeId: string;
  paymentMethod?: string;
}

class PriceService {
  
  // Gestión de tipos de productos
  async getProductTypes(): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching product types:', error);
      throw new Error('Error al obtener tipos de productos');
    }

    return data || [];
  }

  async createProductType(productType: Omit<ProductType, 'id' | 'created_at' | 'updated_at'>): Promise<ProductType> {
    const { data, error } = await supabase
      .from('product_types')
      .insert(productType)
      .select()
      .single();

    if (error) {
      console.error('Error creating product type:', error);
      throw new Error('Error al crear tipo de producto');
    }

    return data;
  }

  async updateProductType(id: string, updates: Partial<ProductType>): Promise<ProductType> {
    const { data, error } = await supabase
      .from('product_types')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product type:', error);
      throw new Error('Error al actualizar tipo de producto');
    }

    return data;
  }

  // Gestión de precios
  async getCurrentPrice(productTypeId: string): Promise<PriceInfo | null> {
    const { data, error } = await supabase
      .rpc('get_current_price', { p_product_type_id: productTypeId });

    if (error) {
      console.error('Error fetching current price:', error);
      throw new Error('Error al obtener precio actual');
    }

    return data?.[0] || null;
  }

  async createPrice(priceData: Omit<ProductPrice, 'id' | 'created_at' | 'final_price'>): Promise<ProductPrice> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('product_prices')
      .insert({
        ...priceData,
        created_by: userData.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating price:', error);
      throw new Error('Error al crear precio');
    }

    return data;
  }

  async getPriceHistory(productTypeId: string): Promise<ProductPrice[]> {
    const { data, error } = await supabase
      .from('product_prices')
      .select('*')
      .eq('product_type_id', productTypeId)
      .order('valid_from', { ascending: false });

    if (error) {
      console.error('Error fetching price history:', error);
      throw new Error('Error al obtener historial de precios');
    }

    return data || [];
  }

  // Gestión de órdenes
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener precio actual del producto
    const priceInfo = await this.getCurrentPrice(orderData.productTypeId);
    if (!priceInfo) {
      throw new Error('Precio no disponible para este producto');
    }

    // Calcular total
    const subtotal = priceInfo.final_price * orderData.storyIds.length;
    const totalAmount = subtotal; // Sin impuestos por ahora

    // Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        order_type: orderData.storyIds.length > 1 ? 'cart' : 'individual',
        subtotal,
        total_amount: totalAmount,
        currency: priceInfo.currency,
        payment_method: orderData.paymentMethod,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Error al crear orden');
    }

    // Crear items de la orden
    const orderItems = orderData.storyIds.map(storyId => ({
      order_id: order.id,
      story_id: storyId,
      product_type_id: orderData.productTypeId,
      quantity: 1,
      unit_price: priceInfo.final_price,
      total_price: priceInfo.final_price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Error al crear items de la orden');
    }

    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      console.error('Error fetching order:', error);
      throw new Error('Error al obtener orden');
    }

    return data;
  }

  async getUserOrders(limit: number = 20): Promise<Order[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user orders:', error);
      throw new Error('Error al obtener órdenes del usuario');
    }

    return data || [];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching order items:', error);
      throw new Error('Error al obtener items de la orden');
    }

    return data || [];
  }

  // Procesamiento de pagos
  async processPayment(orderId: string, paymentMethod: string, paymentData: Record<string, any> = {}): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase
      .rpc('process_order_payment', {
        p_order_id: orderId,
        p_payment_method: paymentMethod,
        p_payment_data: paymentData
      });

    if (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }

    return data;
  }

  // Vista completa de órdenes con items (para admin)
  async getOrdersWithItems(filters?: { status?: string; limit?: number }): Promise<any[]> {
    let query = supabase
      .from('orders_with_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders with items:', error);
      throw new Error('Error al obtener órdenes completas');
    }

    return data || [];
  }

  // Utilities
  async getDefaultProductType(): Promise<ProductType | null> {
    const productTypes = await this.getProductTypes();
    return productTypes.find(pt => pt.name === 'Libro Digital') || null;
  }

  formatPrice(amount: number, currency: string = 'CLP'): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  isOrderExpired(order: Order): boolean {
    return new Date(order.expires_at) < new Date();
  }

  canPayOrder(order: Order): boolean {
    return order.status === 'pending' && !this.isOrderExpired(order);
  }
}

export const priceService = new PriceService();