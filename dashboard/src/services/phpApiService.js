import { getAuth } from "firebase/auth";

// Determine API URL based on environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // In production, PHP likely serves the API at the same domain
  : 'http://localhost:8000'; // In development, PHP server runs on 8000

class PhpApiService {
  async getHeaders() {
    const auth = getAuth();
    const user = auth.currentUser;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async request(endpoint, method = 'GET', data = null) {
    const headers = await this.getHeaders();
    const config = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    // Handle full URL or relative path
    // Remove leading slash from endpoint if API_BASE_URL doesn't have trailing slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses (like 404 HTML pages from PHP server)
      const contentType = response.headers.get("content-type");
      let responseData;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Invalid response format from server: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Request failed with status ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('PHP API Request Error:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, 'GET');
  }

  async post(endpoint, data) {
    return this.request(endpoint, 'POST', data);
  }

  async put(endpoint, data) {
    return this.request(endpoint, 'PUT', data);
  }

  async patch(endpoint, data) {
    return this.request(endpoint, 'PATCH', data);
  }

  async delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }
}

export default new PhpApiService();
