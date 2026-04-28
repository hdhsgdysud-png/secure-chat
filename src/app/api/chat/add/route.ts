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

    // 1. Kodu girilen arkadaşı veritabanında bul
    const friend = await User.findOne({ userCode: friendCode });
    if (!friend) {
      return NextResponse.json({ error: 'Bu koda sahip biri bulunamadı! Kodu kontrol et.' }, { status: 404 });
    }

    // 2. Kişi kendi kodunu girdiyse engelle
    if (friend.username === currentUser) {
      return NextResponse.json({ error: 'Kendinle sohbet edemezsin Ostam!' }, { status: 400 });
    }

    // 3. Daha önce aralarında açılmış bir sohbet var mı diye bak
    const existingChat = await Chat.findOne({
      participants: { $all: [currentUser, friend.username] }
    });

    if (existingChat) {
      return NextResponse.json({ error: 'Bu kişiyle zaten sohbetin var!' }, { status: 400 });
    }

    // 4. Her şey tamamsa yepyeni bir sohbet odası oluştur
    const newChat = new Chat({
      participants: [currentUser, friend.username],
      messages: [] // Şimdilik mesajlar boş
    });
    await newChat.save();

    // Karşı tarafa "Sana yeni bir sohbet eklendi, F5 atmadan listeni yenile!" sinyali gönderiyoruz
    await pusher.trigger(`user-${friend.username}`, 'chat-updated', {});

    return NextResponse.json({ message: 'Sohbet başarıyla başlatıldı!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Sunucu hatası oluştu!' }, { status: 500 });
  }
}