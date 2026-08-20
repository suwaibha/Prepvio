import mongoose from "mongoose";
import slugify from "slugify";
const { Schema } = mongoose;

const courseSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  channels: [{ type: Schema.Types.ObjectId, ref: "Channel" }],

  // ✅ ADD a categoryId field that references the Category model
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category', // This tells Mongoose what model to reference
    required: true
  },
  totalLevels: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Generate unique slug from name
courseSchema.pre("save", async function () {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    // Use a while loop to ensure the slug is unique
    while (await mongoose.models.Course.exists({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
});

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default Course;