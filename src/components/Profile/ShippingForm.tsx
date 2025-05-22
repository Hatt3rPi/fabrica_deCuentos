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
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información de Envío</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dirección */}
        <div>
          <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dirección
          </label>
          <input
            type="text"
            id="shipping_address"
            name="shipping_address"
            value={formData.shipping_address}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.shipping_address ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700`}
          />
          {errors.shipping_address && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shipping_address}</p>
          )}
        </div>
        
        {/* Región */}
        <div>
          <label htmlFor="shipping_region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Región
          </label>
          <select
            id="shipping_region"
            name="shipping_region"
            value={formData.shipping_region}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.shipping_region ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700`}
          >
            <option value="">Selecciona una región</option>
            {chileanLocations.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {errors.shipping_region && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shipping_region}</p>
          )}
        </div>
        
        {/* Comuna */}
        <div>
          <label htmlFor="shipping_comuna" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comuna
          </label>
          <select
            id="shipping_comuna"
            name="shipping_comuna"
            value={formData.shipping_comuna}
            onChange={handleChange}
            disabled={!formData.shipping_region}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.shipping_comuna ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${
              !formData.shipping_region ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="">Selecciona una comuna</option>
            {availableComunas.map(comuna => (
              <option key={comuna.id} value={comuna.id}>
                {comuna.name}
              </option>
            ))}
          </select>
          {errors.shipping_comuna && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shipping_comuna}</p>
          )}
        </div>
        
        {/* Ciudad */}
        <div>
          <label htmlFor="shipping_city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ciudad
          </label>
          <select
            id="shipping_city"
            name="shipping_city"
            value={formData.shipping_city}
            onChange={handleChange}
            disabled={!formData.shipping_comuna}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.shipping_city ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${
              !formData.shipping_comuna ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="">Selecciona una ciudad</option>
            {availableCities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.shipping_city && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shipping_city}</p>
          )}
        </div>
        
        {/* Teléfono */}
        <div>
          <label htmlFor="shipping_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Teléfono
          </label>
          <input
            type="tel"
            id="shipping_phone"
            name="shipping_phone"
            value={formData.shipping_phone}
            onChange={handleChange}
            placeholder="+56 9 1234 5678"
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.shipping_phone ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700`}
          />
          {errors.shipping_phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shipping_phone}</p>
          )}
        </div>
        
        {/* Persona de contacto */}
        <div>
          <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Persona de contacto
          </label>
          <input
            type="text"
            id="contact_person"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.contact_person ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700`}
          />
          {errors.contact_person && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact_person}</p>
          )}
        </div>
        
        {/* Notas adicionales */}
        <div>
          <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notas adicionales
          </label>
          <textarea
            id="additional_notes"
            name="additional_notes"
            value={formData.additional_notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            Guardar información de envío
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingForm;
