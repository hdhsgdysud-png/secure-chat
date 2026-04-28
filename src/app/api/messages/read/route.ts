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

export async function POST(req: Request) {
  try {
    const { chatId, username } = await req.json();
    await dbConnect();

    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ error: 'Sohbet bulunamadı!' }, { status: 404 });

    let updated = false;

    // Karşı tarafın attığı ve henüz okunmamış mesajları "okundu" yap
    chat.messages.forEach((msg: any) => {
      if (msg.sender !== username && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
      // Karşı tarafa "Mesajların okundu, mavi tik yap" sinyali at
      await pusher.trigger(chatId, 'messages-read', { reader: username });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}