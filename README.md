# Arton · Konakta Bir Gün

Tarayıcıda oynanan, üçüncü şahıs kameralı bir 3D konak gezintisi. Kadın karakterle ana kapının önünden başlayın; küçük açık kapıdan geçerek bahçeyi, avluyu, revakı ve terasları keşfedin.

## Kontroller

- WASD veya yön tuşları: yürüme
- Shift: koşma
- Fareyi sürükleme: kamerayı çevirme
- Fare tekerleği: kamera mesafesi
- Esc: mola
- Dokunmatik ekranda sol kumanda: yürüme; sağ tarafı sürükleme: kamera

## Kapsam

Mekân, sağlanan yedi dış cephe fotoğrafı ve 2 dakika 26 saniyelik drone videosu karşılaştırılarak yaklaşık oranlarla modellenmiştir. Video üzerinden arka avlu, kademeli teraslar, revak içindeki merdiven, merdiven üzerindeki eğimli örtü, farklı çatı seviyeleri ve ikinci kavisli balkon çıkıntısı yeniden işlendi. İç oda planları bilinmediğinden iç mekânlar kapalıdır. Ölçüler ve görüntülerde saklı bağlantı ayrıntıları yaklaşık yorumdur; ölçülü mimari rölöve değildir.

## Geliştirme

Node.js 22.13 veya üzeri ve package.json içinde belirtilen pnpm sürümü gerekir. Bağımlılıklar `pnpm install`, geliştirme sunucusu `pnpm dev`, üretim derlemesi `pnpm build` komutuyla çalışır. Sites ortamında projenin yapılandırılmış kurulum, önizleme ve derleme yardımcıları kullanılır.

- `components/game/world.ts`: sahne, çarpışma hacimleri ve yürünebilir yüzeyler
- `components/game/physics.ts`: hareket, yerçekimi ve basamak çözümü
- `components/game/character.ts`: kadın karakter ve animasyonları
- `components/game/engine.ts`: 3D görüntüleme, kamera ve giriş kontrolleri
- `components/game/Game.tsx`: oyun ekranı, dokunmatik kontrol ve erişilebilir menüler

WebGL 2 ve etkin grafik hızlandırması gerekir. Uygun grafik bağlamı bulunamazsa oyun açıklayıcı bir hata ekranı gösterir.

## Görsel kaynaklar

Kadın karakter ve uyarlanmış hareket yakalama animasyonları Microsoft Rocketbox (MIT); fotoğraf tabanlı taş malzemeleri Poly Haven (CC0). Kaynak ve lisanslar `public/assets/SOURCES.md` ve `public/assets/character/LICENSE-Microsoft-Rocketbox.md` içinde bulunur. Ağaçlar, yapraklar, kemerler ve korkuluklar sahne geometrisi olarak üretilmiştir.

## Doğrulama

Üst teras, arka avlu ve tonoz altı geçiş rotaları gerçek sahne çarpışma verileriyle kontrol edildi. Geometri ve dokular dört açıdan ayrı bir render ile incelendi. Kontrol tarayıcısında WebGL devre dışı olduğundan canlı tarayıcıda 3D görüntü ve etkileşim uçtan uca doğrulanamadı.

Karakter yüklemesini durduran boş `f007_head_specular.webp`, özgün TGA kaynağından yeniden kodlandı. Düzeltilmiş dosya önbellek çakışmasını önlemek için yeni bir adla sunulur. 19 kaplama dosyası çözümlendi; gerçek tarayıcıda karakter, animasyonlar ve taş kaplamalarının yüklemesi ayrıca doğrulandı. Hata mesajları artık grafik başlatma, karakter ve kaplama hatalarını ayırır; yükleme başarısızsa sahne kaynakları serbest bırakılır.

Ana kadın karakter, sağlanan görsel referansa göre koyu kahverengi uzun saç, altın küpe, belirgin yüz makyajı, beyaz kolsuz kruvaze tulum ve siyah topuklu ayakkabıyla yeniden işlendi. Yüz ve kıyafet için yeni 2048 px dokular kullanılır; omuz altına inen saç hacmi baş iskeletine bağlı ek geometriyle animasyonlara eşlik eder.

Ana giriş, ayrıca sağlanan kapı fotoğrafına göre kemerli taş söveler, siyah metal kanatlar, açık yaya kapısı, fenerler, mazgallı üst taşlar ve “ARTON AİLESİ” tabelasıyla modellenmiştir. Başlangıç ve sıfırlama konumu dışarıdadır.

Yakın plan merdiven referansına göre alt terasın döşemesi kemerli taşıyıcı duvarla aynı hatta alındı; açıkta kalan döşeme altları kaldırıldı. L biçimli merdivenin iki kolu, kemerli sahanlık desteği ve duvar boyunca uzanan geniş bağlantı galerisi sürekli taş taşıyıcılarla birleştirildi. Merdiven arkasındaki avlu açıktır. Büyük tonozlu geçit gezilebilir; alçak küçük kemer fotoğraftaki gibi bir niş olarak korunur.
