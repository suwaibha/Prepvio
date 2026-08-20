import Message from '../Models/Message.js';
import Conversation from '../Models/Conversation.js';

// Send a new message
export const sendMessage = async (req, res) => {
    try {
        const { text, receiverId } = req.body;
        const senderId = req.user._id;
        const senderType = req.user.role?.toLowerCase() === 'admin' ? 'admin' : 'user';

        let conversationId;
        if (senderType === 'admin') {
            conversationId = `conv_${receiverId}`;
        } else {
            conversationId = `conv_${senderId}`;
        }

        const message = new Message({
            conversationId,
            sender: senderId,
            senderType,
            text,
            timestamp: new Date()
        });

        await message.save();

        const userId = senderType === 'admin' ? receiverId : senderId;
        await Conversation.findOneAndUpdate(
            { userId },
            {
                lastMessage: text,
                lastMessageTime: new Date(),
                $inc: { unreadCount: senderType === 'admin' ? 0 : 1 }
            },
            { upsert: true, new: true }
        );

        if (req.io) {
            req.io.to(conversationId).emit('new_message', message.toClientFormat());
        }

        res.status(201).json({
            success: true,
            message: message.toClientFormat()
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// Get all messages for a conversation
export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const isAdmin = req.user.role?.toLowerCase() === 'admin';

        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // For admin, check if viewing a specific user's conversation via query param
        // If not admin, or no query param, default to current user's conversation
        const targetUserId = (isAdmin && req.query.userId) ? req.query.userId : userId;

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'Effective User ID is required' });
        }

        const conversationId = `conv_${targetUserId.toString()}`;

        const messages = await Message.find({ conversationId })
            .sort({ timestamp: 1 })
            .limit(100);

        const formattedMessages = messages.map(msg => msg.toClientFormat());

        if (!isAdmin) {
            await Message.updateMany(
                { conversationId, senderType: 'admin', read: false },
                { read: true }
            );

            await Conversation.findOneAndUpdate(
                { userId: targetUserId },
                { unreadCount: 0 }
            );
        }

        res.status(200).json({
            success: true,
            messages: formattedMessages
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

// Get all conversations (Admin only)
export const getAllConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .populate('userId', 'name email avatar')
            .sort({ lastMessageTime: -1 });

        res.status(200).json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
            error: error.message
        });
    }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversationId = `conv_${userId}`;

        await Message.updateMany(
            { conversationId, senderType: 'admin', read: false },
            { read: true }
        );

        await Conversation.findOneAndUpdate(
            { userId },
            { unreadCount: 0 }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
};

// Get conversation status
export const getConversationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        let conversation = await Conversation.findOne({ userId });

        if (!conversation) {
            conversation = new Conversation({ userId });
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('Get conversation status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation status',
            error: error.message
        });
    }
};

// Get Chat Statistics (Admin only)
export const getChatStats = async (req, res) => {
    try {
        const total = await Conversation.countDocuments();
        const active = await Conversation.countDocuments({ status: 'active' });
        const pending = await Conversation.countDocuments({ status: 'pending' });
        const closed = await Conversation.countDocuments({ status: 'closed' });

        // Latest 5 conversations for "Latest Activity"
        const latestConversations = await Conversation.find()
            .populate('userId', 'name email avatar')
            .sort({ lastMessageTime: -1 })
            .limit(5);

        // Total messages today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const messagesToday = await Message.countDocuments({ timestamp: { $gte: startOfDay } });

        res.status(200).json({
            success: true,
            stats: {
                total,
                active,
                pending,
                closed,
                messagesToday
            },
            latestConversations: latestConversations.map(conv => ({
                id: conv._id,
                userId: conv.userId?._id,
                userName: conv.userId?.name || 'Unknown',
                userAvatar: conv.userId?.avatar,
                lastMessage: conv.lastMessage,
                time: conv.lastMessageTime
            }))
        });

    } catch (error) {
        console.error('Get chat stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat statistics',
            error: error.message
        });
    }
};