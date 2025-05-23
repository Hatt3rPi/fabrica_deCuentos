import React, { useEffect, useState } from 'react';
import { VisualStyle, VISUAL_STYLE_NAMES } from '../../constants/visualStyles';
import { FallbackImageService } from '../../services/fallbackImageService';

/**
 * Componente para visualizar las imágenes de respaldo
 */
const FallbackImagesViewer: React.FC = () => {
  const [imageUrls, setImageUrls] = useState<Record<VisualStyle, string>>({} as Record<VisualStyle, string>);
  const [availability, setAvailability] = useState<Record<VisualStyle, boolean>>({} as Record<VisualStyle, boolean>);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        
        // Verificar disponibilidad de imágenes
        const availabilityData = await FallbackImageService.checkAvailability();
        setAvailability(availabilityData);
        
        // Obtener URLs públicas
        const urls = await FallbackImageService.getAllPublicUrls();
        setImageUrls(urls);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar las imágenes de respaldo');
        setLoading(false);
        console.error('Error al cargar las imágenes de respaldo:', err);
      }
    };

    loadImages();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Cargando imágenes de respaldo...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Imágenes de Respaldo por Estilo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(VisualStyle).map((style) => (
          <div 
            key={style} 
            className={`border rounded-lg p-4 ${availability[style] ? 'border-green-500' : 'border-red-500'}`}
          >
            <h3 className="text-lg font-semibold mb-2">{VISUAL_STYLE_NAMES[style]}</h3>
            
            {availability[style] ? (
              <div className="relative aspect-square overflow-hidden rounded-md">
                <img 
                  src={imageUrls[style]} 
                  alt={`Imagen de respaldo para estilo ${VISUAL_STYLE_NAMES[style]}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Disponible
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-200 flex items-center justify-center rounded-md">
                <p className="text-red-500">Imagen no disponible</p>
              </div>
            )}
            
            <p className="mt-2 text-sm truncate">{imageUrls[style]}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Instrucciones</h3>
        <p className="mb-2">
          Para subir las imágenes de respaldo, sigue estos pasos:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Accede al panel de administración de Supabase</li>
          <li>Navega a la sección "Storage"</li>
          <li>Crea un bucket llamado "fallback-images" si no existe</li>
          <li>Configura los permisos para que las imágenes sean accesibles públicamente</li>
          <li>Sube las imágenes optimizadas al bucket</li>
          <li>Verifica que las imágenes aparezcan como "Disponible" en este visor</li>
        </ol>
      </div>
    </div>
  );
};

export default FallbackImagesViewer;

