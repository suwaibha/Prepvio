import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Replied', 'Closed'],
        default: 'Open',
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
        index: true
    },
    category: {
        type: String,
        enum: ['Technical', 'Billing', 'General', 'Account', 'Feature Request', 'Bug Report'],
        default: 'General'
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    closedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Generate unique ticket ID and update lastUpdated
ticketSchema.pre('validate', async function () {
    if (!this.ticketId) {
        const count = await mongoose.model('Ticket').countDocuments();
        this.ticketId = `TKT-${String(count + 1).padStart(6, '0')}`;
    }
});

ticketSchema.pre('save', async function () {
    this.lastUpdated = new Date();
});

// Method to format ticket for client
ticketSchema.methods.toClientFormat = function () {
    return {
        id: this._id,
        ticketId: this.ticketId,
        subject: this.subject,
        description: this.description,
        status: this.status,
        priority: this.priority,
        category: this.category,
        conversationId: this.conversationId,
        createdAt: this.createdAt,
        lastUpdated: this.lastUpdated,
        closedAt: this.closedAt
    };
};

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;