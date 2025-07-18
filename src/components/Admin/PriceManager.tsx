import React, { useState, useEffect, useCallback } from 'react';
import { Package, DollarSign, Plus, Edit, Calendar, TrendingUp, MoreVertical, Trash2, Pause, Play, AlertTriangle } from 'lucide-react';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { priceService, ProductType, ProductPrice, PriceInfo } from '../../services/priceService';
import { supabase } from '../../lib/supabase';
import Button from '../UI/Button';

interface PriceManagerProps {
  className?: string;
}

const PriceManager: React.FC<PriceManagerProps> = ({ className }) => {
  // Proteger con permisos de admin
  const { isAuthorized, isLoading: roleLoading } = useRoleGuard({
    requiredPermissions: ['products.manage'],
    redirectTo: '/unauthorized'
  });

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [currentPrice, setCurrentPrice] = useState<PriceInfo | null>(null);
  const [priceHistory, setPriceHistory] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPriceForm, setShowNewPriceForm] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [showEditProductForm, setShowEditProductForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductType | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductType | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Estados para formularios
  const [newPriceForm, setNewPriceForm] = useState({
    price: '',
    discount_percentage: '0',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_to: '',
    notes: ''
  });

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    category: 'digital' as const,
    status: 'active' as const
  });

  const [editProductForm, setEditProductForm] = useState({
    name: '',
    description: '',
    category: 'digital' as const,
    status: 'active' as const
  });

  const loadProductTypes = useCallback(async () => {
    try {
      setLoading(true);
      // Obtener todos los productos, no solo activos
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setProductTypes(data || []);
      
      // Seleccionar el primero por defecto
      if (data && data.length > 0 && !selectedProduct) {
        setSelectedProduct(data[0]);
      }
    } catch (error) {
      console.error('Error loading product types:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!isAuthorized || roleLoading) return;
    loadProductTypes();
  }, [isAuthorized, roleLoading, loadProductTypes]);

  // Cargar precio actual cuando se selecciona producto
  useEffect(() => {
    if (selectedProduct) {
      loadCurrentPrice(selectedProduct.id);
      loadPriceHistory(selectedProduct.id);
    }
  }, [selectedProduct]);

  // Cerrar menús cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenuOpen(null);
    };

    if (actionMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenuOpen]);

  const loadCurrentPrice = async (productTypeId: string) => {
    try {
      const price = await priceService.getCurrentPrice(productTypeId);
      setCurrentPrice(price);
    } catch (error) {
      console.error('Error loading current price:', error);
    }
  };

  const loadPriceHistory = async (productTypeId: string) => {
    try {
      const history = await priceService.getPriceHistory(productTypeId);
      setPriceHistory(history);
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const priceData = {
        product_type_id: selectedProduct.id,
        price: parseFloat(newPriceForm.price),
        currency: 'CLP',
        discount_percentage: parseFloat(newPriceForm.discount_percentage),
        valid_from: newPriceForm.valid_from,
        valid_to: newPriceForm.valid_to || null,
        notes: newPriceForm.notes || null
      };

      await priceService.createPrice(priceData);
      
      // Recargar datos
      await loadCurrentPrice(selectedProduct.id);
      await loadPriceHistory(selectedProduct.id);
      
      // Reset form
      setNewPriceForm({
        price: '',
        discount_percentage: '0',
        valid_from: new Date().toISOString().slice(0, 16),
        valid_to: '',
        notes: ''
      });
      setShowNewPriceForm(false);
      
    } catch (error) {
      console.error('Error creating price:', error);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await priceService.createProductType({
        ...newProductForm,
        metadata: {}
      });

      // Recargar lista
      await loadProductTypes();
      
      // Reset form
      setNewProductForm({
        name: '',
        description: '',
        category: 'digital',
        status: 'active'
      });
      setShowNewProductForm(false);
      
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleEditProduct = (product: ProductType) => {
    setProductToEdit(product);
    setEditProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      status: product.status
    });
    setShowEditProductForm(true);
    setActionMenuOpen(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit) return;

    try {
      await priceService.updateProductType(productToEdit.id, editProductForm);

      // Recargar lista
      await loadProductTypes();
      
      // Si el producto editado está seleccionado, actualizar la selección
      if (selectedProduct?.id === productToEdit.id) {
        const updatedProduct = { ...productToEdit, ...editProductForm };
        setSelectedProduct(updatedProduct);
      }
      
      // Reset form
      setShowEditProductForm(false);
      setProductToEdit(null);
      
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleToggleProductStatus = async (product: ProductType) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await priceService.updateProductType(product.id, { status: newStatus });

      // Recargar lista
      await loadProductTypes();
      
      // Si el producto editado está seleccionado, actualizar la selección
      if (selectedProduct?.id === product.id) {
        setSelectedProduct({ ...product, status: newStatus });
      }
      
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleDeleteProduct = (product: ProductType) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
    setActionMenuOpen(null);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      // Soft delete: cambiar status a discontinued
      await priceService.updateProductType(productToDelete.id, { 
        status: 'discontinued' 
      });

      // Recargar lista
      await loadProductTypes();
      
      // Si el producto eliminado estaba seleccionado, seleccionar otro
      if (selectedProduct?.id === productToDelete.id) {
        const remainingProducts = productTypes.filter(p => p.id !== productToDelete.id && p.status !== 'discontinued');
        setSelectedProduct(remainingProducts[0] || null);
      }
      
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mostrar loader mientras se verifica autorización
  if (roleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si no está autorizado, el hook ya redirigirá
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold">Gestión de Precios</h1>
        </div>
        <Button
          onClick={() => setShowNewProductForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Lista de productos */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos
            </h2>
            
            <div className="space-y-2">
              {productTypes.map(product => (
                <div
                  key={product.id}
                  className={`p-3 rounded-lg border-2 transition-colors relative ${
                    selectedProduct?.id === product.id
                      ? 'bg-purple-100 border-purple-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                  }`}
                >
                  <div 
                    onClick={() => setSelectedProduct(product)}
                    className="cursor-pointer"
                  >
                    <div className="font-medium pr-8">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.category}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`text-xs inline-block px-2 py-1 rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'Activo' : 
                         product.status === 'inactive' ? 'Inactivo' : 'Discontinuado'}
                      </div>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(actionMenuOpen === product.id ? null : product.id);
                      }}
                      className="p-1 hover:bg-white rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {actionMenuOpen === product.id && (
                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                        
                        <button
                          onClick={() => handleToggleProductStatus(product)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {product.status === 'active' ? (
                            <>
                              <Pause className="w-3 h-3" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              Activar
                            </>
                          )}
                        </button>

                        {product.status !== 'discontinued' && (
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel central: Precio actual */}
          <div className="bg-white rounded-lg shadow p-4">
            {selectedProduct ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Precio Actual
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setShowNewPriceForm(true)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Cambiar
                  </Button>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-lg">{selectedProduct.name}</h3>
                  <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                </div>

                {currentPrice ? (
                  <div className="space-y-3">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Precio base</div>
                      <div className="text-2xl font-bold">
                        {priceService.formatPrice(currentPrice.price, currentPrice.currency)}
                      </div>
                      {currentPrice.final_price !== currentPrice.price && (
                        <div className="text-lg text-purple-600 font-semibold">
                          Final: {priceService.formatPrice(currentPrice.final_price, currentPrice.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay precio configurado</p>
                    <Button
                      size="sm"
                      onClick={() => setShowNewPriceForm(true)}
                      className="mt-2"
                    >
                      Configurar precio
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona un producto</p>
              </div>
            )}
          </div>

          {/* Panel derecho: Historial */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Historial
            </h2>

            {priceHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {priceHistory.map(price => (
                  <div key={price.id} className="border-l-4 border-purple-200 pl-3 py-2">
                    <div className="font-semibold">
                      {priceService.formatPrice(price.final_price, price.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Desde: {formatDate(price.valid_from)}
                    </div>
                    {price.valid_to && (
                      <div className="text-sm text-gray-600">
                        Hasta: {formatDate(price.valid_to)}
                      </div>
                    )}
                    {price.notes && (
                      <div className="text-xs text-gray-500 mt-1">{price.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sin historial de precios</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal nuevo precio */}
      {showNewPriceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Nuevo Precio</h3>
            <form onSubmit={handleCreatePrice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio (CLP)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPriceForm.price}
                  onChange={(e) => setNewPriceForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descuento (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newPriceForm.discount_percentage}
                  onChange={(e) => setNewPriceForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Válido desde</label>
                <input
                  type="datetime-local"
                  value={newPriceForm.valid_from}
                  onChange={(e) => setNewPriceForm(prev => ({ ...prev, valid_from: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Válido hasta (opcional)</label>
                <input
                  type="datetime-local"
                  value={newPriceForm.valid_to}
                  onChange={(e) => setNewPriceForm(prev => ({ ...prev, valid_to: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={newPriceForm.notes}
                  onChange={(e) => setNewPriceForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="Razón del cambio de precio..."
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewPriceForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Precio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nuevo producto */}
      {showNewProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, category: e.target.value as 'digital' | 'physical' | 'premium' }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="digital">Digital</option>
                  <option value="physical">Físico</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={newProductForm.status}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewProductForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Producto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar producto */}
      {showEditProductForm && productToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Editar Producto</h3>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={editProductForm.category}
                  onChange={(e) => setEditProductForm(prev => ({ ...prev, category: e.target.value as 'digital' | 'physical' | 'premium' }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="digital">Digital</option>
                  <option value="physical">Físico</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={editProductForm.status}
                  onChange={(e) => setEditProductForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditProductForm(false);
                    setProductToEdit(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Actualizar Producto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmación de eliminación */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres eliminar el producto <strong>"{productToDelete.name}"</strong>?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> El producto será marcado como discontinuado, pero no se eliminará permanentemente. 
                Esto preserva la integridad de las órdenes existentes.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDeleteProduct}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceManager;