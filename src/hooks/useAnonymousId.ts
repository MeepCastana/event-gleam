
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useAnonymousId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get existing ID from localStorage
    let id = localStorage.getItem('anonymous_user_id');
    
    // If no ID exists, create a new one
    if (!id) {
      id = uuidv4();
      localStorage.setItem('anonymous_user_id', id);
    }
    
    setUserId(id);
  }, []);

  return userId;
};
