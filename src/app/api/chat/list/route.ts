
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) return NextResponse.json({ error: 'Kullanıcı adı gerekli!' }, { status: 400 });

    await dbConnect();

    // Kullanıcının katılımcı olduğu tüm sohbetleri bul
    const chats = await Chat.find({
      participants: { $in: [username] }
    }).sort({ updatedAt: -1 });

    return NextResponse.json({ chats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Sohbetler yüklenemedi!' }, { status: 500 });
  }
}