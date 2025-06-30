import React from 'react';
import { AlertTriangle, Database, Globe, Home } from 'lucide-react';

// Hook para detectar el entorno de Supabase
const useSupabaseEnvironment = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    return { environment: 'No configurado', color: 'bg-red-500', icon: AlertTriangle };
  }

  // Detectar tipo de entorno basado en la URL
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    return { environment: 'Local', color: 'bg-blue-500', icon: Home };
  }
  
  if (supabaseUrl.includes('.supabase.co')) {
    // Supabase remoto - distinguir entre prod y staging por el project ref
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    
    if (projectRef === 'ogegdctdniijmublbmgy') {
      return { environment: 'Producción', color: 'bg-red-500', icon: Globe };
    } else {
      return { environment: 'Staging/Branch', color: 'bg-yellow-500', icon: Database };
    }
  }
  
  return { environment: 'Remoto', color: 'bg-purple-500', icon: Globe };
};

const DevelopmentBanner: React.FC = () => {
  // Solo mostrar en desarrollo
  const isDevelopment = import.meta.env.DEV;
  
  if (!isDevelopment) {
    return null;
  }

  const { environment, color, icon: Icon } = useSupabaseEnvironment();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className={`${color} text-white py-2 px-4 text-center text-sm font-medium shadow-lg`}>
      <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
        <Icon className="w-4 h-4" />
        <span className="font-bold">ENTORNO DE DESARROLLO</span>
        <span className="mx-2">•</span>
        <span>Supabase: {environment}</span>
        {supabaseUrl && (
          <>
            <span className="mx-2">•</span>
            <span className="font-mono text-xs opacity-90">
              {new URL(supabaseUrl).hostname}
            </span>
          </>
        )}
        <span className="mx-2">•</span>
        <span className="text-xs opacity-75">
          Branch: feature/shopping-cart-system
        </span>
      </div>
    </div>
  );
};

export default DevelopmentBanner;