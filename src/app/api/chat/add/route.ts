import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
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
    const { currentUser, friendCode } = await req.json();
    await dbConnect();

    const friend = await User.findOne({ userCode: friendCode });
    if (!friend) {
      return NextResponse.json({ error: 'Bu koda sahip biri bulunamadı! Kodu kontrol et.' }, { status: 404 });
    }

    if (friend.username === currentUser) {
      return NextResponse.json({ error: 'Kendinle sohbet edemezsin Ostam!' }, { status: 400 });
    }

    const existingChat = await Chat.findOne({
      participants: { $all: [currentUser, friend.username] }
    });

    if (existingChat) {
      return NextResponse.json({ error: 'Bu kişiyle zaten sohbetin var!' }, { status: 400 });
    }

    const newChat = new Chat({
      participants: [currentUser, friend.username],
      messages: []
    });
    await newChat.save();

    // ÇÖZÜM: Pusher sinyalini try-catch içine aldık ki Vercel takılsa bile işlem iptal olmasın.
    try {
      await pusher.trigger(`user-${friend.username}`, 'chat-updated', {});
      await pusher.trigger(`user-${currentUser}`, 'chat-updated', {});
    } catch (err) {
      console.log("Pusher sinyal gecikmesi yoksayıldı, sohbet eklendi.");
    }

    return NextResponse.json({ message: 'Sohbet başarıyla başlatıldı!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Sunucu hatası oluştu!' }, { status: 500 });
  }
}