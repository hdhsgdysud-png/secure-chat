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
    if (!chatId) return NextResponse.json({ error: 'ID lazım' }, { status: 400 });

    await dbConnect();
    const deletedChat = await Chat.findByIdAndDelete(chatId);
    if (!deletedChat) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

    try {
      if (deletedChat.participants) {
        // chat-deleted sinyalini ve chatId'yi gönderiyoruz
        const triggers = deletedChat.participants.map((user: string) => 
          pusher.trigger(`user-${user}`, 'chat-deleted', { chatId }).catch(e => {})
        );
        await Promise.all(triggers);
      }
    } catch (e) { console.log("Sinyal gitmedi ama silme okey."); }

    return NextResponse.json({ message: 'Silindi' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Hata!' }, { status: 500 });
  }
}