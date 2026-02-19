import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
    isAxiosError,
  } from 'axios';
  import qs from 'qs';
  

  // API base URL - when running as local app (npx oktaman), UI is served from same server
  export const API_BASE_URL = window.location.origin;
  export const API_URL = API_BASE_URL;
  
  
  function isUrlRelative(url: string) {
    return !url.startsWith('http') && !url.startsWith('https');
  }

  
  async function request<TResponse>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<TResponse> {
    const resolvedUrl = !isUrlRelative(url) ? url : `${API_URL}${url}`;

    return axios({
      url: resolvedUrl,
      ...config,
      withCredentials: true,
      headers: {
        ...config.headers,
      },
    })
      .then((response) => response.data as TResponse)
      .catch((error) => {
        throw error;
      });
  }
  
  export type HttpError = AxiosError<unknown, AxiosResponse<unknown>>;
  
  export const api = {
    isError(error: unknown): error is HttpError {
      return isAxiosError(error);
    },
    get: <TResponse>(url: string, query?: unknown) =>
      request<TResponse>(url, {
        params: query,
        paramsSerializer: (_params) => {
          return qs.stringify(_params, {
            arrayFormat: 'repeat',
          });
        },
      }),
    delete: <TResponse>(url: string, query?: Record<string, string>) =>
      request<TResponse>(url, {
        method: 'DELETE',
        params: query,
        paramsSerializer: (_params) => {
          return qs.stringify(_params, {
            arrayFormat: 'repeat',
          });
        },
      }),
    post: <TResponse, TBody = unknown, TParams = unknown>(
      url: string,
      body?: TBody,
      params?: TParams,
      headers?: Record<string, string>,
    ) =>
      request<TResponse>(url, {
        method: 'POST',
        data: body,
        headers: { 'Content-Type': 'application/json', ...headers },
        params: params,
      }),

    postStream: async <TBody = unknown, TParams = unknown>(
      url: string,
      onChunk: (chunk: string) => void,
      body?: TBody,
      _params?: TParams,
      headers?: Record<string, string>,
    ): Promise<void> => {
      const resolvedUrl = !isUrlRelative(url) ? url : `${API_URL}${url}`;

      const response = await fetch(resolvedUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value }: { done: boolean; value?: Uint8Array } = await reader.read();
        
        if (done) {
          break;
        }

        if (value) {
          const chunk = decoder.decode(value);
          onChunk(chunk);
        }
      }
    },

    patch: <TResponse, TBody = unknown, TParams = unknown>(
      url: string,
      body?: TBody,
      params?: TParams,
    ) =>
      request<TResponse>(url, {
        method: 'PATCH',
        data: body,
        headers: { 'Content-Type': 'application/json' },
        params: params,
      }),

    put: <TResponse, TBody = unknown, TParams = unknown>(
      url: string,
      body?: TBody,
      params?: TParams,
    ) =>
      request<TResponse>(url, {
        method: 'PUT',
        data: body,
        headers: { 'Content-Type': 'application/json' },
        params: params,
      }),
  };