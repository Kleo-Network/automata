import { Method } from 'axios';
import { useEffect, useState } from 'react';

type Options<T> = {
  method?: Method;
  body?: BodyInit | null;
  headers?: HeadersInit;
  mode?: RequestMode;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  redirect?: RequestRedirect;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  signal?: AbortSignal;
  keepalive?: boolean;
  onSuccessfulFetch?: (data?: T) => void;
  onError?: (error: any) => void;
};

type FetchResponse<T> = {
  data: T | null;
  status: FetchStatus;
  error: any;
  fetchData: (url: string, options?: Options<T>) => Promise<T | undefined>;
};

export enum FetchStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  PROCESSING = 'processing',
}

function useFetch<T>(
  url?: string, 
  options?: Options<T>, 
  dependencies: any[] = []
): FetchResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [error, setError] = useState<any>(null);
  const [controller, setController] = useState<AbortController | null>(null);
  // const baseUrl = 'http://127.0.0.1:8000/api/v1';
  const baseUrl = 'https://fastapi.kleo.network/api/v1';
  
  function getToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('user', (storageData: any) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const token = storageData.user?.token || '';
          resolve(token);
        }
      });
    });
  }

  const fetchData = async (url: string, options?: Options<T>): Promise<T | undefined> => {
    if (!url) {
      return;
    }
    
    const token = await getToken();
    setStatus(FetchStatus.LOADING);
    options = {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: token || '',
      },
    };

    try {
      const response = await fetch(`${baseUrl}/${url}`, {
        method: options?.method || 'GET',
        body: options?.body || null,
        headers: options?.headers,
        mode: options?.mode || 'cors',
        cache: options?.cache || 'default',
        credentials: options?.credentials || 'same-origin',
        redirect: options?.redirect || 'follow',
        referrerPolicy: options?.referrerPolicy || 'no-referrer',
        integrity: options?.integrity || '',
        keepalive: options?.keepalive || false,
        signal: options?.signal,
      });

      if (!response.ok) {
        throw new Error('Could not fetch data for that resource');
      }

      const data = (await response.json()) as T;
      setData(data);
      setStatus(FetchStatus.SUCCESS);
      if (options?.onSuccessfulFetch) {
        options.onSuccessfulFetch(data);
      }
      return data;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setStatus(FetchStatus.ERROR);
        if (options?.onError) {
          options.onError(err);
        }
        throw err;
      }
    }
  };

  const fetchDataManually = (url: string, options?: Options<T>) => {
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);
    return fetchData(url || '', { ...(options || {}), signal: newController.signal });
  };

  useEffect(() => {
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);
    fetchData(url || '', { ...(options || {}), signal: newController.signal });

    return () => {
      newController.abort();
    };
  }, [url, ...dependencies]); // Add url and dependencies to the dependency array

  return { data, status, error, fetchData: fetchDataManually };
}

export default useFetch;