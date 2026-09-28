export type UserRole = 'admin' | 'operator' | 'operator_aset';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  jabatan: string;
  avatar: string;
}

export type JenisKelamin = 'Laki-Laki' | 'Perempuan';
export type StatusPerkawinan = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
export type StatusHubunganKeluarga = 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
export type JenjangPendidikan = 'Tidak/Belum Sekolah' | 'SD' | 'SMP' | 'SMA' | 'Diploma (D1-D3)' | 'S1/Kuliah' | 'S2/S3';
export type StatusKematian = 'Hidup' | 'Meninggal';
export type StatusPenduduk = 'Tetap' | 'Sementara';
export type JenisBantuanSosial = 'PKH' | 'BPNT/Sembako' | 'BLT-Dana Desa' | 'Bansos Beras (PBP)' | 'PIP (Pendidikan)' | 'KIS/PBI-JK' | 'Tidak Menerima';
export type StatusKesejahteraan = 'Desil 1 (Sangat Miskin)' | 'Desil 2 (Miskin)' | 'Desil 3 (Hampir Miskin)' | 'Desil 4 (Rentan Miskin)' | 'Non-DTKS (Mampu)';
export type DusunWilayah = 'Dusun I' | 'Dusun II' | 'Dusun III' | 'Dusun IV';

export interface PerangkatDesa {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  nik?: string;
  noHp?: string;
  email?: string;
  foto?: string;
  kategori: 'Kepala Desa' | 'Sekretaris Desa' | 'Kasi' | 'Kaur' | 'Kepala Dusun' | 'BPD' | 'Lainnya';
  periode?: string;
  tugasPokok?: string;
}

export interface AparaturDesaItem extends PerangkatDesa {
  sambutan?: string;
  tingkatJabatan?: 'Pimpinan Utama' | 'Sekretariat' | 'Pelaksana Teknis' | 'Pelaksana Kewilayahan' | 'Badan Permusyawaratan';
}

export interface DesaProfile {
  namaDesa: string;
  kodeDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  alamatKantor: string;
  emailDesa: string;
  teleponDesa: string;
  logoDesa?: string;
  luasWilayahHa: number;
  luasWilayahKm2: number;
  kepalaDesa: {
    nama: string;
    nip?: string;
    nik?: string;
    noHp?: string;
    periode?: string;
    foto?: string;
    sambutan?: string;
  };
  sekretarisDesa: {
    nama: string;
    nip?: string;
    nik?: string;
    noHp?: string;
    periode?: string;
    foto?: string;
  };
  perangkatLainnya: PerangkatDesa[];
  batasWilayah: {
    utara: string;
    selatan: string;
    timur: string;
    barat: string;
  };
  visi?: string;
  misi?: string[];
  runningTextKiosk?: string;
  runningTextSpeed?: 'slow' | 'normal' | 'fast';
  updatedAt?: string;
  lastModifiedBy?: string;
}

export interface DesaProfileAuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'DESA_PROFILE_UPDATED';
  changedFields: string[];
  before: Record<string, any>;
  after: Record<string, any>;
  notes?: string;
}

export interface Penduduk {
  id: string;
  nik: string;
  noKk: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  agama: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
  statusPerkawinan: StatusPerkawinan;
  statusKeluarga: StatusHubunganKeluarga;
  pendidikan: JenjangPendidikan;
  pekerjaan: string;
  penghasilanBulanan: number;
  statusKematian: StatusKematian;
  statusPenduduk?: StatusPenduduk;
  tanggalMeninggal?: string;
  nomorTelepon?: string;
  foto: string;
  bantuanPribadi?: string[];
  disabilitas?: string;
}

export interface KondisiRumah {
  tipeBangunan: 'Permanen' | 'Semi Permanen' | 'Panggung Kayu' | 'Bambu/Papan';
  luasBangunanM2: number;
  sumberAirMinum: 'Sumur Bor' | 'Sumur Gali' | 'Mata Air' | 'Sungai Beliti' | 'PDAM/Depot';
  dayaListrik: '450 VA (Subsidi)' | '900 VA (Subsidi)' | '900 VA (Non Subsidi)' | '1300 VA+' | 'Tanpa Listrik';
  statusKepemilikan: 'Milik Sendiri' | 'Menumpang / Waris' | 'Sewa / Kontrak';
  kondisiLantai: 'Keramik' | 'Semen' | 'Papan Kayu' | 'Tanah';
  kondisiDinding: 'Tembok Bata' | 'Papan/Kayu' | 'Anyaman Bambu';
  fasilitasJamban: 'Milik Sendiri (Leher Angsa)' | 'Jamban Cemplung' | 'MCK Umum' | 'Tidak Ada';
}

