import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../UI/Button';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showRefresh?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class PurchaseErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PurchaseErrorBoundary caught an error:', error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Error en el sistema de compras',
        fallbackMessage = 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.',
        showRefresh = true
      } = this.props;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {fallbackTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {fallbackMessage}
              </p>
              {this.state.error && (
                <details className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <summary className="cursor-pointer">Detalles técnicos</summary>
                  <pre className="mt-2 text-left bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="w-full"
              >
                Intentar nuevamente
              </Button>
              {showRefresh && (
                <Button
                  onClick={this.handleRefresh}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recargar página
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PurchaseErrorBoundary;