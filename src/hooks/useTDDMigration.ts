// Hook para manejar la migración gradual al sistema TDD
import { useState, useEffect, useCallback } from 'react';
import { 
  convertLegacyToUnified, 
  convertUnifiedToLegacy,
  validateMigrationCompatibility 
} from '../utils/styleConfigMigrator';
import { ComponentConfig } from '../types/styleConfig';
import { useNotifications } from './useNotifications';
import { NotificationType, NotificationPriority } from '../types/notification';

interface UseTDDMigrationProps {
  activeConfig: any;
  allComponents: ComponentConfig[];
  onConfigUpdate: (updates: any) => void;
  onComponentsUpdate: (components: ComponentConfig[]) => void;
}

export const useTDDMigration = ({
  activeConfig,
  allComponents,
  onConfigUpdate,
  onComponentsUpdate
}: UseTDDMigrationProps) => {
  const { createNotification } = useNotifications();
  const [isMigrated, setIsMigrated] = useState(false);
  const [unifiedConfig, setUnifiedConfig] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Detectar si la configuración necesita migración
  useEffect(() => {
    if (!activeConfig) return;

    // Verificar si ya es formato unificado
    const hasUnifiedFormat = activeConfig.version === "2.0" && 
                           activeConfig.designTokens && 
                           activeConfig.pageTypes;

    setIsMigrated(hasUnifiedFormat);

    if (!hasUnifiedFormat) {
      // Validar que la configuración se puede migrar
      const validation = validateMigrationCompatibility(activeConfig);
      
      if (!validation.isValid) {
        createNotification(
          NotificationType.ERROR,
          'Error de Migración',
          'La configuración actual tiene errores que impiden la migración',
          NotificationPriority.HIGH
        );
        console.error('Errores de validación:', validation.errors);
      }
    }
  }, [activeConfig, createNotification]);

  // Migrar configuración al formato unificado
  const migrateToUnified = useCallback(async () => {
    if (!activeConfig || isProcessing) return;

    setIsProcessing(true);

    try {
      // Validar antes de migrar
      const validation = validateMigrationCompatibility(activeConfig);
      
      if (!validation.isValid) {
        throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
      }

      // Crear estructura legacy completa para migración
      const legacyConfig: any = {};
      
      if (activeConfig.coverConfig) {
        legacyConfig.cover = {
          background: activeConfig.coverConfig.background,
          components: allComponents.filter(c => c.pageType === 'cover')
        };
      }
      
      if (activeConfig.pageConfig) {
        legacyConfig.page = {
          background: activeConfig.pageConfig.background,
          components: allComponents.filter(c => c.pageType === 'page')
        };
      }
      
      if (activeConfig.dedicatoriaConfig) {
        legacyConfig.dedicatoria = {
          background: activeConfig.dedicatoriaConfig.background,
          components: allComponents.filter(c => c.pageType === 'dedicatoria')
        };
      }

      // Convertir a formato unificado
      const unified = convertLegacyToUnified(legacyConfig);
      setUnifiedConfig(unified);

      // Notificar éxito
      createNotification(
        NotificationType.SUCCESS,
        'Migración Exitosa',
        'La configuración se ha migrado al nuevo sistema unificado',
        NotificationPriority.HIGH
      );

      // Marcar como migrado
      setIsMigrated(true);

      // Actualizar la configuración en el componente padre
      onConfigUpdate({
        ...activeConfig,
        version: "2.0",
        unifiedConfig: unified
      });

    } catch (error) {
      console.error('Error durante migración:', error);
      createNotification(
        NotificationType.ERROR,
        'Error de Migración',
        error instanceof Error ? error.message : 'Error desconocido durante la migración',
        NotificationPriority.HIGH
      );
    } finally {
      setIsProcessing(false);
    }
  }, [activeConfig, allComponents, isProcessing, createNotification, onConfigUpdate]);

  // Sincronizar cambios del formato unificado de vuelta al legacy
  const syncToLegacy = useCallback((unifiedConfig: any) => {
    if (!unifiedConfig || !isMigrated) return;

    try {
      // Convertir de vuelta a legacy
      const legacyConfig = convertUnifiedToLegacy(unifiedConfig);

      // Actualizar componentes
      const updatedComponents: ComponentConfig[] = [];
      
      Object.entries(legacyConfig).forEach(([pageType, pageConfig]: [string, any]) => {
        if (pageConfig.components) {
          pageConfig.components.forEach((component: any) => {
            updatedComponents.push({
              ...component,
              pageType: pageType as 'cover' | 'page' | 'dedicatoria'
            });
          });
        }
      });

      onComponentsUpdate(updatedComponents);

      // Actualizar configuraciones de página
      const updates: any = {};
      
      if (legacyConfig.cover) {
        updates.coverConfig = {
          ...activeConfig.coverConfig,
          background: legacyConfig.cover.background
        };
      }
      
      if (legacyConfig.page) {
        updates.pageConfig = {
          ...activeConfig.pageConfig,
          background: legacyConfig.page.background
        };
      }
      
      if (legacyConfig.dedicatoria) {
        updates.dedicatoriaConfig = {
          ...activeConfig.dedicatoriaConfig,
          background: legacyConfig.dedicatoria.background
        };
      }

      onConfigUpdate(updates);

    } catch (error) {
      console.error('Error sincronizando a legacy:', error);
      createNotification(
        NotificationType.ERROR,
        'Error de Sincronización',
        'No se pudo sincronizar los cambios al formato legacy',
        NotificationPriority.MEDIUM
      );
    }
  }, [isMigrated, activeConfig, onConfigUpdate, onComponentsUpdate, createNotification]);

  // Rollback a formato legacy si es necesario
  const rollbackToLegacy = useCallback(() => {
    if (!unifiedConfig) return;

    try {
      syncToLegacy(unifiedConfig);
      setIsMigrated(false);
      setUnifiedConfig(null);

      createNotification(
        NotificationType.INFO,
        'Rollback Completado',
        'Se ha revertido al sistema legacy',
        NotificationPriority.MEDIUM
      );
    } catch (error) {
      console.error('Error durante rollback:', error);
    }
  }, [unifiedConfig, syncToLegacy, createNotification]);

  return {
    isMigrated,
    unifiedConfig,
    isProcessing,
    migrateToUnified,
    syncToLegacy,
    rollbackToLegacy,
    canMigrate: !isMigrated && activeConfig && !isProcessing
  };
};