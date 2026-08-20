import mongoose from "mongoose";

const { Schema } = mongoose;

const playlistSchema = new Schema({
  type: {
    type: String,
    enum: ["playlist","video"],
    default: "playlist",
  },
  link: {
    type: String,
    required: true, // Make sure the link is required
    unique: true, // Consider making the link unique to prevent duplicates
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
});

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;