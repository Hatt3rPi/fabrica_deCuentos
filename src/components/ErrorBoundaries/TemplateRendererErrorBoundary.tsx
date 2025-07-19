import React, { Component, ReactNode } from 'react';

interface TemplateRendererErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorTimestamp: string | null;
  errorContext: any;
}

interface TemplateRendererErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo, context: any) => void;
  fallback?: ReactNode;
  context?: string;
  // Props adicionales para debugging
  templateRendererProps?: any;
}

class TemplateRendererErrorBoundary extends Component<
  TemplateRendererErrorBoundaryProps,
  TemplateRendererErrorBoundaryState
> {
  constructor(props: TemplateRendererErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorTimestamp: null,
      errorContext: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TemplateRendererErrorBoundaryState> {
    // Actualizar el state para mostrar la UI de error
    return {
      hasError: true,
      error,
      errorTimestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capturar información detallada del error
    const detailedErrorContext = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      props: {
        context: this.props.context,
        templateRendererProps: this.props.templateRendererProps ? {
          config: this.props.templateRendererProps.config ? {
            id: this.props.templateRendererProps.config.id,
            name: this.props.templateRendererProps.config.name,
            hasComponents: !!this.props.templateRendererProps.config.components,
            componentsCount: this.props.templateRendererProps.config.components?.length || 0,
          } : null,
          pageType: this.props.templateRendererProps.pageType,
          contentKeys: this.props.templateRendererProps.content ? 
            Object.keys(this.props.templateRendererProps.content) : [],
          renderOptions: this.props.templateRendererProps.renderOptions ? {
            context: this.props.templateRendererProps.renderOptions.context,
            enableScaling: this.props.templateRendererProps.renderOptions.enableScaling,
            preserveAspectRatio: this.props.templateRendererProps.renderOptions.preserveAspectRatio,
            targetDimensions: this.props.templateRendererProps.renderOptions.targetDimensions,
            features: this.props.templateRendererProps.renderOptions.features,
          } : null,
          debug: this.props.templateRendererProps.debug,
          hasCallbacks: {
            onComponentSelect: !!this.props.templateRendererProps.onComponentSelect,
            onComponentUpdate: !!this.props.templateRendererProps.onComponentUpdate,
          }
        } : null,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Guardar en estado para mostrar
    this.setState({
      errorInfo,
      errorContext: detailedErrorContext
    });

    // Logging detallado en consola
    console.group('🎯[TEMPLATE-DEBUG] 🚨 TemplateRenderer Error Boundary Triggered');
    console.error('🎯[TEMPLATE-DEBUG] Error:', error);
    console.error('🎯[TEMPLATE-DEBUG] Error Info:', errorInfo);
    console.error('🎯[TEMPLATE-DEBUG] Detailed Context:', detailedErrorContext);
    console.groupEnd();

    // Callback externo si está definido
    if (this.props.onError) {
      this.props.onError(error, errorInfo, detailedErrorContext);
    }

    // También guardar en localStorage para debugging persistente
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        context: detailedErrorContext
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('templateRenderer_errorLogs') || '[]');
      existingLogs.push(errorLog);
      
      // Mantener solo los últimos 10 errores
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('templateRenderer_errorLogs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Failed to save error log to localStorage:', storageError);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorTimestamp: null,
      errorContext: null
    });
  };

  handleCopyErrorDetails = () => {
    if (this.state.errorContext) {
      const errorDetails = JSON.stringify(this.state.errorContext, null, 2);
      navigator.clipboard.writeText(errorDetails).then(() => {
        alert('Detalles del error copiados al portapapeles');
      }).catch(() => {
        // Fallback para navegadores sin clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = errorDetails;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Detalles del error copiados al portapapeles');
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si está proporcionado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error detallada para debugging
      return (
        <div className="template-renderer-error-boundary border-2 border-red-500 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              🚨 TemplateRenderer Error
            </h2>
            <p className="text-sm text-red-600 dark:text-red-300">
              Error capturado en: {this.props.context || 'Unknown context'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {this.state.errorTimestamp}
            </p>
          </div>

          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Error Message:</h3>
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {this.state.error?.message}
            </p>
          </div>

          {this.state.errorContext?.props?.templateRendererProps && (
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Props Analysis:</h3>
              <div className="text-xs space-y-1">
                <p><strong>Config:</strong> {this.state.errorContext.props.templateRendererProps.config?.name || 'null'}</p>
                <p><strong>Page Type:</strong> {this.state.errorContext.props.templateRendererProps.pageType}</p>
                <p><strong>Enable Scaling:</strong> {String(this.state.errorContext.props.templateRendererProps.renderOptions?.enableScaling)}</p>
                <p><strong>Target Dimensions:</strong> {JSON.stringify(this.state.errorContext.props.templateRendererProps.renderOptions?.targetDimensions)}</p>
                <p><strong>Context:</strong> {this.state.errorContext.props.templateRendererProps.renderOptions?.context}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              🔄 Reintentar
            </button>
            <button
              onClick={this.handleCopyErrorDetails}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              📋 Copiar Detalles
            </button>
          </div>

          {/* Stack trace colapsable para debugging avanzado */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              🔍 Stack Trace (Click para expandir)
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TemplateRendererErrorBoundary;