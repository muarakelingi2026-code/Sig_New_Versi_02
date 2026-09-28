import { 
  Keluarga, 
  Penduduk, 
  User, 
  VerificationNotification, 
  FilterOptions, 
  DesaProfile, 
  DesaProfileAuditLogEntry,
  RolePermissions, 
  AuthLogEntry, 
  AsetDesa, 
  WargaAccount, 
  WargaSession, 
  WargaAuthLogEntry,
  WargaDataChangeRequest,
  WargaFieldChange,
  WargaDataChangeLogEntry,
  LetterType,
  LetterRequest,
  LetterRequestStatus,
  LetterAuditLogEntry,
  LetterAuditAction,
  LetterAutoDataSnapshot,
  WorkflowLevel,
  LetterTemplate,
  LetterTemplateStatus,
  LetterTemplateAuditLogEntry,
  LetterTemplateAuditAction,
  LetterIssuance,
  LetterIssuanceStatus,
  LetterArchive,
  LetterNumberingConfig,
  SuratDinasData,
  SuratDinasSifat
} from '../types';
import { INITIAL_KELUARGA_DATA, INITIAL_NOTIFICATIONS, INITIAL_USERS, INITIAL_DESA_PROFILE, INITIAL_AUTH_LOGS, INITIAL_ASET_DESA } from '../data/mockData';
import { DEFAULT_LETTER_TYPES } from '../data/defaultLetterTypes';
import { DEFAULT_OFFICIAL_LETTER_TYPES } from '../data/defaultOfficialLetterTypes';
import { DEFAULT_LETTER_TEMPLATES } from '../data/defaultLetterTemplates';
import { DEFAULT_LETTER_NUMBERING_CONFIG } from '../data/defaultLetterNumberingConfig';
import CryptoJS from 'crypto-js';

const STORAGE_KEYS = {
  KELUARGA: 'sig_belitijaya_keluarga_v3',
  CURRENT_USER: 'sig_belitijaya_current_user_v1',
  USERS: 'sig_belitijaya_users_v2',
  ROLE_PERMISSIONS: 'sig_belitijaya_role_permissions_v1',
  NOTIFICATIONS: 'sig_belitijaya_notifications_v1',
  AUDIT_LOGS: 'sig_belitijaya_audit_logs_v1',
  AUTH_LOGS: 'sig_belitijaya_auth_logs_v1',
  DESA_PROFILE: 'sig_belitijaya_desa_profile_v2',
  ASET_DESA: 'sig_belitijaya_aset_desa_v1',
  WARGA_ACCOUNTS: 'sig_belitijaya_warga_accounts_v1',
  CURRENT_WARGA: 'sig_belitijaya_current_warga_v1',
  WARGA_AUTH_LOGS: 'sig_belitijaya_warga_auth_logs_v1',
  WARGA_DATA_CHANGE_REQUESTS: 'sig_belitijaya_warga_data_change_requests_v1',
  WARGA_DATA_CHANGE_LOGS: 'sig_belitijaya_warga_data_change_logs_v1',
  LETTER_TYPES: 'sig_belitijaya_letter_types_v1',
  LETTER_REQUESTS: 'sig_belitijaya_letter_requests_v1',
  LETTER_AUDIT_LOGS: 'sig_belitijaya_letter_audit_logs_v1',
  LETTER_TEMPLATES: 'sig_belitijaya_letter_templates_v1',
  LETTER_TEMPLATE_AUDIT_LOGS: 'sig_belitijaya_letter_template_audit_logs_v1',
  LETTER_ISSUANCES: 'sig_belitijaya_letter_issuances_v1',
  LETTER_ARCHIVES: 'sig_belitijaya_letter_archives_v1',
  LETTER_NUMBERING_CONFIG: 'sig_belitijaya_letter_numbering_config_v1',
  DESA_PROFILE_AUDIT_LOGS: 'sig_belitijaya_desa_profile_audit_logs_v1'
};

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  operatorOnlyAddKK: true, // Berdasarkan instruksi: Kalau Operator Hanya dapat mengakses Tombol (Tambah data KK & Titik Baru)
  allowOperatorAnalytics: false,
  allowOperatorExport: false,
  allowOperatorEditKK: false,
  allowOperatorDeleteKK: false,
  allowOperatorVillageProfile: false,
  allowOnlyAdminAndOperatorAsetAdd: true,
  requirePasswordForBukuInventaris: true
};

