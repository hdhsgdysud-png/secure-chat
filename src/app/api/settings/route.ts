import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, settings } = await req.json();
    await dbConnect();
    
    // Ntfy kanal adını HİÇBİR ŞİFRELEME YAPMADAN, olduğu gibi tertemiz DB'ye kaydet
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