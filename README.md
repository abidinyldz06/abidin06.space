# 🚀 Abidin.Space - Kişisel Asistan Web Sitesi

Modern, güvenli ve performanslı kişisel asistan web uygulaması.

## ✨ Özellikler

### 🎨 **Modern UI/UX**
- Glassmorphism ve neumorphism efektleri
- Dark theme ile modern renk paleti
- Smooth animations ve micro-interactions
- Mobile-first responsive design
- Touch-friendly interface

### 🔒 **Güvenlik**
- JWT tabanlı authentication sistemi
- Password strength validation
- Rate limiting ve CSRF protection
- Input sanitization ve XSS protection
- Session management

### 💬 **Chat Interface**
- Real-time chat arayüzü
- Emoji picker ve file attachment
- Message history ve search
- Typing indicators
- Message reactions

### 📊 **Dashboard & Analytics**
- User dashboard ile sidebar navigation
- Chat statistics ve activity charts
- Message history management
- Settings panel

### ⚡ **Performance**
- Lazy loading ve virtual scrolling
- Caching mechanisms
- Image optimization
- Resource hints ve prefetching
- Memory management

## 🛠️ Teknolojiler

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - ES6+ features
- **Performance API** - Optimization utilities

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **Helmet** - Security headers

### Testing
- **Jest** - Testing framework
- **Supertest** - API testing
- **JSDOM** - DOM testing

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/abidinyldz06/abidin06.space.git
cd abidin06.space
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

4. **Tarayıcınızda açın:**
```
http://localhost:3000
```

## 📋 Test

### Node.js Kurulu Değilse
Eğer Node.js kurulu değilse, `test.html` dosyasını doğrudan tarayıcıda açabilirsiniz:
- `kendisitem/test.html` dosyasını çift tıklayın
- Test kullanıcısı: `admin` / `admin123`

### Node.js ile Test
```bash
# Tüm testleri çalıştır
npm test

# Sadece backend testleri
npm run test:backend

# Sadece frontend testleri
npm run test:frontend

# Coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📁 Proje Yapısı

```
kendisitem/
├── 📁 public/                 # Frontend dosyları
│   ├── 📁 css/
│   │   ├── reset.css          # CSS reset
│   │   └── style.css          # Ana stil dosyası
│   ├── 📁 js/
│   │   ├── api.js             # API service
│   │   ├── app.js             # Ana uygulama
│   │   └── performance.js     # Performance utilities
│   └── index.html             # Ana HTML dosyası
├── 📁 routes/                 # API endpoints
│   ├── auth.js                # Authentication routes
│   ├── chat.js                # Chat routes
│   └── settings.js            # Settings routes
├── 📁 database/               # Database operations
│   ├── init.js                # Database initialization
│   ├── users.js               # User operations
│   ├── messages.js            # Message operations
│   ├── settings.js            # Settings operations
│   └── activity.js            # Activity tracking
├── 📁 middleware/             # Express middleware
│   ├── auth.js                # JWT authentication
│   ├── security.js            # Security middleware
│   └── errorHandler.js        # Error handling
├── 📁 tests/                  # Test suite
│   ├── auth.test.js           # Authentication tests
│   ├── chat.test.js           # Chat tests
│   ├── frontend.test.js       # Frontend tests
│   ├── setup.js               # Test setup
│   └── frontend-setup.js      # Frontend test setup
├── server.js                  # Express server
├── package.json               # Dependencies
├── jest.config.js             # Test configuration
├── test.html                  # Standalone test file
└── README.md                  # Bu dosya
```

## 🎯 Kullanım

### Test Kullanıcısı
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

### Ana Özellikler
1. **Landing Page** - Modern hero section ve özellik tanıtımı
2. **Authentication** - Güvenli giriş sistemi
3. **Dashboard** - Kullanıcı paneli ve navigasyon
4. **Chat Interface** - AI asistan ile sohbet
5. **Settings** - Kullanıcı ayarları ve tercihler

## 🔧 Geliştirme

### Komutlar
```bash
npm start              # Production server
npm run dev            # Development server (nodemon)
npm test               # Run tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Coverage report
npm run build          # Minify CSS/JS
npm run lint           # Code linting
```

### Environment Variables
```bash
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

## 📊 Test Sonuçları

Proje kapsamlı test suite ile gelir:
- ✅ Authentication endpoints
- ✅ Chat functionality
- ✅ Frontend components
- ✅ Security middleware
- ✅ Error handling
- ✅ Performance optimizations

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Node.js production environment
- Environment variables configuration
- SSL certificate setup
- Database optimization

## 🤝 Katkıda Bulunma

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 📞 İletişim

- **Website:** https://abidin06.space
- **GitHub:** https://github.com/abidinyldz06
- **Repository:** https://github.com/abidinyldz06/abidin06.space

---

**Not:** Bu proje modern web standartlarına uygun olarak geliştirilmiştir ve production-ready durumundadır.