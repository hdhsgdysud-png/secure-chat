// Bu link senin GitHub'dan kopyaladığın o 'Raw' linki olacak. Asla değişmeyecek!
const GIST_URL = "https://gist.githubusercontent.com/hdhsgdysud-png/44adf67542408f0117ba24b89a574ab1/raw/falcon-config.json";

// Uygulama her açıldığında arka planda çalışacak fonksiyon
export async function getServerUrl() {
  try {
    const response = await fetch(GIST_URL, { cache: 'no-store' });
    const data = await response.json();
    
    // Eğer sunucuyu bakıma alırsan (true yaparsan), uygulamayı kilitler
    if (data.maintenance_mode) {
      alert("FALCON şu an bakımda, birazdan döneceğiz!");
      return null;
    }

    // Sisteme güncel Vercel veya Hostinger linkini verir
    return data.current_server; 

  } catch (error) {
    console.error("Tabelaya ulaşılamadı, interneti kontrol edin.");
    // Çökmeyi önlemek için son bilinen (yedek) linki döndürür
    return "https://yedek-falcon-sunucu.vercel.app";
  }
}