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
    const { chatId, username, isTyping } = await req.json();
    
    // Pusher ile o odaya "Bu kişi yazıyor/yazmayı bıraktı" sinyali yolla
    await pusher.trigger(chatId, 'typing', { username, isTyping });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Sinyal gönderilemedi' }, { status: 500 });
  }
}