import React, { useState } from 'react';
import { X, ArrowLeft, Check, Package } from 'lucide-react';
import { useCartOperations } from '../../contexts/CartContext';
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
  const handlePaymentSuccess = (_paymentMethod: string) => {
    // Pago exitoso
    clearCart();
    setCurrentStep('success');
    
    if (onSuccess && orderId) {
      onSuccess(orderId);
    }
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
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-purple-600" />
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
                  {orderId && (
                    <p className="text-sm text-gray-500 mt-2">
                      Orden: {orderId.slice(0, 8)}...
                    </p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    📧 Recibirás un correo electrónico con los detalles de tu pedido.
                  </p>
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