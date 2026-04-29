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
    const chatId = req.nextUrl.searchParams.get('chatId');
    if (!chatId) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    await dbConnect();

    const deletedChat = await Chat.findByIdAndDelete(chatId);
    if (!deletedChat) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

    try {
      if (deletedChat.participants && Array.isArray(deletedChat.participants)) {
        const triggers = deletedChat.participants.map((user: string) => 
          // DEĞİŞİKLİK BURADA: Karşı tarafa spesifik olarak "chat-deleted" ve ID'yi yolluyoruz.
          pusher.trigger(`user-${user}`, 'chat-deleted', { chatId: chatId }).catch(e => console.log("Pusher hatası"))
        );
        await Promise.all(triggers);
      }
    } catch (pusherErr) {
      console.error("Sinyal hatası ama silme işlemi başarılı");
    }

    return NextResponse.json({ message: 'Başarılı' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}