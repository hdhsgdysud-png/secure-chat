import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. Veritabanına bağlan
    await dbConnect();

    // 2. Kullanıcı adı zaten var mı kontrol et
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten alınmış!' }, { status: 400 });
    }

    // 3. Şifreyi Bcrypt ile "çorba" yap (Güvenlik için en önemlisi!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Rastgele 6 haneli benzersiz kullanıcı kodu üret (Örn: 542910)
    let userCode = '';
    let isCodeUnique = false;
    while (!isCodeUnique) {
      userCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existingCode = await User.findOne({ userCode });
      if (!existingCode) isCodeUnique = true;
    }

    // 5. Yeni kullanıcıyı varsayılan ayarlarıyla kaydet
    const newUser = new User({
      username,
      password: hashedPassword,
      userCode,
      settings: {
        lang: 'en',
        theme: 'dark',
        accent: 'cyan',
        notif: true
      }
    });

    await newUser.save();

    return NextResponse.json({ message: 'Kayıt başarıyla tamamlandı!', userCode }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Sunucu hatası oluştu!' }, { status: 500 });
  }
}