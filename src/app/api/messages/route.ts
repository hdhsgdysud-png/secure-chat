import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import Pusher from 'pusher';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'yedek-anahtar-123';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  try {
    const { chatId, sender, text } = await req.json();
    await dbConnect();

    const encryptedText = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ error: 'Sohbet bulunamadı!' }, { status: 404 });

    const newMessage = { sender, text: encryptedText, createdAt: new Date(), isRead: false };
    chat.messages.push(newMessage);
    await chat.save();

    await pusher.trigger(chatId, 'new-message', {
      sender,
      text: text, 
      createdAt: newMessage.createdAt,
    });

    // 4. NTFY BİLDİRİMİ (Sıfır Maliyet, Sıfır Şifre, Tam Hayalet Modu)
    const receiverUsername = chat.participants.find((p: string) => p !== sender);
    if (receiverUsername) {
      const receiver = await User.findOne({ username: receiverUsername });
      
      if (receiver && receiver.settings.notif && receiver.settings.ntfyChannel) {
        
        let decryptedChannel = receiver.settings.ntfyChannel;
        try {
          // Veritabanındaki AES Şifresini Çöz
          const bytes = CryptoJS.AES.decrypt(decryptedChannel, SECRET_KEY);
          const originalText = bytes.toString(CryptoJS.enc.Utf8);
          // Eğer şifre başarıyla çözüldüyse gerçek kanalı al, çözülemediyse veritabanındaki haliyle dene
          if (originalText) {
            decryptedChannel = originalText;
          }
        } catch(e) {
          console.log("Sifre cozulemedi, ham kanal adi kullanilacak.");
        } 

        const ntfyUrl = `https://ntfy.sh/${decryptedChannel}`;
        
        // VERCEL'İN FİŞİ ÇEKMESİNİ ENGELLEYEN O SİHİRLİ 'AWAIT' KELİMESİ EKLENDİ!
        await fetch(ntfyUrl, {
          method: 'POST',
          headers: {
            'Title': 'FALCON',
            'Tags': 'lock,bird',
            'Priority': 'default'
          },
          body: `🔒 ${sender} sana yeni bir mesaj gönderdi.`
        }).catch(err => console.error('Ntfy hatası:', err));
        
      }
    }

    // Vercel ancak fetch (kargo) işlemi bittikten sonra burayı görecek ve dükkanı kapatacak.
    return NextResponse.json({ message: 'Mesaj şifrelendi ve gönderildi!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Mesaj gönderilemedi!' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    await dbConnect();

    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ error: 'Sohbet bulunamadı!' }, { status: 404 });

    const decryptedMessages = chat.messages.map((msg: any) => {
      try {
        const bytes = CryptoJS.AES.decrypt(msg.text, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return { ...msg.toObject(), text: originalText };
      } catch (error) {
        return { ...msg.toObject(), text: "⚠️ [Şifre Çözülemedi]" };
      }
    });

    return NextResponse.json({ messages: decryptedMessages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Mesajlar yüklenemedi!' }, { status: 500 });
  }
}