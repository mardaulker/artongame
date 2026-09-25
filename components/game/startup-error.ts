export type StartupStage='graphics'|'character'|'materials'|'scene';

export class StartupError extends Error {
 constructor(readonly stage:StartupStage,cause:unknown){
  super(`Game startup failed: ${stage}`,{cause});this.name='StartupError';
 }
}

export function startupErrorMessage(error:unknown){
 if(error instanceof StartupError){
  switch(error.stage){
   case 'graphics':return 'Bu oturumda 3D görüntü başlatılamadı. Diğer oyun sekmelerini kapatıp yeniden deneyebilirsin. Sorun sürerse bağlantıyı ayrı bir tarayıcıda aç. (E-GRAFİK)';
   case 'character':return 'Karakter dosyaları yüklenemedi. Bağlantını kontrol edip yeniden dene. (E-KARAKTER)';
   case 'materials':return 'Konağın kaplamaları yüklenemedi. Bağlantını kontrol edip yeniden dene. (E-KAPLAMA)';
   case 'scene':return '3D sahne hazırlanırken bir hata oluştu. Yeniden deneyebilirsin. (E-SAHNE)';
  }
 }
 return 'Oyun başlatılırken bir hata oluştu. Sayfayı yenileyerek yeniden deneyebilirsin. (E-AÇILIŞ)';
}
