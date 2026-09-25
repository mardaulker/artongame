# Konak konum sözlüğü

Tek kaynak: `components/game/locations.ts`. Kodları yeniden kullanmayın veya yeniden numaralandırmayın. Yapı taşınırsa koordinatı da güncelleyin. Harita ve AI okuma aracı aynı kaynağı kullanır.

Sahnedeki `getObjectByName(id)` sonucu fiziksel yapının tamamı değil, onu tanımlayan görünmez referans noktasıdır. Çarpışmalar ve ortak instanced mesh grupları değişmez. Geometri düzenlemek için tabloda belirtilen kaynak ve koordinatlar kullanılır.

Koordinatlar: x arazi boyunca yatay; planY kapıdan içeri doğru; height yükseklik. Three.js: [x,height,-planY]. Noktalar ışınlanma hedefi değildir. Haritada üst üste gelen katlar seçim listesinden ayrı seçilir.

| Kod | Ad | Kaynak | Tarif |
|---|---|---|---|
| GATE-01 | Ana dış giriş kapısı | gate.ts | Siyah metal kapı ve taş portal. |
| WICKET-01 | Yaya geçiş kapısı | gate.ts | Ana kapının küçük açık geçişi. |
| PATH-01 | Ön bahçe yolu | world.ts | Girişten avluya basamaksız yol. |
| GARDEN-01 | Ön bahçe | world.ts | Giriş ile ön avlu arasındaki ağaçlı alan. |
| COURTYARD-01 | Ön avlu | world.ts | Bahçe yolunun sonundaki taş avlu. |
| HOUSE-01 | Ana konak bloğu | world.ts | Ana taş yapı. |
| FACADE-01 | Bahçeye bakan cephe | world.ts | Giriş yönündeki kısa cephe. |
| ARCADE-01 | Kemerli revak | world.ts | Ana girişe değil, sol yan avluya bakan galeri. |
| ARCH-01 | Büyük tonozlu geçit | world.ts | Alt terasın altındaki yürünebilir kemer. |
| NICHE-01 | Küçük kemerli niş | world.ts | Sahanlık altında; ayakta geçilemez. |
| STAIR-01 | Ana dış merdiven | world.ts | Alt kol, sahanlık ve üst kolun bütünü. |
| STAIR-01A | Ana merdiven alt kolu | world.ts | Avludan sahanlığa; çıkışta planY azalır. |
| LANDING-01 | Ara sahanlık | world.ts | L dönüşündeki düz platform. |
| STAIR-01B | Ana merdiven üst kolu | world.ts | Sahanlıktan galeriye; çıkışta x artar. |
| BALUSTRADE-01 | Ana merdiven taş korkuluğu | world.ts | İki kol ve sahanlığın korkulukları. |
| TERRACE-01 | Alt taş teras | world.ts | Büyük tonoz üzerindeki teras. |
| GALLERY-01 | Bağlantı galerisi | world.ts | Üst kolu revaka ve alt terasa bağlar. |
| TERRACE-02 | Üst teras | world.ts | Revak üzerindeki açık seviye. |
| PORCH-01 | Yeşil sundurma | world.ts | Merdivenin önündeki ahşap direkli kapı örtüsü. |
| DOOR-01 | Sundurma altındaki kapı | world.ts | Yeşil örtü altındaki kahverengi kapı. |
| COURTYARD-02 | Arka avlu | world.ts | Konağın arkasındaki yükseltilmiş avlu. |
| STAIR-02 | Revak iç merdivenleri | world.ts | Revaktan iki oda kapısına simetrik olarak çıkan merdivenler. |
| AlyaRoom | AlyaRoom | world.ts | Merdiven bitişinin kuzeyindeki geniş üst sahanlığa açılan oda kapısı. |
| sadakatRoom | sadakatRoom | world.ts | Merdivenin üst bitişindeki özel sahanlığa açılan oda kapısı. |
| STAIR-03 | Arka merdiven bağlantısı | world.ts | Arka avluya çıkan kol; batıdaki teras inişiyle bağlantılı. |
| ROOF-01 | Ana çatı | world.ts | Ana bloğun en yüksek düz çatısı. |
| ROOF-02 | Alt çatı | world.ts | Ana çatının arkasındaki alçak çatı. |
| BALCONY-01 | Kavisli balkon | world.ts | Kısa cephedeki alt balkon; çatı çıkıntısından ayrı. |
| WALL-01 | Dış çevre duvarı | world.ts | Çevre duvarlarının bütünü; nokta sol kenarda referanstır. |
| PLAYER-SPAWN-01 | Başlangıç noktası | entrance.ts | Alt taş terastaki başlangıç. |

Örnek: “STAIR-01B ana merdiven üst kolunu genişlet; LANDING-01 yüksekliği ve PORCH-01 konumu değişmesin.”

