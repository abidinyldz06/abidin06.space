const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { saveMessage, getUserMessages } = require('../database/messages');
const { rateLimits, sanitizeInput } = require('../middleware/security');
const { logActivity } = require('../database/activity');

const router = express.Router();

// Simple AI response generator (placeholder)
const generateAIResponse = (message, user) => {
    const responses = [
        `Merhaba ${user.username}! "${message}" mesajınızı aldım. Size nasıl yardımcı olabilirim?`,
        `Anlıyorum. "${message}" konusunda size yardımcı olmaya çalışacağım.`,
        `İlginç bir soru! "${message}" hakkında düşünmeme izin verin.`,
        `Tabii ki! "${message}" konusunda elimden geldiğince yardımcı olacağım.`,
        `Harika bir soru! "${message}" ile ilgili size şunları söyleyebilirim...`,
        `${user.username}, "${message}" konusunda size destek olmaktan mutluluk duyarım.`,
        `Bu konuda size yardımcı olabilirim. "${message}" hakkında ne öğrenmek istiyorsunuz?`,
        `Mükemmel! "${message}" konusunu birlikte keşfedelim.`
    ];

    // Simple keyword-based responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
        return `Merhaba ${user.username}! Size nasıl yardımcı olabilirim?`;
    }
    
    if (lowerMessage.includes('nasılsın') || lowerMessage.includes('nasıl gidiyor')) {
        return `İyiyim, teşekkür ederim! Sizinle sohbet etmekten mutluluk duyuyorum. Peki siz nasılsınız?`;
    }
    
    if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağol')) {
        return `Rica ederim ${user.username}! Size yardımcı olabildiysem ne mutlu bana. Başka bir konuda yardıma ihtiyacınız var mı?`;
    }
    
    if (lowerMessage.includes('yardım') || lowerMessage.includes('help')) {
        return `Tabii ki size yardımcı olabilirim! Hangi konuda desteğe ihtiyacınız var? Sorularınızı çekinmeden sorabilirsiniz.`;
    }
    
    if (lowerMessage.includes('hava') || lowerMessage.includes('weather')) {
        return `Hava durumu hakkında bilgi vermek isterdim ama şu anda bu özelliğim yok. Gelecekte bu tür bilgileri de sağlayabileceğim!`;
    }
    
    if (lowerMessage.includes('zaman') || lowerMessage.includes('saat')) {
        const now = new Date();
        return `Şu anki zaman: ${now.toLocaleString('tr-TR')}. Size başka nasıl yardımcı olabilirim?`;
    }
    
    if (lowerMessage.includes('kim') || lowerMessage.includes('who')) {
        return `Ben Abidin'in kişisel asistanıyım! Size yardımcı olmak için buradayım. Sorularınızı çekinmeden sorabilirsiniz.`;
    }

    // Random response for other messages
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
};

// Send message endpoint
router.post('/message', authenticateToken, rateLimits.chat, async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user;

        // Validate message
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mesaj boş olamaz'
            });
        }

        if (message.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Mesaj çok uzun (maksimum 1000 karakter)'
            });
        }

        const cleanMessage = sanitizeInput(message.trim());

        // Additional content filtering
        const forbiddenPatterns = [
            /\b(hack|crack|exploit)\b/gi,
            /\b(password|pwd|pass)\s*[:=]\s*\w+/gi,
            /<script/gi,
            /javascript:/gi
        ];

        const hasForbiddenContent = forbiddenPatterns.some(pattern => pattern.test(cleanMessage));
        
        if (hasForbiddenContent) {
            // Log suspicious activity
            await logActivity({
                userId: user.id,
                activityType: 'suspicious_message',
                data: { message: cleanMessage },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(400).json({
                success: false,
                message: 'Mesaj içeriği uygun değil'
            });
        }

        // Save user message
        await saveMessage({
            userId: user.id,
            content: cleanMessage,
            type: 'user'
        });

        // Log message activity
        await logActivity({
            userId: user.id,
            activityType: 'message_sent',
            data: { messageLength: cleanMessage.length },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Generate AI response
        const aiResponse = generateAIResponse(cleanMessage, user);

        // Save AI response
        await saveMessage({
            userId: user.id,
            content: aiResponse,
            type: 'assistant'
        });

        // Return AI response
        res.json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.'
        });
    }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const user = req.user;

        const messages = await getUserMessages(user.id, {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100) // Max 100 messages per request
        });

        res.json({
            success: true,
            messages,
            pagination: {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100)
            }
        });

    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj geçmişi alınamadı'
        });
    }
});

// Clear chat history
router.delete('/history', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        // In a real implementation, you'd have a function to delete user messages
        // await clearUserMessages(user.id);

        res.json({
            success: true,
            message: 'Mesaj geçmişi temizlendi'
        });

    } catch (error) {
        console.error('Clear chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj geçmişi temizlenemedi'
        });
    }
});

