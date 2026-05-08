import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl:  { type: String, required: true },
  fileKey:  { type: String, required: true },
  fileType: { type: String, enum: ['image', 'video'], required: true },
  mimeType: { type: String },
  size:     { type: Number },
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);
