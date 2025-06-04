import React, { useEffect } from 'react';
import { useProfileStore } from '../stores/profileStore';
import ShippingForm from '../components/Profile/ShippingForm';

const ProfileSettings: React.FC = () => {
  const { profile, loadProfile, isLoading, error } = useProfileStore();
  
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  
  
  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error && !profile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Error al cargar el perfil</h3>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={() => loadProfile()}
          className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mi Perfil</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <ShippingForm />
      </div>
    </div>
  );
};

export default ProfileSettings;