export interface Keluarga {
  id: string;
  noKk: string;
  namaKepalaKeluarga: string;
  nikKepala: string;
  alamat: string;
  dusun: DusunWilayah;
  rt: string;
  rw: string;
  koordinat: {
    lat: number;
    lng: number;
  };
  statusKesejahteraan: StatusKesejahteraan;
  statusPenduduk?: StatusPenduduk;
  penerimaBansos: boolean;
  daftarBansos: JenisBantuanSosial[];
  totalNominalBantuanBulanan: number;
  fotoRumah: string;
  kondisiRumah: KondisiRumah;
  anggotaKeluarga: Penduduk[];
  catatanKhusus?: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
  statusVerifikasi: 'verified' | 'pending_approval' | 'rejected';
}

export interface VerificationNotification {
  id: string;
  type: 'create' | 'update' | 'delete';
  targetType: 'keluarga' | 'penduduk';
  targetId: string;
  targetNoKk?: string;
  targetName: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  previousData?: Partial<Keluarga>;
  proposedData?: Partial<Keluarga>;
}

export interface FilterOptions {
  searchQuery: string;
  dusun: string;
  statusBansos: 'semua' | 'penerima' | 'bukan_penerima';
  jenisBansos: string;
  statusKesejahteraan: string;
  jenisKelamin: string;
  statusKematian: string;
  statusPerkawinan: string;
  pendidikan: string;
  minPenghasilan: number;
  maxPenghasilan: number;
}

export interface RolePermissions {
  operatorOnlyAddKK: boolean; // Jika aktif, Operator HANYA dapat mengakses Tombol Tambah data KK & Titik Baru
  allowOperatorAnalytics: boolean;
  allowOperatorExport: boolean;
  allowOperatorEditKK: boolean;
  allowOperatorDeleteKK: boolean;
  allowOperatorVillageProfile: boolean;
  allowOnlyAdminAndOperatorAsetAdd?: boolean; // Fitur Tambah Aset hanya bisa diakses admin dan operator aset
  requirePasswordForBukuInventaris?: boolean; // Meminta password operator aset atau admin saat membuka buku inventaris
}

export type AuthActionType = 'LOGIN' | 'LOGOUT';

export interface AuthLogEntry {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userRole: UserRole;
  userJabatan: string;
  userAvatar?: string;
  action: AuthActionType;
  timestamp: string; // ISO string e.g. "2026-09-10T08:30:00.000Z"
  ipAddress?: string;
  device?: string;
  notes?: string;
}

// ── MANAJEMEN ASET DESA (Permendagri No. 1/2016) ──
export type KategoriAset = 'pembangunan' | 'non_pembangunan';
export type KondisiAset = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type StatusPemanfaatanAset = 'Digunakan Aktif' | 'Disewakan / Kerjasama' | 'Dalam Pemeliharaan' | 'Cadangan';
export type SumberDanaAset = 
  | 'Dana Desa (APBN)' 
  | 'Alokasi Dana Desa (ADD)' 
  | 'Bantuan Keuangan Provinsi' 
  | 'Pendapatan Asli Desa (PADes)' 
  | 'Hibah / Swadaya Masyarakat' 
  | 'Asal Usul Desa'
  | 'Penyertaan Modal BUMDes';

export interface AsetDesa {
  id: string;
  namaAset: string;
  kodeRegister: string; // Contoh: KIB-C/001/BLT/2022
  kategori: KategoriAset; // 'pembangunan' (fisik/konstruksi) vs 'non_pembangunan' (tanah kas, alami, kendaraan, mesin)
  subKategori: string; // misal: 'Gedung Publik', 'Jalan & Jembatan', 'Tanah Kas Desa', 'Kendaraan Siaga', 'Peralatan/Mesin', 'Embung Alami'
  tahunPengadaan: number;
  sumberDana: SumberDanaAset;
  nilaiPerolehan: number; // Nilai rupiah
  kondisi: KondisiAset;
  dusun: DusunWilayah;
  koordinat: {
    lat: number;
    lng: number;
  };
  luasAtauVolume?: string; // misal: '450 m²', '1.200 meter', '1 Unit Mobil', '2,4 Hektar'
  penanggungJawab: string;
  statusPemanfaatan: StatusPemanfaatanAset;
  keterangan?: string;
  foto: string; // Foto utama (tampak depan/sampul)
  fotoList?: string[]; // Minimal 4 link foto dokumentasi aset
  createdAt?: string;
  updatedAt?: string;
}

// ── ANJUNGAN MANDIRI & AKUN WARGA (TAHAP 2 & 3) ──
export interface WargaAccount {
  id: string;
  pendudukId: string; // Menunjuk langsung ke data Penduduk existing (Source of Truth)
  nik: string;
  pinHash: string;
  pinSalt: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
}

