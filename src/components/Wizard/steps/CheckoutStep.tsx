import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../../../context/WizardContext';
import { useWizardFlowStore } from '../../../stores/wizardFlowStore';
import { useCartOperations } from '../../../contexts/CartContext';
import { useProfileStore } from '../../../stores/profileStore';
import { priceService, ProductType } from '../../../services/priceService';
import { 
  BookOpen, 
  Package, 
  Download, 
  Truck, 
  CreditCard, 
  Loader, 
  CheckCircle,
  MapPin,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import Button from '../../UI/Button';
import ShippingForm from '../../Profile/ShippingForm';

interface FormatOption {
  id: 'digital' | 'physical';
  type: ProductType | null;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  features: string[];
  requiresShipping: boolean;
}

const CheckoutStep: React.FC = () => {
  const navigate = useNavigate();
  const { generatedPages } = useWizard();
  const { estado } = useWizardFlowStore();
  const { addStoryToCart, formatPrice } = useCartOperations();
  const { profile } = useProfileStore();
  
  const [selectedFormat, setSelectedFormat] = useState<'digital' | 'physical' | null>(null);
  const [formatOptions, setFormatOptions] = useState<FormatOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tipos de productos disponibles
  useEffect(() => {
    const loadProductTypes = async () => {
      try {
        setIsLoading(true);
        const productTypes = await priceService.getProductTypes();
        
        console.log('[CheckoutStep] Productos disponibles:', productTypes);
        
        // Encontrar productos digitales y físicos
        const digitalProduct = productTypes.find(p => 
          p.category === 'digital' && 
          (p.name === 'Libro Digital' || p.name.includes('Digital'))
        );
        
        const physicalProduct = productTypes.find(p => 
          p.category === 'physical' && 
          (p.name === 'Libro Físico Estándar' || p.name.includes('Físico'))
        );

        console.log('[CheckoutStep] Producto digital encontrado:', digitalProduct);
        console.log('[CheckoutStep] Producto físico encontrado:', physicalProduct);

        // Obtener precios actuales
        const [digitalPrice, physicalPrice] = await Promise.all([
          digitalProduct ? priceService.getCurrentPrice(digitalProduct.id) : null,
          physicalProduct ? priceService.getCurrentPrice(physicalProduct.id) : null
        ]);

        const options: FormatOption[] = [
          {
            id: 'digital',
            type: digitalProduct || null,
            title: 'Libro Digital',
            description: digitalPrice ? formatPrice(digitalPrice.final_price) : 'Precio no disponible',
            icon: <Download className="w-8 h-8" />,
            badge: 'Descarga inmediata',
            features: [
              'Descarga inmediata en PDF',
              'Alta calidad de impresión',
              'Compatible con todos los dispositivos',
              'Sin costos de envío'
            ],
            requiresShipping: false
          },
          {
            id: 'physical',
            type: physicalProduct || null,
            title: 'Libro Físico',
            description: physicalPrice ? formatPrice(physicalPrice.final_price) : 'Precio no disponible',
            icon: <Package className="w-8 h-8" />,
            badge: 'Envío incluido',
            features: [
              'Impresión en papel de alta calidad',
              'Acabado profesional',
              'Envío a domicilio incluido',
              'Ideal para regalo'
            ],
            requiresShipping: true
          }
        ];

        setFormatOptions(options.filter(option => option.type !== null));
        setError(null);
      } catch (err) {
        console.error('Error loading product types:', err);
        setError('Error al cargar opciones de formato. Por favor, inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductTypes();
  }, [formatPrice]);

  // Función para verificar si se necesita información de envío
  const needsShippingInfo = () => {
    if (selectedFormat !== 'physical') return false;
    
    return !profile?.shipping_address || 
           !profile?.shipping_region || 
           !profile?.shipping_comuna || 
           !profile?.shipping_city || 
           !profile?.shipping_phone || 
           !profile?.contact_person;
  };

  // Manejar selección de formato
  const handleFormatSelect = (formatId: 'digital' | 'physical') => {
    setSelectedFormat(formatId);
    
    // Si es físico y necesita info de envío, mostrar formulario
    if (formatId === 'physical' && needsShippingInfo()) {
      setShowShippingForm(true);
    }
  };

  // Proceder con la compra
  const handleProceedToPurchase = async () => {
    if (!selectedFormat) return;

    const selectedOption = formatOptions.find(option => option.id === selectedFormat);
    if (!selectedOption?.type) {
      setError('Producto no disponible. Por favor, selecciona otra opción.');
      return;
    }

    // Verificar información de envío para productos físicos
    if (selectedFormat === 'physical' && needsShippingInfo()) {
      setShowShippingForm(true);
      return;
    }

    try {
      setIsAddingToCart(true);
      setError(null);

      // Obtener título del cuento desde las páginas generadas
      const storyTitle = generatedPages.find(p => p.pageNumber === 0)?.text || 'Mi Cuento Personalizado';
      
      // Obtener thumbnail de la portada
      const storyThumbnail = generatedPages.find(p => p.pageNumber === 0)?.imageUrl;

      // Agregar al carrito usando el productType seleccionado
      await addStoryToCart(
        'story-temp-id', // Será reemplazado por el storyId real
        storyTitle,
        storyThumbnail
      );

      // Navegar al carrito
      navigate('/cart');
      
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err instanceof Error ? err.message : 'Error al agregar al carrito');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Si está mostrando el formulario de envío
  if (showShippingForm) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-2">
            Información de Envío
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Complete tus datos de envío para recibir tu libro físico
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <ShippingForm />
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => setShowShippingForm(false)}
              variant="outline"
              className="w-full"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Continuar con la compra</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-2">
          Selecciona el Formato de tu Cuento
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Elige cómo quieres recibir tu cuento personalizado
        </p>
      </div>

      {/* Resumen del cuento */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {generatedPages.find(p => p.pageNumber === 0)?.imageUrl ? (
              <img
                src={generatedPages.find(p => p.pageNumber === 0)?.imageUrl}
                alt="Portada del cuento"
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-300" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {generatedPages.find(p => p.pageNumber === 0)?.text || 'Tu Cuento Personalizado'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Páginas:</span>
                <span className="ml-2">{generatedPages.length}</span>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <span className="ml-2 text-green-600 dark:text-green-400">Completado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones de formato */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando opciones...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {formatOptions.map((option) => (
            <div
              key={option.id}
              className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all duration-200 ${
                selectedFormat === option.id
                  ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
              }`}
              onClick={() => handleFormatSelect(option.id)}
            >
              {/* Badge */}
              {option.badge && (
                <div className="absolute -top-3 left-6">
                  <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {option.badge}
                  </span>
                </div>
              )}

              {/* Checkbox/Radio */}
              <div className="absolute top-4 right-4">
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedFormat === option.id
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selectedFormat === option.id && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Icono y título */}
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedFormat === option.id
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {option.title}
                    </h3>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Características */}
                <ul className="space-y-2">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Indicador de envío para producto físico */}
                {option.requiresShipping && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {needsShippingInfo() 
                        ? 'Se requiere información de envío'
                        : 'Información de envío completa'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón de proceder */}
      {!isLoading && !error && (
        <div className="text-center space-y-4">
          <Button
            onClick={handleProceedToPurchase}
            disabled={!selectedFormat || isAddingToCart}
            isLoading={isAddingToCart}
            className="w-full max-w-md mx-auto"
            size="lg"
          >
            {isAddingToCart ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Agregando al carrito...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>Agregar al Carrito</span>
              </>
            )}
          </Button>
          
          {selectedFormat && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFormat === 'physical' && needsShippingInfo()
                ? 'Se solicitará información de envío en el siguiente paso'
                : 'Serás redirigido al carrito para completar la compra'
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckoutStep;