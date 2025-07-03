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

// Hook para detectar el entorno de deployment
const useDeploymentEnvironment = () => {
  // Variables de entorno de Netlify
  const netlifyContext = import.meta.env.VITE_NETLIFY_CONTEXT; // production, deploy-preview, branch-deploy
  const netlifyBranch = import.meta.env.VITE_NETLIFY_BRANCH;
  const netlifyUrl = import.meta.env.VITE_NETLIFY_URL;
  
  // Variables de entorno de Vercel
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV; // production, preview, development
  const vercelUrl = import.meta.env.VITE_VERCEL_URL;
  
  // Si hay variables de Netlify
  if (netlifyContext) {
    if (netlifyContext === 'production') {
      return { deployment: 'Netlify Producción', branch: netlifyBranch || 'main' };
    } else if (netlifyContext === 'deploy-preview') {
      return { deployment: 'Netlify Preview', branch: netlifyBranch || 'feature' };
    } else {
      return { deployment: 'Netlify Branch', branch: netlifyBranch || 'unknown' };
    }
  }
  
  // Si hay variables de Vercel
  if (vercelEnv) {
    if (vercelEnv === 'production') {
      return { deployment: 'Vercel Producción', branch: 'main' };
    } else {
      return { deployment: 'Vercel Preview', branch: 'feature' };
    }
  }
  
  // Desarrollo local
  return { deployment: 'Local', branch: 'feature/shopping-cart-system' };
};

const DevelopmentBanner: React.FC = () => {
  const { environment, color, icon: Icon } = useSupabaseEnvironment();
  const { deployment, branch } = useDeploymentEnvironment();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  // NO mostrar en producción real
  const isProduction = deployment === 'Netlify Producción' || deployment === 'Vercel Producción';
  const isDevelopmentMode = import.meta.env.DEV;
  
  // Solo mostrar si:
  // 1. Está en modo desarrollo (npm run dev), O
  // 2. Es preview/staging de Netlify (NO producción)
  if (isProduction || (!isDevelopmentMode && deployment === 'Netlify Producción')) {
    return null;
  }

  return (
    <div className={`${color} text-white py-2 px-2 sm:px-4 text-center text-xs sm:text-sm font-medium shadow-lg`}>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="font-bold ml-1">
            {deployment === 'Local' ? 'DESARROLLO' : deployment.toUpperCase().replace('NETLIFY', '').replace('VERCEL', '').trim()}
          </span>
        </div>
        
        <span className="hidden sm:inline">•</span>
        
        <div className="hidden sm:flex items-center">
          <span>Supabase: {environment}</span>
          {supabaseUrl && (
            <>
              <span className="mx-2">•</span>
              <span className="font-mono text-xs opacity-90 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                {new URL(supabaseUrl).hostname}
              </span>
            </>
          )}
        </div>
        
        <span className="hidden sm:inline">•</span>
        
        <div className="text-xs opacity-75 truncate max-w-[150px] sm:max-w-none">
          {branch}
        </div>
        
        {/* Versión móvil más compacta */}
        <div className="sm:hidden w-full text-[10px] opacity-75 mt-1">
          <span>Supabase: {environment}</span>
          {supabaseUrl && (
            <span className="font-mono ml-1">
              {new URL(supabaseUrl).hostname.split('.')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevelopmentBanner;