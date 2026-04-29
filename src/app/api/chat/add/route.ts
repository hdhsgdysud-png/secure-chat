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

// PUSHER TÜRKÇE KARAKTER KORUMASI (İsimleri güvenli sayılara çevirir)
const getSafeChannel = (name: string) => 'user-' + Array.from(name).map(c => c.charCodeAt(0).toString(16)).join('-');

export async function POST(req: Request) {
  try {
    const { currentUser, friendCode } = await req.json();
    await dbConnect();

    const friend = await User.findOne({ userCode: friendCode });
    if (!friend) return NextResponse.json({ error: 'Bu koda sahip biri bulunamadı!' }, { status: 404 });
    if (friend.username === currentUser) return NextResponse.json({ error: 'Kendinle sohbet edemezsin!' }, { status: 400 });

    const existingChat = await Chat.findOne({ participants: { $all: [currentUser, friend.username] } });
    if (existingChat) return NextResponse.json({ error: 'Bu kişiyle zaten sohbetin var!' }, { status: 400 });

    const newChat = new Chat({ participants: [currentUser, friend.username], messages: [] });
    await newChat.save();

    // ÇÖZÜM: İsimler şifrelenerek Pusher'a iletiliyor, Türkçe karakter hatası asla yaşanmayacak!
    try {
      await pusher.trigger(getSafeChannel(friend.username), 'chat-updated', {});
      await pusher.trigger(getSafeChannel(currentUser), 'chat-updated', {});
    } catch (pErr) {
      console.log("Pusher sinyal hatası yoksayıldı");
    }

    return NextResponse.json({ message: 'Sohbet başarıyla başlatıldı!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Sunucu hatası oluştu!' }, { status: 500 });
  }
}