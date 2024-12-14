// utils/api.ts

//const PRODUCTION = 'https://fastapi.kleo.network/api/v1';
const PRODUCTION = 'http://127.0.0.1:8000/api/v1';

// Define types for the parameters
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions extends RequestInit {
    headers: Record<string, string>;
    body?: string;
}

// General API helper function
export async function apiRequest<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    authToken?: string,
    baseUrl: string = PRODUCTION,
): Promise<T> {
    const apiEndpoint = `${baseUrl}/${endpoint}`;
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (authToken) {
        headers['Authorization'] = `${authToken}`;
    }

    const options: RequestOptions = {
        method,
        headers,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(apiEndpoint, options);
        const responseData = await response.json(); // Or use response.json() if the response is JSON
        return responseData;
    } catch (error) {
        console.error("Error in API request:", error);
        throw error;
    }
}
export async function vanaWalletApi(method: HttpMethod, endpoint: string, authToken?: string) {
    const ISLANDER_API = 'https://api.islander.vanascan.io/api/v2';
    return apiRequest(method, endpoint, undefined, authToken, ISLANDER_API);
}