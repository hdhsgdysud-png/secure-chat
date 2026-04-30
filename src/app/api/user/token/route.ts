import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, token } = await req.json();
    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

    if (!user.deviceTokens.includes(token)) {
      user.deviceTokens.push(token);
      await user.save();
    }

    return NextResponse.json({ message: 'Token kaydedildi' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Token kaydedilemedi' }, { status: 500 });
  }
}