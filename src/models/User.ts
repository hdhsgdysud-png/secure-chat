import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userCode: { type: String, required: true, unique: true },
    codeUpdatedAt: { type: Date, default: Date.now },
    // YENİ EKLENEN AYARLAR KISMI
    settings: {
      lang: { type: String, default: 'en' },
      theme: { type: String, default: 'dark' },
      accent: { type: String, default: 'cyan' },
      notif: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;