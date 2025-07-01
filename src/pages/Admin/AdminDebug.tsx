import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useUserRole } from '../../context/UserRoleContext';
import { useCartContext } from '../../contexts/CartContext';
import { priceService } from '../../services/priceService';
import * as Sentry from '@sentry/react';
import { 
  Bug, 
  Database, 
  ShoppingCart, 
  User, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Shield,
  Info
} from 'lucide-react';

const AdminDebug: React.FC = () => {
  const { user } = useAuth();
  const { primaryRole, roles, hasPermission, isAdmin } = useUserRole();
  const { addStoryToCart } = useCartContext();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(`[DEBUG] ${message}`);
  };

  const copyLogsToClipboard = async () => {
    try {
      const logsText = logs.join('\n');
      await navigator.clipboard.writeText(logsText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copiando logs:', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
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
      addLog(`👤 Usuario actual: ${user?.email}`);
      addLog(`🎭 Rol primario: ${primaryRole || 'undefined'}`);
      addLog(`📋 Todos los roles: ${JSON.stringify(roles)}`);
      addLog(`🔑 Es admin: ${isAdmin}`);
      
      // DIAGNÓSTICO ESPECÍFICO DE ROLES
      addLog('🔬 Diagnóstico detallado de roles...');
      
      // Verificar directamente en user_roles
      addLog('📊 Consultando user_roles directamente...');
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);
        
      if (userRolesError) {
        addLog(`❌ Error consultando user_roles: ${userRolesError.message}`);
      } else {
        addLog(`✅ Roles en BD: ${JSON.stringify(userRoles)}`);
      }
      
      // Verificar función get_user_roles si existe
      addLog('🔍 Probando función get_user_roles...');
      const { data: rpcRoles, error: rpcError } = await supabase.rpc('get_user_roles');
      
      if (rpcError) {
        addLog(`❌ Error en get_user_roles: ${rpcError.message}`);
      } else {
        addLog(`✅ get_user_roles retorna: ${JSON.stringify(rpcRoles)}`);
      }
      
      // Verificar productos en base de datos
      addLog('🗄️ Consultando productos en base de datos...');
      const { data: products, error: productsError } = await supabase
        .from('product_types')
        .select('*');
        
      if (productsError) {
        addLog(`❌ Error consultando productos: ${productsError.message}`);
      } else {
        addLog(`✅ Productos encontrados: ${products?.length || 0}`);
        if (products && products.length > 0) {
          addLog(`📋 Productos: ${JSON.stringify(products)}`);
        }
      }
      
      // Verificar precios en base de datos
      addLog('💵 Consultando precios en base de datos...');
      const { data: prices, error: pricesError } = await supabase
        .from('product_prices')
        .select('*');
        
      if (pricesError) {
        addLog(`❌ Error consultando precios: ${pricesError.message}`);
      } else {
        addLog(`✅ Precios encontrados: ${prices?.length || 0}`);
      }
      
      // Verificar función has_permission
      addLog('🔍 Verificando función has_permission...');
      const { data: hasPermission, error: permissionError } = await supabase
        .rpc('has_permission', { permission_name: 'products.manage' });
        
      if (permissionError) {
        addLog(`❌ Error verificando permisos: ${permissionError.message}`);
      } else {
        addLog(`✅ Permiso products.manage: ${hasPermission}`);
      }
      
    } catch (error: any) {
      addLog(`❌ Error en test de admin: ${error.message}`);
      Sentry.captureException(error);
    }
    
    setLoading(false);
  };

  const loadSystemInfo = async () => {
    try {
      // Obtener todos los permisos del usuario
      const allPermissions = ['orders.view', 'orders.update', 'orders.export', 'config.admin', 'config.styles', 'config.prompts', 'analytics.full', 'analytics.operational', 'users.manage', 'roles.assign', 'workflow.admin', 'products.manage']
        .filter(permission => hasPermission(permission));
      
      const info = {
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          primaryRole: primaryRole,
          allRoles: roles,
          permissions: allPermissions,
          permissionCount: allPermissions.length,
          isAdmin: isAdmin
        },
        environment: {
          isDev: import.meta.env.DEV,
          isProd: import.meta.env.PROD,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, ''),
          netlifyContext: import.meta.env.VITE_NETLIFY_CONTEXT || 'local'
        },
        sentry: {
          enabled: import.meta.env.PROD,
          environment: import.meta.env.PROD ? 'production' : 'development'
        }
      };
      
      setDebugInfo(info);
    } catch (error) {
      console.error('Error cargando información del sistema:', error);
    }
  };

  useEffect(() => {
    addLog('🔧 Página de debug cargada');
    loadSystemInfo();
  }, [user, primaryRole, roles, isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bug className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Panel de Diagnóstico
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Herramientas de diagnóstico y testing para administradores del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tests de Funcionalidad */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Tests de Funcionalidad
              </h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={testCartFunctionality}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                Probar Sistema de Carrito
              </button>
              
              <button
                onClick={testAdminAccess}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Probar Acceso de Admin
              </button>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Información del Sistema
              </h2>
            </div>
            
            {debugInfo.user && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Usuario:</span>
                    <p className="text-gray-600 dark:text-gray-400">{debugInfo.user.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Rol:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {debugInfo.user.primaryRole || 'Sin rol asignado'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Permisos:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {debugInfo.user.permissionCount} permisos
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Entorno:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {debugInfo.environment?.isDev ? 'Desarrollo' : 'Producción'}
                    </p>
                  </div>
                </div>
                
                {debugInfo.user.permissions && debugInfo.user.permissions.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Lista de Permisos:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {debugInfo.user.permissions.map((permission: string) => (
                        <span
                          key={permission}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                        >
                          <Shield className="w-3 h-3" />
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log de Diagnóstico */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Log de Diagnóstico
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLogsToClipboard}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Logs
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-md transition-colors text-sm"
                >
                  Limpiar
                </button>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400">
                  No hay logs disponibles. Ejecuta algún test para ver los resultados aquí.
                </p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-400 whitespace-pre-wrap break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;