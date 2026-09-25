// Stable IDs. Anchors are not teleport targets. Three.js position = [x, height, -planY].
// Coordinates describe the current approximate model, not measured architecture.
export type Location={id:string;name:string;x:number;planY:number;height:number;description:string;source:string};
export const LOCATIONS = {
 MAIN_GATE: {"id":"GATE-01","name":"Ana dış giriş kapısı","x":0,"planY":0,"height":0,"description":"Siyah metal kapı ve taş portal.","source":"gate.ts"},
 WICKET_GATE: {"id":"WICKET-01","name":"Yaya geçiş kapısı","x":-0.65,"planY":0,"height":0,"description":"Ana kapının küçük açık geçişi.","source":"gate.ts"},
 FRONT_PATH: {"id":"PATH-01","name":"Ön bahçe yolu","x":0,"planY":18,"height":0,"description":"Girişten avluya basamaksız yol.","source":"world.ts"},
 FRONT_GARDEN: {"id":"GARDEN-01","name":"Ön bahçe","x":-7,"planY":18,"height":0,"description":"Giriş ile ön avlu arasındaki ağaçlı alan.","source":"world.ts"},
 FRONT_COURTYARD: {"id":"COURTYARD-01","name":"Ön avlu","x":-7,"planY":38,"height":0,"description":"Bahçe yolunun sonundaki taş avlu.","source":"world.ts"},
 MAIN_HOUSE: {"id":"HOUSE-01","name":"Ana konak bloğu","x":2.5,"planY":60,"height":4.5,"description":"Ana taş yapı.","source":"world.ts"},
 FRONT_FACADE: {"id":"FACADE-01","name":"Bahçeye bakan cephe","x":2.5,"planY":42,"height":5,"description":"Giriş yönündeki kısa cephe.","source":"world.ts"},
 ARCADE: {"id":"ARCADE-01","name":"Kemerli revak","x":-3,"planY":53,"height":4.5,"description":"Ana girişe değil, sol yan avluya bakan galeri.","source":"world.ts"},
 LARGE_VAULT: {"id":"ARCH-01","name":"Büyük tonozlu geçit","x":-11.1,"planY":67.15,"height":0,"description":"Alt terasın altındaki yürünebilir kemer.","source":"world.ts"},
 SMALL_NICHE: {"id":"NICHE-01","name":"Küçük kemerli niş","x":-12.8,"planY":59.8,"height":0,"description":"Sahanlık altında; ayakta geçilemez.","source":"world.ts"},
 MAIN_STAIR: {"id":"STAIR-01","name":"Ana dış merdiven","x":-11.6,"planY":62.2,"height":2.1,"description":"Alt kol, sahanlık ve üst kolun bütünü.","source":"world.ts"},
 MAIN_STAIR_LOWER: {"id":"STAIR-01A","name":"Ana merdiven alt kolu","x":-12.8,"planY":64.1,"height":1.05,"description":"Avludan sahanlığa; çıkışta planY azalır.","source":"world.ts"},
 MAIN_STAIR_LANDING: {"id":"LANDING-01","name":"Ara sahanlık","x":-12.8,"planY":61,"height":2.1,"description":"L dönüşündeki düz platform.","source":"world.ts"},
 MAIN_STAIR_UPPER: {"id":"STAIR-01B","name":"Ana merdiven üst kolu","x":-9.65,"planY":61,"height":3.3,"description":"Sahanlıktan galeriye; çıkışta x artar.","source":"world.ts"},
 STAIR_BALUSTRADE: {"id":"BALUSTRADE-01","name":"Ana merdiven taş korkuluğu","x":-9.65,"planY":59.8,"height":4.2,"description":"İki kol ve sahanlığın korkulukları.","source":"world.ts"},
 LOWER_TERRACE: {"id":"TERRACE-01","name":"Alt taş teras","x":-11.1,"planY":73,"height":4.5,"description":"Büyük tonoz üzerindeki teras.","source":"world.ts"},
 CONNECTING_GALLERY: {"id":"GALLERY-01","name":"Bağlantı galerisi","x":-6.35,"planY":65,"height":4.5,"description":"Üst kolu revaka ve alt terasa bağlar.","source":"world.ts"},
 UPPER_TERRACE: {"id":"TERRACE-02","name":"Üst teras","x":-2.5,"planY":54,"height":9.5,"description":"Revak üzerindeki açık seviye.","source":"world.ts"},
 GREEN_PORCH: {"id":"PORCH-01","name":"Yeşil sundurma","x":-5.95,"planY":57.7,"height":3.05,"description":"Merdivenin önündeki ahşap direkli kapı örtüsü.","source":"world.ts"},
 PORCH_DOOR: {"id":"DOOR-01","name":"Sundurma altındaki kapı","x":-5.026,"planY":57.7,"height":0,"description":"Yeşil örtü altındaki kahverengi kapı.","source":"world.ts"},
 REAR_COURTYARD: {"id":"COURTYARD-02","name":"Arka avlu","x":2,"planY":96,"height":6.2,"description":"Konağın arkasındaki yükseltilmiş avlu.","source":"world.ts"},
 ARCADE_STAIR: {"id":"STAIR-02","name":"Revak iç merdivenleri","x":0.9,"planY":55.5,"height":7,"description":"Revaktan iki oda kapısına çıkan merdivenler.","source":"world.ts"},
 ALYA_ROOM: {"id":"AlyaRoom","name":"AlyaRoom","x":1.975,"planY":66.5,"height":9.5,"description":"Merdiven bitişinin kuzeyindeki geniş üst sahanlığa açılan oda kapısı.","source":"world.ts"},
 SADAKAT_ROOM: {"id":"sadakatRoom","name":"sadakatRoom","x":1.975,"planY":47.5,"height":9.5,"description":"Merdivenin üst bitişindeki özel sahanlığa açılan oda kapısı.","source":"world.ts"},
 REAR_STAIR: {"id":"STAIR-03","name":"Arka merdiven bağlantısı","x":-6.7,"planY":86.8,"height":4.65,"description":"Arka avluya çıkan kol; batıdaki teras inişiyle bağlantılı.","source":"world.ts"},
 MAIN_ROOF: {"id":"ROOF-01","name":"Ana çatı","x":6,"planY":54,"height":14,"description":"Ana bloğun en yüksek düz çatısı.","source":"world.ts"},
 LOWER_ROOF: {"id":"ROOF-02","name":"Alt çatı","x":6,"planY":72,"height":12.65,"description":"Ana çatının arkasındaki alçak çatı.","source":"world.ts"},
 CURVED_BALCONY: {"id":"BALCONY-01","name":"Kavisli balkon","x":6,"planY":40.5,"height":9.62,"description":"Kısa cephedeki alt balkon; çatı çıkıntısından ayrı.","source":"world.ts"},
 PERIMETER_WALL: {"id":"WALL-01","name":"Dış çevre duvarı","x":-18,"planY":30,"height":0,"description":"Çevre duvarlarının bütünü; nokta sol kenarda referanstır.","source":"world.ts"},
 PLAYER_SPAWN: {"id":"PLAYER-SPAWN-01","name":"Başlangıç noktası","x":-0.65,"planY":-6.5,"height":0,"description":"Açık yaya kapısının karşısındaki dış başlangıç.","source":"entrance.ts"},
} as const;
export const LOCATION_LIST:readonly Location[]=Object.values(LOCATIONS);
export const getLocation=(id:string)=>LOCATION_LIST.find(item=>item.id===id);