export interface WargaSession {
  wargaAccountId: string;
  pendudukId: string;
  nik: string;
  nama: string;
  loginAt: string;
}

export type WargaAuthActionType = 
  | 'WARGA_ACTIVATED'
  | 'WARGA_LOGIN_SUCCESS'
  | 'WARGA_LOGIN_FAILED'
  | 'WARGA_LOGOUT';

export interface WargaAuthLogEntry {
  id: string;
  wargaAccountId?: string;
  pendudukId?: string;
  nik: string;
  nama?: string;
  action: WargaAuthActionType;
  timestamp: string;
  ipAddress?: string;
  device?: string;
  notes?: string;
}

// ── PELAPORAN PERUBAHAN DATA KEPENDUDUKAN (TAHAP 3) ──
export type WargaDataChangeStatus = 'menunggu' | 'diverifikasi' | 'disetujui' | 'ditolak' | 'dibatalkan';

export interface WargaFieldChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface WargaDataChangeRequest {
  id: string;
  wargaAccountId: string;
  pendudukId: string;
  nik: string;
  namaPenduduk: string;
  noKk: string;
  submittedAt: string;
  updatedAt: string;
  status: WargaDataChangeStatus;
  changes: WargaFieldChange[];
  alasan: string;
  catatanWarga?: string;
  catatanOperator?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  lampiranBukti?: string;
}

export type WargaDataChangeLogAction = 
  | 'DATA_CHANGE_REQUEST_CREATED'
  | 'DATA_CHANGE_REQUEST_REVIEWED'
  | 'DATA_CHANGE_REQUEST_APPROVED'
  | 'DATA_CHANGE_REQUEST_REJECTED'
  | 'DATA_CHANGE_REQUEST_CANCELLED'
  | 'DATA_CHANGE_APPLIED';

export interface WargaDataChangeLogEntry {
  id: string;
  timestamp: string;
  actorType: 'warga' | 'aparatur';
  actorId: string;
  actorName: string;
  targetPendudukId: string;
  requestId: string;
  action: WargaDataChangeLogAction;
  notes?: string;
}

// ── LAYANAN SURAT MENYURAT MANDIRI (TAHAP 4) ──
export type WorkflowLevel = 'LEVEL_1_INSTAN' | 'LEVEL_2_VERIFIKASI' | 'LEVEL_3_PERSETUJUAN';

export type LetterRequestStatus = 
  | 'DRAFT'
  | 'MENUNGGU_VERIFIKASI'
  | 'DIVERIFIKASI'
  | 'MENUNGGU_PERSETUJUAN'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'DIBATALKAN'
  | 'SIAP_DITERBITKAN'
  | 'TERBIT';

export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'readonly';

export interface LetterFormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface LetterType {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'kependudukan' | 'usaha' | 'sosial' | 'umum' | 'dinas';
  workflowLevel: WorkflowLevel;
  estimatedTime: string;
  active: boolean;
  requiredFields: LetterFormFieldConfig[];
  requirements: string[];
  classificationCode?: string;
  createdAt: string;
  updatedAt: string;
}

export type SuratDinasSifat = 'Biasa' | 'Penting' | 'Segera' | 'Rahasia';

export interface SuratDinasData {
  tujuanSurat: string;
  instansiTujuan?: string;
  alamatTujuan?: string;
  sifatSurat?: SuratDinasSifat;
  lampiran?: string;
  perihal: string;
  isiSurat?: string;
  tembusan?: string[];
  catatanInternal?: string;
}

export interface LetterAutoDataSnapshot {
  nama: string;
  nik: string;
  noKk: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  statusPerkawinan: string;
  statusKeluarga: string;
  pekerjaan: string;
  pendidikan: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  telepon?: string;
}

