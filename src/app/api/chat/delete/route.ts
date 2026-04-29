import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function DELETE(req: NextRequest) {
  try {
    // 1. DEĞİŞİKLİK: Vercel ortamında çökmeyi önleyen en güvenli parametre alma yöntemi
    const chatId = req.nextUrl.searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Sohbet ID si gerekli!' }, { status: 400 });
    }

    await dbConnect();

    // Veritabanından sohbeti kalıcı olarak uçuruyoruz (Hard Delete)
    const deletedChat = await Chat.findByIdAndDelete(chatId);

    if (!deletedChat) {
      return NextResponse.json({ error: 'Sohbet zaten silinmiş veya bulunamadı.' }, { status: 404 });
    }

    // 2. DEĞİŞİKLİK: Eğer participants dizisi sağlamsa döngüye girip iki tarafa da sinyal yolla (Çökmeyi önler)
    if (deletedChat.participants && Array.isArray(deletedChat.participants)) {
      for (const user of deletedChat.participants) {
        await pusher.trigger(`user-${user}`, 'chat-updated', {});
      }
    }

    return NextResponse.json({ message: 'Sohbet veritabanından tamamen kazındı! 💥' }, { status: 200 });
  } catch (error) {
    // 3. DEĞİŞİKLİK: Eğer yine patlarsa Vercel panelinde hatanın ne olduğunu görebilelim
    console.error("SOHBET SİLİNİRKEN HATA OLUŞTU:", error);
    return NextResponse.json({ error: 'Sohbet silinirken sunucu hatası oluştu!' }, { status: 500 });
  }
}