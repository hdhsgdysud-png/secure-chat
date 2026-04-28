import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. Veritabanına bağlan
    await dbConnect();

    // 2. Kullanıcıyı veritabanında bul
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Böyle bir kullanıcı bulunamadı!' }, { status: 404 });
    }

    // 3. Şifreyi Bcrypt ile çözüp karşılaştır
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: 'Hatalı şifre girdiniz!' }, { status: 401 });
    }

    // 4. Şifre doğruysa giriş başarılı mesajı, kullanıcı bilgileri ve AYARLARI gönder
    return NextResponse.json({ 
      message: 'Giriş başarılı!',
      userCode: user.userCode,
      username: user.username,
      settings: user.settings
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Sunucu hatası oluştu!' }, { status: 500 });
  }
}