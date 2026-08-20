import Ticket from '../Models/Ticket.js';
import Conversation from '../Models/Conversation.js';
import Message from '../Models/Message.js';
import { User } from '../Models/User.js';
import { sendTicketReplyNotification } from '../Utils/notificationHelper.js';

// Create a new ticket (User)
export const createTicket = async (req, res) => {
    try {
        const { subject, description, priority, category } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Subject and description are required'
            });
        }

        // Create conversation ID for this ticket
        const conversationId = `conv_${userId}`;

        // Create the ticket
        const ticket = new Ticket({
            userId,
            subject,
            description,
            priority: priority || 'Medium',
            category: category || 'General',
            conversationId,
            status: 'Open'
        });

        await ticket.save();

        // Create or update conversation
        await Conversation.findOneAndUpdate(
            { userId },
            {
                lastMessage: `New ticket: ${subject}`,
                lastMessageTime: new Date(),
                status: 'active'
            },
            { upsert: true, new: true }
        );

        // Create initial message in conversation
        const initialMessage = new Message({
            conversationId,
            sender: userId,
            senderType: 'user',
            text: `**Ticket Created: ${ticket.ticketId}**\n\n**Subject:** ${subject}\n\n**Description:** ${description}`,
            timestamp: new Date()
        });

        await initialMessage.save();

        // Emit socket event for real-time update
        if (req.io && userId) {
            req.io.emit('new_ticket', {
                ticket: ticket.toClientFormat(),
                userId: userId.toString()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            ticket: ticket.toClientFormat()
        });

    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ticket',
            error: error.message
        });
    }
};

// Get all tickets for logged-in user
export const getUserTickets = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, priority } = req.query;

        // Build filter
        const filter = { userId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tickets = await Ticket.find(filter)
            .sort({ lastUpdated: -1 })
            .limit(100);

        const formattedTickets = tickets.map(ticket => ticket.toClientFormat());

        res.status(200).json({
            success: true,
            tickets: formattedTickets,
            count: formattedTickets.length
        });

    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        });
    }
};

// Get specific ticket by ID
export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role?.toLowerCase() === 'admin';

        // Find ticket
        const ticket = await Ticket.findById(ticketId).populate('userId', 'name email avatar');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check authorization (user can only view their own tickets, admin can view all)
        if (!isAdmin && ticket.userId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view this ticket'
            });
        }

        // Get messages for this ticket's conversation
        const messages = await Message.find({ conversationId: ticket.conversationId })
            .sort({ timestamp: 1 })
            .limit(100);

        const formattedMessages = messages.map(msg => msg.toClientFormat());

        res.status(200).json({
            success: true,
            ticket: {
                ...ticket.toClientFormat(),
                user: {
                    name: ticket.userId.name,
                    email: ticket.userId.email,
                    avatar: ticket.userId.avatar
                }
            },
            messages: formattedMessages
        });

    } catch (error) {
        console.error('Get ticket by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket',
            error: error.message
        });
    }
};

// Reply to a ticket (User)
export const replyToTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message text is required'
            });
        }

        // Find ticket
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check authorization
        if (ticket.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to reply to this ticket'
            });
        }

        // Create message
        const message = new Message({
            conversationId: ticket.conversationId,
            sender: userId,
            senderType: 'user',
            text: text.trim(),
            timestamp: new Date()
        });

        await message.save();

        // Update ticket and conversation
        ticket.lastUpdated = new Date();
        if (ticket.status === 'Closed') {
            ticket.status = 'Open'; // Reopen if user replies to closed ticket
        }
        await ticket.save();

        await Conversation.findOneAndUpdate(
            { userId },
            {
                lastMessage: text.trim(),
                lastMessageTime: new Date()
            }
        );

        // Emit socket event
        if (req.io) {
            req.io.to(ticket.conversationId).emit('new_message', message.toClientFormat());
            req.io.emit('ticket_updated', ticket.toClientFormat());
        }

        res.status(201).json({
            success: true,
            message: message.toClientFormat()
        });

    } catch (error) {
        console.error('Reply to ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
            error: error.message
        });
    }
};

// Get all tickets (Admin only)
export const getAllTickets = async (req, res) => {
    try {
        const { status, priority, search } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(filter)
            .populate('userId', 'name email avatar')
            .sort({ lastUpdated: -1 })
            .limit(200);

        const formattedTickets = tickets.map(ticket => ({
            ...ticket.toClientFormat(),
            user: ticket.userId ? {
                id: ticket.userId._id,
                name: ticket.userId.name,
                email: ticket.userId.email,
                avatar: ticket.userId.avatar
            } : {
                id: null,
                name: "Deleted User",
                email: "N/A",
                avatar: null
            }
        }));

        res.status(200).json({
            success: true,
            tickets: formattedTickets,
            count: formattedTickets.length
        });

    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        });
    }
};

// Update ticket status (Admin only)
export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;

        if (!['Open', 'In Progress', 'Replied', 'Closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = status;
        ticket.lastUpdated = new Date();

        if (status === 'Closed') {
            ticket.closedAt = new Date();
        }

        await ticket.save();

        // Emit socket event
        if (req.io) {
            req.io.emit('ticket_updated', ticket.toClientFormat());
        }

        res.status(200).json({
            success: true,
            message: 'Ticket status updated',
            ticket: ticket.toClientFormat()
        });

    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket status',
            error: error.message
        });
    }
};

// Admin reply to ticket
export const adminReplyToTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { text } = req.body;
        const adminId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message text is required'
            });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Create admin message
        const message = new Message({
            conversationId: ticket.conversationId,
            sender: adminId,
            senderType: 'admin',
            text: text.trim(),
            timestamp: new Date()
        });

        await message.save();

        // Update ticket status to "Replied"
        ticket.status = 'Replied';
        ticket.lastUpdated = new Date();
        await ticket.save();

        // Update conversation
        await Conversation.findOneAndUpdate(
            { userId: ticket.userId },
            {
                lastMessage: text.trim(),
                lastMessageTime: new Date()
            }
        );

        // Emit socket events
        if (req.io) {
            req.io.to(ticket.conversationId).emit('new_message', message.toClientFormat());
            req.io.emit('ticket_updated', ticket.toClientFormat());
        }

        // Send notification to the user
        await sendTicketReplyNotification(ticket.userId, ticket.ticketId);

        res.status(201).json({
            success: true,
            message: message.toClientFormat()
        });

    } catch (error) {
        console.error('Admin reply to ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
            error: error.message
        });
    }
};