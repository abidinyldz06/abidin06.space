// App State Management
class AppState {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        // Check if user is already authenticated
        if (this.token) {
            this.validateToken();
        } else {
            this.showLandingPage();
        }
    }

    async validateToken() {
        try {
            apiService.setToken(this.token);
            const response = await apiService.validateToken();
            
            if (response.success) {
                this.setUser(response.user);
                this.showDashboard();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.logout();
        }
    }

    setUser(userData) {
        this.isAuthenticated = true;
        this.user = userData;
        this.updateUserDisplay();
    }

    updateUserDisplay() {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.user) {
            userNameElement.textContent = this.user.username || 'Kullanıcı';
        }
    }

    showLandingPage() {
        document.getElementById('landing-page').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        this.hideLoadingScreen();
    }

    showDashboard() {
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        this.hideLoadingScreen();
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 350);
        }, 500);
    }

    logout() {
        this.isAuthenticated = false;
        this.user = null;
        this.token = null;
        localStorage.removeItem('authToken');
        this.showLandingPage();
    }
}

// Enhanced Authentication Manager
class AuthManager {
    constructor(appState) {
        this.appState = appState;
        this.isLoading = false;
        this.setupEventListeners();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Login button
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Close modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideLoginModal();
        });

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Close modal on outside click
        document.getElementById('login-modal').addEventListener('click', (e) => {
            if (e.target.id === 'login-modal') {
                this.hideLoginModal();
            }
        });

        // Password toggle
        document.getElementById('toggle-password').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('login-modal').classList.contains('hidden')) {
                this.hideLoginModal();
            }
        });

        // Remember me functionality
        this.setupRememberMe();
    }

    setupFormValidation() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        // Real-time validation
        usernameInput.addEventListener('input', () => {
            this.validateField(usernameInput, 'username');
        });

        passwordInput.addEventListener('input', () => {
            this.validateField(passwordInput, 'password');
        });

        // Enhanced focus states
        [usernameInput, passwordInput].forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
                this.validateField(input, input.name);
            });
        });
    }

    validateField(input, fieldName) {
        const value = input.value.trim();
        let isValid = true;
        let message = '';

        switch (fieldName) {
            case 'username':
                if (!value) {
                    isValid = false;
                    message = 'Kullanıcı adı gerekli';
                } else if (value.length < 3) {
                    isValid = false;
                    message = 'Kullanıcı adı en az 3 karakter olmalı';
                }
                break;
            case 'password':
                if (!value) {
                    isValid = false;
                    message = 'Şifre gerekli';
                } else if (value.length < 6) {
                    isValid = false;
                    message = 'Şifre en az 6 karakter olmalı';
                }
                break;
        }

        this.updateFieldValidation(input, isValid, message);
        return isValid;
    }

    updateFieldValidation(input, isValid, message) {
        const container = input.parentElement;
        const existingError = container.querySelector('.field-error');

        if (existingError) {
            existingError.remove();
        }

        if (!isValid && message) {
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            container.appendChild(errorElement);
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    }

    setupRememberMe() {
        const rememberCheckbox = document.getElementById('remember-me');
        const usernameInput = document.getElementById('username');

        // Load remembered username
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            usernameInput.value = rememberedUsername;
            rememberCheckbox.checked = true;
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const eyeOpen = document.getElementById('eye-open');
        const eyeClosed = document.getElementById('eye-closed');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeOpen.classList.add('hidden');
            eyeClosed.classList.remove('hidden');
        } else {
            passwordInput.type = 'password';
            eyeOpen.classList.remove('hidden');
            eyeClosed.classList.add('hidden');
        }
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.classList.remove('hidden');
        
        // Focus first input after animation
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);

        // Add body scroll lock
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.classList.add('hidden');
        this.clearForm();
        
        // Remove body scroll lock
        document.body.style.overflow = '';
    }

    clearForm() {
        const form = document.getElementById('login-form');
        form.reset();
        this.hideError();
        this.hideSuccess();
        
        // Clear field errors
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        this.hideSuccess();
    }

    hideError() {
        const errorElement = document.getElementById('error-message');
        errorElement.classList.add('hidden');
    }

    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        successElement.textContent = message;
        successElement.classList.remove('hidden');
        this.hideError();
    }

    hideSuccess() {
        const successElement = document.getElementById('success-message');
        successElement.classList.add('hidden');
    }

    setLoadingState(isLoading) {
        const submitBtn = document.getElementById('login-form').querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (isLoading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            btnText.style.opacity = '0';
            btnLoading.classList.remove('hidden');
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            btnLoading.classList.add('hidden');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isLoading) return;

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember-me');

        // Validate fields
        const isUsernameValid = this.validateField(usernameInput, 'username');
        const isPasswordValid = this.validateField(passwordInput, 'password');

        if (!isUsernameValid || !isPasswordValid) {
            this.showError('Lütfen form hatalarını düzeltin');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked;

        this.isLoading = true;
        this.setLoadingState(true);
        this.hideError();

        try {
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));

            const data = await apiService.login({ username, password, remember });

            if (data.success) {
                // Handle remember me
                if (remember) {
                    localStorage.setItem('rememberedUsername', username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }

                // Show success message briefly
                this.showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');

                setTimeout(() => {
                    apiService.setToken(data.token);
                    this.appState.token = data.token;
                    this.appState.setUser(data.user);
                    this.hideLoginModal();
                    this.appState.showDashboard();
                }, 1000);

            } else {
                this.showError(data.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }

    handleLogout() {
        // Show confirmation for better UX
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            this.appState.logout();
        }
    }
}

// Chat Manager
class ChatManager {
    constructor(appState) {
        this.appState = appState;
        this.messages = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Send button
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key in message input
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.appState.token}`
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            if (response.ok) {
                this.addMessage(data.response, 'assistant');
            } else {
                this.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'assistant');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'assistant');
        }
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(content)}</p>
                <span class="message-time">${new Date().toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // Add to messages array
        this.messages.push({
            content,
            type,
            timestamp: new Date()
        });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('messages');
        const typingElement = document.createElement('div');
        typingElement.className = 'message assistant-message typing-indicator';
        typingElement.id = 'typing-indicator';
        
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// UI Components Manager
class UIComponents {
    constructor() {
        this.setupRippleEffects();
        this.setupTooltips();
        this.setupParticleEffect();
        this.setupResponsiveHandlers();
        this.currentBreakpoint = this.getCurrentBreakpoint();
    }

    setupResponsiveHandlers() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle viewport changes
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        }
    }

    getCurrentBreakpoint() {
        const width = window.innerWidth;
        if (width >= 1440) return 'xl';
        if (width >= 1200) return 'lg';
        if (width >= 1024) return 'md';
        if (width >= 768) return 'sm';
        if (width >= 640) return 'xs';
        return 'mobile';
    }

    handleResize() {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint !== this.currentBreakpoint) {
            this.onBreakpointChange(this.currentBreakpoint, newBreakpoint);
            this.currentBreakpoint = newBreakpoint;
        }

        // Update particle effect based on screen size
        this.updateParticleEffect();
        
        // Update tooltip positions
        this.updateTooltipPositions();
    }

    onBreakpointChange(oldBreakpoint, newBreakpoint) {
        // Handle mobile navigation
        if (newBreakpoint === 'mobile' || newBreakpoint === 'xs') {
            this.enableMobileMode();
        } else if (oldBreakpoint === 'mobile' || oldBreakpoint === 'xs') {
            this.disableMobileMode();
        }

        // Adjust chat interface
        this.adjustChatInterface(newBreakpoint);
        
        // Update modal sizes
        this.updateModalSizes(newBreakpoint);
    }

    enableMobileMode() {
        document.body.classList.add('mobile-mode');
        
        // Collapse sidebar navigation
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav) {
            sidebarNav.classList.add('mobile-nav');
        }

        // Adjust emoji picker
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) {
            emojiPicker.classList.add('mobile-picker');
        }

        // Enable touch-friendly interactions
        this.enableTouchMode();
    }

    disableMobileMode() {
        document.body.classList.remove('mobile-mode');
        
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav) {
            sidebarNav.classList.remove('mobile-nav');
        }

        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) {
            emojiPicker.classList.remove('mobile-picker');
        }

        this.disableTouchMode();
    }

    enableTouchMode() {
        document.body.classList.add('touch-mode');
        
        // Increase touch targets
        document.querySelectorAll('.nav-item, .action-btn, .message-action').forEach(el => {
            el.classList.add('touch-target');
        });
    }

    disableTouchMode() {
        document.body.classList.remove('touch-mode');
        
        document.querySelectorAll('.touch-target').forEach(el => {
            el.classList.remove('touch-target');
        });
    }

    adjustChatInterface(breakpoint) {
        const chatContainer = document.querySelector('.chat-container');
        const inputWrapper = document.querySelector('.input-wrapper');
        
        if (!chatContainer || !inputWrapper) return;

        if (breakpoint === 'mobile' || breakpoint === 'xs') {
            chatContainer.classList.add('mobile-chat');
            inputWrapper.classList.add('mobile-input');
        } else {
            chatContainer.classList.remove('mobile-chat');
            inputWrapper.classList.remove('mobile-input');
        }
    }

    updateModalSizes(breakpoint) {
        const modals = document.querySelectorAll('.modal-content');
        
        modals.forEach(modal => {
            modal.classList.remove('modal-sm', 'modal-md', 'modal-lg');
            
            if (breakpoint === 'mobile' || breakpoint === 'xs') {
                modal.classList.add('modal-sm');
            } else if (breakpoint === 'sm' || breakpoint === 'md') {
                modal.classList.add('modal-md');
            } else {
                modal.classList.add('modal-lg');
            }
        });
    }

    handleOrientationChange() {
        // Force layout recalculation
        document.body.style.height = '100vh';
        setTimeout(() => {
            document.body.style.height = '';
        }, 100);

        // Update chat scroll
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 200);
        }
    }

    handleViewportChange() {
        // Handle virtual keyboard on mobile
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const windowHeight = window.innerHeight;
        
        if (viewportHeight < windowHeight * 0.75) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    }

    updateParticleEffect() {
        const particles = document.querySelector('.particles');
        if (!particles) return;

        const particleCount = this.currentBreakpoint === 'mobile' ? 5 : 
                            this.currentBreakpoint === 'xs' ? 10 : 20;
        
        const currentParticles = particles.children.length;
        
        if (currentParticles > particleCount) {
            // Remove excess particles
            for (let i = currentParticles - 1; i >= particleCount; i--) {
                particles.children[i].remove();
            }
        } else if (currentParticles < particleCount) {
            // Add more particles
            for (let i = currentParticles; i < particleCount; i++) {
                this.createParticle(particles);
            }
        }
    }

    updateTooltipPositions() {
        // Recalculate tooltip positions on resize
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            const tooltipText = tooltip.querySelector('.tooltip-text');
            if (tooltipText) {
                // Reset position
                tooltipText.style.left = '50%';
                tooltipText.style.marginLeft = '-60px';
                
                // Check if tooltip goes off screen
                const rect = tooltipText.getBoundingClientRect();
                if (rect.left < 0) {
                    tooltipText.style.left = '0';
                    tooltipText.style.marginLeft = '0';
                } else if (rect.right > window.innerWidth) {
                    tooltipText.style.left = 'auto';
                    tooltipText.style.right = '0';
                    tooltipText.style.marginLeft = '0';
                }
            }
        });
    }

    // Enhanced scroll animations with intersection observer
    setupScrollAnimations() {
        if (!('IntersectionObserver' in window)) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        // Different animations for different screen sizes
        const isMobile = this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'xs';
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Add staggered animation for mobile
                    if (isMobile && entry.target.classList.contains('feature-card')) {
                        const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100;
                        entry.target.style.animationDelay = `${delay}ms`;
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .tech-item, .stat-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Device-specific optimizations
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
        
        if (isIOS) {
            document.body.classList.add('ios-device');
            this.setupIOSOptimizations();
        }
        
        if (isAndroid) {
            document.body.classList.add('android-device');
            this.setupAndroidOptimizations();
        }
        
        if (isSafari) {
            document.body.classList.add('safari-browser');
            this.setupSafariOptimizations();
        }
    }

    setupIOSOptimizations() {
        // Prevent zoom on input focus
        document.querySelectorAll('input, textarea').forEach(input => {
            input.style.fontSize = '16px';
        });

        // Handle safe area insets
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        }
    }

    setupAndroidOptimizations() {
        // Handle Android keyboard behavior
        window.addEventListener('resize', () => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    }

    setupSafariOptimizations() {
        // Fix Safari 100vh issue
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    // Ripple effect for buttons
    setupRippleEffects() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ripple')) {
                this.createRipple(e);
            }
        });
    }

    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Enhanced toast notifications
    showToast(message, type = 'info', duration = 3000, actions = []) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);
        
        // Add action buttons if provided
        if (actions.length > 0) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'toast-actions';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'toast-action-btn';
                button.textContent = action.text;
                button.addEventListener('click', () => {
                    action.handler();
                    toast.remove();
                });
                actionsEl.appendChild(button);
            });
            
            content.appendChild(actionsEl);
        }
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        document.body.appendChild(toast);

        // Auto remove after duration
        const autoRemove = setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);

        // Clear timeout if manually closed
        toast.addEventListener('click', () => {
            clearTimeout(autoRemove);
        });

        return toast;
    }

    // Error notification with retry option
    showErrorWithRetry(message, retryCallback) {
        return this.showToast(message, 'error', 10000, [
            {
                text: 'Tekrar Dene',
                handler: retryCallback
            }
        ]);
    }

    // Network error handler
    handleNetworkError(error, retryCallback = null) {
        let message = 'Bağlantı hatası oluştu';
        
        if (!navigator.onLine) {
            message = 'İnternet bağlantınızı kontrol edin';
        } else if (error.message.includes('fetch')) {
            message = 'Sunucuya bağlanılamıyor';
        } else if (error.message.includes('timeout')) {
            message = 'İstek zaman aşımına uğradı';
        }

        if (retryCallback) {
            this.showErrorWithRetry(message, retryCallback);
        } else {
            this.showToast(message, 'error');
        }
    }

    // Global error handler
    handleGlobalError(error, context = '') {
        console.error(`Global error ${context}:`, error);
        
        // Log error to server if possible
        if (window.apiService && window.apiService.token) {
            try {
                // Don't await to avoid blocking UI
                fetch('/api/client-error', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.apiService.token}`
                    },
                    body: JSON.stringify({
                        message: error.message,
                        stack: error.stack,
                        context,
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    })
                }).catch(() => {
                    // Ignore logging errors
                });
            } catch (e) {
                // Ignore logging errors
            }
        }

        // Show user-friendly error message
        let userMessage = 'Beklenmeyen bir hata oluştu';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
        } else if (error.name === 'SyntaxError') {
            userMessage = 'Veri işleme hatası oluştu';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            userMessage = 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            userMessage = 'Bu işlem için yetkiniz bulunmuyor';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
            userMessage = 'İstenen kaynak bulunamadı';
        } else if (error.message.includes('429') || error.message.includes('Rate limit')) {
            userMessage = 'Çok fazla istek gönderdiniz. Lütfen bekleyin.';
        } else if (error.message.includes('500') || error.message.includes('Internal Server')) {
            userMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        }

        this.showToast(userMessage, 'error', 5000);
    }

    // Loading skeleton
    createSkeleton(container, lines = 3) {
        container.innerHTML = '';
        for (let i = 0; i < lines; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-text ${i % 2 === 0 ? 'long' : 'medium'}`;
            container.appendChild(skeleton);
        }
    }

    // Progress bar
    updateProgress(element, percentage) {
        const fill = element.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    // Tooltip setup
    setupTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip-text';
            tooltip.textContent = element.getAttribute('data-tooltip');
            element.appendChild(tooltip);
            element.classList.add('tooltip');
        });
    }

    // Particle effect
    setupParticleEffect() {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const particles = document.createElement('div');
            particles.className = 'particles';
            heroSection.appendChild(particles);

            // Create particles
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    this.createParticle(particles);
                }, i * 200);
            }

            // Continue creating particles
            setInterval(() => {
                this.createParticle(particles);
            }, 2000);
        }
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 3 + 7) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        container.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 10000);
    }

    // Smooth scroll with easing
    smoothScrollTo(element, duration = 1000) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        requestAnimationFrame(animation.bind(this));
    }

    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    // Intersection Observer for animations
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.feature-card, .tech-item').forEach(el => {
            observer.observe(el);
        });
    }
}

// Advanced Chat Manager with full functionality
class AdvancedChatManager extends ChatManager {
    constructor(appState, uiComponents) {
        super(appState);
        this.uiComponents = uiComponents;
        this.isTyping = false;
        this.currentSessionId = null;
        this.messageHistory = [];
        this.setupAdvancedFeatures();
        this.setupEmojiPicker();
        this.setupNavigationHandlers();
    }

    setupAdvancedFeatures() {
        // Auto-resize textarea
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('input', this.handleInputChange.bind(this));
        messageInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Character counter
        this.updateCharCounter();
        
        // Quick action buttons
        this.setupQuickActions();
        
        // Chat actions
        this.setupChatActions();
        
        // Scroll detection
        this.setupScrollDetection();
    }

    setupNavigationHandlers() {
        // Navigation between sections
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'history':
                await this.loadChatHistory();
                break;
            case 'stats':
                await this.loadStatistics();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    handleInputChange(event) {
        const textarea = event.target;
        const value = textarea.value;
        
        // Auto-resize
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        
        // Update character counter
        this.updateCharCounter(value.length);
        
        // Update send button state
        this.updateSendButtonState(value.trim());
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    updateCharCounter(count = 0) {
        const counter = document.getElementById('char-count');
        const maxLength = 1000;
        
        counter.textContent = count;
        counter.parentElement.classList.remove('warning', 'danger');
        
        if (count > maxLength * 0.8) {
            counter.parentElement.classList.add('warning');
        }
        if (count > maxLength * 0.95) {
            counter.parentElement.classList.add('danger');
        }
    }

    updateSendButtonState(hasContent) {
        const sendBtn = document.getElementById('send-btn');
        
        if (hasContent && !this.isTyping) {
            sendBtn.disabled = false;
            sendBtn.classList.add('pulse');
        } else {
            sendBtn.disabled = true;
            sendBtn.classList.remove('pulse');
        }
    }

    setupQuickActions() {
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                this.sendQuickMessage(message);
            });
        });
    }

    setupChatActions() {
        // Clear chat
        document.getElementById('clear-chat').addEventListener('click', () => {
            this.clearChat();
        });

        // Export chat
        document.getElementById('export-chat').addEventListener('click', () => {
            this.exportChat();
        });

        // Scroll to bottom
        document.getElementById('scroll-to-bottom').addEventListener('click', () => {
            this.scrollToBottom(true);
        });
    }

    setupScrollDetection() {
        const messagesContainer = document.getElementById('messages');
        const scrollBtn = document.getElementById('scroll-to-bottom');
        
        messagesContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            if (isNearBottom) {
                scrollBtn.classList.remove('show');
            } else {
                scrollBtn.classList.add('show');
            }
        });
    }

    setupEmojiPicker() {
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiGrid = document.getElementById('emoji-grid');
        
        // Emoji data
        const emojis = {
            smileys: ['😊', '😂', '🥰', '😍', '🤗', '😘', '😋', '😎', '🤔', '😴', '😇', '🥳', '🤩', '😭', '😅', '😆'],
            gestures: ['👋', '👍', '👎', '👏', '🙏', '💪', '✌️', '🤝', '👌', '🤞', '🤟', '🤘', '👈', '👉', '👆', '👇'],
            objects: ['📱', '💻', '⌚', '📷', '🎵', '🎮', '🚗', '✈️', '🏠', '🌟', '⭐', '🔥', '💡', '🎯', '🎨', '📚'],
            symbols: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '💯', '✨', '⚡', '🌈', '☀️', '🌙', '⭐', '🔥']
        };

        // Toggle emoji picker
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPicker.classList.toggle('hidden');
            if (!emojiPicker.classList.contains('hidden')) {
                this.loadEmojis('smileys', emojis);
            }
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.classList.add('hidden');
            }
        });

        // Category switching
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.getAttribute('data-category');
                this.loadEmojis(category, emojis);
            });
        });
    }

    loadEmojis(category, emojis) {
        const emojiGrid = document.getElementById('emoji-grid');
        emojiGrid.innerHTML = '';
        
        emojis[category].forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.className = 'emoji-item';
            emojiBtn.textContent = emoji;
            emojiBtn.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            emojiGrid.appendChild(emojiBtn);
        });
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('message-input');
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(messageInput.selectionEnd);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        // Update character counter and button state
        this.handleInputChange({ target: messageInput });
        
        // Hide emoji picker
        document.getElementById('emoji-picker').classList.add('hidden');
    }

    async sendQuickMessage(message) {
        const messageInput = document.getElementById('message-input');
        messageInput.value = message;
        this.handleInputChange({ target: messageInput });
        await this.sendMessage();
    }

    async sendMessage() {
        if (this.isTyping) return;

        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const message = input.value.trim();

        if (!message) return;

        // Hide welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Update UI state
        this.isTyping = true;
        this.updateSendButtonState(false);
        
        // Show typing indicator
        this.showTypingIndicator();

        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        this.updateCharCounter(0);

        try {
            const data = await apiService.sendMessage(message);

            // Hide typing indicator
            this.hideTypingIndicator();

            if (data.success) {
                // Simulate realistic typing delay
                const typingDelay = Math.min(data.response.length * 20, 2000);
                setTimeout(() => {
                    this.addMessage(data.response, 'assistant');
                    this.updateMessageStats();
                }, typingDelay);
            } else {
                this.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'assistant');
                this.uiComponents.showToast(data.message || 'Mesaj gönderilemedi', 'error');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'assistant');
            this.uiComponents.showToast(error.message || 'Bağlantı hatası', 'error');
        } finally {
            this.isTyping = false;
        }
    }

    showTypingIndicator() {
        const typingUsers = document.getElementById('typing-users');
        typingUsers.style.display = 'flex';
    }

    hideTypingIndicator() {
        const typingUsers = document.getElementById('typing-users');
        typingUsers.style.display = 'none';
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;
        messageElement.setAttribute('data-message-id', Date.now());
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (type === 'assistant') {
            messageContent.classList.add('glass-card');
        }
        
        messageContent.innerHTML = `
            <p>${this.escapeHtml(content)}</p>
            <span class="message-time">${new Date().toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}</span>
        `;

        // Add message actions
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions';
        messageActions.innerHTML = `
            <button class="message-action" data-action="copy" title="Kopyala">📋</button>
            <button class="message-action" data-action="delete" title="Sil">🗑️</button>
        `;

        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageActions);
        messagesContainer.appendChild(messageElement);
        
        // Setup message actions
        this.setupMessageActions(messageElement);
        
        // Add entrance animation
        setTimeout(() => {
            messageElement.classList.add('animate-in');
        }, 10);

        this.scrollToBottom();

        // Add to messages array
        this.messageHistory.push({
            id: Date.now(),
            content,
            type,
            timestamp: new Date()
        });
    }

    setupMessageActions(messageElement) {
        const actions = messageElement.querySelectorAll('.message-action');
        
        actions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionType = action.getAttribute('data-action');
                const messageId = messageElement.getAttribute('data-message-id');
                
                switch (actionType) {
                    case 'copy':
                        this.copyMessage(messageElement);
                        break;
                    case 'delete':
                        this.deleteMessage(messageElement, messageId);
                        break;
                }
            });
        });
    }

    copyMessage(messageElement) {
        const content = messageElement.querySelector('p').textContent;
        navigator.clipboard.writeText(content).then(() => {
            this.uiComponents.showToast('Mesaj kopyalandı', 'success');
        });
    }

    deleteMessage(messageElement, messageId) {
        if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
            messageElement.remove();
            this.messageHistory = this.messageHistory.filter(msg => msg.id != messageId);
            this.uiComponents.showToast('Mesaj silindi', 'success');
        }
    }

    async clearChat() {
        if (confirm('Tüm sohbeti temizlemek istediğinizden emin misiniz?')) {
            try {
                await apiService.clearChatHistory();
                
                const messagesContainer = document.getElementById('messages');
                messagesContainer.innerHTML = '';
                this.messageHistory = [];
                this.uiComponents.showToast('Sohbet temizlendi', 'success');
                
                // Show welcome message again
                this.showWelcomeMessage();
                
                // Update stats
                this.updateMessageStats();
            } catch (error) {
                console.error('Failed to clear chat:', error);
                this.uiComponents.showToast('Sohbet temizlenemedi', 'error');
            }
        }
    }

    showWelcomeMessage() {
        const messagesContainer = document.getElementById('messages');
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-icon">👋</div>
                <h3>Hoş Geldiniz!</h3>
                <p>Ben sizin kişisel asistanınızım. Size nasıl yardımcı olabilirim?</p>
                <div class="quick-actions">
                    <button class="quick-action-btn" data-message="Merhaba!">
                        <span>👋</span> Merhaba
                    </button>
                    <button class="quick-action-btn" data-message="Bana yardım edebilir misin?">
                        <span>❓</span> Yardım
                    </button>
                    <button class="quick-action-btn" data-message="Bugün nasılsın?">
                        <span>😊</span> Nasılsın
                    </button>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(welcomeMessage);
        this.setupQuickActions();
    }

    async exportChat() {
        try {
            const blob = await apiService.exportChat('json');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.uiComponents.showToast('Sohbet dışa aktarıldı', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.uiComponents.showToast('Dışa aktarma başarısız', 'error');
        }
    }

    scrollToBottom(smooth = false) {
        const messagesContainer = document.getElementById('messages');
        const scrollOptions = {
            top: messagesContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        };
        messagesContainer.scrollTo(scrollOptions);
    }

    updateMessageStats() {
        const todayMessages = this.messageHistory.filter(msg => {
            const today = new Date().toDateString();
            return msg.timestamp.toDateString() === today;
        }).length;
        
        const totalMessages = this.messageHistory.length;
        
        // Update sidebar stats
        document.getElementById('today-messages').textContent = todayMessages;
        document.getElementById('total-messages').textContent = totalMessages;
        
        // Update stats section
        document.getElementById('today-messages-stat').textContent = todayMessages;
        document.getElementById('total-messages-stat').textContent = totalMessages;
    }

    async loadChatHistory() {
        try {
            this.uiComponents.showToast('Geçmiş yükleniyor...', 'info');
            
            const response = await apiService.getChatHistory({ limit: 100 });
            
            if (response.success) {
                const historyContainer = document.getElementById('history-messages');
                historyContainer.innerHTML = '';
                
                response.messages.forEach(msg => {
                    const messageEl = document.createElement('div');
                    messageEl.className = `message ${msg.type}-message`;
                    messageEl.innerHTML = `
                        <div class="message-content">
                            <p>${this.escapeHtml(msg.content)}</p>
                            <span class="message-time">${new Date(msg.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                    `;
                    historyContainer.appendChild(messageEl);
                });
                
                this.uiComponents.showToast('Geçmiş yüklendi', 'success');
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.uiComponents.showToast('Geçmiş yüklenemedi', 'error');
        }
    }

    async loadStatistics() {
        try {
            const response = await apiService.getChatStats();
            
            if (response.success) {
                const stats = response.stats;
                
                // Update stat cards
                document.getElementById('total-messages-stat').textContent = stats.total_messages || 0;
                document.getElementById('today-messages-stat').textContent = stats.today_messages || 0;
                document.getElementById('avg-response-time').textContent = stats.averageResponseTime || '1.2s';
                
                // Update sidebar stats
                document.getElementById('today-messages').textContent = stats.today_messages || 0;
                document.getElementById('total-messages').textContent = stats.total_messages || 0;
                
                // Calculate active days
                const firstMessage = stats.first_message ? new Date(stats.first_message) : new Date();
                const daysSinceFirst = Math.floor((new Date() - firstMessage) / (1000 * 60 * 60 * 24));
                document.getElementById('active-days').textContent = Math.max(1, daysSinceFirst);
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
        
        this.generateActivityChart();
    }

    generateActivityChart() {
        const chartContainer = document.getElementById('activity-chart');
        chartContainer.innerHTML = '';
        
        // Generate sample data for the last 7 days
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const data = [12, 8, 15, 20, 18, 5, 10]; // Sample data
        
        days.forEach((day, index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${(data[index] / Math.max(...data)) * 100}%`;
            bar.title = `${day}: ${data[index]} mesaj`;
            
            if (data[index] > 0) {
                bar.classList.add('active');
            }
            
            chartContainer.appendChild(bar);
        });
    }

    loadSettings() {
        // Load user settings
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        
        document.getElementById('theme-toggle').checked = savedTheme === 'dark';
        document.getElementById('font-size').value = savedFontSize;
    }
}

