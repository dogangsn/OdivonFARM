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

export interface InvitationEmailData {
  email: string;
  displayName: string;
  farmName: string;
  role: string;
  invitedByName?: string;
}

export interface KurbanPaymentEmailData {
  email: string;
  hissedarName: string;
  farmName: string;
  kurbanTagNo: string;
  animalName?: string;
  category: string;
  slaughterOrder: number;
  slaughterDay: number;
  slaughterTime: string;
  sharePrice: number;
  depositPaid: number;
  remainingPayment: number;
  paymentLink: string;
  meatPreference?: string;
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
   * Çiftliğe davet edilen kullanıcıya davet e-postası hazırlar ve
   * Firestore 'mail' kuyruğuna yazar.
   */
  async sendInvitationEmail(data: InvitationEmailData): Promise<string> {
    const { email, displayName, farmName, role, invitedByName } = data;
    const roleLabels: Record<string, string> = {
      admin: 'Yönetici (Admin)',
      veterinarian: 'Veteriner Hekim',
      worker: 'Çiftlik Çalışanı',
      viewer: 'Gözlemci / İzleyici',
    };
    const roleLabel = roleLabels[role] || role;
    const subject = `🌾 ${farmName} Çiftliğine Davet Edildiniz! - Odivon FARM`;
    const htmlContent = this.generateInvitationEmailHtml(displayName, farmName, roleLabel, invitedByName);
    const plainText = this.generateInvitationEmailText(displayName, farmName, roleLabel, invitedByName);

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
          type: 'invitation_email',
          displayName,
          farmName,
          role,
          recipientEmail: email,
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      console.log(`[EmailService] Davet e-postası mail kuyruğuna eklendi: ID=${mailRef.id}`);
      return mailRef.id;
    } catch (err) {
      console.error('[EmailService] Davet e-postası mail kuyruğuna yazılırken hata oluştu:', err);
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

  private generateInvitationEmailHtml(
    displayName: string,
    farmName: string,
    roleLabel: string,
    invitedByName?: string
  ): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Çiftlik Daveti</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .content { padding: 32px 30px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
    .paragraph { font-size: 14px; line-height: 1.65; color: #475569; margin: 0 0 18px; }
    .invite-card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .invite-card h4 { margin: 0 0 8px; font-size: 15px; color: #166534; font-weight: 700; }
    .invite-detail { font-size: 13px; color: #15803d; line-height: 1.6; }
    .btn-container { text-align: center; margin: 32px 0 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <div class="badge">Odivon FARM &bull; Ekip Daveti</div>
          <h1>Çiftlik Yönetim Ekibine Davet Edildiniz</h1>
          <p>${farmName}</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Sayın ${displayName},</div>
          <p class="paragraph">
            ${invitedByName ? `<strong>${invitedByName}</strong> tarafından ` : ''}<strong>${farmName}</strong> çiftliğinin yönetim sistemine dahil edildiniz.
          </p>

          <div class="invite-card">
            <h4>🌾 Davet Bilgileri</h4>
            <div class="invite-detail"><strong>Çiftlik Adı:</strong> ${farmName}</div>
            <div class="invite-detail"><strong>Yetki / Rol:</strong> ${roleLabel}</div>
            ${invitedByName ? `<div class="invite-detail"><strong>Davet Eden:</strong> ${invitedByName}</div>` : ''}
          </div>

          <p class="paragraph">
            Çiftlik operasyonlarını görüntülemek, kayıtları girmek veya yetkiniz dahilinde süreçleri takip etmek için aşağıdaki bağlantıdan sisteme giriş yapabilirsiniz. Eğer henüz bir şifreniz yoksa, sistem üzerinden <em>"Şifremi Unuttum"</em> seçeneğiyle şifrenizi belirleyebilirsiniz.
          </p>

          <div class="btn-container">
            <a href="https://odivonfarm.web.app/login" class="btn">Çiftlik Paneline Giriş Yap &rarr;</a>
          </div>

          <p class="paragraph" style="font-size: 12px; color: #64748b; text-align: center; margin-top: 28px;">
            Sorularınız için <a href="mailto:info@odivon.com" style="color: #059669; text-decoration: none; font-weight: 600;">info@odivon.com</a> adresinden ekibimize ulaşabilirsiniz.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} Odivon Çiftlik Yönetim Sistemleri. Tüm hakları saklıdır.</p>
          <p style="margin: 0;">Bu e-posta <strong>${farmName}</strong> çiftliği üyeliğiniz için gönderilmiştir.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  private generateInvitationEmailText(
    displayName: string,
    farmName: string,
    roleLabel: string,
    invitedByName?: string
  ): string {
    return `Sayın ${displayName},

${invitedByName ? `${invitedByName} tarafından ` : ''}${farmName} çiftliğinin Odivon Çiftlik Yönetim Sistemi ekibine "${roleLabel}" rolüyle davet edildiniz.

Çiftlik operasyonlarını yönetmek için hemen giriş yapabilirsiniz:
https://odivonfarm.web.app/login

(İlk girişiniz ise giriş ekranındaki "Şifremi Unuttum" seçeneğini kullanarak şifrenizi belirleyebilirsiniz.)

Sorularınız ve destek için: info@odivon.com

Saygılarımızla,
Odivon Çiftlik Yönetim Sistemleri Ekibi`;
  }

  /**
   * Kurban hissedarına kesim randevusu ve güvenli online ödeme bağlantısını e-posta ile iletir.
   */
  async sendKurbanPaymentEmail(data: KurbanPaymentEmailData): Promise<string> {
    const { email, hissedarName, farmName, kurbanTagNo, paymentLink } = data;
    const subject = `🕋 ${farmName} — Kurbanlık Hisse & Online Ödeme Bilgilendirmesi (${kurbanTagNo})`;
    const htmlContent = this.generateKurbanPaymentEmailHtml(data);
    const plainText = this.generateKurbanPaymentEmailText(data);

    try {
      const mailRef = await addDoc(collection(this.db, 'mail'), {
        to: [email],
        from: `${farmName} Kurban Hizmetleri <info@odivon.com>`,
        replyTo: 'info@odivon.com',
        message: {
          subject,
          text: plainText,
          html: htmlContent,
        },
        meta: {
          type: 'kurban_payment_email',
          hissedarName,
          farmName,
          kurbanTagNo,
          paymentLink,
          recipientEmail: email,
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      console.log(`[EmailService] Kurban ödeme e-postası mail kuyruğuna eklendi: ID=${mailRef.id}`);
      return mailRef.id;
    } catch (err) {
      console.error('[EmailService] Kurban ödeme e-postası gönderilemedi:', err);
      return '';
    }
  }

  private generateKurbanPaymentEmailHtml(data: KurbanPaymentEmailData): string {
    const {
      hissedarName,
      farmName,
      kurbanTagNo,
      animalName,
      category,
      slaughterOrder,
      slaughterDay,
      slaughterTime,
      sharePrice,
      depositPaid,
      remainingPayment,
      paymentLink,
      meatPreference,
    } = data;

    const categoryText = category === 'buyukbas' ? 'Büyükbaş (7 Paylı)' : 'Küçükbaş (Tek Hisse)';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kurbanlık Hisse & Ödeme Bilgilendirmesi</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 30px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .paragraph { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin: 20px 0; }
    .card-title { font-size: 14px; font-weight: 700; color: #166534; margin: 0 0 10px; border-bottom: 1px dashed #bbf7d0; padding-bottom: 6px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .label { color: #15803d; font-weight: 500; }
    .val { color: #0f172a; font-weight: 700; }
    .pay-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
    .pay-amount { font-size: 28px; font-weight: 900; color: #059669; margin: 6px 0 12px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35); }
    .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <div class="badge">🕋 KURBANLIK HİSSE & ÖDEME KARTI</div>
          <h1>${farmName}</h1>
          <p>Kurbanlık Kesim Randevu & Online Ödeme Bilgilendirmesi</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Sayın ${hissedarName},</div>
          <p class="paragraph">
            <strong>${farmName}</strong> bünyesinde kurbanlık hisseniz başarıyla ayrılmıştır. Kesim randevu bilgileriniz ve hisse bedeli ödeme detaylarınız aşağıda yer almaktadır:
          </p>

          <div class="card">
            <div class="card-title">📋 Kurban & Randevu Detayları</div>
            <div class="row"><span class="label">Kurban Küpe No:</span> <span class="val">${kurbanTagNo} ${animalName ? `(${animalName})` : ''}</span></div>
            <div class="row"><span class="label">Kategori:</span> <span class="val">${categoryText}</span></div>
            <div class="row"><span class="label">Kesim Günü:</span> <span class="val">${slaughterDay}. GÜN</span></div>
            <div class="row"><span class="label">Kesim Sıra No:</span> <span class="val">SIRA NO: ${slaughterOrder}</span></div>
            <div class="row"><span class="label">Randevu Saati:</span> <span class="val">${slaughterTime}</span></div>
            <div class="row"><span class="label">Parçalama Tercihi:</span> <span class="val">${meatPreference || 'Standart 7 Eşit Pay'}</span></div>
          </div>

          <div class="pay-card">
            <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Ödenecek Kalan Bakiye</div>
            <div class="pay-amount">${remainingPayment.toLocaleString('tr-TR')} ₺</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 18px;">
              Toplam Bedel: ${sharePrice.toLocaleString('tr-TR')} ₺ &bull; Alınan Kapora: ${depositPaid.toLocaleString('tr-TR')} ₺
            </div>
            ${remainingPayment > 0 ? `
              <a href="${paymentLink}" class="btn">💳 Kalan Bakiyeyi Online Güvenle Öde &rarr;</a>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 12px;">Banka / Kredi Kartı ve Havale/EFT ile 7/24 güvenli ödeme yapabilirsiniz.</div>
            ` : `
              <div style="display: inline-block; padding: 8px 18px; border-radius: 999px; background: #dcfce7; color: #166534; font-weight: bold; font-size: 13px;">
                ✓ Hisse Bedelinin Tamamı Ödenmiştir
              </div>
            `}
          </div>

          <p class="paragraph" style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
            Kurbanınızın kabul olmasını diler, şimdiden hayırlı ve bereketli bayramlar temenni ederiz.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} ${farmName} &bull; Odivon Akıllı Çiftlik Sistemleri</p>
          <p style="margin: 0;">Bu bilgilendirme mesajı <strong>${hissedarName}</strong> adına oluşturulmuştur.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  private generateKurbanPaymentEmailText(data: KurbanPaymentEmailData): string {
    const {
      hissedarName,
      farmName,
      kurbanTagNo,
      slaughterOrder,
      slaughterDay,
      slaughterTime,
      sharePrice,
      depositPaid,
      remainingPayment,
      paymentLink,
    } = data;

    return `Sayın ${hissedarName},

${farmName} bünyesinde kurbanlık hisseniz başarıyla ayrılmıştır.

Kurban Küpe No: ${kurbanTagNo}
Kesim Günü: ${slaughterDay}. Gün
Kesim Sıra No: ${slaughterOrder}
Randevu Saati: ${slaughterTime}

Toplam Hisse Bedeli: ${sharePrice.toLocaleString('tr-TR')} TL
Alınan Kapora: ${depositPaid.toLocaleString('tr-TR')} TL
Ödenecek Kalan Bakiye: ${remainingPayment.toLocaleString('tr-TR')} TL

Online Kredi Kartı veya Havale/EFT ile ödemenizi tamamlamak için:
${paymentLink}

Kurbanınızın kabul olmasını diler, hayırlı bayramlar dileriz.
${farmName}`;
  }
}
