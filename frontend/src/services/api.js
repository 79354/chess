const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
    constructor(){
        this.baseUrl = API_BASE_URL;
    }

    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        }

        if (includeAuth) {
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }
    

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }


    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET'});
    }

    async post(endpoint, data, options ={}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async patch(endpoint, data, options ={}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, options= {}) {
        return this.request(endpoint, { ...options, method: "DELETE"});
    }
}


export const api = new ApiService();
export default api;