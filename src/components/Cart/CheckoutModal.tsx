import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, Check, Package, FileDown, Loader2 } from 'lucide-react';
import { useCartOperations } from '../../contexts/CartContext';
import { useOrderFulfillment } from '../../hooks/useOrderFulfillment';
import PaymentMethods from './PaymentMethods';
import Button from '../UI/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
}

type CheckoutStep = 'review' | 'payment' | 'success';

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const {
    items,
    totalPrice,
    formatPrice,
    clearCart,
    createOrder
  } = useCartOperations();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [orderId, setOrderId] = useState<string>('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  // Hook para procesar fulfillment
  const { isProcessing: isGeneratingPdfs, pdfUrls, error: fulfillmentError } = useOrderFulfillment(
    currentStep === 'success' ? orderId : null
  );

  // Handler para proceder al pago
  const handleProceedToPayment = async () => {
    try {
      setIsCreatingOrder(true);
      const result = await createOrder();
      
      if (result.success && result.orderId) {
        setOrderId(result.orderId);
        setCurrentStep('payment');
      } else {
        alert(result.error || 'Error al crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error inesperado al crear la orden');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handler para pago exitoso
  const handlePaymentSuccess = () => {
    // Pago exitoso
    clearCart();
    setCurrentStep('success');
    
    if (onSuccess && orderId) {
      onSuccess(orderId);
    }

    // Redirigir a página de confirmación después de un breve delay
    setTimeout(() => {
      handleClose();
      navigate(`/purchase-confirmation/${orderId}`);
    }, 2000);
  };

  // Handler para cerrar modal
  const handleClose = () => {
    // Reset state
    setCurrentStep('review');
    setOrderId('');
    setIsCreatingOrder(false);
    onClose();
  };

  // Handler para volver al paso anterior
  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('review');
    }
  };

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={currentStep === 'success' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {currentStep === 'payment' && (
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-semibold">
                {currentStep === 'review' && 'Revisar pedido'}
                {currentStep === 'payment' && 'Método de pago'}
                {currentStep === 'success' && '¡Pago exitoso!'}
              </h2>
            </div>
            {currentStep !== 'success' && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Paso 1: Revisar pedido */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Resumen del pedido</h3>
                  
                  {/* Lista de items */}
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.storyThumbnail ? (
                            <img 
                              src={item.storyThumbnail} 
                              alt={item.storyTitle}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-6 h-6 text-purple-600"><svg class="lucide lucide-package" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.storyTitle}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {item.productTypeName} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatPrice(item.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Botón continuar */}
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isCreatingOrder}
                  isLoading={isCreatingOrder}
                  className="w-full"
                  size="lg"
                >
                  {isCreatingOrder ? 'Preparando pago...' : 'Continuar al pago'}
                </Button>
              </div>
            )}

            {/* Paso 2: Método de pago */}
            {currentStep === 'payment' && (
              <PaymentMethods
                onPaymentSuccess={handlePaymentSuccess}
                totalAmount={totalPrice}
                orderId={orderId}
                currency="CLP"
              />
            )}

            {/* Paso 3: Éxito */}
            {currentStep === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ¡Pago exitoso!
                  </h3>
                  <p className="text-gray-600">
                    Tu pedido ha sido procesado correctamente.
                  </p>
                  <p className="text-sm text-purple-600 mt-2 font-medium">
                    Redirigiendo a los detalles de tu compra...
                  </p>
                  {orderId && (
                    <p className="text-sm text-gray-500 mt-2">
                      Orden: {orderId.slice(0, 8)}...
                    </p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    {isGeneratingPdfs ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generando tus libros digitales...
                      </span>
                    ) : Object.keys(pdfUrls).length > 0 ? (
                      <span className="flex items-center justify-center gap-2">
                        <FileDown className="w-4 h-4" />
                        ¡Tus libros están listos para descargar!
                      </span>
                    ) : (
                      <span>📧 Recibirás un correo electrónico con los detalles de tu pedido.</span>
                    )}
                  </p>
                  {fulfillmentError && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ Hubo un problema generando los PDFs. Por favor contacta soporte.
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full"
                  size="lg"
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;