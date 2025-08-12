// API Service Class for Frontend-Backend Integration
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('authToken');
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get default headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method with retry logic
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers
            }
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, config);
                
                // Handle different response types
                if (response.status === 204) {
                    return { success: true };
                }

                const data = await response.json();

                if (!response.ok) {
                    // Handle specific error cases
                    if (response.status === 401) {
                        this.handleUnauthorized();
                        throw new Error(data.message || 'Unauthorized');
                    }
                    
                    if (response.status === 429) {
                        // Rate limited - wait and retry
                        if (attempt < this.retryAttempts) {
                            await this.delay(this.retryDelay * attempt);
                            continue;
                        }
                    }

                    throw new Error(data.message || `HTTP ${response.status}`);
                }

                return data;
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    throw error;
                }

                // Only retry on network errors
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    await this.delay(this.retryDelay * attempt);
                    continue;
                }

                throw error;
            }
        }
    }

    // Handle unauthorized responses
    handleUnauthorized() {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Delay utility for retries
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Authentication endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            auth: false
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            auth: false
        });
    }

    async validateToken() {
        return this.request('/auth/validate');
    }

    async refreshToken(refreshToken) {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    async getUserStats() {
        return this.request('/auth/stats');
    }

    async deleteAccount(password) {
        return this.request('/auth/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }

    // Chat endpoints
    async sendMessage(message) {
        return this.request('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getChatHistory(options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/chat/history?${params}`);
    }

    async clearChatHistory() {
        return this.request('/chat/history', {
            method: 'DELETE'
        });
    }

    async getChatStats() {
        return this.request('/chat/stats');
    }

    async searchMessages(query, options = {}) {
        const params = new URLSearchParams({ query, ...options });
        return this.request(`/chat/search?${params}`);
    }

    async exportChat(format = 'json') {
        const response = await fetch(`${this.baseURL}/chat/export?format=${format}`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        return response.blob();
    }

    async getMessage(messageId) {
        return this.request(`/chat/message/${messageId}`);
    }

    async deleteMessage(messageId) {
        return this.request(`/chat/message/${messageId}`, {
            method: 'DELETE'
        });
    }

    async deleteMessages(messageIds) {
        return this.request('/chat/messages', {
            method: 'DELETE',
            body: JSON.stringify({ messageIds })
        });
    }

    async getChatSessions(options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/chat/sessions?${params}`);
    }

    async createChatSession() {
        return this.request('/chat/session', {
            method: 'POST'
        });
    }

    async endChatSession(sessionId) {
        return this.request(`/chat/session/${sessionId}/end`, {
            method: 'PUT'
        });
    }

    // Settings endpoints
    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    async resetSettings() {
        return this.request('/settings/reset', {
            method: 'POST'
        });
    }

    async exportSettings() {
        const response = await fetch(`${this.baseURL}/settings/export`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Settings export failed');
        }

        return response.blob();
    }

    async importSettings(settings) {
        return this.request('/settings/import', {
            method: 'POST',
            body: JSON.stringify({ settings })
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health', { auth: false });
    }

    // File upload utility
    async uploadFile(file, endpoint) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        return response.json();
    }

    // WebSocket connection for real-time features
    createWebSocket(endpoint) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws${endpoint}`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            // Send authentication token
            if (this.token) {
                ws.send(JSON.stringify({
                    type: 'auth',
                    token: this.token
                }));
            }
        };

        return ws;
    }
}

// Create global API instance
window.apiService = new ApiService();