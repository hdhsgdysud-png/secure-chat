import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { username, action } = await req.json();
    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

    const now = new Date();
    // Eğer önceden kalma bir hesapsa createdAt tarihini baz al
    const lastUpdated = user.codeUpdatedAt ? new Date(user.codeUpdatedAt) : new Date(user.createdAt);
    const diffHours = Math.abs(now.getTime() - lastUpdated.getTime()) / 3600000;

    // Eğer butona manuel basıldıysa VEYA 24 saat dolduysa kodu yenile
    if (action === 'manual' || diffHours >= 24) {
      let newCode = generateCode();
      let isUnique = false;

      // Üretilen kodun başka birinde olmadığından %100 emin ol
      while (!isUnique) {
        const existing = await User.findOne({ userCode: newCode });
        if (!existing) {
          isUnique = true;
        } else {
          newCode = generateCode();
        }
      }

      user.userCode = newCode;
      user.codeUpdatedAt = now;
      await user.save();

      return NextResponse.json({ success: true, newCode });
    }

    // 24 saat dolmadıysa mevcut kodu geri gönder
    return NextResponse.json({ success: true, newCode: user.userCode });

  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}