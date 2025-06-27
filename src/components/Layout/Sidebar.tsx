import React, { useState, useEffect } from 'react';
import { BookOpen, User, Settings, LogOut, AlertTriangle, BarChart3, Home, Palette, Package, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoleCheck } from '../../hooks/useRoleGuard';
import { Link } from 'react-router-dom';
import { ImageGenerationSettings, ImageEngine, OpenAIModel, StabilityModel, FluxModel } from '../../types';
import { useNotificacionesPedidos } from '../../hooks/useNotificacionesPedidos';

const Sidebar: React.FC = () => {
  const { signOut, supabase } = useAuth();
  
  // Verificar permisos con el nuevo sistema de roles
  const canManagePrompts = useRoleCheck([], ['config.prompts']);
  const canViewAnalytics = useRoleCheck([], ['analytics.operational']);
  const canManageFlow = useRoleCheck([], ['workflow.admin']);
  const canManageStyles = useRoleCheck([], ['config.styles']);
  const canManageOrders = useRoleCheck([], ['orders.view']);
  const canManageUsers = useRoleCheck([], ['users.manage']);
  
  const { pedidosPendientes, nuevosPedidos, resetearNuevos } = useNotificacionesPedidos();
  const [settings, setSettings] = useState<ImageGenerationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!canManageStyles) return;
      
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'image_generation')
          .single();

        if (error) throw error;
        setSettings(data.value as ImageGenerationSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [supabase, canManageStyles]);

  const handleEngineChange = async (
    type: 'thumbnail' | 'variations' | 'spriteSheet',
    provider: 'openai' | 'stability' | 'flux',
    model: OpenAIModel | StabilityModel | FluxModel,
    quality?: string,
    size?: string,
    style?: string
  ) => {
    if (!canManageStyles || !settings) return;
    setIsLoading(true);

    const updatedEngine: ImageEngine = {
      provider,
      model,
      ...(quality && { quality }),
      ...(size && { size }),
      ...(style && { style })
    };

    try {
      const updatedSettings: ImageGenerationSettings = {
        ...settings,
        engines: {
          ...settings.engines,
          [type]: updatedEngine
        },
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('system_settings')
        .update({
          value: updatedSettings
        })
        .eq('key', 'image_generation');

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEngineSelector = (
    type: 'thumbnail' | 'variations' | 'spriteSheet',
    label: string
  ) => {
    const engine = settings?.engines[type];
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          value={`${engine?.provider}:${engine?.model}`}
          onChange={(e) => {
            const [provider, model] = e.target.value.split(':');
            handleEngineChange(
              type,
              provider as 'openai' | 'stability' | 'flux',
              model as OpenAIModel | StabilityModel | FluxModel
            );
          }}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <optgroup label="OpenAI">
            <option value="openai:dall-e-2">DALL-E 2</option>
            <option value="openai:dall-e-3">DALL-E 3</option>
            <option value="openai:gpt-image-1">GPT-4 Vision</option>
          </optgroup>
          <optgroup label="Stability AI">
            <option value="stability:stable-diffusion-3.5">Stable Diffusion 3.5</option>
          </optgroup>
          <optgroup label="Flux">
            <option value="flux:flux-kontext-pro">Flux Kontext Pro</option>
            <option value="flux:flux-kontext-max">Flux Kontext Max</option>
            <option value="flux:flux-pro">Flux Pro 1.0</option>
            <option value="flux:flux-pro-1.1">Flux Pro 1.1</option>
            <option value="flux:flux-pro-1.1-ultra">Flux Pro 1.1 Ultra</option>
            <option value="flux:flux-pro-1.0-fill">Flux Pro 1.0 Fill</option>
            <option value="flux:flux-pro-1.0-expand">Flux Pro 1.0 Expand</option>
            <option value="flux:flux-pro-1.0-canny">Flux Pro 1.0 Canny</option>
            <option value="flux:flux-pro-1.0-depth">Flux Pro 1.0 Depth</option>
            <option value="flux:flux-pro-finetuned">Flux Pro 1.0 Finetuned</option>
            <option value="flux:flux-pro-1.0-depth-finetuned">Flux Pro 1.0 Depth Finetuned</option>
            <option value="flux:flux-pro-1.0-canny-finetuned">Flux Pro 1.0 Canny Finetuned</option>
            <option value="flux:flux-pro-1.0-fill-finetuned">Flux Pro 1.0 Fill Finetuned</option>
            <option value="flux:flux-pro-1.1-ultra-finetuned">Flux Pro 1.1 Ultra Finetuned</option>
            <option value="flux:flux-dev">Flux Dev</option>
          </optgroup>
        </select>

        {engine?.provider === 'openai' && engine.model === 'dall-e-3' && (
          <>
            <select
              value={engine.quality || 'standard'}
              onChange={(e) => handleEngineChange(
                type,
                engine.provider,
                engine.model,
                e.target.value,
                engine.size,
                engine.style
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2"
            >
              <option value="standard">Calidad Estándar</option>
              <option value="hd">Calidad HD</option>
            </select>

            <select
              value={engine.style || 'vivid'}
              onChange={(e) => handleEngineChange(
                type,
                engine.provider,
                engine.model,
                engine.quality,
                engine.size,
                e.target.value
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2"
            >
              <option value="vivid">Estilo Vívido</option>
              <option value="natural">Estilo Natural</option>
            </select>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-gray-900 dark:text-white">CuenterIA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link to="/home" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
              <Home className="w-5 h-5" />
              <span>Mis Cuentos</span>
            </Link>
          </li>
          <li>
            <Link to="/perfil" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </Link>
          </li>
          {canManagePrompts && (
            <li>
              <Link to="/admin/prompts" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
                <Settings className="w-5 h-5" />
                <span>Prompts</span>
              </Link>
            </li>
          )}
          {canViewAnalytics && (
            <li>
              <Link
                to="/admin/analytics"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </Link>
            </li>
          )}
          {canManageFlow && (
            <li>
              <Link
                to="/admin/flujo"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Flujo</span>
              </Link>
            </li>
          )}
          {canManageStyles && (
            <li>
              <Link
                to="/admin/style"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
              >
                <Palette className="w-5 h-5" />
                <span>Estilos</span>
              </Link>
            </li>
          )}
          {canManageOrders && (
            <li>
              <Link
                to="/admin/pedidos"
                onClick={() => resetearNuevos()}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20 relative"
              >
                <Package className="w-5 h-5" />
                <span>Pedidos</span>
                {/* Badge de notificaciones */}
                {(nuevosPedidos > 0 || pedidosPendientes > 0) && (
                  <span className="ml-auto flex items-center gap-1">
                    {nuevosPedidos > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {nuevosPedidos}
                      </span>
                    )}
                    {pedidosPendientes > 0 && (
                      <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pedidosPendientes}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          )}
          {canManageUsers && (
            <li>
              <Link
                to="/admin/users"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
              >
                <Users className="w-5 h-5" />
                <span>Usuarios</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
