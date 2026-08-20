import mongoose from "mongoose";
import slugify from "slugify";
const { Schema } = mongoose;

const channelSchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    link: { type: String, required: true },
    slug: { type: String, unique: true },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }]
}, { timestamps: true });

// Generate unique slug
channelSchema.pre("save", async function () {
    if (this.isModified("name")) {
        let baseSlug = slugify(this.name, { lower: true, strict: true });
        let slug = baseSlug;
        let count = 1;

        while (await mongoose.models.Channel.exists({ slug })) {
            slug = `${baseSlug}-${count++}`;
        }
        this.slug = slug;
    }
});

const Channel = mongoose.models.Channel || mongoose.model("Channel", channelSchema);
export default Channel;