export const StorageService = {
  getDesaProfile(): DesaProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DESA_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.namaDesa) {
          if (!parsed.logoDesa) {
            parsed.logoDesa = INITIAL_DESA_PROFILE.logoDesa;
          }
          if (!parsed.runningTextKiosk) {
            parsed.runningTextKiosk = INITIAL_DESA_PROFILE.runningTextKiosk;
          }
          if (!parsed.runningTextSpeed) {
            parsed.runningTextSpeed = 'normal';
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    this.saveDesaProfile(INITIAL_DESA_PROFILE);
    return INITIAL_DESA_PROFILE;
  },

  saveDesaProfile(data: DesaProfile, explicitActor?: User | null): void {
    const rawOld = localStorage.getItem(STORAGE_KEYS.DESA_PROFILE);
    let oldProfile: DesaProfile | null = null;
    if (rawOld) {
      try {
        oldProfile = JSON.parse(rawOld);
      } catch {
        oldProfile = null;
      }
    }

    // 1. Simpan data baru ke storage
    localStorage.setItem(STORAGE_KEYS.DESA_PROFILE, JSON.stringify(data));

    // 2. Audit perubahan jika ada data lama (bukan seeding awal)
    if (oldProfile) {
      try {
        this.auditDesaProfileChanges(oldProfile, data, explicitActor);
      } catch (err) {
        console.error('Gagal mencatat audit log profil desa:', err);
      }
    }
  },

  getDesaProfileAuditLogs(): DesaProfileAuditLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DESA_PROFILE_AUDIT_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  logDesaProfileAudit(entry: Omit<DesaProfileAuditLogEntry, 'id' | 'timestamp'>): DesaProfileAuditLogEntry {
    const logs = this.getDesaProfileAuditLogs();
    const newEntry: DesaProfileAuditLogEntry = {
      ...entry,
      id: `log-prof-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    try {
      localStorage.setItem(STORAGE_KEYS.DESA_PROFILE_AUDIT_LOGS, JSON.stringify(logs.slice(0, 300)));
    } catch (err) {
      console.error('Gagal menyimpan audit log profil desa:', err);
    }
    return newEntry;
  },

  auditDesaProfileChanges(
    oldProfile: DesaProfile,
    newProfile: DesaProfile,
    explicitActor?: User | null
  ): DesaProfileAuditLogEntry | null {
    const changedFields: string[] = [];
    const before: Record<string, any> = {};
    const after: Record<string, any> = {};

    // 1. Data Kepala Desa (Fokus Utama Perubahan Pejabat)
    const oldKades = oldProfile.kepalaDesa || ({} as any);
    const newKades = newProfile.kepalaDesa || ({} as any);

    if ((oldKades.nama || '') !== (newKades.nama || '')) {
      changedFields.push('kepalaDesa.nama');
      before['kepalaDesa.nama'] = oldKades.nama || '';
      after['kepalaDesa.nama'] = newKades.nama || '';
    }
    if ((oldKades.nip || '') !== (newKades.nip || '')) {
      changedFields.push('kepalaDesa.nip');
      before['kepalaDesa.nip'] = oldKades.nip || '';
      after['kepalaDesa.nip'] = newKades.nip || '';
    }
    if ((oldKades.nik || '') !== (newKades.nik || '')) {
      changedFields.push('kepalaDesa.nik');
      before['kepalaDesa.nik'] = oldKades.nik || '';
      after['kepalaDesa.nik'] = newKades.nik || '';
    }
    if ((oldKades.noHp || '') !== (newKades.noHp || '')) {
      changedFields.push('kepalaDesa.noHp');
      before['kepalaDesa.noHp'] = oldKades.noHp || '';
      after['kepalaDesa.noHp'] = newKades.noHp || '';
    }
    if ((oldKades.periode || '') !== (newKades.periode || '')) {
      changedFields.push('kepalaDesa.periode');
      before['kepalaDesa.periode'] = oldKades.periode || '';
      after['kepalaDesa.periode'] = newKades.periode || '';
    }
    if ((oldKades.sambutan || '') !== (newKades.sambutan || '')) {
      changedFields.push('kepalaDesa.sambutan');
      before['kepalaDesa.sambutan'] = oldKades.sambutan || '';
      after['kepalaDesa.sambutan'] = newKades.sambutan || '';
    }
    if ((oldKades.foto || '') !== (newKades.foto || '')) {
      changedFields.push('kepalaDesa.foto');
      before['kepalaDesa.foto'] = oldKades.foto ? '[Foto Diperbarui]' : '';
      after['kepalaDesa.foto'] = newKades.foto ? '[Foto Diperbarui]' : '';
    }

    // 2. Data Sekretaris Desa
    const oldSekdes = oldProfile.sekretarisDesa || ({} as any);
    const newSekdes = newProfile.sekretarisDesa || ({} as any);

    if ((oldSekdes.nama || '') !== (newSekdes.nama || '')) {
      changedFields.push('sekretarisDesa.nama');
      before['sekretarisDesa.nama'] = oldSekdes.nama || '';
      after['sekretarisDesa.nama'] = newSekdes.nama || '';
    }
    if ((oldSekdes.nip || '') !== (newSekdes.nip || '')) {
      changedFields.push('sekretarisDesa.nip');
      before['sekretarisDesa.nip'] = oldSekdes.nip || '';
      after['sekretarisDesa.nip'] = newSekdes.nip || '';
    }
    if ((oldSekdes.nik || '') !== (newSekdes.nik || '')) {
      changedFields.push('sekretarisDesa.nik');
      before['sekretarisDesa.nik'] = oldSekdes.nik || '';
      after['sekretarisDesa.nik'] = newSekdes.nik || '';
    }
    if ((oldSekdes.noHp || '') !== (newSekdes.noHp || '')) {
      changedFields.push('sekretarisDesa.noHp');
      before['sekretarisDesa.noHp'] = oldSekdes.noHp || '';
      after['sekretarisDesa.noHp'] = newSekdes.noHp || '';
    }
    if ((oldSekdes.periode || '') !== (newSekdes.periode || '')) {
      changedFields.push('sekretarisDesa.periode');
      before['sekretarisDesa.periode'] = oldSekdes.periode || '';
      after['sekretarisDesa.periode'] = newSekdes.periode || '';
    }

    // 3. Identitas & Kontak Pemerintahan Desa
    const simpleStringProps: (keyof DesaProfile)[] = [
      'namaDesa', 'kodeDesa', 'kecamatan', 'kabupaten', 'provinsi',
      'kodePos', 'alamatKantor', 'emailDesa', 'teleponDesa', 'visi'
    ];
    for (const prop of simpleStringProps) {
      if ((oldProfile[prop] || '') !== (newProfile[prop] || '')) {
        changedFields.push(prop);
        before[prop] = oldProfile[prop] || '';
        after[prop] = newProfile[prop] || '';
      }
    }

    // 4. Logo Desa
    if ((oldProfile.logoDesa || '') !== (newProfile.logoDesa || '')) {
      changedFields.push('logoDesa');
      before['logoDesa'] = oldProfile.logoDesa ? '[Logo Diperbarui]' : '';
      after['logoDesa'] = newProfile.logoDesa ? '[Logo Diperbarui]' : '';
    }

    // 5. Luas Wilayah
    if (oldProfile.luasWilayahHa !== newProfile.luasWilayahHa) {
      changedFields.push('luasWilayahHa');
      before['luasWilayahHa'] = oldProfile.luasWilayahHa;
      after['luasWilayahHa'] = newProfile.luasWilayahHa;
    }
    if (oldProfile.luasWilayahKm2 !== newProfile.luasWilayahKm2) {
      changedFields.push('luasWilayahKm2');
      before['luasWilayahKm2'] = oldProfile.luasWilayahKm2;
      after['luasWilayahKm2'] = newProfile.luasWilayahKm2;
    }

    // 6. Running Text Kiosk
    if ((oldProfile.runningTextKiosk || '') !== (newProfile.runningTextKiosk || '')) {
      changedFields.push('runningTextKiosk');
      before['runningTextKiosk'] = oldProfile.runningTextKiosk || '';
      after['runningTextKiosk'] = newProfile.runningTextKiosk || '';
    }
    if ((oldProfile.runningTextSpeed || '') !== (newProfile.runningTextSpeed || '')) {
      changedFields.push('runningTextSpeed');
      before['runningTextSpeed'] = oldProfile.runningTextSpeed || '';
      after['runningTextSpeed'] = newProfile.runningTextSpeed || '';
    }

    // 7. Perangkat Lainnya
    if (JSON.stringify(oldProfile.perangkatLainnya || []) !== JSON.stringify(newProfile.perangkatLainnya || [])) {
      changedFields.push('perangkatLainnya');
      before['perangkatLainnya'] = `${(oldProfile.perangkatLainnya || []).length} Perangkat`;
      after['perangkatLainnya'] = `${(newProfile.perangkatLainnya || []).length} Perangkat`;
    }

    // Jika tidak ada perubahan sama sekali: JANGAN membuat audit event
    if (changedFields.length === 0) {
      return null;
    }

    // Juga dukung nested object kepalaDesa / sekretarisDesa pada before/after untuk fleksibilitas konsumsi
    if (changedFields.some(f => f.startsWith('kepalaDesa.'))) {
      before.kepalaDesa = {};
      after.kepalaDesa = {};
      if (before['kepalaDesa.nama'] !== undefined) {
        before.kepalaDesa.nama = before['kepalaDesa.nama'];
        after.kepalaDesa.nama = after['kepalaDesa.nama'];
      }
      if (before['kepalaDesa.nip'] !== undefined) {
        before.kepalaDesa.nip = before['kepalaDesa.nip'];
        after.kepalaDesa.nip = after['kepalaDesa.nip'];
      }
      if (before['kepalaDesa.nik'] !== undefined) {
        before.kepalaDesa.nik = before['kepalaDesa.nik'];
        after.kepalaDesa.nik = after['kepalaDesa.nik'];
      }
    }

    if (changedFields.some(f => f.startsWith('sekretarisDesa.'))) {
      before.sekretarisDesa = {};
      after.sekretarisDesa = {};
      if (before['sekretarisDesa.nama'] !== undefined) {
        before.sekretarisDesa.nama = before['sekretarisDesa.nama'];
        after.sekretarisDesa.nama = after['sekretarisDesa.nama'];
      }
      if (before['sekretarisDesa.nip'] !== undefined) {
        before.sekretarisDesa.nip = before['sekretarisDesa.nip'];
        after.sekretarisDesa.nip = after['sekretarisDesa.nip'];
      }
    }

    // Ambil identitas aparatur dari session
    const actor = explicitActor || this.getCurrentUser();
    const actorId = actor?.id || 'system';
    const actorName = actor?.name || 'Aparatur Sistem';
    const actorRole = actor?.role || 'admin';

    return this.logDesaProfileAudit({
      actorId,
      actorName,
      actorRole,
      action: 'DESA_PROFILE_UPDATED',
      changedFields,
      before,
      after,
      notes: `Pembaruan data profil desa (${changedFields.join(', ')})`
    });
  },

  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure operator_aset exists in user list
          const hasOpAset = parsed.some((u: User) => u.role === 'operator_aset');
          if (!hasOpAset) {
            const opAsetDef = INITIAL_USERS.find(u => u.role === 'operator_aset');
            if (opAsetDef) {
              parsed.push(opAsetDef);
              this.saveUsers(parsed);
            }
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getRolePermissions(): RolePermissions {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.operatorOnlyAddKK === 'boolean') {
          return {
            ...DEFAULT_ROLE_PERMISSIONS,
            ...parsed
          };
        }
      }
    } catch {
      // ignore
    }
    this.saveRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    return DEFAULT_ROLE_PERMISSIONS;
  },

  saveRolePermissions(permissions: RolePermissions): void {
    localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(permissions));
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getKeluargaList(): Keluarga[] {
    try {
      // Check v2 key first
      const stored = localStorage.getItem(STORAGE_KEYS.KELUARGA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if any legacy coordinates exist and adjust if necessary
          const needsMigration = parsed.some(k => k.koordinat && k.koordinat.lat < -3.0);
          if (needsMigration) {
            const migrated = parsed.map(k => {
              if (k.koordinat && k.koordinat.lat < -3.0) {
                return {
                  ...k,
                  koordinat: {
                    lat: -2.9661 + (Math.random() - 0.5) * 0.005,
                    lng: 103.1581 + (Math.random() - 0.5) * 0.005
                  }
                };
              }
              return k;
            });
            this.saveKeluargaList(migrated);
            return migrated;
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default fallback to updated INITIAL_KELUARGA_DATA
    this.saveKeluargaList(INITIAL_KELUARGA_DATA);
    return INITIAL_KELUARGA_DATA;
  },

  saveKeluargaList(data: Keluarga[]): void {
    localStorage.setItem(STORAGE_KEYS.KELUARGA, JSON.stringify(data));
  },

  getAllPenduduk(): Penduduk[] {
    const keluargaList = this.getKeluargaList();
    const result: Penduduk[] = [];
    keluargaList.forEach(k => {
      k.anggotaKeluarga.forEach(p => {
        result.push(p);
      });
    });
    return result;
  },

  getNotifications(): VerificationNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    return INITIAL_NOTIFICATIONS;
  },

  saveNotifications(notifs: VerificationNotification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  addNotification(notif: Omit<VerificationNotification, 'id' | 'timestamp' | 'status'>): VerificationNotification {
    const current = this.getNotifications();
    const newNotif: VerificationNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    const updated = [newNotif, ...current];
    this.saveNotifications(updated);
    return newNotif;
  },

  resolveNotification(id: string, status: 'approved' | 'rejected', adminName: string, adminNotes?: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => {
      if (n.id === id) {
        return {
          ...n,
          status,
          approvedBy: adminName,
          approvedAt: new Date().toISOString(),
          adminNotes: adminNotes || ''
        };
      }
      return n;
    });
    this.saveNotifications(updated);
  },

  // Save / Add new Keluarga
  addKeluarga(keluarga: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'>, user: User): { keluarga: Keluarga; notification?: VerificationNotification } {
    const current = this.getKeluargaList();
    const isOperator = user.role === 'operator';

    const newKeluarga: Keluarga = {
      ...keluarga,
      id: `kel_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: user.name,
      statusVerifikasi: isOperator ? 'pending_approval' : 'verified'
    };

    const updated = [newKeluarga, ...current];
    this.saveKeluargaList(updated);

    let notif: VerificationNotification | undefined;
    if (isOperator) {
      notif = this.addNotification({
        type: 'create',
        targetType: 'keluarga',
        targetId: newKeluarga.id,
        targetNoKk: newKeluarga.noKk,
        targetName: `${newKeluarga.namaKepalaKeluarga} (${newKeluarga.dusun} RT ${newKeluarga.rt})`,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        summary: `Operator menambahkan data KK Baru No. ${newKeluarga.noKk} atas nama ${newKeluarga.namaKepalaKeluarga}.`,
        proposedData: newKeluarga
      });
    }

    return { keluarga: newKeluarga, notification: notif };
  },

  // Update Keluarga
  updateKeluarga(id: string, updatedData: Partial<Keluarga>, user: User): { updated: Keluarga; notification?: VerificationNotification } {
    const list = this.getKeluargaList();
    const existingIndex = list.findIndex(k => k.id === id);
    if (existingIndex === -1) {
      throw new Error('Data keluarga tidak ditemukan');
    }

    const previous = list[existingIndex];
    const isOperator = user.role === 'operator';

    const merged: Keluarga = {
      ...previous,
      ...updatedData,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: user.name,
      statusVerifikasi: isOperator ? 'pending_approval' : previous.statusVerifikasi
    };

    list[existingIndex] = merged;
    this.saveKeluargaList(list);

    let notif: VerificationNotification | undefined;
    if (isOperator) {
      notif = this.addNotification({
        type: 'update',
        targetType: 'keluarga',
        targetId: merged.id,
        targetNoKk: merged.noKk,
        targetName: `${merged.namaKepalaKeluarga} (${merged.dusun} RT ${merged.rt})`,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        summary: `Operator memperbarui data keluarga / bansos ${merged.namaKepalaKeluarga}.`,
        previousData: previous,
        proposedData: merged
      });
    }

    return { updated: merged, notification: notif };
  },

  // Delete Keluarga
  deleteKeluarga(id: string, user: User): { success: boolean; notification?: VerificationNotification } {
    const list = this.getKeluargaList();
    const target = list.find(k => k.id === id);
    if (!target) return { success: false };

    if (user.role === 'operator') {
      // Operator deletion requires admin notification & mark as pending
      const notif = this.addNotification({
        type: 'delete',
        targetType: 'keluarga',
        targetId: target.id,
        targetNoKk: target.noKk,
        targetName: `${target.namaKepalaKeluarga} (${target.dusun} RT ${target.rt})`,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        summary: `Operator mengajukan penghapusan data KK ${target.noKk} - ${target.namaKepalaKeluarga}.`,
        previousData: target
      });
      return { success: true, notification: notif };
    }

    const filtered = list.filter(k => k.id !== id);
    this.saveKeluargaList(filtered);
    return { success: true };
  },

  // Filter Helper Function
  filterKeluarga(list: Keluarga[], filters: FilterOptions): { keluarga: Keluarga[]; matchedPenduduk: Penduduk[] } {
    const matchedPenduduk: Penduduk[] = [];

    const filteredKeluarga = list.filter(k => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchKk = k.noKk.toLowerCase().includes(query);
        const matchKepala = k.namaKepalaKeluarga.toLowerCase().includes(query);
        const matchAlamat = k.alamat.toLowerCase().includes(query);
        const matchAnggota = k.anggotaKeluarga.some(a =>
          a.nama.toLowerCase().includes(query) || a.nik.toLowerCase().includes(query) || a.pekerjaan.toLowerCase().includes(query)
        );
        if (!matchKk && !matchKepala && !matchAlamat && !matchAnggota) {
          return false;
        }
      }

      // 2. Dusun
      if (filters.dusun && filters.dusun !== 'semua' && k.dusun !== filters.dusun) {
        return false;
      }

      // 3. Status Bansos
      if (filters.statusBansos === 'penerima' && !k.penerimaBansos) return false;
      if (filters.statusBansos === 'bukan_penerima' && k.penerimaBansos) return false;

      // 4. Jenis Bansos
      if (filters.jenisBansos && filters.jenisBansos !== 'semua') {
        if (!k.daftarBansos.includes(filters.jenisBansos as any)) {
          return false;
        }
      }

      // 5. Status Kesejahteraan
      if (filters.statusKesejahteraan && filters.statusKesejahteraan !== 'semua') {
        if (k.statusKesejahteraan !== filters.statusKesejahteraan) {
          return false;
        }
      }

      // 6. Anggota level filters (Jenis Kelamin, Kematian, Perkawinan, Pendidikan, Penghasilan)
      const validMembers = k.anggotaKeluarga.filter(m => {
        if (filters.jenisKelamin && filters.jenisKelamin !== 'semua' && m.jenisKelamin !== filters.jenisKelamin) {
          return false;
        }
        if (filters.statusKematian && filters.statusKematian !== 'semua' && m.statusKematian !== filters.statusKematian) {
          return false;
        }
        if (filters.statusPerkawinan && filters.statusPerkawinan !== 'semua' && m.statusPerkawinan !== filters.statusPerkawinan) {
          return false;
        }
        if (filters.pendidikan && filters.pendidikan !== 'semua' && m.pendidikan !== filters.pendidikan) {
          return false;
        }
        if (filters.minPenghasilan > 0 && m.penghasilanBulanan < filters.minPenghasilan) {
          return false;
        }
        if (filters.maxPenghasilan > 0 && m.penghasilanBulanan > filters.maxPenghasilan) {
          return false;
        }
        return true;
      });

      // If specific individual filters are applied, family must have matching members
      const hasMemberSpecificFilter =
        (filters.jenisKelamin && filters.jenisKelamin !== 'semua') ||
        (filters.statusKematian && filters.statusKematian !== 'semua') ||
        (filters.statusPerkawinan && filters.statusPerkawinan !== 'semua') ||
        (filters.pendidikan && filters.pendidikan !== 'semua') ||
        filters.minPenghasilan > 0 ||
        filters.maxPenghasilan > 0;

      if (hasMemberSpecificFilter && validMembers.length === 0) {
        return false;
      }

      validMembers.forEach(m => matchedPenduduk.push(m));
      return true;
    });

    return { keluarga: filteredKeluarga, matchedPenduduk };
  },

  // Auth Logs Management (Catat Login & Logout Pengguna)
  getAuthLogs(): AuthLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_LOGS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed; // Kembalikan data yang tersimpan apa adanya, walau kosong [] (data yang sudah dihapus tidak boleh dikembalikan)
        }
      }
    } catch {
      // ignore
    }
    this.saveAuthLogs(INITIAL_AUTH_LOGS);
    return INITIAL_AUTH_LOGS;
  },

  saveAuthLogs(logs: AuthLogEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGS, JSON.stringify(logs));
  },

  addAuthLog(entry: Omit<AuthLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): AuthLogEntry {
    const currentLogs = this.getAuthLogs();
    const entryTime = entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now();

    // Pencegahan Rekam Ganda (Deduplication Guard):
    // Jika aksi yang sama untuk user yang sama dipanggil dalam rentang < 5 detik, jangan duplikasi
    if (currentLogs.length > 0) {
      const latest = currentLogs[0];
      const latestTime = new Date(latest.timestamp).getTime();
      const diffSeconds = Math.abs(entryTime - latestTime) / 1000;

      if (
        latest.userId === entry.userId &&
        latest.action === entry.action &&
        diffSeconds < 5
      ) {
        // Mengembalikan log terbaru tanpa menambahkan record ganda
        return latest;
      }
    }

    const newLog: AuthLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };

    // Simpan hingga 250 rekaman terbaru
    const updated = [newLog, ...currentLogs].slice(0, 250);
    this.saveAuthLogs(updated);
    return newLog;
  },

  deleteAuthLog(id: string): AuthLogEntry[] {
    const currentLogs = this.getAuthLogs();
    const filtered = currentLogs.filter(log => log.id !== id);
    this.saveAuthLogs(filtered);
    return filtered;
  },

  clearAuthLogs(): void {
    this.saveAuthLogs([]);
  },

  // ── MANAJEMEN ASET DESA ──
  getAsetDesa(): AsetDesa[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASET_DESA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all items have consistent foto and fotoList without overwriting user-updated photos
          const migrated = parsed.map((item: AsetDesa) => {
            const list = Array.isArray(item.fotoList) && item.fotoList.length > 0
              ? [...item.fotoList.filter(p => typeof p === 'string' && p.trim().length > 0)]
              : [];

            if (item.foto && typeof item.foto === 'string' && item.foto.trim().length > 0) {
              const primary = item.foto.trim();
              if (!list.includes(primary)) {
                list.unshift(primary);
              }
            }

            // Only fallback to initial mock data if both foto and fotoList are completely empty
            if (list.length === 0) {
              const initialMatch = INITIAL_ASET_DESA.find(a => a.id === item.id);
              if (initialMatch?.fotoList && initialMatch.fotoList.length > 0) {
                return {
                  ...item,
                  foto: initialMatch.foto || initialMatch.fotoList[0],
                  fotoList: [...initialMatch.fotoList]
                };
              }
              const defaultFallback = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';
              list.push(defaultFallback);
            }

            return {
              ...item,
              foto: item.foto || list[0],
              fotoList: list
            };
          });
          return migrated;
        }
      }
    } catch {
      // fallback
    }
    this.saveAsetDesa(INITIAL_ASET_DESA);
    return INITIAL_ASET_DESA;
  },

  saveAsetDesa(list: AsetDesa[]): void {
    localStorage.setItem(STORAGE_KEYS.ASET_DESA, JSON.stringify(list));
  },

  addAsetDesa(asetData: Omit<AsetDesa, 'id' | 'createdAt' | 'updatedAt'>): AsetDesa {
    const current = this.getAsetDesa();
    const newAset: AsetDesa = {
      ...asetData,
      id: `aset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newAset, ...current];
    this.saveAsetDesa(updated);
    return newAset;
  },

  updateAsetDesa(id: string, updates: Partial<AsetDesa>): AsetDesa | null {
    const current = this.getAsetDesa();
    const index = current.findIndex(a => a.id === id);
    if (index === -1) return null;

    const updatedItem: AsetDesa = {
      ...current[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    current[index] = updatedItem;
    this.saveAsetDesa(current);
    return updatedItem;
  },

  deleteAsetDesa(id: string): boolean {
    const current = this.getAsetDesa();
    const filtered = current.filter(a => a.id !== id);
    if (filtered.length !== current.length) {
      this.saveAsetDesa(filtered);
      return true;
    }
    return false;
  },

  // ── PENCARIAN PENDUDUK & KELUARGA (SOURCE OF TRUTH) ──
  getPendudukById(id: string): { penduduk: Penduduk; keluarga: Keluarga } | null {
    const list = this.getKeluargaList();
    for (const keluarga of list) {
      const p = keluarga.anggotaKeluarga?.find(m => m.id === id);
      if (p) {
        return { penduduk: p, keluarga };
      }
    }
    return null;
  },

  findPendudukByNik(nik: string): { penduduk: Penduduk; keluarga: Keluarga } | null {
    const cleanNik = (nik || '').trim();
    if (!cleanNik) return null;
    const list = this.getKeluargaList();
    for (const keluarga of list) {
      const p = keluarga.anggotaKeluarga?.find(m => (m.nik || '').trim() === cleanNik);
      if (p) {
        return { penduduk: p, keluarga };
      }
    }
    return null;
  },

  // ── MANAJEMEN AKUN WARGA (TAHAP 2) ──
  getWargaAccounts(): WargaAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WARGA_ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveWargaAccounts(accounts: WargaAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.WARGA_ACCOUNTS, JSON.stringify(accounts));
  },

  getCurrentWarga(): WargaSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_WARGA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentWarga(session: WargaSession | null): void {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_WARGA, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_WARGA);
    }
  },

  // Aktivasi Akun Warga
  activateWargaAccount(data: {
    nik: string;
    noKk: string;
    tanggalLahir: string;
    pin: string;
  }): { success: boolean; message: string; account?: WargaAccount } {
    const nikClean = (data.nik || '').trim();
    const noKkClean = (data.noKk || '').trim();
    const tglClean = (data.tanggalLahir || '').trim();
    const pinClean = (data.pin || '').trim();

    if (!nikClean) {
      return { success: false, message: 'Nomor Induk Kependudukan (NIK) wajib diisi.' };
    }

    // 1. Cari data Penduduk existing (Source of Truth)
    const residentMatch = this.findPendudukByNik(nikClean);
    if (!residentMatch) {
      return { success: false, message: 'Data NIK tidak ditemukan dalam data penduduk desa.' };
    }

    const { penduduk, keluarga } = residentMatch;

    // 2. Cocokkan No KK
    if ((keluarga.noKk || '').trim() !== noKkClean) {
      return { success: false, message: 'Nomor KK tidak sesuai dengan data penduduk.' };
    }

    // 3. Cocokkan Tanggal Lahir (Format YYYY-MM-DD)
    if ((penduduk.tanggalLahir || '').trim() !== tglClean) {
      return { success: false, message: 'Tanggal lahir tidak sesuai dengan data penduduk.' };
    }

    // 4. Periksa apakah akun warga sudah pernah aktif
    const accounts = this.getWargaAccounts();
    const existingAcc = accounts.find(a => a.nik === nikClean);
    if (existingAcc && existingAcc.status === 'active') {
      return { success: false, message: 'Akun warga untuk NIK ini sudah aktif. Silakan masuk menggunakan PIN Anda.' };
    }

    // 5. Validasi PIN 6 digit
    if (!/^\d{6}$/.test(pinClean)) {
      return { success: false, message: 'PIN harus berupa 6 digit angka.' };
    }

    // 6. Generate salt unik dan hash PIN (SHA-256)
    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const pinHash = CryptoJS.SHA256(pinClean + salt).toString();

    const newAccount: WargaAccount = {
      id: `wacc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      pendudukId: penduduk.id,
      nik: penduduk.nik,
      pinHash,
      pinSalt: salt,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failedLoginAttempts: 0
    };

    // Jika sebelumnya ada record inactive, perbarui; jika tidak, tambahkan
    const updatedAccounts = existingAcc
      ? accounts.map(a => a.id === existingAcc.id ? newAccount : a)
      : [newAccount, ...accounts];

    this.saveWargaAccounts(updatedAccounts);

    // Audit log aktivasi
    this.addWargaAuthLog({
      wargaAccountId: newAccount.id,
      pendudukId: penduduk.id,
      nik: penduduk.nik,
      nama: penduduk.nama,
      action: 'WARGA_ACTIVATED',
      notes: `Aktivasi mandiri akun warga atas nama ${penduduk.nama} (NIK ${penduduk.nik.slice(0, 6)}******${penduduk.nik.slice(-4)})`
    });

    return {
      success: true,
      message: 'Akun warga berhasil diaktifkan! Silakan masuk menggunakan NIK dan PIN Anda.',
      account: newAccount
    };
  },

  // Login Warga
  loginWarga(nik: string, pin: string): {
    success: boolean;
    message: string;
    session?: WargaSession;
    penduduk?: Penduduk;
    keluarga?: Keluarga;
  } {
    const nikClean = (nik || '').trim();
    const pinClean = (pin || '').trim();
    const genericErrorMessage = 'NIK atau PIN tidak sesuai.';

    if (!nikClean || !pinClean) {
      return { success: false, message: 'NIK dan PIN wajib diisi.' };
    }

    const accounts = this.getWargaAccounts();
    const accountIndex = accounts.findIndex(a => a.nik === nikClean);

    if (accountIndex === -1) {
      this.addWargaAuthLog({
        nik: nikClean,
        action: 'WARGA_LOGIN_FAILED',
        notes: `Percobaan login gagal: Akun dengan NIK ini belum diaktifkan.`
      });
      return { success: false, message: genericErrorMessage };
    }

    const account = accounts[accountIndex];

    // Cek apakah akun sedang terkunci / dibatasi sementara
    if (account.lockedUntil) {
      const lockTime = new Date(account.lockedUntil).getTime();
      const now = Date.now();
      if (lockTime > now) {
        const remainingMinutes = Math.max(1, Math.ceil((lockTime - now) / 60000));
        return {
          success: false,
          message: `Akun sementara dibatasi karena beberapa percobaan gagal. Silakan coba kembali dalam ${remainingMinutes} menit.`
        };
      } else {
        // Masa lock sudah lewat, reset lock
        account.lockedUntil = undefined;
        account.failedLoginAttempts = 0;
      }
    }

    // Verifikasi hash PIN dengan salt akun
    const testHash = CryptoJS.SHA256(pinClean + account.pinSalt).toString();
    if (testHash !== account.pinHash) {
      const currentFailures = (account.failedLoginAttempts || 0) + 1;
      account.failedLoginAttempts = currentFailures;

      if (currentFailures >= 5) {
        // Kunci akun selama 15 menit
        account.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        accounts[accountIndex] = account;
        this.saveWargaAccounts(accounts);

        this.addWargaAuthLog({
          wargaAccountId: account.id,
          pendudukId: account.pendudukId,
          nik: account.nik,
          action: 'WARGA_LOGIN_FAILED',
          notes: `Akun dibatasi 15 menit setelah 5 kali gagal memasukkan PIN.`
        });

        return {
          success: false,
          message: 'Terlalu banyak percobaan PIN salah. Akun sementara dibatasi selama 15 menit demi keamanan.'
        };
      }

      accounts[accountIndex] = account;
      this.saveWargaAccounts(accounts);

      this.addWargaAuthLog({
        wargaAccountId: account.id,
        pendudukId: account.pendudukId,
        nik: account.nik,
        action: 'WARGA_LOGIN_FAILED',
        notes: `Percobaan PIN salah (percobaan ke-${currentFailures}/5).`
      });

      return { success: false, message: genericErrorMessage };
    }

    // PIN BENAR!
    // Ambil data kependudukan existing dari Source of Truth berdasarkan account.pendudukId
    const residentMatch = this.getPendudukById(account.pendudukId);
    if (!residentMatch) {
      return { success: false, message: 'Data kependudukan warga tidak ditemukan dalam database desa.' };
    }

    // Reset attempt counter dan update timestamp login
    account.failedLoginAttempts = 0;
    account.lockedUntil = undefined;
    account.lastLoginAt = new Date().toISOString();
    accounts[accountIndex] = account;
    this.saveWargaAccounts(accounts);

    // Buat session warga terisolasi
    const session: WargaSession = {
      wargaAccountId: account.id,
      pendudukId: residentMatch.penduduk.id,
      nik: residentMatch.penduduk.nik,
      nama: residentMatch.penduduk.nama,
      loginAt: new Date().toISOString()
    };
    this.setCurrentWarga(session);

    // Audit log login sukses
    this.addWargaAuthLog({
      wargaAccountId: account.id,
      pendudukId: residentMatch.penduduk.id,
      nik: residentMatch.penduduk.nik,
      nama: residentMatch.penduduk.nama,
      action: 'WARGA_LOGIN_SUCCESS',
      notes: `Warga @${residentMatch.penduduk.nama} berhasil masuk ke Anjungan Mandiri.`
    });

    return {
      success: true,
      message: 'Login berhasil.',
      session,
      penduduk: residentMatch.penduduk,
      keluarga: residentMatch.keluarga
    };
  },

  // Logout Warga (TIDAK mengganggu currentUser aparatur)
  logoutWarga(): void {
    const current = this.getCurrentWarga();
    if (current) {
      this.addWargaAuthLog({
        wargaAccountId: current.wargaAccountId,
        pendudukId: current.pendudukId,
        nik: current.nik,
        nama: current.nama,
        action: 'WARGA_LOGOUT',
        notes: `Warga @${current.nama} mengakhiri sesi Anjungan Mandiri.`
      });
    }
    this.setCurrentWarga(null);
  },

  // Audit Logs Warga
  getWargaAuthLogs(): WargaAuthLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WARGA_AUTH_LOGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveWargaAuthLogs(logs: WargaAuthLogEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.WARGA_AUTH_LOGS, JSON.stringify(logs));
  },

  addWargaAuthLog(entry: Omit<WargaAuthLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): WargaAuthLogEntry {
    const current = this.getWargaAuthLogs();
    const newLog: WargaAuthLogEntry = {
      id: `wlog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };
    const updated = [newLog, ...current].slice(0, 200);
    this.saveWargaAuthLogs(updated);
    return newLog;
  },

  // ── PELAPORAN PERUBAHAN DATA KEPENDUDUKAN (TAHAP 3) ──
  getWargaDataChangeRequests(): WargaDataChangeRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WARGA_DATA_CHANGE_REQUESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveWargaDataChangeRequests(requests: WargaDataChangeRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.WARGA_DATA_CHANGE_REQUESTS, JSON.stringify(requests));
  },

  getWargaDataChangeLogs(): WargaDataChangeLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WARGA_DATA_CHANGE_LOGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveWargaDataChangeLogs(logs: WargaDataChangeLogEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.WARGA_DATA_CHANGE_LOGS, JSON.stringify(logs));
  },

  addWargaDataChangeLog(entry: Omit<WargaDataChangeLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): WargaDataChangeLogEntry {
    const current = this.getWargaDataChangeLogs();
    const newLog: WargaDataChangeLogEntry = {
      id: `wclog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };
    const updated = [newLog, ...current].slice(0, 300);
    this.saveWargaDataChangeLogs(updated);
    return newLog;
  },

  createDataChangeRequest(params: {
    wargaAccountId: string;
    pendudukId: string;
    changes: WargaFieldChange[];
    alasan: string;
    catatanWarga?: string;
    lampiranBukti?: string;
  }): { success: boolean; message: string; request?: WargaDataChangeRequest } {
    const residentMatch = this.getPendudukById(params.pendudukId);
    if (!residentMatch) {
      return { success: false, message: 'Data kependudukan warga tidak ditemukan.' };
    }

    if (!params.changes || params.changes.length === 0) {
      return { success: false, message: 'Harap tentukan setidaknya satu data yang ingin diubah.' };
    }

    const alasanClean = (params.alasan || '').trim();
    if (!alasanClean) {
      return { success: false, message: 'Alasan atau keterangan perubahan data wajib diisi.' };
    }

    // Cek duplikasi request aktif ('menunggu') untuk penduduk yang sama dengan field yang beririsan
    const existingRequests = this.getWargaDataChangeRequests();
    const pendingSamePenduduk = existingRequests.filter(
      r => r.pendudukId === params.pendudukId && r.status === 'menunggu'
    );

    const proposedFields = params.changes.map(c => c.field);
    const hasOverlap = pendingSamePenduduk.some(r =>
      r.changes.some(c => proposedFields.includes(c.field))
    );

    if (hasOverlap) {
      return {
        success: false,
        message: 'Masih ada pengajuan perubahan data untuk warga ini dengan bidang data yang sama yang sedang menunggu verifikasi petugas desa.'
      };
    }

    const now = new Date().toISOString();
    const newReq: WargaDataChangeRequest = {
      id: `req_chg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      wargaAccountId: params.wargaAccountId,
      pendudukId: residentMatch.penduduk.id,
      nik: residentMatch.penduduk.nik,
      namaPenduduk: residentMatch.penduduk.nama,
      noKk: residentMatch.keluarga.noKk,
      submittedAt: now,
      updatedAt: now,
      status: 'menunggu',
      changes: params.changes,
      alasan: alasanClean,
      catatanWarga: params.catatanWarga?.trim() || undefined,
      lampiranBukti: params.lampiranBukti?.trim() || undefined
    };

    const updated = [newReq, ...existingRequests];
    this.saveWargaDataChangeRequests(updated);

    this.addWargaDataChangeLog({
      actorType: 'warga',
      actorId: params.wargaAccountId,
      actorName: residentMatch.penduduk.nama,
      targetPendudukId: residentMatch.penduduk.id,
      requestId: newReq.id,
      action: 'DATA_CHANGE_REQUEST_CREATED',
      notes: `Warga mengajukan perubahan ${newReq.changes.length} data (${newReq.changes.map(c => c.label).join(', ')}).`
    });

    return {
      success: true,
      message: 'Pengajuan perubahan data kependudukan berhasil dikirim dan menunggu verifikasi aparatur desa.',
      request: newReq
    };
  },

  reviewDataChangeRequest(
    requestId: string,
    operator: User,
    catatanOperator?: string
  ): { success: boolean; message: string; request?: WargaDataChangeRequest } {
    const requests = this.getWargaDataChangeRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, message: 'Data pengajuan tidak ditemukan.' };
    }

    const req = requests[index];
    if (req.status !== 'menunggu') {
      return { success: false, message: `Pengajuan ini sudah berstatus ${req.status}.` };
    }

    const now = new Date().toISOString();
    const updatedReq: WargaDataChangeRequest = {
      ...req,
      status: 'diverifikasi',
      reviewedBy: `${operator.name} (${operator.role})`,
      reviewedAt: now,
      updatedAt: now,
      catatanOperator: catatanOperator?.trim() || req.catatanOperator
    };

    requests[index] = updatedReq;
    this.saveWargaDataChangeRequests(requests);

    this.addWargaDataChangeLog({
      actorType: 'aparatur',
      actorId: operator.id,
      actorName: operator.name,
      targetPendudukId: req.pendudukId,
      requestId: req.id,
      action: 'DATA_CHANGE_REQUEST_REVIEWED',
      notes: `Petugas ${operator.name} menandai pengajuan sedang diverifikasi.`
    });

    return { success: true, message: 'Status pengajuan berhasil diubah menjadi Sedang Diverifikasi.', request: updatedReq };
  },

  rejectDataChangeRequest(
    requestId: string,
    operator: User,
    catatanOperator: string
  ): { success: boolean; message: string; request?: WargaDataChangeRequest } {
    const catatanClean = (catatanOperator || '').trim();
    if (!catatanClean) {
      return { success: false, message: 'Alasan penolakan wajib diisi untuk memberikan penjelasan yang jelas kepada warga.' };
    }

    const requests = this.getWargaDataChangeRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, message: 'Data pengajuan tidak ditemukan.' };
    }

    const req = requests[index];
    if (req.status === 'disetujui') {
      return { success: false, message: 'Pengajuan yang sudah disetujui tidak dapat ditolak.' };
    }

    const now = new Date().toISOString();
    const updatedReq: WargaDataChangeRequest = {
      ...req,
      status: 'ditolak',
      reviewedBy: `${operator.name} (${operator.role})`,
      reviewedAt: now,
      updatedAt: now,
      catatanOperator: catatanClean
    };

    requests[index] = updatedReq;
    this.saveWargaDataChangeRequests(requests);

    this.addWargaDataChangeLog({
      actorType: 'aparatur',
      actorId: operator.id,
      actorName: operator.name,
      targetPendudukId: req.pendudukId,
      requestId: req.id,
      action: 'DATA_CHANGE_REQUEST_REJECTED',
      notes: `Petugas ${operator.name} menolak pengajuan. Alasan: ${catatanClean}`
    });

    return { success: true, message: 'Pengajuan perubahan data telah ditolak.', request: updatedReq };
  },

  approveDataChangeRequest(
    requestId: string,
    operator: User,
    catatanOperator?: string
  ): { success: boolean; message: string; request?: WargaDataChangeRequest; updatedPenduduk?: Penduduk } {
    const requests = this.getWargaDataChangeRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, message: 'Data pengajuan tidak ditemukan.' };
    }

    const req = requests[index];
    if (req.status === 'disetujui') {
      return { success: false, message: 'Pengajuan ini sudah disetujui sebelumnya.' };
    }

    // 1. Ambil data master penduduk & keluarga saat ini
    const residentMatch = this.getPendudukById(req.pendudukId);
    if (!residentMatch) {
      return { success: false, message: 'Data master penduduk yang bersangkutan tidak ditemukan dalam sistem.' };
    }

    // 2. Siapkan update ke Penduduk dan/atau Keluarga
    const updatedPendudukFields: Record<string, any> = {};
    const updatedKeluargaFields: Record<string, any> = {};

    for (const change of req.changes) {
      if (['alamat', 'rt', 'rw', 'dusun'].includes(change.field)) {
        updatedKeluargaFields[change.field] = change.newValue;
      } else {
        updatedPendudukFields[change.field] = change.newValue;
      }
    }

    // 3. Terapkan secara atomik ke Keluarga master list
    const list = this.getKeluargaList();
    const keluargaIndex = list.findIndex(k => k.anggotaKeluarga?.some(m => m.id === req.pendudukId));
    if (keluargaIndex === -1) {
      return { success: false, message: 'Keluarga penduduk tidak ditemukan dalam basis data master.' };
    }

    const keluarga = list[keluargaIndex];
    const memberIndex = keluarga.anggotaKeluarga.findIndex(m => m.id === req.pendudukId);
    if (memberIndex === -1) {
      return { success: false, message: 'Anggota keluarga tidak ditemukan dalam kartu keluarga terkait.' };
    }

    const currentMember = keluarga.anggotaKeluarga[memberIndex];
    const updatedMember: Penduduk = { ...currentMember, ...updatedPendudukFields };

    // Jika nama kepala keluarga berubah dan member ini adalah kepala keluarga
    if (updatedPendudukFields.nama && (currentMember.nik === keluarga.nikKepala || currentMember.statusKeluarga === 'Kepala Keluarga')) {
      keluarga.namaKepalaKeluarga = updatedPendudukFields.nama;
    }

    // Jika ada perubahan alamat keluarga
    if (Object.keys(updatedKeluargaFields).length > 0) {
      Object.assign(keluarga, updatedKeluargaFields);
    }

    keluarga.anggotaKeluarga[memberIndex] = updatedMember;
    keluarga.updatedAt = new Date().toISOString();
    keluarga.lastModifiedBy = `${operator.name} (Approval Perubahan Data Warga)`;

    list[keluargaIndex] = keluarga;
    this.saveKeluargaList(list);

    // 4. Update status pengajuan menjadi 'disetujui'
    const now = new Date().toISOString();
    const updatedReq: WargaDataChangeRequest = {
      ...req,
      status: 'disetujui',
      reviewedBy: `${operator.name} (${operator.role})`,
      reviewedAt: now,
      updatedAt: now,
      catatanOperator: catatanOperator?.trim() || req.catatanOperator
    };

    requests[index] = updatedReq;
    this.saveWargaDataChangeRequests(requests);

    // 5. Catat audit log persetujuan dan penerapan data
    this.addWargaDataChangeLog({
      actorType: 'aparatur',
      actorId: operator.id,
      actorName: operator.name,
      targetPendudukId: req.pendudukId,
      requestId: req.id,
      action: 'DATA_CHANGE_REQUEST_APPROVED',
      notes: `Petugas ${operator.name} menyetujui pengajuan perubahan data kependudukan.`
    });

    this.addWargaDataChangeLog({
      actorType: 'aparatur',
      actorId: operator.id,
      actorName: operator.name,
      targetPendudukId: req.pendudukId,
      requestId: req.id,
      action: 'DATA_CHANGE_APPLIED',
      notes: `Data master penduduk ${updatedMember.nama} (NIK: ${updatedMember.nik}) telah berhasil diperbarui di basis data desa.`
    });

    return {
      success: true,
      message: `Perubahan data untuk ${updatedMember.nama} berhasil disetujui dan diterapkan ke master kependudukan.`,
      request: updatedReq,
      updatedPenduduk: updatedMember
    };
  },

  cancelDataChangeRequest(
    requestId: string,
    wargaSession: WargaSession
  ): { success: boolean; message: string } {
    const requests = this.getWargaDataChangeRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, message: 'Data pengajuan tidak ditemukan.' };
    }

    const req = requests[index];
    if (req.wargaAccountId !== wargaSession.wargaAccountId && req.pendudukId !== wargaSession.pendudukId) {
      return { success: false, message: 'Anda tidak memiliki hak untuk membatalkan pengajuan ini.' };
    }

    if (req.status !== 'menunggu') {
      return { success: false, message: 'Pengajuan yang sudah diproses petugas tidak dapat dibatalkan.' };
    }

    const now = new Date().toISOString();
    req.status = 'dibatalkan';
    req.updatedAt = now;
    requests[index] = req;
    this.saveWargaDataChangeRequests(requests);

    this.addWargaDataChangeLog({
      actorType: 'warga',
      actorId: wargaSession.wargaAccountId,
      actorName: wargaSession.nama,
      targetPendudukId: req.pendudukId,
      requestId: req.id,
      action: 'DATA_CHANGE_REQUEST_CANCELLED',
      notes: `Warga @${wargaSession.nama} membatalkan pengajuan perubahan data.`
    });

    return { success: true, message: 'Pengajuan berhasil dibatalkan.' };
  },

  // ── LAYANAN SURAT MENYURAT MANDIRI (TAHAP 4) ──
  getLetterTypes(): LetterType[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_TYPES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      this.saveLetterTypes(DEFAULT_LETTER_TYPES);
      return DEFAULT_LETTER_TYPES;
    } catch {
      return DEFAULT_LETTER_TYPES;
    }
  },

  saveLetterTypes(types: LetterType[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LETTER_TYPES, JSON.stringify(types));
    } catch (e) {
      console.error('Error saving letter types', e);
    }
  },

  getOfficialLetterTypes(): LetterType[] {
    return DEFAULT_OFFICIAL_LETTER_TYPES;
  },

  getLetterTypeById(id: string): LetterType | undefined {
    return this.getLetterTypes().find(t => t.id === id && t.active) || 
      DEFAULT_OFFICIAL_LETTER_TYPES.find(t => t.id === id && t.active);
  },

  getLetterTypeByCode(code: string): LetterType | undefined {
    return this.getLetterTypes().find(t => t.code === code && t.active) ||
      DEFAULT_OFFICIAL_LETTER_TYPES.find(t => t.code === code && t.active);
  },

  getLetterRequests(): LetterRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_REQUESTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLetterRequests(requests: LetterRequest[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.LETTER_REQUESTS, JSON.stringify(requests));
      return true;
    } catch (e) {
      console.error('Error saving letter requests', e);
      return false;
    }
  },

  getLetterRequestsByWarga(wargaAccountId: string): LetterRequest[] {
    if (!wargaAccountId) return [];
    return this.getLetterRequests().filter(r => !r.isSuratDinas && r.wargaAccountId === wargaAccountId);
  },

  getLetterRequestsByPenduduk(pendudukId: string): LetterRequest[] {
    if (!pendudukId) return [];
    return this.getLetterRequests().filter(r => !r.isSuratDinas && r.pendudukId === pendudukId);
  },

  getSuratDinasRequests(): LetterRequest[] {
    return this.getLetterRequests().filter(r => r.isSuratDinas === true);
  },

  getSuratWargaRequests(): LetterRequest[] {
    return this.getLetterRequests().filter(r => !r.isSuratDinas);
  },

  getLetterRequestById(id: string): LetterRequest | undefined {
    return this.getLetterRequests().find(r => r.id === id);
  },

  createLetterRequest(params: {
    wargaSession: WargaSession;
    letterTypeId: string;
    formData: Record<string, any>;
    confirmedRequirements: string[];
    notes?: string;
  }): { success: boolean; request?: LetterRequest; error?: string } {
    const { wargaSession, letterTypeId, formData, confirmedRequirements, notes } = params;

    if (!wargaSession || !wargaSession.pendudukId || !wargaSession.wargaAccountId) {
      return { success: false, error: 'Sesi warga tidak valid atau telah berakhir.' };
    }

    // Ambil data penduduk & keluarga existing (Single Source of Truth)
    const res = this.getPendudukById(wargaSession.pendudukId);
    if (!res || !res.penduduk || !res.keluarga) {
      return { success: false, error: 'Data kependudukan pemohon tidak ditemukan di master data desa.' };
    }

    const { penduduk, keluarga } = res;

    // Ambil konfigurasi jenis surat
    const letterType = this.getLetterTypeById(letterTypeId);
    if (!letterType) {
      return { success: false, error: 'Jenis surat tidak ditemukan atau sedang tidak aktif.' };
    }

    // Periksa duplikasi pengajuan aktif untuk jenis surat yang sama
    const existingRequests = this.getLetterRequestsByPenduduk(penduduk.id);
    const hasActiveDuplicate = existingRequests.some(r => 
      r.letterTypeId === letterTypeId &&
      (r.status === 'MENUNGGU_VERIFIKASI' || r.status === 'DIVERIFIKASI' || r.status === 'MENUNGGU_PERSETUJUAN')
    );

    if (hasActiveDuplicate) {
      return { 
        success: false, 
        error: `Anda masih memiliki pengajuan ${letterType.name} yang sedang dalam proses verifikasi. Harap tunggu hingga proses selesai sebelum mengajukan kembali.` 
      };
    }

    // Validasi field wajib terisi
    for (const field of letterType.requiredFields) {
      if (field.required) {
        const val = formData[field.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          return { success: false, error: `Kolom "${field.label}" wajib diisi.` };
        }
      }
    }

    // Buat Snapshot Data Otomatis (READ-ONLY SNAPSHOT)
    const autoDataSnapshot: LetterAutoDataSnapshot = {
      nama: penduduk.nama,
      nik: penduduk.nik,
      noKk: keluarga.noKk,
      tempatLahir: penduduk.tempatLahir,
      tanggalLahir: penduduk.tanggalLahir,
      jenisKelamin: penduduk.jenisKelamin,
      agama: penduduk.agama,
      statusPerkawinan: penduduk.statusPerkawinan,
      statusKeluarga: penduduk.statusKeluarga,
      pekerjaan: penduduk.pekerjaan,
      pendidikan: penduduk.pendidikan,
      alamat: keluarga.alamat,
      rt: keluarga.rt,
      rw: keluarga.rw,
      dusun: keluarga.dusun,
      telepon: keluarga.telepon || undefined
    };

    // Tentukan Status Awal Berdasarkan Level Workflow
    let initialStatus: LetterRequestStatus = 'MENUNGGU_VERIFIKASI';
    if (letterType.workflowLevel === 'LEVEL_1_INSTAN') {
      initialStatus = 'SIAP_DITERBITKAN';
    } else if (letterType.workflowLevel === 'LEVEL_2_VERIFIKASI') {
      initialStatus = 'MENUNGGU_VERIFIKASI';
    } else if (letterType.workflowLevel === 'LEVEL_3_PERSETUJUAN') {
      initialStatus = 'MENUNGGU_VERIFIKASI';
    }

    const now = new Date().toISOString();
    const newRequest: LetterRequest = {
      id: `req-srt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      wargaAccountId: wargaSession.wargaAccountId,
      pendudukId: penduduk.id,
      letterTypeId: letterType.id,
      letterTypeCode: letterType.code,
      letterTypeName: letterType.name,
      submittedAt: now,
      updatedAt: now,
      status: initialStatus,
      workflowLevel: letterType.workflowLevel,
      autoData: autoDataSnapshot,
      formData: { ...formData },
      confirmedRequirements: [...confirmedRequirements],
      notes: notes || undefined,
      nomorSurat: 'Belum diterbitkan'
    };

    const requests = this.getLetterRequests();
    requests.unshift(newRequest);
    this.saveLetterRequests(requests);

    // Audit log
    this.logLetterAudit({
      actorType: 'warga',
      actorId: wargaSession.wargaAccountId,
      actorName: wargaSession.nama,
      letterRequestId: newRequest.id,
      letterTypeCode: letterType.code,
      action: 'LETTER_REQUEST_CREATED',
      notes: `Pengajuan ${letterType.name} berhasil dibuat dengan status ${initialStatus} (${letterType.workflowLevel}).`
    });

    return { success: true, request: newRequest };
  },

  createLetterRequestByAparatur(params: {
    currentUser: User;
    pendudukId: string;
    letterTypeId: string;
    formData: Record<string, any>;
    confirmedRequirements?: string[];
    notes?: string;
    isDraft?: boolean;
  }): { success: boolean; request?: LetterRequest; error?: string } {
    const { currentUser, pendudukId, letterTypeId, formData, confirmedRequirements = [], notes, isDraft = false } = params;

    if (!currentUser) {
      return { success: false, error: 'Sesi aparatur tidak valid.' };
    }

    if (currentUser.role === 'operator_aset') {
      return { success: false, error: 'Operator Aset tidak memiliki izin untuk membuat Surat Keterangan Warga.' };
    }

    // Ambil data master penduduk & keluarga (Single Source of Truth)
    const res = this.getPendudukById(pendudukId);
    if (!res || !res.penduduk || !res.keluarga) {
      return { success: false, error: 'Data kependudukan pemohon tidak ditemukan di master data desa.' };
    }

    const { penduduk, keluarga } = res;

    // Ambil konfigurasi jenis surat
    const letterType = this.getLetterTypeById(letterTypeId);
    if (!letterType) {
      return { success: false, error: 'Jenis surat tidak ditemukan atau sedang tidak aktif.' };
    }

    // Validasi status kematian jika penduduk sudah meninggal dan jenis surat bukan SK Kematian
    if (penduduk.statusKematian === 'Meninggal' && letterType.code !== 'SK_KEMATIAN') {
      return {
        success: false,
        error: `Warga atas nama ${penduduk.nama} berstatus meninggal dunia. Surat yang dapat dibuat hanya Surat Keterangan Kematian.`
      };
    }

    // Periksa duplikasi pengajuan aktif untuk jenis surat yang sama
    const existingRequests = this.getLetterRequestsByPenduduk(penduduk.id);
    const hasActiveDuplicate = existingRequests.some(r => 
      r.letterTypeId === letterTypeId &&
      (r.status === 'MENUNGGU_VERIFIKASI' || r.status === 'DIVERIFIKASI' || r.status === 'MENUNGGU_PERSETUJUAN')
    );

    if (hasActiveDuplicate && !isDraft) {
      return { 
        success: false, 
        error: `Warga ${penduduk.nama} masih memiliki pengajuan ${letterType.name} yang sedang dalam proses verifikasi. Harap tunggu hingga proses selesai.` 
      };
    }

    // Proteksi duplikasi aksi / double-click (Idempotensi 15 detik untuk permohonan identik yang sama)
    if (!isDraft) {
      const nowMs = Date.now();
      const recentIdentical = existingRequests.find(r => {
        if (r.letterTypeId !== letterTypeId) return false;
        const subMs = new Date(r.submittedAt).getTime();
        if ((nowMs - subMs) > 15000) return false;
        try {
          return JSON.stringify(r.formData) === JSON.stringify(formData);
        } catch {
          return false;
        }
      });

      if (recentIdentical) {
        console.log('[LETTER DEBUG] Detected rapid duplicate submission within 15s window, returning existing request:', recentIdentical.id);
        return { success: true, request: recentIdentical };
      }
    }

    // Validasi field wajib terisi jika bukan draft
    if (!isDraft) {
      for (const field of letterType.requiredFields) {
        if (field.required) {
          const val = formData[field.name];
          if (val === undefined || val === null || String(val).trim() === '') {
            return { success: false, error: `Kolom "${field.label}" wajib diisi.` };
          }
        }
      }
    }

    // Snapshot data kependudukan otomatis (READ-ONLY SNAPSHOT)
    const autoDataSnapshot: LetterAutoDataSnapshot = {
      nama: penduduk.nama,
      nik: penduduk.nik,
      noKk: keluarga.noKk,
      tempatLahir: penduduk.tempatLahir,
      tanggalLahir: penduduk.tanggalLahir,
      jenisKelamin: penduduk.jenisKelamin,
      agama: penduduk.agama,
      statusPerkawinan: penduduk.statusPerkawinan,
      statusKeluarga: penduduk.statusKeluarga,
      pekerjaan: penduduk.pekerjaan,
      pendidikan: penduduk.pendidikan,
      alamat: keluarga.alamat,
      rt: keluarga.rt,
      rw: keluarga.rw,
      dusun: keluarga.dusun,
      telepon: keluarga.telepon || undefined
    };

    // Tentukan Status Awal Berdasarkan Level Workflow
    let initialStatus: LetterRequestStatus = 'MENUNGGU_VERIFIKASI';
    if (isDraft) {
      initialStatus = 'DRAFT';
    } else if (letterType.workflowLevel === 'LEVEL_1_INSTAN') {
      initialStatus = 'SIAP_DITERBITKAN';
    } else if (letterType.workflowLevel === 'LEVEL_2_VERIFIKASI') {
      initialStatus = 'MENUNGGU_VERIFIKASI';
    } else if (letterType.workflowLevel === 'LEVEL_3_PERSETUJUAN') {
      initialStatus = 'MENUNGGU_VERIFIKASI';
    }

    // Ambil account ID jika ada, atau tandai dibuat aparatur
    const wargaAcc = this.getWargaAccounts().find(a => a.pendudukId === penduduk.id);
    const wargaAccountId = wargaAcc ? wargaAcc.id : `aparatur-${currentUser.id}`;

    const now = new Date().toISOString();
    const newRequest: LetterRequest = {
      id: `req-srt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      wargaAccountId,
      pendudukId: penduduk.id,
      letterTypeId: letterType.id,
      letterTypeCode: letterType.code,
      letterTypeName: letterType.name,
      submittedAt: now,
      updatedAt: now,
      status: initialStatus,
      workflowLevel: letterType.workflowLevel,
      autoData: autoDataSnapshot,
      formData: { ...formData },
      confirmedRequirements: [...confirmedRequirements],
      notes: notes || undefined,
      nomorSurat: 'Belum diterbitkan',
      createdByType: 'APARATUR',
      createdByActorId: currentUser.id,
      createdByActorName: currentUser.name,
      createdByRole: currentUser.role
    };

    const requests = this.getLetterRequests();
    requests.unshift(newRequest);
    this.saveLetterRequests(requests);

    // Audit log pencatatan pembuatan surat oleh aparatur
    this.logLetterAudit({
      actorType: 'aparatur',
      actorId: currentUser.id,
      actorName: currentUser.name,
      letterRequestId: newRequest.id,
      letterTypeCode: letterType.code,
      action: 'LETTER_REQUEST_CREATED',
      notes: isDraft
        ? `Draft surat ${letterType.name} untuk warga ${penduduk.nama} (NIK: ${penduduk.nik}) disimpan oleh ${currentUser.name} (${currentUser.role}).`
        : `Surat ${letterType.name} untuk warga ${penduduk.nama} (NIK: ${penduduk.nik}) dibuat langsung oleh aparatur ${currentUser.name} (${currentUser.role}). Status: ${initialStatus} (${letterType.workflowLevel}).`
    });

    return { success: true, request: newRequest };
  },

  createSuratDinasByAparatur(params: {
    currentUser: User;
    letterTypeId: string;
    suratDinasData: {
      tujuanSurat: string;
      instansiTujuan?: string;
      alamatTujuan?: string;
      sifatSurat?: SuratDinasSifat;
      lampiran?: string;
      perihal: string;
      isiSurat?: string;
      tembusan?: string[];
      catatanInternal?: string;
    };
    formData?: Record<string, any>;
    confirmedRequirements?: string[];
    notes?: string;
    isDraft?: boolean;
  }): { success: boolean; request?: LetterRequest; error?: string } {
    const { 
      currentUser, 
      letterTypeId, 
      suratDinasData, 
      formData = {}, 
      confirmedRequirements = [], 
      notes, 
      isDraft = false 
    } = params;

    if (!currentUser) {
      return { success: false, error: 'Sesi aparatur tidak valid.' };
    }

    // Ambil konfigurasi master jenis surat
    const letterType = this.getLetterTypeById(letterTypeId);
    if (!letterType) {
      return { success: false, error: 'Jenis surat dinas tidak ditemukan atau sedang tidak aktif.' };
    }

    if (letterType.category !== 'dinas') {
      return { success: false, error: 'Jenis surat yang dipilih bukan merupakan kategori Surat Dinas.' };
    }

    const cleanTujuan = (suratDinasData?.tujuanSurat || '').trim();
    const cleanPerihal = (suratDinasData?.perihal || '').trim();

    // Validasi field wajib Surat Dinas jika bukan draft
    if (!isDraft) {
      if (!cleanTujuan) {
        return { success: false, error: 'Tujuan surat dinas wajib diisi.' };
      }
      if (!cleanPerihal) {
        return { success: false, error: 'Perihal surat dinas wajib diisi.' };
      }

      // Validasi field konfigurasi dinas (misal: acara, hariTanggal, dll)
      for (const field of letterType.requiredFields) {
        if (field.required) {
          const val = formData[field.name];
          if (val === undefined || val === null || String(val).trim() === '') {
            return { success: false, error: `Kolom "${field.label}" wajib diisi.` };
          }
        }
      }
    }

    // Proteksi duplikasi aktif untuk Surat Dinas yang identik
    const existingDinas = this.getSuratDinasRequests();
    if (!isDraft && cleanPerihal && cleanTujuan) {
      const normPerihal = cleanPerihal.toLowerCase();
      const normTujuan = cleanTujuan.toLowerCase();

      const hasActiveDuplicate = existingDinas.some(r => 
        r.letterTypeId === letterTypeId &&
        r.suratDinasData?.perihal?.trim().toLowerCase() === normPerihal &&
        r.suratDinasData?.tujuanSurat?.trim().toLowerCase() === normTujuan &&
        (r.status === 'MENUNGGU_VERIFIKASI' || r.status === 'DIVERIFIKASI' || r.status === 'MENUNGGU_PERSETUJUAN')
      );

      if (hasActiveDuplicate) {
        return { 
          success: false, 
          error: `Surat Dinas ${letterType.name} dengan perihal "${cleanPerihal}" dan tujuan "${cleanTujuan}" saat ini sedang dalam proses verifikasi/persetujuan.` 
        };
      }

      // Proteksi rapid double-click (Idempotensi 15 detik)
      const nowMs = Date.now();
      const recentIdentical = existingDinas.find(r => {
        if (r.letterTypeId !== letterTypeId) return false;
        if (r.createdByActorId !== currentUser.id) return false;
        const subMs = new Date(r.submittedAt).getTime();
        if ((nowMs - subMs) > 15000) return false;
        const rPerihal = r.suratDinasData?.perihal?.trim().toLowerCase();
        const rTujuan = r.suratDinasData?.tujuanSurat?.trim().toLowerCase();
        return rPerihal === normPerihal && rTujuan === normTujuan;
      });

      if (recentIdentical) {
        console.log('[SURAT DINAS DEBUG] Rapid duplicate submission detected within 15s, returning existing request:', recentIdentical.id);
        return { success: true, request: recentIdentical };
      }
    }

    // Tentukan Status Awal Sesuai Workflow Level
    let initialStatus: LetterRequestStatus = 'MENUNGGU_VERIFIKASI';
    if (isDraft) {
      initialStatus = 'DRAFT';
    } else if (letterType.workflowLevel === 'LEVEL_1_INSTAN') {
      initialStatus = 'SIAP_DITERBITKAN';
    } else if (letterType.workflowLevel === 'LEVEL_2_VERIFIKASI') {
      initialStatus = 'MENUNGGU_VERIFIKASI';
    } else if (letterType.workflowLevel === 'LEVEL_3_PERSETUJUAN') {
      initialStatus = 'MENUNGGU_VERIFIKASI';
    }

    const now = new Date().toISOString();
    const sifatSurat: SuratDinasSifat = suratDinasData?.sifatSurat || 'Biasa';

    const newRequest: LetterRequest = {
      id: `req-dns-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      // Surat Dinas tidak terikat data penduduk/warga dan tidak menggunakan autoData kependudukan
      wargaAccountId: undefined,
      pendudukId: undefined,
      autoData: undefined,
      letterTypeId: letterType.id,
      letterTypeCode: letterType.code,
      letterTypeName: letterType.name,
      submittedAt: now,
      updatedAt: now,
      status: initialStatus,
      workflowLevel: letterType.workflowLevel,
      formData: { ...formData },
      confirmedRequirements: [...confirmedRequirements],
      notes: notes || undefined,
      nomorSurat: 'Belum diterbitkan',
      createdByType: 'APARATUR',
      createdByActorId: currentUser.id,
      createdByActorName: currentUser.name,
      createdByRole: currentUser.role,
      isSuratDinas: true,
      suratDinasData: {
        tujuanSurat: cleanTujuan || (isDraft ? 'Draft Tujuan' : ''),
        instansiTujuan: suratDinasData?.instansiTujuan || undefined,
        alamatTujuan: suratDinasData?.alamatTujuan || undefined,
        sifatSurat,
        lampiran: suratDinasData?.lampiran || undefined,
        perihal: cleanPerihal || (isDraft ? 'Draft Perihal' : ''),
        isiSurat: suratDinasData?.isiSurat || undefined,
        tembusan: suratDinasData?.tembusan && suratDinasData.tembusan.length > 0 ? suratDinasData.tembusan : undefined,
        catatanInternal: suratDinasData?.catatanInternal || undefined
      }
    };

    const requests = this.getLetterRequests();
    requests.unshift(newRequest);
    this.saveLetterRequests(requests);

    // Audit log pencatatan pembuatan surat dinas oleh aparatur
    this.logLetterAudit({
      actorType: 'aparatur',
      actorId: currentUser.id,
      actorName: currentUser.name,
      letterRequestId: newRequest.id,
      letterTypeCode: letterType.code,
      action: 'LETTER_REQUEST_CREATED',
      notes: isDraft
        ? `Draft Surat Dinas ${letterType.name} (Perihal: "${newRequest.suratDinasData?.perihal}", Tujuan: "${newRequest.suratDinasData?.tujuanSurat}") disimpan oleh aparatur ${currentUser.name} (${currentUser.role}).`
        : `Surat Dinas ${letterType.name} dibuat oleh aparatur ${currentUser.name} (${currentUser.role}) dengan perihal "${newRequest.suratDinasData?.perihal}" ditujukan kepada "${newRequest.suratDinasData?.tujuanSurat}". Status: ${initialStatus} (${letterType.workflowLevel}).`
    });

    return { success: true, request: newRequest };
  },

  updateSuratDinas(params: {
    requestId: string;
    currentUser: User;
    suratDinasData?: Partial<SuratDinasData>;
    formData?: Record<string, any>;
    confirmedRequirements?: string[];
    notes?: string;
    status?: LetterRequestStatus;
  }): { success: boolean; request?: LetterRequest; error?: string } {
    const { requestId, currentUser, suratDinasData, formData, confirmedRequirements, notes, status } = params;

    const requests = this.getLetterRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, error: 'Surat dinas tidak ditemukan.' };
    }

    const req = requests[index];
    if (!req.isSuratDinas) {
      return { success: false, error: 'Dokumen ini bukan merupakan Surat Dinas.' };
    }

    const now = new Date().toISOString();
    req.updatedAt = now;

    if (suratDinasData) {
      req.suratDinasData = {
        ...(req.suratDinasData || { tujuanSurat: '', perihal: '' }),
        ...suratDinasData
      };
    }

    if (formData) {
      req.formData = { ...req.formData, ...formData };
    }

    if (confirmedRequirements) {
      req.confirmedRequirements = [...confirmedRequirements];
    }

    if (notes !== undefined) {
      req.notes = notes;
    }

    if (status) {
      req.status = status;
    }

    requests[index] = req;
    this.saveLetterRequests(requests);

    this.logLetterAudit({
      actorType: 'aparatur',
      actorId: currentUser.id,
      actorName: currentUser.name,
      letterRequestId: req.id,
      letterTypeCode: req.letterTypeCode,
      action: 'LETTER_REQUEST_REVIEWED',
      notes: `Surat Dinas ${req.letterTypeName} (${req.suratDinasData?.perihal || ''}) diperbarui oleh aparatur ${currentUser.name} (${currentUser.role}).`
    });

    return { success: true, request: req };
  },

  cancelLetterRequest(requestId: string, wargaSession: WargaSession): { success: boolean; error?: string } {
    const requests = this.getLetterRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, error: 'Pengajuan surat tidak ditemukan.' };
    }

    const req = requests[index];
    if (req.wargaAccountId !== wargaSession.wargaAccountId && req.pendudukId !== wargaSession.pendudukId) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk membatalkan pengajuan ini.' };
    }

    // Pembatalan hanya diperbolehkan jika status masih DRAFT atau MENUNGGU_VERIFIKASI
    if (req.status !== 'DRAFT' && req.status !== 'MENUNGGU_VERIFIKASI') {
      return { success: false, error: `Pengajuan dengan status "${req.status}" tidak dapat dibatalkan secara sepihak oleh pemohon.` };
    }

    req.status = 'DIBATALKAN';
    req.updatedAt = new Date().toISOString();
    requests[index] = req;
    this.saveLetterRequests(requests);

    this.logLetterAudit({
      actorType: 'warga',
      actorId: wargaSession.wargaAccountId,
      actorName: wargaSession.nama,
      letterRequestId: req.id,
      letterTypeCode: req.letterTypeCode,
      action: 'LETTER_REQUEST_CANCELLED',
      notes: `Warga @${wargaSession.nama} membatalkan pengajuan surat ${req.letterTypeName}.`
    });

    return { success: true };
  },

  reviewLetterRequest(params: {
    requestId: string;
    reviewer: User;
    status: 'DIVERIFIKASI' | 'MENUNGGU_PERSETUJUAN' | 'DISETUJUI' | 'SIAP_DITERBITKAN';
    notes?: string;
  }): { success: boolean; error?: string } {
    const { requestId, reviewer, status, notes } = params;

    // 1. Guard Autorisasi Operator Aset (Blokir total semua aksi verifikasi/persetujuan persuratan)
    if (reviewer.role === 'operator_aset') {
      return { 
        success: false, 
        error: 'Operator aset tidak memiliki kewenangan verifikasi atau persetujuan persuratan.' 
      };
    }

    const requests = this.getLetterRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, error: 'Pengajuan surat tidak ditemukan.' };
    }

    const req = requests[index];

    // 2. Guard Status Terminal / Dokumen Terbit
    if (req.status === 'TERBIT') {
      return { success: false, error: 'Surat yang sudah terbit resmi tidak dapat diubah status persetujuannya.' };
    }
    if (req.status === 'DITOLAK' || req.status === 'DIBATALKAN') {
      return { success: false, error: 'Pengajuan surat yang sudah ditolak atau dibatalkan tidak dapat diproses lebih lanjut.' };
    }

    // Guard Dokumen yang Sudah Dicabut (REVOKED)
    const existingIssuance = this.getLetterIssuanceByRequestId(req.id);
    if (existingIssuance && existingIssuance.status === 'REVOKED') {
      return { success: false, error: 'Surat untuk pengajuan ini telah dicabut (REVOKED) dan tidak dapat diubah statusnya.' };
    }

    // 3. Guard Level 3 Final Approval (HANYA ADMIN)
    const isLevel3 = req.workflowLevel === 'LEVEL_3_PERSETUJUAN';
    const isFinalApprovalAction = status === 'DISETUJUI' || status === 'SIAP_DITERBITKAN';

    if (isLevel3 && isFinalApprovalAction) {
      if (reviewer.role !== 'admin') {
        return { 
          success: false, 
          error: 'Hanya administrator / Kepala Desa yang berwenang memberikan persetujuan akhir surat Level 3.' 
        };
      }

      // Persetujuan akhir Level 3 hanya boleh dilakukan dari status MENUNGGU_PERSETUJUAN
      if (req.status !== 'MENUNGGU_PERSETUJUAN') {
        return { 
          success: false, 
          error: `Persetujuan Level 3 tidak dapat dilakukan dari status "${req.status}". Pengajuan harus melalui verifikasi berkas terlebih dahulu.` 
        };
      }
    }

    // 4. Guard Transisi Verifikasi Level 3 (MENUNGGU_VERIFIKASI -> MENUNGGU_PERSETUJUAN)
    if (isLevel3 && status === 'MENUNGGU_PERSETUJUAN') {
      if (req.status !== 'MENUNGGU_VERIFIKASI') {
        return { 
          success: false, 
          error: `Verifikasi berkas Level 3 hanya dapat dilakukan untuk pengajuan yang berstatus Menunggu Verifikasi (status saat ini: "${req.status}").` 
        };
      }
    }

    // 5. Guard Level 2 Verification / Approval (Boleh operator & admin)
    const isLevel2 = req.workflowLevel === 'LEVEL_2_VERIFIKASI';
    if (isLevel2 && isFinalApprovalAction) {
      if (req.status !== 'MENUNGGU_VERIFIKASI' && req.status !== 'DIVERIFIKASI') {
        return { 
          success: false, 
          error: `Persetujuan surat Level 2 tidak dapat dilakukan dari status "${req.status}".` 
        };
      }
    }

    const now = new Date().toISOString();

    req.status = status;
    req.updatedAt = now;
    req.reviewedBy = reviewer.name;
    req.reviewedAt = now;
    if (notes) {
      req.notes = notes;
    }

    if (status === 'DISETUJUI' || status === 'SIAP_DITERBITKAN') {
      req.approvedBy = reviewer.name;
      req.approvedAt = now;
    }

    requests[index] = req;
    const saved = this.saveLetterRequests(requests);
    if (!saved) {
      return { success: false, error: 'Gagal menyimpan pembaruan status pengajuan ke penyimpanan.' };
    }

    this.logLetterAudit({
      actorType: 'aparatur',
      actorId: reviewer.id,
      actorName: reviewer.name,
      letterRequestId: req.id,
      letterTypeCode: req.letterTypeCode,
      action: status === 'DISETUJUI' || status === 'SIAP_DITERBITKAN' ? 'LETTER_REQUEST_APPROVED' : 'LETTER_REQUEST_REVIEWED',
      notes: req.isSuratDinas
        ? `Aparatur (${reviewer.role}) ${reviewer.name} mengubah status Surat Dinas ${req.letterTypeName} (${req.suratDinasData?.perihal || ''}) menjadi ${status}. ${notes ? `Catatan: ${notes}` : ''}`
        : `Aparatur (${reviewer.role}) ${reviewer.name} mengubah status menjadi ${status}. ${notes ? `Catatan: ${notes}` : ''}`
    });

    return { success: true };
  },

  rejectLetterRequest(params: {
    requestId: string;
    reviewer: User;
    rejectionReason: string;
  }): { success: boolean; error?: string } {
    const { requestId, reviewer, rejectionReason } = params;

    // Guard Autorisasi Operator Aset
    if (reviewer.role === 'operator_aset') {
      return { 
        success: false, 
        error: 'Operator aset tidak memiliki kewenangan atas persuratan.' 
      };
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      return { success: false, error: 'Alasan penolakan wajib dicantumkan.' };
    }

    const requests = this.getLetterRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, error: 'Pengajuan surat tidak ditemukan.' };
    }

    const req = requests[index];

    // Tidak boleh menolak surat yang sudah terbit resmi (gunakan fitur pencabutan)
    if (req.status === 'TERBIT') {
      return { success: false, error: 'Surat yang sudah terbit resmi tidak dapat ditolak. Gunakan fitur cabut surat.' };
    }

    const now = new Date().toISOString();

    req.status = 'DITOLAK';
    req.updatedAt = now;
    req.reviewedBy = reviewer.name;
    req.reviewedAt = now;
    req.rejectionReason = rejectionReason;

    requests[index] = req;
    this.saveLetterRequests(requests);

    this.logLetterAudit({
      actorType: 'aparatur',
      actorId: reviewer.id,
      actorName: reviewer.name,
      letterRequestId: req.id,
      letterTypeCode: req.letterTypeCode,
      action: 'LETTER_REQUEST_REJECTED',
      notes: req.isSuratDinas
        ? `Aparatur ${reviewer.name} menolak Surat Dinas ${req.letterTypeName} (${req.suratDinasData?.perihal || ''}): "${rejectionReason}"`
        : `Aparatur ${reviewer.name} menolak pengajuan: "${rejectionReason}"`
    });

    return { success: true };
  },

  getLetterAuditLogs(): LetterAuditLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_AUDIT_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  logLetterAudit(entry: Omit<LetterAuditLogEntry, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getLetterAuditLogs();
      const newEntry: LetterAuditLogEntry = {
        ...entry,
        id: `log-srt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      localStorage.setItem(STORAGE_KEYS.LETTER_AUDIT_LOGS, JSON.stringify(logs.slice(0, 300)));
    } catch (e) {
      console.error('Error logging letter audit', e);
    }
  },

  // ── MASTER TEMPLATE SURAT (TAHAP 5 & STAGE 7.2D.1.1) ──
  getLetterTemplates(): LetterTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_TEMPLATES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sinkronisasi seluruh template master bawaan jika belum ada di runtime storage (tanpa duplikasi ID)
          let hasNew = false;
          const merged = [...parsed];
          for (const def of DEFAULT_LETTER_TEMPLATES) {
            const exists = merged.some(t => t.id === def.id);
            if (!exists) {
              merged.push(def);
              hasNew = true;
            }
          }
          if (hasNew) {
            this.saveLetterTemplates(merged);
          }
          return merged;
        }
      }
      this.saveLetterTemplates(DEFAULT_LETTER_TEMPLATES);
      return DEFAULT_LETTER_TEMPLATES;
    } catch {
      return DEFAULT_LETTER_TEMPLATES;
    }
  },

  saveLetterTemplates(templates: LetterTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LETTER_TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.error('Error saving letter templates', e);
    }
  },

  getLetterTemplateById(id: string, version?: number): LetterTemplate | undefined {
    const list = this.getLetterTemplates();
    if (version !== undefined) {
      const matchBoth = list.find(t => t.id === id && t.version === version);
      if (matchBoth) return matchBoth;
    }
    const found = list.find(t => t.id === id);
    if (found) return found;

    if (version !== undefined) {
      const defMatchBoth = DEFAULT_LETTER_TEMPLATES.find(t => t.id === id && t.version === version);
      if (defMatchBoth) return defMatchBoth;
    }
    return DEFAULT_LETTER_TEMPLATES.find(t => t.id === id);
  },

  getActiveLetterTemplateByType(letterTypeId: string): LetterTemplate | undefined {
    const list = this.getLetterTemplates().filter(t => t.letterTypeId === letterTypeId);
    const active = list.filter(t => t.status === 'ACTIVE').sort((a, b) => b.version - a.version);
    if (active.length > 0) return active[0];
    const sorted = [...list].sort((a, b) => b.version - a.version);
    return sorted[0];
  },

  saveLetterTemplate(template: LetterTemplate, actor?: User): LetterTemplate {
    const templates = this.getLetterTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);

    // Jika template baru atau diubah menjadi ACTIVE, nonaktifkan template lama untuk letterType yang sama
    if (template.status === 'ACTIVE') {
      templates.forEach(t => {
        if (t.letterTypeId === template.letterTypeId && t.id !== template.id && t.status === 'ACTIVE') {
          t.status = 'INACTIVE';
          t.updatedAt = new Date().toISOString();
        }
      });
    }

    if (existingIndex >= 0) {
      templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.unshift(template);
    }

    this.saveLetterTemplates(templates);

    if (actor) {
      this.logLetterTemplateAudit({
        templateId: template.id,
        templateName: template.name,
        action: existingIndex >= 0 ? 'TEMPLATE_UPDATED' : 'TEMPLATE_CREATED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        oldVersion: template.version,
        newVersion: template.version,
        description: `Template "${template.name}" ${existingIndex >= 0 ? 'diperbarui' : 'dibuat'} (Versi ${template.version}, Status: ${template.status})`
      });
    }

    return template;
  },

  /**
   * STAGE 7.2D.1.1: Pembuatan versi template baru yang IMMUTABLE
   * - Menghasilkan record baru dengan ID baru (misal: tpl-sk-domisili-v1 -> tpl-sk-domisili-v2)
   * - Version baru (increment dari versi tertinggi untuk jenis surat terkait)
   * - Status template baru = ACTIVE
   * - Template lama berstatus INACTIVE dan kontennya UTUH (tidak di-overwrite)
   * - Surat-surat lama yang telah terbit tetap mengacu pada template lama secara aman
   */
  createNewTemplateVersion(baseTemplateId: string, updates: Partial<LetterTemplate>, actor?: User): LetterTemplate | null {
    const templates = this.getLetterTemplates();
    const oldTemplate = templates.find(t => t.id === baseTemplateId) || 
      DEFAULT_LETTER_TEMPLATES.find(t => t.id === baseTemplateId);
    if (!oldTemplate) return null;

    // Hitung nomor versi baru: cari versi tertinggi untuk jenis surat ini
    const allSameType = templates.filter(t => t.letterTypeId === oldTemplate.letterTypeId);
    const maxExistingVersion = allSameType.reduce((max, t) => Math.max(max, t.version), oldTemplate.version);
    const newVersion = maxExistingVersion + 1;

    // Generate ID baru (misal: tpl-sk-domisili-v1 -> tpl-sk-domisili-v2)
    const baseId = oldTemplate.id.replace(/-v\d+$/i, '');
    const newId = `${baseId}-v${newVersion}`;

    // Generate Code baru (misal: TPL_SK_DOMISILI_V1 -> TPL_SK_DOMISILI_V2)
    const baseCode = oldTemplate.code ? oldTemplate.code.replace(/_V\d+$/i, '') : baseId.toUpperCase().replace(/-/g, '_');
    const newCode = `${baseCode}_V${newVersion}`;

    const nowIso = new Date().toISOString();
    const actorStr = actor ? `${actor.name} (${actor.role})` : 'Administrator Persuratan';

    // 1. Nonaktifkan seluruh template aktif untuk jenis surat yang sama (termasuk template asal)
    templates.forEach(t => {
      if (t.letterTypeId === oldTemplate.letterTypeId && t.status === 'ACTIVE') {
        t.status = 'INACTIVE';
        t.updatedAt = nowIso;
        if (actor) {
          t.updatedBy = actorStr;
        }
      }
    });

    // Pastikan template asal tercatat sebagai INACTIVE di dalam list
    const oldIndex = templates.findIndex(t => t.id === oldTemplate.id);
    if (oldIndex >= 0) {
      templates[oldIndex].status = 'INACTIVE';
      templates[oldIndex].updatedAt = nowIso;
      if (actor) {
        templates[oldIndex].updatedBy = actorStr;
      }
    } else {
      templates.push({
        ...oldTemplate,
        status: 'INACTIVE',
        updatedAt: nowIso,
        updatedBy: actorStr
      });
    }

    // 2. Buat record template baru (IMMUTABLE RECORD)
    const newTemplate: LetterTemplate = {
      ...oldTemplate,
      id: newId,
      code: newCode,
      name: updates.name || oldTemplate.name,
      description: updates.description || oldTemplate.description,
      version: newVersion,
      status: updates.status || 'ACTIVE',
      variables: updates.variables ? [...updates.variables] : [...oldTemplate.variables],
      content: {
        ...oldTemplate.content,
        ...(updates.content || {})
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorStr,
      updatedBy: actorStr
    };

    // Tambahkan record baru di urutan teratas
    templates.unshift(newTemplate);
    this.saveLetterTemplates(templates);

    // 3. Catat Audit Log
    if (actor) {
      this.logLetterTemplateAudit({
        templateId: newTemplate.id,
        templateName: newTemplate.name,
        action: 'TEMPLATE_CREATED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        oldVersion: oldTemplate.version,
        newVersion: newTemplate.version,
        description: `Template ${newTemplate.name} versi ${newTemplate.version} dibuat dari ${oldTemplate.id}.`
      });
    }

    return newTemplate;
  },

  updateLetterTemplate(id: string, updates: Partial<LetterTemplate>, actor?: User): LetterTemplate | null {
    // ATURAN IMMUTABILITY (Stage 7.2D.1.1):
    // Jika terdapat perubahan KONTEN: Jangan lakukan in-place overwrite!
    // Alihkan otomatis ke createNewTemplateVersion untuk membuat record baru & menonaktifkan versi sebelumnya.
    if (updates.content) {
      return this.createNewTemplateVersion(id, updates, actor);
    }

    // Jika HANYA perubahan status atau metadata non-konten (misal: aktifkan/nonaktifkan):
    const templates = this.getLetterTemplates();
    let index = templates.findIndex(t => t.id === id);

    if (index === -1) {
      const def = DEFAULT_LETTER_TEMPLATES.find(t => t.id === id);
      if (!def) return null;
      templates.push({ ...def });
      index = templates.length - 1;
    }

    const oldTemplate = templates[index];
    const nowIso = new Date().toISOString();

    // Jika template diaktifkan, nonaktifkan template aktif lain untuk jenis surat yang sama
    if (updates.status === 'ACTIVE') {
      templates.forEach(t => {
        if (t.letterTypeId === oldTemplate.letterTypeId && t.id !== id && t.status === 'ACTIVE') {
          t.status = 'INACTIVE';
          t.updatedAt = nowIso;
        }
      });
    }

    const updated: LetterTemplate = {
      ...oldTemplate,
      ...updates,
      // Konten dan Versi TIDAK BOLEH BERUBAH jika bukan via createNewTemplateVersion
      content: oldTemplate.content,
      version: oldTemplate.version,
      updatedAt: nowIso,
      updatedBy: actor ? `${actor.name} (${actor.role})` : oldTemplate.updatedBy
    };

    templates[index] = updated;
    this.saveLetterTemplates(templates);

    if (actor) {
      this.logLetterTemplateAudit({
        templateId: updated.id,
        templateName: updated.name,
        action: updates.status === 'ACTIVE' 
          ? 'TEMPLATE_ACTIVATED' 
          : updates.status === 'INACTIVE' 
            ? 'TEMPLATE_DEACTIVATED' 
            : 'TEMPLATE_UPDATED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        oldVersion: oldTemplate.version,
        newVersion: updated.version,
        description: updates.status === 'ACTIVE'
          ? `Template "${updated.name}" (${updated.id}) versi ${updated.version} diaktifkan oleh ${actor.name}`
          : updates.status === 'INACTIVE'
            ? `Template "${updated.name}" (${updated.id}) versi ${updated.version} dinonaktifkan oleh ${actor.name}`
            : `Template "${updated.name}" (${updated.id}) diperbarui oleh ${actor.name}`
      });
    }

    return updated;
  },

  getLetterTemplateAuditLogs(): LetterTemplateAuditLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_TEMPLATE_AUDIT_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  logLetterTemplateAudit(entry: Omit<LetterTemplateAuditLogEntry, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getLetterTemplateAuditLogs();
      const newEntry: LetterTemplateAuditLogEntry = {
        ...entry,
        id: `log-tpl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      localStorage.setItem(STORAGE_KEYS.LETTER_TEMPLATE_AUDIT_LOGS, JSON.stringify(logs.slice(0, 300)));
    } catch (e) {
      console.error('Error logging letter template audit', e);
    }
  },

  // ── SISTEM PENOMORAN, PENERBITAN & ARSIP SURAT (TAHAP 6) ──
  getLetterNumberingConfig(): LetterNumberingConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_NUMBERING_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Pastikan master kode klasifikasi baru selalu sinkron
        parsed.classifications = {
          ...DEFAULT_LETTER_NUMBERING_CONFIG.classifications,
          ...(parsed.classifications || {})
        };
        return parsed;
      }
      this.saveLetterNumberingConfig(DEFAULT_LETTER_NUMBERING_CONFIG);
      return DEFAULT_LETTER_NUMBERING_CONFIG;
    } catch {
      return DEFAULT_LETTER_NUMBERING_CONFIG;
    }
  },

  saveLetterNumberingConfig(config: LetterNumberingConfig): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.LETTER_NUMBERING_CONFIG, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Error saving letter numbering config', e);
      return false;
    }
  },

  getLetterIssuances(): LetterIssuance[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_ISSUANCES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLetterIssuances(issuances: LetterIssuance[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.LETTER_ISSUANCES, JSON.stringify(issuances));
      return true;
    } catch (e) {
      console.error('Error saving letter issuances', e);
      return false;
    }
  },

  getLetterIssuanceById(id: string): LetterIssuance | undefined {
    return this.getLetterIssuances().find(i => i.id === id);
  },

  getLetterIssuanceByRequestId(letterRequestId: string): LetterIssuance | undefined {
    return this.getLetterIssuances().find(i => i.letterRequestId === letterRequestId);
  },

  getLetterIssuancesByPenduduk(pendudukId: string): LetterIssuance[] {
    if (!pendudukId) return [];
    return this.getLetterIssuances().filter(i => !i.isSuratDinas && i.pendudukId === pendudukId);
  },

  getLetterArchives(): LetterArchive[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LETTER_ARCHIVES);
      let archives: LetterArchive[] = stored ? JSON.parse(stored) : [];

      // Sinkronisasi otomatis dari letter issuances jika ada surat yang diterbitkan namun belum masuk ke arsip
      const issuances = this.getLetterIssuances();
      if (issuances.length > 0) {
        let hasNew = false;
        for (const iss of issuances) {
          const alreadyArchived = archives.some(
            a => a.issuanceId === iss.id || a.nomorSurat === iss.nomorSurat || a.letterRequestId === iss.letterRequestId
          );
          if (!alreadyArchived) {
            const req = this.getLetterRequestById(iss.letterRequestId);
            archives.unshift({
              id: `arc-${iss.id}`,
              letterRequestId: iss.letterRequestId,
              issuanceId: iss.id,
              letterTypeId: iss.letterTypeId,
              letterTypeCode: iss.letterTypeCode,
              letterTypeName: iss.letterTypeName,
              nomorSurat: iss.nomorSurat,
              nomorRegistrasi: iss.nomorRegistrasi,
              tanggalTerbit: iss.issuedAt,
              tahun: iss.tahun || new Date(iss.issuedAt).getFullYear(),
              pemohonNama: req?.isSuratDinas 
                ? (req.suratDinasData?.tujuanSurat ? `Tujuan: ${req.suratDinasData.tujuanSurat}` : 'Kedinasan Pemerintah Desa')
                : (req?.autoData?.nama || 'Warga Desa Beliti Jaya'),
              pemohonNik: req?.isSuratDinas ? '-' : (req?.autoData?.nik || '-'),
              pemohonDusun: req?.isSuratDinas ? '-' : (req?.autoData?.dusun || '-'),
              status: iss.status === 'REVOKED' ? 'REVOKED' : 'ISSUED',
              templateId: iss.templateId,
              templateVersion: iss.templateVersion,
              documentHash: iss.documentHash,
              verificationToken: iss.verificationToken,
              issuedBy: iss.issuedBy,
              issuedByRole: iss.issuedByRole,
              pdfFileName: iss.pdfFileName,
              isSuratDinas: iss.isSuratDinas || req?.isSuratDinas || false,
              perihal: iss.perihal || req?.suratDinasData?.perihal,
              createdAt: iss.createdAt,
              // Stage 7.2F.4: Snapshot penandatangan langsung dari LetterIssuance
              signatoryNameSnapshot: iss.signatoryName,
              signatoryRoleSnapshot: iss.signatoryRole,
              signatoryNipSnapshot: iss.signatoryNip
            });
            hasNew = true;
          }
        }
        if (hasNew) {
          this.saveLetterArchives(archives);
        }
      }

      // Pastikan deduplikasi arsip (1 record per issuance / nomor surat)
      const seenIssuances = new Set<string>();
      const seenNomorSurat = new Set<string>();
      const uniqueArchives: LetterArchive[] = [];
      let hadDuplicates = false;

      for (const arc of archives) {
        const issKey = arc.issuanceId;
        const noKey = arc.nomorSurat;
        if ((issKey && seenIssuances.has(issKey)) || (noKey && seenNomorSurat.has(noKey))) {
          hadDuplicates = true;
          continue;
        }
        if (issKey) seenIssuances.add(issKey);
        if (noKey) seenNomorSurat.add(noKey);
        uniqueArchives.push(arc);
      }

      if (hadDuplicates) {
        this.saveLetterArchives(uniqueArchives);
        return uniqueArchives;
      }

      return archives;
    } catch {
      return [];
    }
  },

  saveLetterArchives(archives: LetterArchive[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.LETTER_ARCHIVES, JSON.stringify(archives));
      return true;
    } catch (e) {
      console.error('Error saving letter archives', e);
      return false;
    }
  },

  getLetterArchiveById(id: string): LetterArchive | undefined {
    return this.getLetterArchives().find(a => a.id === id);
  },

  getLetterArchiveByRequestId(letterRequestId: string): LetterArchive | undefined {
    return this.getLetterArchives().find(a => a.letterRequestId === letterRequestId);
  },

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.KELUARGA);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUTH_LOGS);
    localStorage.removeItem(STORAGE_KEYS.ASET_DESA);
    localStorage.removeItem(STORAGE_KEYS.WARGA_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_WARGA);
    localStorage.removeItem(STORAGE_KEYS.WARGA_AUTH_LOGS);
    localStorage.removeItem(STORAGE_KEYS.WARGA_DATA_CHANGE_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.WARGA_DATA_CHANGE_LOGS);
    localStorage.removeItem(STORAGE_KEYS.LETTER_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.LETTER_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.LETTER_TYPES);
    localStorage.removeItem(STORAGE_KEYS.LETTER_TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.LETTER_TEMPLATE_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.LETTER_ISSUANCES);
    localStorage.removeItem(STORAGE_KEYS.LETTER_ARCHIVES);
    localStorage.removeItem(STORAGE_KEYS.LETTER_NUMBERING_CONFIG);
    this.saveKeluargaList(INITIAL_KELUARGA_DATA);
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    this.saveAuthLogs(INITIAL_AUTH_LOGS);
    this.saveAsetDesa(INITIAL_ASET_DESA);
    this.saveLetterTypes(DEFAULT_LETTER_TYPES);
    this.saveLetterTemplates(DEFAULT_LETTER_TEMPLATES);
    this.saveLetterNumberingConfig(DEFAULT_LETTER_NUMBERING_CONFIG);
  }
};