export interface LetterRequest {
  id: string;
  wargaAccountId?: string;
  pendudukId?: string;
  letterTypeId: string;
  letterTypeCode: string;
  letterTypeName: string;
  submittedAt: string;
  updatedAt: string;
  status: LetterRequestStatus;
  workflowLevel: WorkflowLevel;
  autoData?: LetterAutoDataSnapshot;
  formData: Record<string, any>;
  confirmedRequirements: string[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  nomorSurat?: string;
  publishedAt?: string;
  templateId?: string;
  templateVersion?: number;
  createdByType?: 'WARGA' | 'APARATUR';
  createdByActorId?: string;
  createdByActorName?: string;
  createdByRole?: string;
  isSuratDinas?: boolean;
  suratDinasData?: SuratDinasData;
}

export type LetterAuditAction = 
  | 'LETTER_REQUEST_CREATED'
  | 'LETTER_REQUEST_CANCELLED'
  | 'LETTER_REQUEST_REVIEWED'
  | 'LETTER_REQUEST_APPROVED'
  | 'LETTER_REQUEST_REJECTED'
  | 'LETTER_ISSUED'
  | 'LETTER_NUMBER_ASSIGNED'
  | 'LETTER_PDF_GENERATED'
  | 'LETTER_PRINTED'
  | 'LETTER_DOWNLOADED'
  | 'LETTER_REVOKED'
  | 'LETTER_VERIFIED';

export interface LetterAuditLogEntry {
  id: string;
  timestamp: string;
  actorType: 'warga' | 'aparatur';
  actorId: string;
  actorName: string;
  letterRequestId: string;
  letterTypeCode: string;
  action: LetterAuditAction;
  notes?: string;
  issuanceId?: string;
}

// ── MASTER TEMPLATE SURAT & DOKUMEN (TAHAP 5) ──
export type LetterTemplateStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface LetterCustomDisplayField {
  label: string;
  variableKey: string;
  prefix?: string;
  suffix?: string;
}

export interface LetterTemplateContent {
  title: string;
  codePrefix?: string;
  letterNumberFormat: string;
  opening: string;
  bodyParagraphs: string[];
  closing: string;
  signatoryRole: string;
  signatoryName?: string;
  signatoryNip?: string;
  customDisplayFields?: LetterCustomDisplayField[];
}

export interface LetterTemplate {
  id: string;
  letterTypeId: string;
  name: string;
  code: string;
  description: string;
  version: number;
  status: LetterTemplateStatus;
  content: LetterTemplateContent;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type LetterTemplateAuditAction = 
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_UPDATED'
  | 'TEMPLATE_ACTIVATED'
  | 'TEMPLATE_DEACTIVATED';

export interface LetterTemplateAuditLogEntry {
  id: string;
  templateId: string;
  templateName?: string;
  action: LetterTemplateAuditAction;
  actorId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  description: string;
  oldVersion?: number;
  newVersion?: number;
}

// ── PENERBITAN SURAT RESMI, PENOMORAN & ARSIP (TAHAP 6) ──
export type LetterIssuanceStatus = 'DRAFT' | 'READY_TO_ISSUE' | 'ISSUED' | 'CANCELLED' | 'REVOKED';

export interface LetterIssuance {
  id: string;
  letterRequestId: string;
  letterTypeId: string;
  letterTypeCode: string;
  letterTypeName: string;
  templateId: string;
  templateVersion: number;
  nomorSurat: string;
  nomorRegistrasi: string;
  urutanNomor: number;
  tahun: number;
  kodeKlasifikasi: string;
  issuedAt: string;
  issuedBy: string;
  issuedByRole: string;
  actorId?: string;
  wargaAccountId?: string;
  pendudukId?: string;
  documentHash: string;
  verificationToken: string;
  verificationUrl: string;
  signatureType: 'NONE' | 'IMAGE' | 'MANUAL';
  signatoryName: string;
  signatoryRole: string;
  signatoryNip?: string;
  status: LetterIssuanceStatus;
  pdfFileName: string;
  pdfGeneratedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  isSuratDinas?: boolean;
  perihal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LetterArchive {
  id: string;
  letterRequestId: string;
  issuanceId: string;
  letterTypeId: string;
  letterTypeCode: string;
  letterTypeName: string;
  nomorSurat: string;
  nomorRegistrasi: string;
  tanggalTerbit: string;
  tahun: number;
  pemohonNama: string;
  pemohonNik: string;
  pemohonDusun: string;
  status: LetterIssuanceStatus;
  templateId: string;
  templateVersion: number;
  documentHash: string;
  verificationToken: string;
  issuedBy: string;
  issuedByRole: string;
  pdfFileName: string;
  isSuratDinas?: boolean;
  perihal?: string;
  createdAt: string;
  // Snapshot penandatangan historis pada saat surat diterbitkan (Stage 7.2F.4)
  signatoryNameSnapshot?: string;
  signatoryRoleSnapshot?: string;
  signatoryNipSnapshot?: string;
}

export interface LetterNumberingConfig {
  format: string; // e.g. "{{kode_klasifikasi}} / {{nomor_urut}} / {{kode_desa}} / {{bulan_romawi}} / {{tahun}}"
  kodeDesa: string; // "2008" (register desa Beliti Jaya di kecamatan)
  paddingDigits: number; // 4 -> "0001"
  resetTahunan: boolean;
  tahunBerjalan: number;
  counterByYear: Record<string, number>; // e.g. { "2026": 0 }
  classifications: Record<string, string>; // e.g. { "SK_DOMISILI": "470", "SK_USAHA": "503", ... }
}



