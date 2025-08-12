# Tasarım Belgesi

## Genel Bakış

abidin.space için modern, özgün tasarımlı kişisel asistan web sitesi. Site, kullanıcı dostu arayüz, güvenli authentication sistemi ve AI-benzeri chat deneyimi sunacak. Modern web teknolojileri kullanılarak responsive ve performanslı bir deneyim sağlanacak.

## Mimari

### Teknoloji Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (modern ES6+)
- **Styling**: Custom CSS + CSS Grid/Flexbox
- **Authentication**: JWT tabanlı token sistemi
- **Backend**: Node.js + Express.js
- **Database**: SQLite (başlangıç için)
- **Deployment**: Static hosting (Netlify/Vercel)

### Sistem Mimarisi
```
[Frontend (SPA)] <-> [REST API] <-> [Database]
       |                |              |
   [Auth Service]   [JWT Middleware]  [SQLite]
       |
   [Local Storage]
```

## Bileşenler ve Arayüzler

### 1. Ana Sayfa (Landing Page)
- **Hero Section**: Büyük başlık, alt başlık ve CTA button
- **Features Section**: Asistan özelliklerinin tanıtımı
- **About Section**: Kişisel bilgiler ve site amacı
- **Contact/Login Section**: Giriş yapma çağrısı

### 2. Authentication Sistemi
- **Login Modal**: Overlay tarzında modern giriş formu
- **JWT Token Management**: Güvenli token saklama ve yenileme
- **Session Management**: Otomatik çıkış ve güvenlik

### 3. Dashboard
- **Header**: Kullanıcı adı, avatar, çıkış butonu
- **Sidebar**: Navigasyon menüsü
- **Main Content**: Asistan chat arayüzü
- **Status Bar**: Bağlantı durumu ve bildirimler

### 4. Chat Interface
- **Message Container**: Scrollable mesaj listesi
- **Input Area**: Mesaj yazma alanı ve gönder butonu
- **Typing Indicator**: Asistan yazıyor animasyonu
- **Message Bubbles**: Kullanıcı ve asistan mesaj baloncukları

## Veri Modelleri

### User Model
```javascript
{
  id: String (UUID),
  username: String,
  email: String,
  password: String (hashed),
  avatar: String (URL),
  createdAt: Date,
  lastLogin: Date
}
```

### Message Model
```javascript
{
  id: String (UUID),
  userId: String,
  content: String,
  type: String ('user' | 'assistant'),
  timestamp: Date,
  sessionId: String
}
```

### Session Model
```javascript
{
  id: String (UUID),
  userId: String,
  startTime: Date,
  endTime: Date,
  messageCount: Number
}
```

## Hata Yönetimi

### Frontend Hata Yönetimi
- **Network Errors**: Bağlantı hatalarında retry mekanizması
- **Authentication Errors**: Token süresi dolduğunda otomatik yenileme
- **Validation Errors**: Form validasyonu ve kullanıcı dostu mesajlar
- **UI Errors**: Graceful degradation ve fallback UI

### Backend Hata Yönetimi
- **API Errors**: Standart HTTP status kodları
- **Database Errors**: Connection pooling ve retry logic
- **Authentication Errors**: Güvenli hata mesajları
- **Rate Limiting**: API abuse koruması

## Test Stratejisi

### Unit Tests
- **Authentication Functions**: Login/logout logic
- **Message Handling**: Chat functionality
- **Data Validation**: Form ve API validation
- **Utility Functions**: Helper functions

### Integration Tests
- **API Endpoints**: REST API testleri
- **Database Operations**: CRUD işlemleri
- **Authentication Flow**: Login/logout süreci
- **Chat Flow**: Mesaj gönderme/alma

### E2E Tests
- **User Journey**: Tam kullanıcı deneyimi
- **Cross-browser**: Farklı tarayıcılarda test
- **Responsive**: Farklı ekran boyutlarında test
- **Performance**: Yükleme süreleri ve optimizasyon

## UI/UX Tasarım Detayları

### Renk Paleti
- **Primary**: #6366f1 (Indigo)
- **Secondary**: #8b5cf6 (Purple)
- **Accent**: #06b6d4 (Cyan)
- **Background**: #0f172a (Dark Blue)
- **Surface**: #1e293b (Slate)
- **Text**: #f8fafc (Light)

### Typography
- **Heading**: Inter, sans-serif
- **Body**: Inter, sans-serif
- **Code**: JetBrains Mono, monospace

### Animasyonlar
- **Page Transitions**: Smooth fade-in/out
- **Button Hover**: Scale ve color transitions
- **Chat Messages**: Slide-in animations
- **Loading States**: Skeleton screens ve spinners

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## Güvenlik Özellikleri

### Authentication Security
- **Password Hashing**: bcrypt ile güvenli hashing
- **JWT Security**: Secure, HttpOnly cookies
- **CSRF Protection**: Token tabanlı koruma
- **Rate Limiting**: Brute force koruması

### Data Security
- **Input Sanitization**: XSS koruması
- **SQL Injection**: Parameterized queries
- **HTTPS**: SSL/TLS şifreleme
- **Content Security Policy**: XSS ve injection koruması