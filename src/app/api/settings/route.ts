import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'yedek-anahtar-123';

export async function POST(req: Request) {
  try {
    const { username, settings } = await req.json();
    
    // Eğer ntfyChannel girilmişse ve zaten şifrelenmemişse (U2FsdGVk ile başlamıyorsa), DB'ye yazmadan önce AES ile şifrele
    if (settings.ntfyChannel && !settings.ntfyChannel.startsWith('U2FsdGVk')) {
      settings.ntfyChannel = CryptoJS.AES.encrypt(settings.ntfyChannel, SECRET_KEY).toString();
    }

    await dbConnect();
    
    const user = await User.findOneAndUpdate(
      { username }, 
      { settings }, 
      { new: true }
    );
    
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı!' }, { status: 404 });
    return NextResponse.json({ success: true, settings: user.settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}