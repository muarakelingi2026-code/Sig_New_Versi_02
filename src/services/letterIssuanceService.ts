import CryptoJS from 'crypto-js';
import { 
  LetterRequest, 
  LetterIssuance, 
  LetterArchive, 
  LetterNumberingConfig, 
  User, 
  DesaProfile, 
  LetterTemplate 
} from '../types';
import { StorageService } from './storageService';
import { getRomanMonth, resolveLetterVariables } from '../utils/letterVariableResolver';

export const LetterIssuanceService = {
  /**
   * Inti komputasi nomor surat resmi (critical section)
   * Selalu membaca ulang LetterNumberingConfig segar dari storage (BAGIAN F: Fresh Config)
   */
  generateNextLetterNumberSync(letterTypeCode: string, customDate?: Date): {
    nomorSurat: string;
    nomorRegistrasi: string;
    urutanNomor: number;
    tahun: number;
    kodeKlasifikasi: string;
  } {
    const config = StorageService.getLetterNumberingConfig();
    const date = customDate || new Date();
    const tahun = date.getFullYear();
    const tahunStr = String(tahun);

    // Dapatkan counter tahunan (reset tahunan jika tahun berganti)
    const currentCounters = config.counterByYear || {};
    const previousCounter = currentCounters[tahunStr] || 0;
    const urutanNomor = previousCounter + 1;

    // Simpan counter terbaru
    currentCounters[tahunStr] = urutanNomor;
    config.counterByYear = currentCounters;
    config.tahunBerjalan = tahun;
    const configSaved = StorageService.saveLetterNumberingConfig(config);
    if (!configSaved) {
      console.error('[CRITICAL] Gagal menyimpan LetterNumberingConfig ke storage');
      return null;
    }

    // Ambil kode klasifikasi surat (misal: SK_DOMISILI -> 470, SK_USAHA -> 503, dll)
    const kodeKlasifikasi = config.classifications[letterTypeCode] || '470';

    // Format nomor urut dengan padding
    const padding = config.paddingDigits || 4;
    const nomorPadded = String(urutanNomor).padStart(padding, '0');

    const bulanRomawi = getRomanMonth(date);
    const kodeDesa = config.kodeDesa || '2008';

    // Format Nomor Surat Resmi: {{kode_klasifikasi}} / {{nomor_urut}} / {{kode_desa}} / {{bulan_romawi}} / {{tahun}}
    let nomorSurat = config.format || '{{kode_klasifikasi}} / {{nomor_urut}} / {{kode_desa}} / {{bulan_romawi}} / {{tahun}}';
    nomorSurat = nomorSurat
      .replace('{{kode_klasifikasi}}', kodeKlasifikasi)
      .replace('{{nomor_urut}}', nomorPadded)
      .replace('{{nomor}}', nomorPadded)
      .replace('{{kode_desa}}', kodeDesa)
      .replace('{{bulan_romawi}}', bulanRomawi)
      .replace('{{tahun}}', tahunStr);

    const nomorRegistrasi = `REG-${tahunStr}-${nomorPadded}`;

    return {
      nomorSurat,
      nomorRegistrasi,
      urutanNomor,
      tahun,
      kodeKlasifikasi
    };
  },

  /**
   * Menghasilkan nomor urut dan nomor surat resmi unik sesuai LetterNumberingConfig
   * Dilindungi dengan Web Locks API (navigator.locks) untuk mencegah race-condition antar-tab (HIGH-01)
   */
  async generateNextLetterNumber(letterTypeCode: string, customDate?: Date): Promise<{
    nomorSurat: string;
    nomorRegistrasi: string;
    urutanNomor: number;
    tahun: number;
    kodeKlasifikasi: string;
  } | null> {
    // Feature detection: Web Locks API
    if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks?.request) {
      return await navigator.locks.request('sig_letter_numbering_mutex', async () => {
        // Critical section: Hanya dijalankan satu per satu antar-tab browser
        return this.generateNextLetterNumberSync(letterTypeCode, customDate);
      });
    }

    // Fallback: Jika Web Locks API tidak didukung browser / runtime
    return this.generateNextLetterNumberSync(letterTypeCode, customDate);
  },

  /**
   * Menghasilkan token verifikasi yang aman dan tidak dapat ditebak
   */
  generateVerificationToken(letterRequestId: string, nomorSurat: string): string {
    const seed = `${letterRequestId}-${nomorSurat}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const hash = CryptoJS.SHA256(seed).toString(CryptoJS.enc.Hex);
    return `vtok_${hash.substring(0, 24)}`;
  },

  /**
   * Menghasilkan URL verifikasi publik berbasis origin aplikasi saat runtime (bukan hardcoded localhost)
   */
  generateVerificationUrl(verificationToken: string): string {
    let baseUrl = '';
    if (typeof window !== 'undefined' && window.location) {
      baseUrl = window.location.origin + window.location.pathname;
    }
    // Jika baseUrl berakhir dengan slash, rapikan
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return `${baseUrl}?verify=${encodeURIComponent(verificationToken)}`;
  },

  /**
   * Menghasilkan hash kriptografis SHA-256 atas isi kanonikal dokumen surat
   */
  generateDocumentHash(params: {
    nomorSurat: string;
    nik: string;
    nama: string;
    letterTypeCode: string;
    issuedAt: string;
    signatoryName: string;
  }): string {
    const payload = `${params.nomorSurat}|${params.nik}|${params.nama}|${params.letterTypeCode}|${params.issuedAt}|${params.signatoryName}`;
    return CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
  },

  /**
   * FUNGSI TRANSAKSI UTAMA PENERBITAN SURAT RESMI (IDEMPOTEN)
   * Mengonversi LetterRequest menjadi LetterIssuance + Arsip Resmi + Nomor Surat Unik
   */
  async issueLetter(params: {
    letterRequestId: string;
    actor?: {
      id: string;
      name: string;
      role: string;
    };
  }): Promise<{ success: boolean; issuance?: LetterIssuance; error?: string }> {
    const { letterRequestId, actor } = params;

    // Defense in depth (HIGH-02): Operator Aset tidak diperbolehkan menerbitkan surat
    if (actor && actor.role === 'operator_aset') {
      return { success: false, error: 'Operator Aset tidak memiliki izin untuk menerbitkan surat.' };
    }

    // 1. Ambil data LetterRequest
    const req = StorageService.getLetterRequestById(letterRequestId);
    if (!req) {
      return { success: false, error: 'Pengajuan surat tidak ditemukan di sistem.' };
    }

    // 2. PROTEKSI DUPLIKASI & REKONSILIASI PENERBITAN (STAGE 7.2G.3A)
    // Jika sudah pernah diterbitkan, lakukan rekonsiliasi state (Request & Archive) lalu kembalikan issuance eksisting
    const existingIssuance = StorageService.getLetterIssuanceByRequestId(letterRequestId);
    if (existingIssuance) {
      if (existingIssuance.status === 'REVOKED') {
        return { 
          success: false, 
          error: 'Surat untuk pengajuan ini telah dicabut (REVOKED) dan tidak dapat diterbitkan ulang.' 
        };
      }

      if (existingIssuance.status === 'ISSUED') {
        // Rekonsiliasi 1: Sinkronisasi Status LetterRequest jika belum TERBIT atau desinkron
        const nowIso = new Date().toISOString();
        let requestNeedsUpdate = false;
        
        if (
          req.status !== 'TERBIT' ||
          req.nomorSurat !== existingIssuance.nomorSurat ||
          !req.publishedAt ||
          req.templateId !== existingIssuance.templateId
        ) {
          req.status = 'TERBIT';
          req.nomorSurat = existingIssuance.nomorSurat;
          req.publishedAt = req.publishedAt || existingIssuance.issuedAt;
          req.templateId = existingIssuance.templateId;
          req.templateVersion = existingIssuance.templateVersion;
          req.updatedAt = nowIso;
          requestNeedsUpdate = true;
        }

        if (requestNeedsUpdate) {
          const allRequests = StorageService.getLetterRequests();
          const reqIndex = allRequests.findIndex(r => r.id === req.id);
          if (reqIndex >= 0) {
            allRequests[reqIndex] = req;
            const reqSaved = StorageService.saveLetterRequests(allRequests);
            if (!reqSaved) {
              console.error('[CRITICAL] Gagal memperbarui status LetterRequest saat rekonsiliasi');
              return {
                success: false,
                error: 'Gagal memperbarui status pengajuan saat rekonsiliasi. Silakan ulangi.'
              };
            }
          }
        }

        // Rekonsiliasi 2: Pastikan LetterArchive untuk issuanceId ini ada (tanpa duplikasi)
        const archives = StorageService.getLetterArchives();
        const archiveExists = archives.some(
          a => a.issuanceId === existingIssuance.id || a.nomorSurat === existingIssuance.nomorSurat || a.letterRequestId === req.id
        );

        if (!archiveExists) {
          const reconstructedArchive: LetterArchive = {
            id: `arc-${existingIssuance.id}`,
            letterRequestId: req.id,
            issuanceId: existingIssuance.id,
            letterTypeId: existingIssuance.letterTypeId,
            letterTypeCode: existingIssuance.letterTypeCode,
            letterTypeName: existingIssuance.letterTypeName,
            nomorSurat: existingIssuance.nomorSurat,
            nomorRegistrasi: existingIssuance.nomorRegistrasi,
            tanggalTerbit: existingIssuance.issuedAt,
            tahun: existingIssuance.tahun || new Date(existingIssuance.issuedAt).getFullYear(),
            pemohonNama: req.isSuratDinas 
              ? (req.suratDinasData?.tujuanSurat ? `Tujuan: ${req.suratDinasData.tujuanSurat}` : 'Kedinasan Pemerintah Desa')
              : (req.autoData?.nama || 'Warga Desa Beliti Jaya'),
            pemohonNik: req.isSuratDinas ? '-' : (req.autoData?.nik || '-'),
            pemohonDusun: req.isSuratDinas ? '-' : (req.autoData?.dusun || '-'),
            isSuratDinas: req.isSuratDinas || existingIssuance.isSuratDinas || false,
            perihal: req.isSuratDinas ? req.suratDinasData?.perihal : existingIssuance.perihal,
            status: 'ISSUED',
            templateId: existingIssuance.templateId,
            templateVersion: existingIssuance.templateVersion,
            documentHash: existingIssuance.documentHash,
            verificationToken: existingIssuance.verificationToken,
            issuedBy: existingIssuance.issuedBy,
            issuedByRole: existingIssuance.issuedByRole,
            pdfFileName: existingIssuance.pdfFileName,
            createdAt: existingIssuance.createdAt,
            signatoryNameSnapshot: existingIssuance.signatoryName,
            signatoryRoleSnapshot: existingIssuance.signatoryRole,
            signatoryNipSnapshot: existingIssuance.signatoryNip
          };

          archives.unshift(reconstructedArchive);
          const arcSaved = StorageService.saveLetterArchives(archives);
          if (!arcSaved) {
            console.error('[CRITICAL] Gagal menyimpan rekonstruksi LetterArchive saat rekonsiliasi');
            return {
              success: false,
              error: 'Gagal menyimpan rekonsiliasi arsip surat. Silakan ulangi.'
            };
          }
        }

        // Return issuance eksisting secara idempoten tanpa alokasi nomor baru, perubahan counter, atau audit ganda
        return { success: true, issuance: existingIssuance };
      }
    }

    // 3. Validasi kelayakan status workflow
    // Status yang diizinkan untuk diterbitkan: SIAP_DITERBITKAN, DISETUJUI, atau LEVEL 1 INSTAN
    const isLevel1 = req.workflowLevel === 'LEVEL_1_INSTAN';
    const isAllowedStatus = req.status === 'SIAP_DITERBITKAN' || req.status === 'DISETUJUI' || isLevel1;

    if (!isAllowedStatus) {
      return { 
        success: false, 
        error: `Pengajuan surat dengan status "${req.status}" belum memenuhi syarat untuk diterbitkan.` 
      };
    }

    // 4. Ambil template aktif
    const template = req.templateId 
      ? StorageService.getLetterTemplateById(req.templateId) 
      : StorageService.getActiveLetterTemplateByType(req.letterTypeId);

    if (!template || template.status !== 'ACTIVE') {
      const errorMsg = req.isSuratDinas
        ? `TEMPLATE_SURAT_DINAS_BELUM_TERSEDIA: Template resmi belum terdaftar atau belum aktif untuk Surat Dinas "${req.letterTypeName}".`
        : `Template surat aktif belum tersedia untuk "${req.letterTypeName}".`;
      return { 
        success: false, 
        error: errorMsg 
      };
    }

    const templateId = template.id;
    const templateVersion = template.version;

    // 5. Ambil data DesaProfile untuk pejabat penandatangan aktif
    const desaProfile = StorageService.getDesaProfile();
    const namaKades = desaProfile.kepalaDesa?.nama || '';
    const nipKades = desaProfile.kepalaDesa?.nip || undefined;

    // 6. Generate Nomor Surat Resmi Unik dengan Web Locks Mutex (HIGH-01)
    const now = new Date();
    const nowIso = now.toISOString();
    const numResult = await this.generateNextLetterNumber(req.letterTypeCode, now);
    if (!numResult) {
      return {
        success: false,
        error: 'Gagal menyimpan nomor surat. Surat belum diterbitkan.'
      };
    }
    const { nomorSurat, nomorRegistrasi, urutanNomor, tahun, kodeKlasifikasi } = numResult;

    // 7. Generate Verification Token & URL
    const verificationToken = this.generateVerificationToken(req.id, nomorSurat);
    const verificationUrl = this.generateVerificationUrl(verificationToken);

    // 8. Generate Document Hash
    const documentHash = this.generateDocumentHash({
      nomorSurat,
      nik: req.isSuratDinas ? '-' : (req.autoData?.nik || '-'),
      nama: req.isSuratDinas ? (req.suratDinasData?.tujuanSurat || 'Pemerintah Desa Beliti Jaya') : (req.autoData?.nama || '-'),
      letterTypeCode: req.letterTypeCode,
      issuedAt: nowIso,
      signatoryName: namaKades
    });

    // 9. Format Nama File PDF Bersih
    // Contoh: Surat_Keterangan_Domisili_470-0001-IX-2026.pdf
    const sanitizedNumber = nomorSurat.replace(/[\/\s]+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedTypeName = req.letterTypeName.replace(/[\/\s]+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const pdfFileName = `${sanitizedTypeName}_${sanitizedNumber}.pdf`;

    // 10. Tentukan metadata penerbit
    const issuedBy = actor?.name || (isLevel1 ? 'Sistem Otomatis (Level 1 Instan)' : 'Pemerintah Desa Beliti Jaya');
    const issuedByRole = actor?.role || (isLevel1 ? 'SISTEM_OTOMATIS' : 'KEPALA_DESA');

    // 11. Buat Record LetterIssuance
    const issuance: LetterIssuance = {
      id: `iss-srt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      letterRequestId: req.id,
      letterTypeId: req.letterTypeId,
      letterTypeCode: req.letterTypeCode,
      letterTypeName: req.letterTypeName,
      templateId,
      templateVersion,
      nomorSurat,
      nomorRegistrasi,
      urutanNomor,
      tahun,
      kodeKlasifikasi,
      issuedAt: nowIso,
      issuedBy,
      issuedByRole,
      actorId: actor?.id,
      wargaAccountId: req.wargaAccountId,
      pendudukId: req.pendudukId,
      documentHash,
      verificationToken,
      verificationUrl,
      signatureType: 'MANUAL', // Penandatanganan administratif manual & stempel resmi desa Beliti Jaya
      signatoryName: namaKades,
      signatoryRole: template.content.signatoryRole || 'Kepala Desa Beliti Jaya',
      signatoryNip: nipKades,
      status: 'ISSUED',
      pdfFileName,
      pdfGeneratedAt: nowIso,
      isSuratDinas: req.isSuratDinas || false,
      perihal: req.isSuratDinas ? req.suratDinasData?.perihal : undefined,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Simpan ke storage issuance (Critical Write 1)
    const issuances = StorageService.getLetterIssuances();
    issuances.unshift(issuance);
    const issuanceSaved = StorageService.saveLetterIssuances(issuances);
    if (!issuanceSaved) {
      console.error('[CRITICAL] Gagal menyimpan LetterIssuance ke storage');
      return {
        success: false,
        error: 'Gagal menyimpan data penerbitan surat. Surat belum dianggap terbit.'
      };
    }

    // 12. Buat Record LetterArchive (Arsip Surat Resmi) (Critical Write 2)
    const archive: LetterArchive = {
      id: `arc-srt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      letterRequestId: req.id,
      issuanceId: issuance.id,
      letterTypeId: req.letterTypeId,
      letterTypeCode: req.letterTypeCode,
      letterTypeName: req.letterTypeName,
      nomorSurat,
      nomorRegistrasi,
      tanggalTerbit: nowIso,
      tahun,
      pemohonNama: req.isSuratDinas 
        ? (req.suratDinasData?.tujuanSurat ? `Tujuan: ${req.suratDinasData.tujuanSurat}` : 'Kedinasan Pemerintah Desa')
        : (req.autoData?.nama || 'Warga Desa Beliti Jaya'),
      pemohonNik: req.isSuratDinas ? '-' : (req.autoData?.nik || '-'),
      pemohonDusun: req.isSuratDinas ? '-' : (req.autoData?.dusun || '-'),
      isSuratDinas: req.isSuratDinas || false,
      perihal: req.isSuratDinas ? req.suratDinasData?.perihal : undefined,
      status: 'ISSUED',
      templateId,
      templateVersion,
      documentHash,
      verificationToken,
      issuedBy,
      issuedByRole,
      pdfFileName,
      createdAt: nowIso,
      // Stage 7.2F.4: Snapshot penandatangan historis langsung bersumber dari LetterIssuance
      signatoryNameSnapshot: issuance.signatoryName,
      signatoryRoleSnapshot: issuance.signatoryRole,
      signatoryNipSnapshot: issuance.signatoryNip
    };

    const archives = StorageService.getLetterArchives();
    const existingArcIdx = archives.findIndex(
      a => a.issuanceId === issuance.id || a.letterRequestId === req.id || a.nomorSurat === nomorSurat
    );
    if (existingArcIdx >= 0) {
      archives[existingArcIdx] = archive;
    } else {
      archives.unshift(archive);
    }
    const archiveSaved = StorageService.saveLetterArchives(archives);
    if (!archiveSaved) {
      console.error('[CRITICAL] Gagal menyimpan LetterArchive ke storage');
      return {
        success: false,
        error: 'Gagal menyimpan arsip surat. Penerbitan tersimpan dan dapat direkonsiliasi.'
      };
    }

    // 13. Perbarui Status LetterRequest Menjadi 'TERBIT' (Critical Write 3)
    req.status = 'TERBIT';
    req.nomorSurat = nomorSurat;
    req.publishedAt = nowIso;
    req.templateId = templateId;
    req.templateVersion = templateVersion;
    req.updatedAt = nowIso;

    const allRequests = StorageService.getLetterRequests();
    const reqIndex = allRequests.findIndex(r => r.id === req.id);
    if (reqIndex >= 0) {
      allRequests[reqIndex] = req;
      const requestSaved = StorageService.saveLetterRequests(allRequests);
      if (!requestSaved) {
        console.error('[CRITICAL] Gagal memperbarui status LetterRequest ke storage');
        return {
          success: false,
          error: 'Gagal memperbarui status pengajuan. Penerbitan dan arsip tersimpan; silakan jalankan proses penerbitan kembali untuk rekonsiliasi.'
        };
      }
    }

    // 14. Log Audit Penerbitan (Non-fatal: kegagalan audit log tidak membatalkan penerbitan sah)
    try {
      StorageService.logLetterAudit({
        actorType: actor ? 'aparatur' : 'warga',
        actorId: actor?.id || req.wargaAccountId,
        actorName: issuedBy,
        letterRequestId: req.id,
        letterTypeCode: req.letterTypeCode,
        action: 'LETTER_ISSUED',
        notes: `Surat ${req.letterTypeName} diterbitkan dengan nomor resmi ${nomorSurat} (Reg: ${nomorRegistrasi}).`,
        issuanceId: issuance.id
      });

      StorageService.logLetterAudit({
        actorType: 'aparatur',
        actorId: actor?.id || 'system',
        actorName: issuedBy,
        letterRequestId: req.id,
        letterTypeCode: req.letterTypeCode,
        action: 'LETTER_NUMBER_ASSIGNED',
        notes: `Alokasi nomor registrasi ${nomorSurat} berhasil dicatat pada buku arsip tahun ${tahun}.`,
        issuanceId: issuance.id
      });
    } catch (auditErr) {
      console.warn('[AUDIT WARNING] Gagal mencatat audit log penerbitan surat:', auditErr);
    }

    return { success: true, issuance };
  },

  /**
   * Pencabutan Surat Resmi (Hanya oleh Aparatur Berwenang)
   */
  revokeLetter(params: {
    issuanceId: string;
    revocationReason: string;
    actor: User;
  }): { success: boolean; error?: string } {
    const { issuanceId, revocationReason, actor } = params;

    if (!revocationReason || revocationReason.trim() === '') {
      return { success: false, error: 'Alasan pencabutan surat wajib dicantumkan.' };
    }

    const issuances = StorageService.getLetterIssuances();
    const issuanceIndex = issuances.findIndex(i => i.id === issuanceId);
    if (issuanceIndex === -1) {
      return { success: false, error: 'Dokumen penerbitan surat tidak ditemukan.' };
    }

    const issuance = issuances[issuanceIndex];
    if (issuance.status === 'REVOKED') {
      return { success: false, error: 'Surat ini sudah dicabut sebelumnya.' };
    }

    const now = new Date().toISOString();
    issuance.status = 'REVOKED';
    issuance.revokedAt = now;
    issuance.revokedBy = `${actor.name} (${actor.role})`;
    issuance.revocationReason = revocationReason;
    issuance.updatedAt = now;

    issuances[issuanceIndex] = issuance;
    const issSaved = StorageService.saveLetterIssuances(issuances);
    if (!issSaved) {
      return { success: false, error: 'Gagal memperbarui status pencabutan surat ke storage.' };
    }

    // Update juga di LetterArchive
    const archives = StorageService.getLetterArchives();
    const arcIndex = archives.findIndex(a => a.issuanceId === issuanceId);
    if (arcIndex >= 0) {
      archives[arcIndex].status = 'REVOKED';
      StorageService.saveLetterArchives(archives);
    }

    // Log audit pencabutan
    StorageService.logLetterAudit({
      actorType: 'aparatur',
      actorId: actor.id,
      actorName: actor.name,
      letterRequestId: issuance.letterRequestId,
      letterTypeCode: issuance.letterTypeCode,
      action: 'LETTER_REVOKED',
      notes: `Surat nomor ${issuance.nomorSurat} dicabut oleh ${actor.name}. Alasan: "${revocationReason}"`,
      issuanceId: issuance.id
    });

    return { success: true };
  },

  /**
   * Verifikasi Keabsahan Surat Publik Berdasarkan Verification Token atau Nomor Registrasi
   * Menampilkan data terbatas/non-sensitif (sesuai poin 16 prinsip privasi)
   */
  verifyLetter(tokenOrNumber: string): {
    status: 'VALID' | 'REVOKED' | 'NOT_FOUND';
    issuance?: LetterIssuance;
    maskedNik?: string;
    pemohonNama?: string;
    verifiedAt: string;
  } {
    const trimmed = (tokenOrNumber || '').trim();
    if (!trimmed) {
      return { status: 'NOT_FOUND', verifiedAt: new Date().toISOString() };
    }

    const issuances = StorageService.getLetterIssuances();
    const found = issuances.find(i => 
      i.verificationToken === trimmed || 
      i.nomorSurat === trimmed || 
      i.nomorRegistrasi.toUpperCase() === trimmed.toUpperCase() ||
      i.id === trimmed
    );

    if (!found) {
      return { status: 'NOT_FOUND', verifiedAt: new Date().toISOString() };
    }

    // Dapatkan data pemohon terkait untuk masking NIK
    const req = StorageService.getLetterRequestById(found.letterRequestId);
    let pemohonNama = found.signatoryName;
    let maskedNik = '160501******0001';

    if (req) {
      if (req.isSuratDinas) {
        pemohonNama = req.suratDinasData?.tujuanSurat ? `Tujuan: ${req.suratDinasData.tujuanSurat}` : 'Kedinasan Pemerintah Desa';
        maskedNik = '- (Surat Dinas)';
      } else if (req.autoData) {
        pemohonNama = req.autoData.nama;
        const rawNik = req.autoData.nik;
        if (rawNik && rawNik.length === 16) {
          maskedNik = `${rawNik.substring(0, 6)}******${rawNik.substring(12)}`;
        }
      }
    }

    // Log aktivitas verifikasi
    StorageService.logLetterAudit({
      actorType: 'warga',
      actorId: 'public_verifier',
      actorName: 'Pemindai Publik (QR)',
      letterRequestId: found.letterRequestId,
      letterTypeCode: found.letterTypeCode,
      action: 'LETTER_VERIFIED',
      notes: `Verifikasi QR dilakukan untuk surat nomor ${found.nomorSurat}. Hasil: ${found.status === 'REVOKED' ? 'DICABUT' : 'VALID'}.`,
      issuanceId: found.id
    });

    return {
      status: found.status === 'REVOKED' ? 'REVOKED' : 'VALID',
      issuance: found,
      pemohonNama,
      maskedNik,
      verifiedAt: new Date().toISOString()
    };
  }
};
