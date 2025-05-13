import { useState, useEffect } from 'react';

const messages = [
  'Descubriendo nuevos héroes',
  'Pintando dinosaurios',
  'Dibujando unicornios',
  'Construyendo castillos de almohadas',
  'Navegando mares de estrellas',
  'Buscando tesoros entre las nubes',
  'Horneando galletas cósmicas',
  'Despertando dragones dormilones',
  'Sembrando risas en el jardín',
  'Tejiendo historias mágicas'
];

export const useLoadingMessage = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setMessage(messages[currentIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return message;
};