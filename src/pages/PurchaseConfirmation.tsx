import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, FileDown, BookOpen, Loader2, Package, Calendar, Home, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useOrderFulfillment } from '../hooks/useOrderFulfillment';
import { priceService } from '../services/priceService';
import Button from '../components/UI/Button';
import { OrderWithItems } from '../types';

const PurchaseConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook para procesar fulfillment
  const { isProcessing: isGeneratingPdfs, pdfUrls, error: fulfillmentError } = useOrderFulfillment(orderId || null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!orderId) {
      setError('ID de orden no válido');
      setIsLoading(false);
      return;
    }

    loadOrderDetails();
  }, [user, orderId, navigate]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener detalles de la orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .eq('status', 'paid')
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          setError('Orden no encontrada o no pagada');
        } else {
          throw orderError;
        }
        return;
      }

      // Obtener items de la orden con detalles de historias
      const items = await priceService.getOrderItems(orderData.id);
      
      // Obtener detalles de cada historia
      const storyIds = items.map(item => item.story_id);
      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, title, cover_url, pdf_url, export_url')
        .in('id', storyIds);
      
      // Mapear historias con items
      const itemsWithStories = items.map(item => ({
        ...item,
        story: storiesData?.find(story => story.id === item.story_id)
      }));

      setOrder({
        ...orderData,
        items: itemsWithStories
      });
    } catch (err) {
      console.error('Error cargando detalles de orden:', err);
      setError('Error al cargar los detalles de tu compra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = (pdfUrl: string, storyTitle: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      alert(`El PDF de "${storyTitle}" aún se está generando. Por favor intenta en unos momentos.`);
    }
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/read/${storyId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando detalles de tu compra...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Orden no encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'No se pudo cargar la información de tu compra.'}
          </p>
          <Button onClick={() => navigate('/')} size="lg">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header de confirmación */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Compra exitosa!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tu pedido ha sido procesado correctamente
          </p>
        </div>

        {/* Detalles de la orden */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* Header de orden */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Orden #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(order.paid_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {priceService.formatPrice(order.total_amount)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {order.payment_method === 'flow' ? 'Tarjeta' : 'WebPay Plus'}
                </p>
              </div>
            </div>
          </div>

          {/* Estado de generación */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {isGeneratingPdfs ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Generando tus libros digitales
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Esto puede tomar unos minutos. Te notificaremos cuando estén listos.
                    </p>
                  </div>
                </div>
              </div>
            ) : Object.keys(pdfUrls).length > 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      ¡Tus libros están listos!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Ya puedes descargar y leer tus historias personalizadas.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Preparando tus libros
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Recibirás un email cuando tus PDFs estén listos para descargar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {fulfillmentError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  ⚠️ Hubo un problema generando los PDFs. Por favor contacta soporte.
                </p>
              </div>
            )}
          </div>

          {/* Items de la orden */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {order.items.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-center gap-4">
                  {/* Thumbnail de la historia */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {item.story?.cover_url ? (
                      <img
                        src={item.story.cover_url}
                        alt={item.story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info de la historia */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.story?.title || 'Historia sin título'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Libro Digital × {item.quantity}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => item.story && handleReadStory(item.story.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Leer
                    </Button>
                    
                    <Button
                      onClick={() => item.story && handleDownloadPdf(
                        item.story.pdf_url || item.story.export_url || '',
                        item.story.title
                      )}
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={!(item.story?.pdf_url || item.story?.export_url)}
                    >
                      <FileDown className="w-4 h-4" />
                      {(item.story?.pdf_url || item.story?.export_url) ? 'Descargar PDF' : 'Generando...'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate('/my-purchases')}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Ver mis compras
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Crear nueva historia
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmation;