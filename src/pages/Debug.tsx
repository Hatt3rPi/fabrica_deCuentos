import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../context/UserRoleContext';
import { useCartContext } from '../contexts/CartContext';
import { priceService } from '../services/priceService';
import * as Sentry from '@sentry/react';

const Debug: React.FC = () => {
  const { user } = useAuth();
  const { role, permissions } = useUserRole();
  const { addStoryToCart } = useCartContext();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const testCartFunctionality = async () => {
    setLoading(true);
    addLog('🧪 Iniciando test del carrito...');
    
    try {
      // Test 1: Verificar productos disponibles
      addLog('📦 Verificando productos disponibles...');
      const defaultProduct = await priceService.getDefaultProductType();
      addLog(`✅ Producto por defecto: ${JSON.stringify(defaultProduct)}`);
      
      // Test 2: Verificar precios
      addLog('💰 Verificando precios...');
      const priceInfo = await priceService.getCurrentPrice(defaultProduct.id);
      addLog(`✅ Precio actual: ${JSON.stringify(priceInfo)}`);
      
      // Test 3: Intentar agregar historia ficticia
      addLog('🛒 Intentando agregar historia al carrito...');
      await addStoryToCart('test-story-123', 'Historia de Prueba', 'https://example.com/thumb.jpg');
      addLog('✅ Historia agregada exitosamente');
      
    } catch (error: any) {
      addLog(`❌ Error en test del carrito: ${error.message}`);
      Sentry.captureException(error);
    }
    
    setLoading(false);
  };

  const testAdminAccess = async () => {
    setLoading(true);
    addLog('🔐 Verificando acceso de admin...');
    
    try {
      // Test 1: Verificar permisos
      addLog(`👤 Usuario actual: ${user?.email}`);
      addLog(`🎭 Rol actual: ${role}`);
      addLog(`🔑 Permisos: ${JSON.stringify(permissions)}`);
      
      // Test 2: Verificar productos en DB
      addLog('🗄️ Consultando productos en base de datos...');
      const { data: products, error: productsError } = await supabase
        .from('product_types')
        .select('*')
        .eq('status', 'active');
      
      if (productsError) {
        addLog(`❌ Error consultando productos: ${productsError.message}`);
      } else {
        addLog(`✅ Productos encontrados: ${products?.length || 0}`);
        addLog(`📋 Productos: ${JSON.stringify(products)}`);
      }
      
      // Test 3: Verificar precios en DB
      addLog('💵 Consultando precios en base de datos...');
      const { data: prices, error: pricesError } = await supabase
        .from('product_prices')
        .select('*')
        .limit(5);
        
      if (pricesError) {
        addLog(`❌ Error consultando precios: ${pricesError.message}`);
      } else {
        addLog(`✅ Precios encontrados: ${prices?.length || 0}`);
      }
      
      // Test 4: Verificar función has_permission
      addLog('🔍 Verificando función has_permission...');
      const { data: hasPermission, error: permError } = await supabase
        .rpc('has_permission', { permission_name: 'products.manage' });
        
      if (permError) {
        addLog(`❌ Error verificando permisos: ${permError.message}`);
      } else {
        addLog(`✅ Permiso products.manage: ${hasPermission}`);
      }
      
    } catch (error: any) {
      addLog(`❌ Error en test de admin: ${error.message}`);
      Sentry.captureException(error);
    }
    
    setLoading(false);
  };

  const testSentry = () => {
    addLog('🚨 Enviando error de prueba a Sentry...');
    try {
      throw new Error('Error de prueba desde página de debug');
    } catch (error) {
      Sentry.captureException(error);
      addLog('✅ Error enviado a Sentry');
    }
  };

  useEffect(() => {
    const loadDebugInfo = async () => {
      const info = {
        environment: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        sentryEnabled: import.meta.env.PROD,
        sentryDsn: import.meta.env.VITE_SENTRY_DSN ? 'Configurado' : 'No configurado',
        userEmail: user?.email,
        userRole: role,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(info);
      addLog('🔧 Página de debug cargada');
    };
    
    loadDebugInfo();
  }, [user, role]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Página de Diagnóstico - La CuenterIA
          </h1>
          
          {/* Info del Sistema */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">📊 Información del Sistema</h2>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          {/* Botones de Test */}
          <div className="mb-6 space-x-4">
            <button
              onClick={testCartFunctionality}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              🛒 Test Carrito
            </button>
            
            <button
              onClick={testAdminAccess}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              🔐 Test Admin/Precios
            </button>
            
            <button
              onClick={testSentry}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🚨 Test Sentry
            </button>
          </div>
          
          {/* Logs en Tiempo Real */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">📝 Logs de Diagnóstico</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">Esperando logs...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Botón para limpiar logs */}
          <button
            onClick={() => setLogs([])}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            🗑️ Limpiar Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Debug;