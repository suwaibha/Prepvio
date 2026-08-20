import mongoose from "mongoose";

/* ======================================================
   VIDEO PROGRESS (NESTED UNDER COURSE)
====================================================== */
const videoProgressSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true },
    watchedSeconds: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ======================================================
   COURSE PROGRESS (COURSE + CHANNEL LEVEL)
====================================================== */
const courseProgressSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    courseTitle: { type: String, required: true },
    courseThumbnail: String,
    channelId: { type: String, required: true },
    channelName: { type: String, required: true },
    channelThumbnail: String,
    totalSeconds: { type: Number, required: true },
    watchedSeconds: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    videos: [videoProgressSchema],
  },
  { _id: false }
);

/* ======================================================
   FEEDBACK SCHEMA
====================================================== */
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: { type: String },
    channelId: { type: String },
    type: {
      type: String,
      enum: ["course", "general"],
      required: true,
    },
    category: {
      type: String,
      enum: ["content", "bug", "ui", "general"],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

/* ======================================================
   APTITUDE TEST ATTEMPTS
====================================================== */
const aptitudeAttemptSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      required: true,
    },
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            text: {
              type: String,
              required: true,
            },
          },
        ],
        explanation: {
          type: String,
        },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
        selectedIndex: {
          type: Number,
        },
        correctIndex: {
          type: Number,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

/* ======================================================
   INTERVIEW ATTEMPT SCHEMA
====================================================== */
const interviewAttemptSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    durationMinutes: {
      type: Number,
    },
  },
  { timestamps: true }
);

/* ======================================================
   PAYMENT SCHEMA
====================================================== */
const paymentSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      enum: ["subscription", "course", "certificate", "interviews"],
      default: "subscription",
    },
    amount: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
      default: null, // Original amount before discount
    },
    discountAmount: {
      type: Number,
      default: 0, // Amount discounted via promo code
    },
    promoCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ["razorpay", "stripe", "paypal"],
      default: "razorpay",
    },
    orderId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paidAt: {
      type: Date,
    },
    planId: {
      type: String,
    },
    interviewsGranted: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* ======================================================
   SUBSCRIPTION SCHEMA (WITH INTERVIEWS)
====================================================== */
const subscriptionSchema = new mongoose.Schema(
  {
    active: {
      type: Boolean,
      default: false,
    },
    planId: {
      type: String,
      enum: ["free", "monthly", "premium", "yearly", "lifetime"],
      default: "free",
    },
    planName: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    interviewsTotal: {
      type: Number,
      default: 0,
    },
    interviewsUsed: {
      type: Number,
      default: 0,
    },
    interviewsRemaining: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);



/* ======================================================
   PROJECT SCHEMA (EMBEDDED IN USER)
====================================================== */
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    imageUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    },
    liveLink: {
      type: String,
      trim: true,
    },
    githubLink: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ======================================================
   USER SCHEMA (SOURCE OF TRUTH)
====================================================== */
const userSchema = new mongoose.Schema(
  {
    /* ================= AUTH ================= */
    name: {
      type: String,
      trim: true,
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    userId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined for existing users
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
    },

    verificationToken: {
      type: String,
    },

    verificationTokenExpiresAt: {
      type: Date,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpiresAt: {
      type: Date,
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },

    /* ================= PAYMENT & SUBSCRIPTION ================= */
    payments: [paymentSchema],

    subscription: {
      type: subscriptionSchema,
      default: () => ({
        active: true,
        planId: "free",
        planName: "Free Plan",
        interviewsTotal: 1,
        interviewsUsed: 0,
        interviewsRemaining: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
    },

    hasClaimedFreeSession: {
      type: Boolean,
      default: false,
    },

    /* ================= INTERVIEWS ================= */
    interviewAttempts: [interviewAttemptSchema],



    /* ================= WATCH LATER ================= */
    savedVideos: [
      {
        videoId: { type: String, required: true },
        title: String,
        thumbnail: String,
        channelName: String,
        channelId: String,
        courseId: String,
        savedAt: { type: Date, default: Date.now },
      },
    ],

    /* ================= LEARNING PROGRESS ================= */
    courseProgress: [courseProgressSchema],

    feedbacks: [feedbackSchema],

    /* ================= APTITUDE ================= */
    aptitudeAttempts: [aptitudeAttemptSchema],

    /* ================= ✅ PROJECTS ================= */
    projects: [projectSchema],

    /* ================= PROFILE ================= */
    phone: String,

    bio: {
      type: String,
      maxLength: 300,
    },

    location: {
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    avatarUrl: String,
    profilePic: String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to sync name with firstName/lastName
userSchema.pre("save", function () {
  // If firstName or lastName changed, update name
  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.name = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  // If name changed but firstName/lastName not set, split name
  else if (this.isModified("name") && !this.firstName && !this.lastName) {
    const nameParts = (this.name || "").split(" ");
    this.firstName = nameParts[0] || "";
    this.lastName = nameParts.slice(1).join(" ") || "";
  }
});

// Prevent OverwriteModelError in dev / hot reload
export const User =
  mongoose.models.User || mongoose.model("User", userSchema);