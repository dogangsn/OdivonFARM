import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface WelcomeEmailData {
  email: string;
  displayName: string;
  farmName: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private get db() {
    return getFirestore();
  }

  /**
   * Yeni üye olan kullanıcıya kurumsal Hoş Geldiniz e-postası hazırlar ve
   * Firestore 'mail' kuyruğuna (Trigger Email extension & Cloud Function) yazar.
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<string> {
    const { email, displayName, farmName } = data;
    const subject = `🌾 Odivon Çiftlik Yönetim Sistemine Hoş Geldiniz!`;
    const htmlContent = this.generateWelcomeEmailHtml(displayName, farmName);
    const plainText = this.generateWelcomeEmailText(displayName, farmName);

    try {
      const mailRef = await addDoc(collection(this.db, 'mail'), {
        to: [email],
        from: 'Odivon Çiftlik Yönetimi <info@odivon.com>',
        replyTo: 'info@odivon.com',
        message: {
          subject,
          text: plainText,
          html: htmlContent,
        },
        meta: {
          type: 'welcome_email',
          displayName,
          farmName,
          recipientEmail: email,
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      console.log(`[EmailService] Hoş Geldiniz e-postası mail kuyruğuna eklendi: ID=${mailRef.id}`);
      return mailRef.id;
    } catch (err) {
      console.error('[EmailService] Mail kuyruğuna yazılırken hata oluştu:', err);
      return '';
    }
  }

  /**
   * Zengin, modern ve mobil uyumlu HTML e-posta şablonu
   */
  private generateWelcomeEmailHtml(displayName: string, farmName: string): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Odivon Çiftlik'e Hoş Geldiniz</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .content { padding: 32px 30px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
    .paragraph { font-size: 14px; line-height: 1.65; color: #475569; margin: 0 0 18px; }
    .highlight-card { background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
    .highlight-card h4 { margin: 0 0 6px; font-size: 14px; color: #1e293b; font-weight: 700; }
    .highlight-card p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
    .feature-list { margin: 20px 0; padding: 0; list-style: none; }
    .feature-item { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 13px; color: #334155; line-height: 1.5; }
    .feature-icon { color: #10b981; font-weight: bold; margin-right: 10px; font-size: 16px; }
    .btn-container { text-align: center; margin: 32px 0 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    .footer a { color: #6366f1; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <div class="badge">Odivon FARM &bull; Akıllı Hayvancılık</div>
          <h1>Aramıza Hoş Geldiniz!</h1>
          <p>Modern Çiftlik Yönetim Sisteminiz Hazır</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Sayın ${displayName},</div>
          <p class="paragraph">
            <strong>${farmName}</strong> için Odivon Çiftlik Yönetim Sistemi üyeliğiniz başarıyla oluşturulmuştur. Çiftliğinizi verimli, karlı ve şeffaf bir şekilde yönetmeniz için tüm araçlar kullanımınıza sunulmuştur.
          </p>

          <div class="highlight-card">
            <h4>🌾 Hazır Çiftlik Altyapısı Yüklendi</h4>
            <p>
              Çiftliğinize özel Türkiye standartlarına uygun <strong>11 Hayvan Tipi, 15 Önemli Küçükbaş & Büyükbaş Irkı, 7 Padok Alanı, 7 Tedavi Yöntemi ve 10 Klinik Hastalık</strong> tanımı sisteminize otomatik olarak tanımlanmıştır.
            </p>
          </div>

          <p class="paragraph" style="font-weight: 600; color: #1e293b; margin-top: 24px;">
            Odivon FARM ile Neler Yapabilirsiniz?
          </p>
          <ul class="feature-list">
            <li class="feature-item">
              <span class="feature-icon">&#10003;</span>
              <div><strong>Hayvan & Sürü Takibi:</strong> Kulak numarası, soy kütüğü, tartım ve canlı ağırlık artış geçmişi.</div>
            </li>
            <li class="feature-item">
              <span class="feature-icon">&#10003;</span>
              <div><strong>Sağlık & Aşı Takvimi:</strong> Bulaşıcı hastalıklara karşı periyodik aşılama ve tedavi protokolleri.</div>
            </li>
            <li class="feature-item">
              <span class="feature-icon">&#10003;</span>
              <div><strong>Padok & Barınma Alanı:</strong> Doğum, karantina ve besi grupları arasında hızlı transfer.</div>
            </li>
            <li class="feature-item">
              <span class="feature-icon">&#10003;</span>
              <div><strong>Stok & Muhasebe:</strong> Yem/ilaç tüketimi, cari hesaplar ve gelir-gider raporları.</div>
            </li>
          </ul>

          <div class="btn-container">
            <a href="https://odivonfarm.web.app/anasayfa" class="btn">Çiftlik Paneline Giriş Yap &rarr;</a>
          </div>

          <p class="paragraph" style="font-size: 12px; color: #64748b; text-align: center; margin-top: 28px;">
            Sorularınız veya teknik destek talepleriniz için bize her zaman <a href="mailto:info@odivon.com" style="color: #4f46e5; text-decoration: none; font-weight: 600;">info@odivon.com</a> adresinden ulaşabilirsiniz.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} Odivon Çiftlik Yönetim Sistemleri. Tüm hakları saklıdır.</p>
          <p style="margin: 0;">Bu e-posta <strong>${farmName}</strong> hesabı oluşturulduğu için <strong>${displayName}</strong> adına otomatik olarak gönderilmiştir.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  private generateWelcomeEmailText(displayName: string, farmName: string): string {
    return `Sayın ${displayName},

${farmName} için Odivon Çiftlik Yönetim Sistemi üyeliğiniz başarıyla oluşturulmuştur.

Çiftliğinize özel Türkiye hayvancılık standartlarına uygun 11 Hayvan Tipi, 15 Önemli Irk, 7 Padok Alanı, 7 Tedavi Türü ve 10 Hastalık tanımı sisteminize otomatik olarak yüklenmiştir.

Hemen giriş yaparak hayvanlarınızı ve çiftlik operasyonlarınızı yönetmeye başlayabilirsiniz:
https://odivonfarm.web.app/anasayfa

Destek ve sorularınız için: info@odivon.com

Saygılarımızla,
Odivon Çiftlik Yönetim Sistemleri Ekibi`;
  }
}
