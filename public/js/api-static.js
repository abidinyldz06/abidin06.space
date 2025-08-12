// Static API Service for GitHub Pages Deployment
class ApiService {
    constructor() {
        this.baseURL = '';
        this.token = localStorage.getItem('authToken');
        this.mockData = {
            users: [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@abidin.space',
                    password: 'admin123', // In real app, this would be hashed
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'demo',
                    email: 'demo@abidin.space',
                    password: 'demo123',
                    createdAt: new Date().toISOString()
                }
            ],
            messages: [
                {
                    id: 1,
                    userId: 1,
                    content: 'Merhaba! Abidin.Space'e hoş geldiniz!',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    type: 'received'
                },
                {
                    id: 2,
                    userId: 1,
                    content: 'Bu modern kişisel asistan uygulaması nasıl?',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    type: 'sent'
                },
                {
                    id: 3,
                    userId: 1,
                    content: 'Harika! Tüm özellikler çalışıyor. Chat, dashboard, güvenlik - her şey mükemmel!',
                    timestamp: new Date(Date.now() - 900000).toISOString(),
                    type: 'received'
                }
            ],
            settings: {
                theme: 'dark',
                notifications: true,
                language: 'tr',
                autoSave: true
            },
            stats: {
                totalMessages: 156,
                totalUsers: 12,
                activeToday: 8,
                responseTime: '0.3s'
            }
        };
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

    // Simulate API delay
    async delay(ms = 300) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Mock authentication
    async login(credentials) {
        await this.delay();
        
        const user = this.mockData.users.find(u => 
            u.username === credentials.username && 
            u.password === credentials.password
        );

        if (user) {
            const token = btoa(JSON.stringify({ 
                userId: user.id, 
                username: user.username,
                exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            }));
            
            this.setToken(token);
            
            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                }
            };
        }

        return {
            success: false,
            error: 'Geçersiz kullanıcı adı veya şifre'
        };
    }

    // Mock registration
    async register(userData) {
        await this.delay();
        
        // Check if user already exists
        const existingUser = this.mockData.users.find(u => 
            u.username === userData.username || u.email === userData.email
        );

        if (existingUser) {
            return {
                success: false,
                error: 'Kullanıcı zaten mevcut'
            };
        }

        // Create new user
        const newUser = {
            id: this.mockData.users.length + 1,
            ...userData,
            createdAt: new Date().toISOString()
        };

        this.mockData.users.push(newUser);

        const token = btoa(JSON.stringify({ 
            userId: newUser.id, 
            username: newUser.username,
            exp: Date.now() + 24 * 60 * 60 * 1000
        }));
        
        this.setToken(token);

        return {
            success: true,
            data: {
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email
                }
            }
        };
    }

    // Mock logout
    async logout() {
        await this.delay(100);
        this.setToken(null);
        return { success: true };
    }

    // Mock get messages
    async getMessages() {
        await this.delay();
        
        if (!this.token) {
            return { success: false, error: 'Unauthorized' };
        }

        return {
            success: true,
            data: this.mockData.messages
        };
    }

    // Mock send message
    async sendMessage(messageData) {
        await this.delay();
        
        if (!this.token) {
            return { success: false, error: 'Unauthorized' };
        }

        const newMessage = {
            id: this.mockData.messages.length + 1,
            userId: JSON.parse(atob(this.token)).userId,
            content: messageData.content,
            timestamp: new Date().toISOString(),
            type: 'sent'
        };

        this.mockData.messages.push(newMessage);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: this.mockData.messages.length + 1,
                userId: 0, // AI user
                content: this.generateAIResponse(messageData.content),
                timestamp: new Date().toISOString(),
                type: 'received'
            };
            
            this.mockData.messages.push(aiResponse);
            
            // Trigger message update event
            window.dispatchEvent(new CustomEvent('newMessage', { 
                detail: aiResponse 
            }));
        }, 1000 + Math.random() * 2000);

        return {
            success: true,
            data: newMessage
        };
    }

    // Generate AI response
    generateAIResponse(userMessage) {
        const responses = [
            'Çok ilginç bir soru! Bu konuda size yardımcı olabilirim.',
            'Anlıyorum. Bu durumda şunu önerebilirim...',
            'Harika! Bu konuda daha fazla bilgi verebilirim.',
            'Tabii ki! Size bu konuda detaylı bilgi verebilirim.',
            'Mükemmel soru! İşte size önerim...',
            'Bu gerçekten önemli bir konu. Şöyle düşünebiliriz...',
            'Çok güzel! Bu konuda birlikte çalışabiliriz.',
            'Anlıyorum. Size en iyi çözümü sunmaya çalışacağım.'
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Mock get user settings
    async getSettings() {
        await this.delay();
        
        if (!this.token) {
            return { success: false, error: 'Unauthorized' };
        }

        return {
            success: true,
            data: this.mockData.settings
        };
    }

    // Mock update settings
    async updateSettings(settings) {
        await this.delay();
        
        if (!this.token) {
            return { success: false, error: 'Unauthorized' };
        }

        this.mockData.settings = { ...this.mockData.settings, ...settings };

        return {
            success: true,
            data: this.mockData.settings
        };
    }

    // Mock get dashboard stats
    async getDashboardStats() {
        await this.delay();
        
        if (!this.token) {
            return { success: false, error: 'Unauthorized' };
        }

        // Simulate dynamic stats
        const stats = {
            ...this.mockData.stats,
            totalMessages: this.mockData.messages.length,
            lastActivity: new Date().toISOString()
        };

        return {
            success: true,
            data: stats
        };
    }

    // Mock verify token
    async verifyToken() {
        await this.delay(100);
        
        if (!this.token) {
            return { success: false, error: 'No token' };
        }

        try {
            const payload = JSON.parse(atob(this.token));
            
            if (payload.exp < Date.now()) {
                this.setToken(null);
                return { success: false, error: 'Token expired' };
            }

            const user = this.mockData.users.find(u => u.id === payload.userId);
            
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            return {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                }
            };
        } catch (error) {
            this.setToken(null);
            return { success: false, error: 'Invalid token' };
        }
    }

    // Mock file upload
    async uploadFile(file) {
        await this.delay(1000);
        
        if (!this.token) {
            return { success: false, error: 'Unauthorized' };
        }

        // Simulate file upload
        return {
            success: true,
            data: {
                filename: file.name,
                size: file.size,
                url: URL.createObjectURL(file),
                uploadedAt: new Date().toISOString()
            }
        };
    }
}

// Export for use in other modules
window.ApiService = ApiService;