// Settings Manager
class SettingsManager {
    constructor(uiComponents) {
        this.uiComponents = uiComponents;
        this.currentSettings = {};
        this.setupSettingsHandlers();
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const response = await apiService.getSettings();
            if (response.success) {
                this.currentSettings = response.settings;
                this.applySettings(this.currentSettings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Use local storage as fallback
            this.loadLocalSettings();
        }
    }

    loadLocalSettings() {
        this.currentSettings = {
            theme: localStorage.getItem('theme') || 'dark',
            fontSize: localStorage.getItem('fontSize') || 'medium',
            notifications: localStorage.getItem('notifications') !== 'false',
            soundNotifications: localStorage.getItem('soundNotifications') === 'true',
            saveHistory: localStorage.getItem('saveHistory') !== 'false'
        };
        this.applySettings(this.currentSettings);
    }

    applySettings(settings) {
        // Apply theme
        document.body.classList.toggle('dark-theme', settings.theme === 'dark');
        document.getElementById('theme-toggle').checked = settings.theme === 'dark';

        // Apply font size
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${settings.fontSize}`);
        document.getElementById('font-size').value = settings.fontSize;

        // Apply other settings
        document.getElementById('notifications-toggle').checked = settings.notifications;
        document.getElementById('sound-toggle').checked = settings.soundNotifications;
        document.getElementById('save-history').checked = settings.saveHistory;
    }

    setupSettingsHandlers() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('change', (e) => {
            this.updateSetting('theme', e.target.checked ? 'dark' : 'light');
        });

        // Font size
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.updateSetting('fontSize', e.target.value);
        });

        // Notifications
        document.getElementById('notifications-toggle').addEventListener('change', (e) => {
            this.updateSetting('notifications', e.target.checked);
        });

        // Sound notifications
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.updateSetting('soundNotifications', e.target.checked);
        });

        // Save history
        document.getElementById('save-history').addEventListener('change', (e) => {
            this.updateSetting('saveHistory', e.target.checked);
        });

        // Clear all data
        document.getElementById('clear-all-data').addEventListener('click', () => {
            this.clearAllData();
        });

        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportUserData();
        });

        // Change password
        document.getElementById('change-password').addEventListener('click', () => {
            this.showChangePasswordModal();
        });
    }

    async updateSetting(key, value) {
        this.currentSettings[key] = value;
        
        // Apply immediately for better UX
        this.applySettings(this.currentSettings);
        
        // Save to localStorage as backup
        localStorage.setItem(key, value);

        try {
            await apiService.updateSettings(this.currentSettings);
            this.uiComponents.showToast('Ayar güncellendi', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.uiComponents.showToast('Ayar kaydedilemedi', 'warning');
        }
    }

    async clearAllData() {
        if (confirm('Tüm verileriniz silinecek. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?')) {
            try {
                // Clear chat history
                await apiService.clearChatHistory();
                
                // Reset settings
                await apiService.resetSettings();
                
                // Clear local storage
                localStorage.clear();
                sessionStorage.clear();
                
                this.uiComponents.showToast('Tüm veriler temizlendi', 'success');
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (error) {
                console.error('Failed to clear data:', error);
                this.uiComponents.showToast('Veriler temizlenemedi', 'error');
            }
        }
    }

    async exportUserData() {
        try {
            // Export settings
            const settingsBlob = await apiService.exportSettings();
            const settingsUrl = URL.createObjectURL(settingsBlob);
            const settingsLink = document.createElement('a');
            settingsLink.href = settingsUrl;
            settingsLink.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
            settingsLink.click();
            URL.revokeObjectURL(settingsUrl);

            // Export chat
            const chatBlob = await apiService.exportChat('json');
            const chatUrl = URL.createObjectURL(chatBlob);
            const chatLink = document.createElement('a');
            chatLink.href = chatUrl;
            chatLink.download = `chat-${new Date().toISOString().split('T')[0]}.json`;
            chatLink.click();
            URL.revokeObjectURL(chatUrl);

            this.uiComponents.showToast('Veriler dışa aktarıldı', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.uiComponents.showToast('Dışa aktarma başarısız', 'error');
        }
    }

    showChangePasswordModal() {
        // Create a simple password change modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Şifre Değiştir</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <form class="password-form">
                    <div class="form-group">
                        <label>Mevcut Şifre</label>
                        <input type="password" id="current-password" required>
                    </div>
                    <div class="form-group">
                        <label>Yeni Şifre</label>
                        <input type="password" id="new-password" required>
                    </div>
                    <div class="form-group">
                        <label>Yeni Şifre Tekrar</label>
                        <input type="password" id="confirm-password" required>
                    </div>
                    <button type="submit" class="submit-btn">Şifreyi Değiştir</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        modal.querySelector('.password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = modal.querySelector('#current-password').value;
            const newPassword = modal.querySelector('#new-password').value;
            const confirmPassword = modal.querySelector('#confirm-password').value;

            if (newPassword !== confirmPassword) {
                this.uiComponents.showToast('Yeni şifreler eşleşmiyor', 'error');
                return;
            }

            try {
                await apiService.changePassword({ currentPassword, newPassword });
                this.uiComponents.showToast('Şifre başarıyla değiştirildi', 'success');
                modal.remove();
            } catch (error) {
                this.uiComponents.showToast(error.message || 'Şifre değiştirilemedi', 'error');
            }
        });

        // Handle close
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const appState = new AppState();
    const uiComponents = new UIComponents();
    const authManager = new AuthManager(appState);
    const chatManager = new AdvancedChatManager(appState, uiComponents);
    const settingsManager = new SettingsManager(uiComponents);

    // Setup scroll animations with performance optimization
    uiComponents.setupScrollAnimations();
    
    // Detect device and apply optimizations
    uiComponents.detectDevice();

    // Initialize performance optimizations
    if (window.performanceOptimizer) {
        // Cache API responses
        const originalApiRequest = apiService.request.bind(apiService);
        apiService.request = async function(endpoint, options = {}) {
            const cacheKey = `api_${endpoint}_${JSON.stringify(options)}`;
            
            // Try to get from cache first (for GET requests)
            if (!options.method || options.method === 'GET') {
                const cached = performanceOptimizer.getCache(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            
            const result = await originalApiRequest(endpoint, options);
            
            // Cache successful GET responses
            if (result.success && (!options.method || options.method === 'GET')) {
                performanceOptimizer.setCache(cacheKey, result, 300000); // 5 minutes
            }
            
            return result;
        };

        // Optimize image loading
        document.querySelectorAll('img[data-src]').forEach(img => {
            performanceOptimizer.addLazyImage(img);
        });

        // Defer non-critical tasks
        performanceOptimizer.addDeferredTask(() => {
            // Initialize analytics or other non-critical features
            console.log('Non-critical tasks initialized');
        });
    }

    // Add ripple effect to buttons
    document.querySelectorAll('.cta-button, .submit-btn, .send-btn').forEach(btn => {
        btn.classList.add('ripple');
    });

    // Update user display in sidebar
    const originalSetUser = appState.setUser.bind(appState);
    appState.setUser = function(userData) {
        originalSetUser(userData);
        
        // Update sidebar user info
        const sidebarUsername = document.getElementById('sidebar-username');
        const userInitials = document.getElementById('user-initials');
        
        if (sidebarUsername && userData.username) {
            sidebarUsername.textContent = userData.username;
        }
        
        if (userInitials && userData.username) {
            userInitials.textContent = userData.username.charAt(0).toUpperCase();
        }
    };

    // Add welcome message when dashboard is shown
    const originalShowDashboard = appState.showDashboard.bind(appState);
    appState.showDashboard = function() {
        originalShowDashboard();
        setTimeout(() => {
            uiComponents.showToast('Başarıyla giriş yaptınız!', 'success');
            chatManager.showWelcomeMessage();
        }, 500);
    };

    // Enhanced error handling with toast notifications
    const originalShowError = authManager.showError.bind(authManager);
    authManager.showError = function(message) {
        originalShowError(message);
        uiComponents.showToast(message, 'error');
    };

    // Apply saved settings on load
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    if (savedFontSize) {
        document.body.classList.add(`font-${savedFontSize}`);
    }

    // Listen for auth events
    window.addEventListener('auth:logout', () => {
        appState.logout();
        uiComponents.showToast('Oturum süresi doldu', 'warning');
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
        uiComponents.showToast('Bağlantı yeniden kuruldu', 'success');
        document.querySelector('.status-indicator').classList.remove('offline');
        document.querySelector('.status-indicator').classList.add('online');
        document.querySelector('.status-text').textContent = 'Asistan Çevrimiçi';
    });

    window.addEventListener('offline', () => {
        uiComponents.showToast('Bağlantı kesildi', 'warning');
        document.querySelector('.status-indicator').classList.remove('online');
        document.querySelector('.status-indicator').classList.add('offline');
        document.querySelector('.status-text').textContent = 'Çevrimdışı';
    });

    // Global error handlers
    window.addEventListener('error', (event) => {
        uiComponents.handleGlobalError(event.error, 'window.error');
    });

    window.addEventListener('unhandledrejection', (event) => {
        uiComponents.handleGlobalError(event.reason, 'unhandledrejection');
        event.preventDefault(); // Prevent console error
    });

    // Enhanced API service error handling
    const originalRequest = apiService.request.bind(apiService);
    apiService.request = async function(endpoint, options = {}) {
        try {
            return await originalRequest(endpoint, options);
        } catch (error) {
            // Handle specific API errors
            if (error.message.includes('Failed to fetch')) {
                uiComponents.handleNetworkError(error, () => {
                    return originalRequest(endpoint, options);
                });
            } else {
                uiComponents.handleGlobalError(error, `API: ${endpoint}`);
            }
            throw error;
        }
    };

    // Periodic health check with error handling
    let healthCheckFailures = 0;
    const maxHealthCheckFailures = 3;
    
    setInterval(async () => {
        try {
            await apiService.healthCheck();
            healthCheckFailures = 0; // Reset on success
        } catch (error) {
            healthCheckFailures++;
            console.warn(`Health check failed (${healthCheckFailures}/${maxHealthCheckFailures}):`, error);
            
            if (healthCheckFailures >= maxHealthCheckFailures) {
                uiComponents.showToast(
                    'Sunucu bağlantısında sorun var. Lütfen sayfayı yenileyin.',
                    'warning',
                    10000,
                    [{
                        text: 'Yenile',
                        handler: () => window.location.reload()
                    }]
                );
            }
        }
    }, 300000); // Every 5 minutes

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData && perfData.loadEventEnd > 5000) {
                    console.warn('Slow page load detected:', perfData.loadEventEnd + 'ms');
                }
            }, 0);
        });
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
        setInterval(() => {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
            
            if (usedMB > limitMB * 0.9) {
                console.warn('High memory usage detected:', usedMB + 'MB/' + limitMB + 'MB');
                uiComponents.showToast(
                    'Yüksek bellek kullanımı tespit edildi. Sayfayı yenilemeniz önerilir.',
                    'warning',
                    8000,
                    [{
                        text: 'Yenile',
                        handler: () => window.location.reload()
                    }]
                );
            }
        }, 60000); // Every minute
    }
});