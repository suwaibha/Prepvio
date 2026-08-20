import express from 'express';
import {
    createTicket,
    getUserTickets,
    getTicketById,
    replyToTicket,
    getAllTickets,
    updateTicketStatus,
    adminReplyToTicket
} from '../Controllers/ticketController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.post('/create', verifyToken, createTicket);
router.get('/my-tickets', verifyToken, getUserTickets);
router.get('/:ticketId', verifyToken, getTicketById);
router.post('/:ticketId/reply', verifyToken, replyToTicket);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAllTickets);
router.put('/admin/:ticketId/status', verifyToken, isAdmin, updateTicketStatus);
router.post('/admin/:ticketId/reply', verifyToken, isAdmin, adminReplyToTicket);

export default router;