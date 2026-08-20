import express from 'express';
import {
    sendMessage,
    getMessages,
    getAllConversations,
    markAsRead,
    getConversationStatus,
    getChatStats
} from '../Controllers/chatController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.post('/send', verifyToken, sendMessage);
router.get('/messages', verifyToken, getMessages);
router.put('/mark-read', verifyToken, markAsRead);
router.get('/conversation', verifyToken, getConversationStatus);

// Admin routes
router.get('/admin/conversations', verifyToken, isAdmin, getAllConversations);
router.get('/admin/messages/:userId', verifyToken, isAdmin, getMessages);
router.get('/admin/stats', verifyToken, isAdmin, getChatStats);

export default router;