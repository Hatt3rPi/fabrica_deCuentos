import React, { useState } from 'react';
import { CreditCard, Smartphone, Building2, Check } from 'lucide-react';
import Button from '../UI/Button';
import { priceService } from '../../services/priceService';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  available: boolean;
}

interface PaymentMethodsProps {
  onPaymentSuccess: (method: string) => void;
  totalAmount: number;
  orderId?: string;
  currency?: string;
  disabled?: boolean;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  onPaymentSuccess,
  totalAmount,
  orderId,
  currency = 'CLP',
  disabled = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'flow',
      name: 'Flow (Tarjetas)',
      icon: CreditCard,
      description: 'Tarjetas de débito y crédito',
      available: true
    },
    {
      id: 'transbank',
      name: 'Webpay Plus',
      icon: Building2,
      description: 'Pago seguro con Transbank',
      available: true
    },
    {
      id: 'transfer',
      name: 'Transferencia',
      icon: Smartphone,
      description: 'Transferencia bancaria',
      available: false // Deshabilitado por ahora
    }
  ];

  // Proceso de pago real
  const handlePayment = async (methodId: string) => {
    if (!methodId || isProcessing) return;

    try {
      setIsProcessing(true);

      // Si tenemos orderId, procesar el pago real
      if (orderId) {
        const paymentData = {
          amount: totalAmount,
          currency,
          method: methodId,
          timestamp: new Date().toISOString()
        };

        const result = await priceService.processPayment(orderId, methodId, paymentData);
        
        if (result.success) {
          onPaymentSuccess(methodId);
        } else {
          throw new Error(result.error || 'Error en el procesamiento del pago');
        }
      } else {
        // Fallback: simulación si no hay orderId
        await new Promise(resolve => setTimeout(resolve, 2000));
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          onPaymentSuccess(methodId);
        } else {
          throw new Error('Error en el procesamiento del pago');
        }
      }

    } catch (error) {
      console.error('Payment failed:', error);
      alert(error instanceof Error ? error.message : 'Error en el pago. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Resumen del pago */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total a pagar:</span>
          <span className="text-lg font-bold text-purple-600">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Selecciona método de pago
        </h3>
        
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => method.available && setSelectedMethod(method.id)}
              className={`
                relative border-2 rounded-lg p-4 transition-all cursor-pointer
                ${method.available 
                  ? 'hover:border-purple-300 hover:bg-purple-50' 
                  : 'opacity-50 cursor-not-allowed bg-gray-50'
                }
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isSelected 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {method.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {method.description}
                    </p>
                  </div>
                </div>

                {/* Indicador de selección */}
                {isSelected && (
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Indicador de no disponible */}
                {!method.available && (
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Próximamente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón de pago */}
      <Button
        onClick={() => handlePayment(selectedMethod)}
        disabled={!selectedMethod || isProcessing || disabled}
        isLoading={isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing 
          ? 'Procesando pago...' 
          : `Pagar ${formatPrice(totalAmount)}`
        }
      </Button>

      {/* Nota de seguridad */}
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Pago 100% seguro y encriptado</p>
      </div>
    </div>
  );
};

export default PaymentMethods;