import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Sohbet ID si gerekli!' }, { status: 400 });
    }

    await dbConnect();

    // Veritabanından sohbeti ve içindeki tüm mesajları kalıcı olarak uçuruyoruz (Hard Delete)
    const deletedChat = await Chat.findByIdAndDelete(chatId);

    if (!deletedChat) {
      return NextResponse.json({ error: 'Sohbet zaten silinmiş veya bulunamadı.' }, { status: 404 });
    }

    // Sohbet silindiğinde içindeki iki kişiye de "Listeyi yenileyin ve açık sohbet varsa kapatın" sinyali gönder
    await pusher.trigger(`user-${deletedChat.participants[0]}`, 'chat-updated', {});
    await pusher.trigger(`user-${deletedChat.participants[1]}`, 'chat-updated', {});

    return NextResponse.json({ message: 'Sohbet veritabanından tamamen kazındı! 💥' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Sohbet silinirken sunucu hatası oluştu!' }, { status: 500 });
  }
}