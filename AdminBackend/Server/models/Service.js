import mongoose from 'mongoose';

const servicesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  icon: {
    type: String,
  },
});

// Pre-save hook to generate slug automatically
servicesSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
  next();
});

const Service =  mongoose.models.Service || mongoose.model("Service", servicesSchema);
export default Service;




// import mongoose from 'mongoose';

// const servicesSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   slug: {
//     type: String,
//     required: true,
//     unique: true,
//   },
// });

// // Pre-save hook to generate slug automatically
// servicesSchema.pre('save', function (next) {
//   if (!this.slug) {
//     this.slug = this.title
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, '-')
//       .replace(/[^\w-]+/g, '');
//   }
//   next();
// });

// const Service = mongoose.model('Service', servicesSchema);
// export default Service;