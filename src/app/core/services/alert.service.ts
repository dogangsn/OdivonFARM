import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  /**
   * Aktif temanın dark olup olmadığını tespit eder
   */
  private isDarkMode(): boolean {
    return (
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')
    );
  }

  /**
   * Odivon SaaS tasarım diline uygun temel SweetAlert2 yapılandırması
   */
  private getBaseOptions(): SweetAlertOptions {
    const isDark = this.isDarkMode();
    return {
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: isDark ? '#334155' : '#e2e8f0',
      buttonsStyling: true,
      customClass: {
        popup: 'odivon-swal-popup',
        confirmButton: 'odivon-swal-confirm',
        cancelButton: 'odivon-swal-cancel',
      },
    };
  }

  /**
   * Modern bilgi/uyarı modalı gösterir (Tarayıcı alert(...) yerine geçer)
   */
  async alert(title: string, text?: string, icon: SweetAlertIcon = 'info'): Promise<void> {
    await Swal.fire({
      ...this.getBaseOptions(),
      title,
      text,
      icon,
      confirmButtonText: 'Tamam',
    });
  }

  /**
   * Başarılı işlem modalı
   */
  async success(title: string, text?: string): Promise<void> {
    await this.alert(title, text, 'success');
  }

  /**
   * Hata modalı
   */
  async error(title: string, text?: string): Promise<void> {
    await this.alert(title, text, 'error');
  }

  /**
   * Uyarı modalı
   */
  async warning(title: string, text?: string): Promise<void> {
    await this.alert(title, text, 'warning');
  }

  /**
   * Bilgilendirme modalı
   */
  async info(title: string, text?: string): Promise<void> {
    await this.alert(title, text, 'info');
  }

  /**
   * Modern onay diyaloğu (Tarayıcı confirm(...) yerine geçer)
   * Onaylanırsa true, vazgeçilirse false döner.
   */
  async confirm(
    title: string,
    text?: string,
    confirmButtonText: string = 'Evet, Devam Et',
    cancelButtonText: string = 'Vazgeç',
    icon: SweetAlertIcon = 'warning'
  ): Promise<boolean> {
    const result = await Swal.fire({
      ...this.getBaseOptions(),
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    });
    return result.isConfirmed;
  }

  /**
   * Silme işlemleri için kırmızı vurgulu modern onay diyaloğu
   */
  async confirmDelete(
    title: string = 'Bu kaydı silmek istediğinize emin misiniz?',
    text: string = 'Bu işlem geri alınamayabilir.',
    confirmButtonText: string = 'Evet, Sil',
    cancelButtonText: string = 'Vazgeç'
  ): Promise<boolean> {
    const isDark = this.isDarkMode();
    const result = await Swal.fire({
      ...this.getBaseOptions(),
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: '#e11d48', // rose-600
      reverseButtons: true,
    });
    return result.isConfirmed;
  }

  /**
   * Ekran köşesinde geçici bildirim (Toast)
   */
  toast(title: string, icon: SweetAlertIcon = 'success', timer = 3000): void {
    const isDark = this.isDarkMode();
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'odivon-swal-toast',
      },
      didOpen: (toast: HTMLElement) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
    Toast.fire({
      icon,
      title,
    });
  }

  toastSuccess(message: string): void {
    this.toast(message, 'success');
  }

  toastError(message: string): void {
    this.toast(message, 'error');
  }

  toastWarning(message: string): void {
    this.toast(message, 'warning');
  }

  toastInfo(message: string): void {
    this.toast(message, 'info');
  }
}
