import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: String, required: true }], // Sohbetteki iki kişinin kullanıcı adları
    messages: [
      {
        sender: { type: String, required: true },
        text: { type: String, required: true }, // Şifrelenmiş mesaj metni buraya gelecek
        createdAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false } // Görüldü özelliği için
      }
    ]
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export default Chat;