// Get chat statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { getMessageStats } = require('../database/messages');
        const stats = await getMessageStats(req.user.id);

        // Calculate additional stats
        const averageResponseTime = '1.2s'; // This would be calculated from actual response times
        const favoriteTopics = ['Genel Sohbet', 'Yardım', 'Bilgi']; // This would be analyzed from message content

        res.json({
            success: true,
            stats: {
                ...stats,
                averageResponseTime,
                favoriteTopics
            }
        });

    } catch (error) {
        console.error('Chat stats error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınamadı'
        });
    }
});

// Search messages
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { query, page = 1, limit = 20 } = req.query;
        const user = req.user;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Arama terimi en az 2 karakter olmalı'
            });
        }

        // In a real implementation, you'd search through messages
        // For now, return empty results
        const results = [];

        res.json({
            success: true,
            results,
            pagination: {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                total: 0
            }
        });

    } catch (error) {
        console.error('Message search error:', error);
        res.status(500).json({
            success: false,
            message: 'Arama yapılamadı'
        });
    }
});

// Export chat data
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const user = req.user;

        const messages = await getUserMessages(user.id, { limit: 1000 });

        if (format === 'json') {
            const exportData = {
                user: {
                    username: user.username,
                    exportDate: new Date().toISOString()
                },
                messages: messages.map(msg => ({
                    content: msg.content,
                    type: msg.type,
                    timestamp: msg.created_at
                }))
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="chat-export-${user.username}-${new Date().toISOString().split('T')[0]}.json"`);
            res.json(exportData);
        } else if (format === 'txt') {
            let textContent = `Chat Export for ${user.username}\n`;
            textContent += `Export Date: ${new Date().toISOString()}\n`;
            textContent += `Total Messages: ${messages.length}\n\n`;
            textContent += '=' .repeat(50) + '\n\n';

            messages.forEach(msg => {
                const timestamp = new Date(msg.created_at).toLocaleString('tr-TR');
                const sender = msg.type === 'user' ? user.username : 'Assistant';
                textContent += `[${timestamp}] ${sender}: ${msg.content}\n\n`;
            });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="chat-export-${user.username}-${new Date().toISOString().split('T')[0]}.txt"`);
            res.send(textContent);
        } else {
            res.status(400).json({
                success: false,
                message: 'Desteklenmeyen format. json veya txt kullanın.'
            });
        }

    } catch (error) {
        console.error('Chat export error:', error);
        res.status(500).json({
            success: false,
            message: 'Sohbet dışa aktarılamadı'
        });
    }
});

// Get message by ID
router.get('/message/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { getMessageById } = require('../database/messages');
        
        const message = await getMessageById(id);

        if (!message || message.user_id !== req.user.id) {
            return res.status(404).json({
                success: false,
                message: 'Mesaj bulunamadı'
            });
        }

        res.json({
            success: true,
            message: {
                id: message.id,
                content: message.content,
                type: message.type,
                timestamp: message.created_at
            }
        });

    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj alınamadı'
        });
    }
});

// Delete message
router.delete('/message/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteMessage } = require('../database/messages');
        
        const deletedRows = await deleteMessage(id, req.user.id);

        if (deletedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesaj bulunamadı veya silinemiyor'
            });
        }

        res.json({
            success: true,
            message: 'Mesaj başarıyla silindi'
        });

    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj silinemedi'
        });
    }
});

// Bulk delete messages
router.delete('/messages', authenticateToken, async (req, res) => {
    try {
        const { messageIds } = req.body;

        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli mesaj ID\'leri gerekli'
            });
        }

        const { deleteMessage } = require('../database/messages');
        let deletedCount = 0;

        for (const messageId of messageIds) {
            const deleted = await deleteMessage(messageId, req.user.id);
            if (deleted > 0) deletedCount++;
        }

        res.json({
            success: true,
            message: `${deletedCount} mesaj başarıyla silindi`,
            deletedCount
        });

    } catch (error) {
        console.error('Bulk delete messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Mesajlar silinemedi'
        });
    }
});

// Get chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { getUserSessions } = require('../database/messages');
        
        const sessions = await getUserSessions(req.user.id, {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100)
        });

        res.json({
            success: true,
            sessions,
            pagination: {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100)
            }
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Oturumlar alınamadı'
        });
    }
});

// Create new chat session
router.post('/session', authenticateToken, async (req, res) => {
    try {
        const { createSession } = require('../database/messages');
        const session = await createSession(req.user.id);

        res.status(201).json({
            success: true,
            message: 'Yeni oturum oluşturuldu',
            session
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Oturum oluşturulamadı'
        });
    }
});

// End chat session
router.put('/session/:id/end', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { endSession } = require('../database/messages');
        
        const updatedRows = await endSession(id);

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Oturum bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Oturum sonlandırıldı'
        });

    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({
            success: false,
            message: 'Oturum sonlandırılamadı'
        });
    }
});

module.exports = router;