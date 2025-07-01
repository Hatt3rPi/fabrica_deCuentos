// Tipos centralizados para el sistema de órdenes y compras

export interface StoryDetails {
  id: string;
  title: string;
  cover_url?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
}

export interface OrderItem {
  id: string;
  story_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  story_title?: string;
}

export interface OrderItemWithStory extends OrderItem {
  story?: StoryDetails;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  total_amount: number;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
  
  // Fulfillment fields
  fulfillment_status?: 'pending' | 'processing' | 'completed' | 'failed';
  fulfilled_at?: string;
  fulfillment_notes?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithStory[];
}

export interface OrderForFulfillment extends Order {
  items: OrderItem[];
}

export interface PurchaseStatus {
  isPurchased: boolean;
  pdfUrl?: string;
  orderId?: string;
  purchasedAt?: string;
  isLoading: boolean;
}

export interface FulfillmentResult {
  storyId: string;
  pdfUrl?: string;
  error?: Error | string;
  success: boolean;
}

export interface FulfillmentBatchResult {
  successful: FulfillmentResult[];
  failed: FulfillmentResult[];
  totalProcessed: number;
}