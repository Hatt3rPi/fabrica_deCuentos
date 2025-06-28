/**
 * Componente temporal para probar la integración con Sentry
 * Solo aparece en desarrollo
 */

import React from 'react';
import { logger } from '../../utils/logger';

const SentryTest: React.FC = () => {
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  const handleTestError = () => {
    throw new Error("🧪 Test Error - Sentry Integration Test");
  };

  const handleTestLoggerError = () => {
    logger.error("Test Logger Error", new Error("Error desde logger"));
  };

  const handleTestApiError = () => {
    logger.apiError("/api/test", new Error("API Test Error"), { testData: "example" });
  };

  const handleTestUserError = () => {
    logger.userError("test_action", new Error("User Action Error"), { userId: "test123" });
  };

  const handleTestWarning = () => {
    logger.warn("Test Warning", { component: "SentryTest" });
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg shadow-lg z-50">
      <h3 className="text-sm font-bold text-yellow-800 mb-2">🧪 Sentry Test (Dev Only)</h3>
      <div className="space-y-2">
        <button
          onClick={handleTestError}
          className="block w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test Direct Error
        </button>
        <button
          onClick={handleTestLoggerError}
          className="block w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Test Logger Error
        </button>
        <button
          onClick={handleTestApiError}
          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API Error
        </button>
        <button
          onClick={handleTestUserError}
          className="block w-full px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test User Error
        </button>
        <button
          onClick={handleTestWarning}
          className="block w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Test Warning
        </button>
      </div>
    </div>
  );
};

export default SentryTest;