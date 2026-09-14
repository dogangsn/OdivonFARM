export type AppRole = 'admin' | 'yonetici' | 'veteriner' | 'saha' | 'muhasebe' | 'okuyucu';

/** users/{uid} — kimlik doğrulama sonrası kullanıcı profili */
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  /** Kullanıcının erişebildiği çiftlikler ve o çiftlikteki rolü */
  memberships: FarmMembership[];
  activeFarmId?: string;
  createdAt?: any;
}

export interface FarmMembership {
  farmId: string;
  role: AppRole;
}

/** farms/{farmId} */
export interface Farm {
  id?: string;
  name: string;
  ownerUid: string;
  address?: string;
  phone?: string;
  createdAt?: any;
}

/** farms/{farmId}/roles/{roleId} — özel rol tanımı (Tanımlamalar > Roller) */
export interface RoleDefinition {
  id?: string;
  farmId: string;
  name: string;
  permissions: string[];
}
