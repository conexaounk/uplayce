import { useEffect, useState } from 'react';

export const usePWA = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setIsUpdateAvailable(false);
        window.location.reload();
      });
    }
  }, []);

  return { isUpdateAvailable };
};
