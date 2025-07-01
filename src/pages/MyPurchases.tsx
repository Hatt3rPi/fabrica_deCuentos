import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, BookOpen, Calendar, Package, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { priceService } from '../services/priceService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import PurchaseErrorBoundary from '../components/ErrorBoundary/PurchaseErrorBoundary';
import { OrderWithItems } from '../types';

const MyPurchases: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ORDERS_PER_PAGE = 5;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadPurchases();
  }, [user, navigate, currentPage]);

  const loadPurchases = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero obtener el total de órdenes pagadas para paginación
      const { data: totalData } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'paid');
      
      const total = totalData?.length || 0;
      setTotalOrders(total);
      setTotalPages(Math.ceil(total / ORDERS_PER_PAGE));

      // Obtener órdenes pagadas paginadas
      const offset = (currentPage - 1) * ORDERS_PER_PAGE;
      const { data: paidOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .range(offset, offset + ORDERS_PER_PAGE - 1);

      if (ordersError) throw ordersError;

      // Para cada orden, obtener sus items con detalles de historias
      const ordersWithDetails = await Promise.all(
        (paidOrders || []).map(async (order) => {
          const items = await priceService.getOrderItems(order.id);
          
          // Obtener detalles de cada historia en lotes para mejor rendimiento
          const storyIds = items.map(item => item.story_id);
          const { data: storiesData } = await supabase
            .from('stories')
            .select('id, title, cover_url, pdf_url')
            .in('id', storyIds);
          
          // Mapear historias con items
          const itemsWithStories = items.map(item => ({
            ...item,
            story: storiesData?.find(story => story.id === item.story_id)
          }));

          return {
            ...order,
            items: itemsWithStories
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (err) {
      console.error('Error cargando compras:', err);
      setError('Error al cargar tus compras. Por favor intenta nuevamente.');
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
          <p className="text-gray-600 dark:text-gray-400">Cargando tus compras...</p>
        </div>
      </div>
    );
  }

  return (
    <PurchaseErrorBoundary 
      fallbackTitle="Error al cargar tus compras"
      fallbackMessage="No se pudieron cargar tus compras. Verifica tu conexión e intenta nuevamente."
    >
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver al inicio
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mis Compras
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aquí puedes ver todas tus historias compradas y descargar los PDFs
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tienes compras aún
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Cuando compres historias, aparecerán aquí para que puedas descargarlas
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              Explorar historias
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Order header */}
                  <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Orden #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          Comprado el {new Date(order.paid_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {priceService.formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Story thumbnail */}
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

                          {/* Story info */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {item.story?.title || 'Historia sin título'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Libro Digital × {item.quantity}
                            </p>
                          </div>

                          {/* Actions */}
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
                                item.story.pdf_url || '',
                                item.story.title
                              )}
                              size="sm"
                              className="flex items-center gap-2"
                              disabled={!item.story?.pdf_url}
                            >
                              <FileDown className="w-4 h-4" />
                              {item.story?.pdf_url ? 'Descargar PDF' : 'Generando...'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando página {currentPage} de {totalPages} ({totalOrders} compras en total)
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PurchaseErrorBoundary>
  );
};

export default MyPurchases;