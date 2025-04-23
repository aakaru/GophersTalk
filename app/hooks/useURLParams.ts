import { useEffect, useState } from 'react';

interface URLParams {
  username: string;
}

export const useURLParams = (): URLParams => {
  const [params, setParams] = useState<URLParams>({ username: '' });

  useEffect(() => {
    const url = new URL(window.location.href);
    const username = url.searchParams.get('username') || '';
    
    setParams({ username });
  }, []);

  return params;
}; 