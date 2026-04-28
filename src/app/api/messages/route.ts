import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import Pusher from 'pusher';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'yedek-anahtar-123';

// Pusher Ayarları (Senin .env dosyasındaki şifrelerle köprü kurar)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// MESAJ GÖNDERME
export async function POST(req: Request) {
  try {
    const { chatId, sender, text } = await req.json();
    await dbConnect();

    // 1. Mesajı veritabanı için AES ile çorbaya çevir
    const encryptedText = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ error: 'Sohbet bulunamadı!' }, { status: 404 });

    // 2. Şifreli mesajı MongoDB'ye kaydet
    const newMessage = { sender, text: encryptedText, createdAt: new Date(), isRead: false };
    chat.messages.push(newMessage);
    await chat.save();

    // 3. PUSHER TETİKLEMESİ (Anında Karşıya İlet)
    // Pusher kanalına şifresiz halini yolluyoruz ki ön yüz hemen ekrana basabilsin
    await pusher.trigger(chatId, 'new-message', {
      sender,
      text: text, 
      createdAt: newMessage.createdAt,
    });

    return NextResponse.json({ message: 'Mesaj şifrelendi ve gönderildi!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Mesaj gönderilemedi!' }, { status: 500 });
  }
}

// MESAJLARI ÇEKME (GET METODU AYNI KALIYOR)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    await dbConnect();

    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ error: 'Sohbet bulunamadı!' }, { status: 404 });

    const decryptedMessages = chat.messages.map((msg: any) => {
      try {
        const bytes = CryptoJS.AES.decrypt(msg.text, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return { ...msg.toObject(), text: originalText };
      } catch (error) {
        return { ...msg.toObject(), text: "⚠️ [Şifre Çözülemedi]" };
      }
    });

    return NextResponse.json({ messages: decryptedMessages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Mesajlar yüklenemedi!' }, { status: 500 });
  }
}