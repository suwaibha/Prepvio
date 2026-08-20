import mongoose from "mongoose";

const { Schema } = mongoose;

const videoSchema = new Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  playlistId: {
    type: Schema.Types.ObjectId,
    ref: "Playlist",
    required: true,
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

const Video = mongoose.model("Video", videoSchema);

export default Video;