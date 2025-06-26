import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { chileanLocations } from '../../data/chileanLocations';

const ShippingForm: React.FC = () => {
  const { profile, updateShippingInfo } = useProfileStore();
  
  const [formData, setFormData] = useState({
    shipping_address: profile?.shipping_address || '',
    shipping_region: profile?.shipping_region || '',
    shipping_comuna: profile?.shipping_comuna || '',
    shipping_city: profile?.shipping_city || '',
    shipping_phone: profile?.shipping_phone || '',
    contact_person: profile?.contact_person || '',
    additional_notes: profile?.additional_notes || ''
  });
  
  const [availableComunas, setAvailableComunas] = useState<{id: string, name: string}[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (formData.shipping_region) {
      const region = chileanLocations.find(r => r.id === formData.shipping_region);
      if (region) {
        setAvailableComunas(region.comunas.map(c => ({ id: c.id, name: c.name })));
        
        if (!region.comunas.some(c => c.id === formData.shipping_comuna)) {
          setFormData(prev => ({
            ...prev,
            shipping_comuna: '',
            shipping_city: ''
          }));
          setAvailableCities([]);
        }
      }
    } else {
      setAvailableComunas([]);
      setAvailableCities([]);
    }
  }, [formData.shipping_region]);
  
  useEffect(() => {
    if (formData.shipping_comuna && formData.shipping_region) {
      const region = chileanLocations.find(r => r.id === formData.shipping_region);
      if (region) {
        const comuna = region.comunas.find(c => c.id === formData.shipping_comuna);
        if (comuna) {
          setAvailableCities(comuna.cities);
          
          if (!comuna.cities.includes(formData.shipping_city)) {
            setFormData(prev => ({
              ...prev,
              shipping_city: ''
            }));
          }
        }
      }
    }
  }, [formData.shipping_comuna, formData.shipping_region]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.shipping_address.trim()) {
      newErrors.shipping_address = 'La dirección es requerida';
    }
    
    if (!formData.shipping_region) {
      newErrors.shipping_region = 'La región es requerida';
    }
    
    if (!formData.shipping_comuna) {
      newErrors.shipping_comuna = 'La comuna es requerida';
    }
    
    if (!formData.shipping_city) {
      newErrors.shipping_city = 'La ciudad es requerida';
    }
    
    if (!formData.shipping_phone.trim()) {
      newErrors.shipping_phone = 'El teléfono es requerido';
    } else if (!/^(\+?56)?(\s*\d){9,11}$/.test(formData.shipping_phone)) {
      newErrors.shipping_phone = 'Ingresa un teléfono chileno válido';
    }
    
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'La persona de contacto es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await updateShippingInfo(formData);
    }
  };
  
  return (
    <div className="mt-4 sm:mt-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Información de Envío</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Completa tus datos de envío para recibir tus pedidos
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dirección */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección
            </label>
          </div>
          <div className="mt-1">
            <input
              type="text"
              id="shipping_address"
              name="shipping_address"
              value={formData.shipping_address}
              onChange={handleChange}
              placeholder="Calle y número, departamento, villa, etc."
              className={`block w-full px-4 py-3 rounded-lg border-2 ${
                errors.shipping_address 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 transition duration-150 ease-in-out`}
            />
            {errors.shipping_address && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.shipping_address}
              </p>
            )}
          </div>
        </div>
        
        {/* Región */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label htmlFor="shipping_region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Región
            </label>
          </div>
          <div className="mt-1">
            <div className="relative">
              <select
                id="shipping_region"
                name="shipping_region"
                value={formData.shipping_region}
                onChange={handleChange}
                className={`block w-full pl-4 pr-10 py-3 text-base rounded-lg border-2 appearance-none ${
                  errors.shipping_region 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none transition duration-150 ease-in-out`}
              >
                <option value="">Selecciona una región</option>
                {chileanLocations.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {errors.shipping_region && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.shipping_region}
              </p>
            )}
          </div>
        </div>
        
        {/* Comuna */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label 
              htmlFor="shipping_comuna" 
              className={`block text-sm font-medium ${
                !formData.shipping_region ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              Comuna
            </label>
          </div>
          <div className="mt-1">
            <div className="relative">
              <select
                id="shipping_comuna"
                name="shipping_comuna"
                value={formData.shipping_comuna}
                onChange={handleChange}
                disabled={!formData.shipping_region}
                className={`block w-full pl-4 pr-10 py-3 text-base rounded-lg border-2 appearance-none ${
                  errors.shipping_comuna 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                } ${
                  !formData.shipping_region ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                } focus:outline-none transition duration-150 ease-in-out`}
              >
                <option value="">Selecciona una comuna</option>
                {availableComunas.map(comuna => (
                  <option key={comuna.id} value={comuna.id}>
                    {comuna.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className={`h-5 w-5 ${
                  !formData.shipping_region ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'
                }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {errors.shipping_comuna && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.shipping_comuna}
              </p>
            )}
          </div>
        </div>
        
        {/* Ciudad */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label 
              htmlFor="shipping_city" 
              className={`block text-sm font-medium ${
                !formData.shipping_comuna ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              Ciudad
            </label>
          </div>
          <div className="mt-1">
            <div className="relative">
              <select
                id="shipping_city"
                name="shipping_city"
                value={formData.shipping_city}
                onChange={handleChange}
                disabled={!formData.shipping_comuna}
                className={`block w-full pl-4 pr-10 py-3 text-base rounded-lg border-2 appearance-none ${
                  errors.shipping_city 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                } ${
                  !formData.shipping_comuna ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                } focus:outline-none transition duration-150 ease-in-out`}
              >
                <option value="">Selecciona una ciudad</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className={`h-5 w-5 ${
                  !formData.shipping_comuna ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'
                }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {errors.shipping_city && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.shipping_city}
              </p>
            )}
          </div>
        </div>
        
        {/* Teléfono */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label htmlFor="shipping_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Teléfono
            </label>
          </div>
          <div className="mt-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="tel"
                id="shipping_phone"
                name="shipping_phone"
                value={formData.shipping_phone}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                className={`block w-full pl-10 pr-4 py-3 rounded-lg border-2 ${
                  errors.shipping_phone 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition duration-150 ease-in-out`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Formato: +56 9 1234 5678 o 912345678
            </p>
            {errors.shipping_phone && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.shipping_phone}
              </p>
            )}
          </div>
        </div>
        
        {/* Persona de contacto */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Persona de contacto
            </label>
          </div>
          <div className="mt-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Nombre completo de quien recibirá"
                className={`block w-full pl-10 pr-4 py-3 rounded-lg border-2 ${
                  errors.contact_person 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition duration-150 ease-in-out`}
              />
            </div>
            {errors.contact_person && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.contact_person}
              </p>
            )}
          </div>
        </div>
        
        {/* Notas adicionales */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-1">
            <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas adicionales
            </label>
          </div>
          <div className="mt-1">
            <div className="relative">
              <div className="absolute top-3 left-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <textarea
                id="additional_notes"
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                rows={3}
                placeholder="Instrucciones especiales para la entrega"
                className="block w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition duration-150 ease-in-out resize-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ej: Número de departamento, bloque, referencias, etc.
            </p>
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guardar información de envío
          </button>
          <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
            Tus datos se guardan automáticamente. Puedes modificarlos cuando lo necesites.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ShippingForm;
