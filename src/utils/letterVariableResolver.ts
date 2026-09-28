import { LetterTemplate, LetterRequest, DesaProfile, LetterIssuance } from '../types';

/**
 * Format tanggal dalam Bahasa Indonesia standar
 */
export const formatIndonesianDate = (dateStr?: string | Date): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
};

/**
 * Helper konversi bulan numerik ke Romawi untuk format persuratan dinas
 */
export const getRomanMonth = (date?: Date): string => {
  const d = date || new Date();
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[d.getMonth()] || 'I';
};

export interface ResolvedDisplayItem {
  label: string;
  value: string;
}

export interface ResolvedLetterDocument {
  templateId: string;
  templateCode: string;
  templateVersion: number;
  title: string;
  codePrefix: string;
  nomorSuratDisplay: string; // Contoh: "Beliti Jaya" atau nomor resmi jika sudah ada
  fullNomorSurat: string;
  opening: string;
  pemohonData: ResolvedDisplayItem[];
  bodyParagraphs: string[];
  customDisplayFields: ResolvedDisplayItem[];
  closing: string;
  datePlace: string; // Contoh: "Beliti Jaya, 24 September 2026"
  signatoryRole: string; // Contoh: "Kepala Desa Beliti Jaya"
  signatoryName: string; // Contoh: "M. HIDAYAT, S.IP"
  signatoryNip: string; // Contoh: "-"
  isPublished: boolean;
  variableMap: Record<string, string>;
  isSuratDinas?: boolean;
  suratDinasData?: {
    tujuanSurat: string;
    instansiTujuan?: string;
    alamatTujuan?: string;
    sifatSurat?: string;
    lampiran?: string;
    perihal: string;
    isiSurat?: string;
    tembusan?: string[];
  };
  dinasDetails?: ResolvedDisplayItem[];
}

/**
 * Membangun mapping variabel persuratan lengkap dari request, kependudukan, profil desa, dan customData
 * (Mendukung snapshot LetterIssuance untuk immutability dokumen terbit pada Stage 7.2F.1)
 */
export const buildVariableMap = (
  letterRequest: LetterRequest,
  desaProfile: DesaProfile,
  issuance?: LetterIssuance
): Record<string, string> => {
  const auto = letterRequest.autoData || ({} as any);
  const form = letterRequest.formData || {};
  const isIssued = Boolean(issuance && (issuance.status === 'ISSUED' || issuance.status === 'REVOKED'));

  // Waktu / Tanggal Efektif: Untuk dokumen terbit (ISSUED/REVOKED), gunakan tanggal penerbitan historis (issuance.issuedAt)
  let effectiveDate = new Date();
  if (isIssued && issuance?.issuedAt) {
    const parsedDate = new Date(issuance.issuedAt);
    if (!isNaN(parsedDate.getTime())) {
      effectiveDate = parsedDate;
    }
  }

  // Status nomor surat (TAHAP 5: Jangan membuat nomor resmi palsu)
  const isNomorAvailable = Boolean(
    (isIssued && issuance?.nomorSurat) ||
    (letterRequest.nomorSurat && 
     letterRequest.nomorSurat.trim() !== '' && 
     letterRequest.nomorSurat !== 'Belum diterbitkan' &&
     !letterRequest.nomorSurat.toLowerCase().includes('belum'))
  );

  const nomorSuratValue = (isIssued && issuance?.nomorSurat)
    ? issuance.nomorSurat
    : (isNomorAvailable ? letterRequest.nomorSurat! : 'Belum diterbitkan');

  const nomorRegistrasiValue = (isIssued && issuance?.nomorRegistrasi)
    ? issuance.nomorRegistrasi
    : '-';

  // Identitas Pejabat: Untuk surat TERBIT / HISTORIS (termasuk REVOKED), prioritaskan snapshot historis LetterIssuance / LetterArchive.
  // Untuk dokumen BELUM TERBIT: Sumber data pejabat aktif adalah DesaProfile aktif (Single Source of Truth).
  const isIssuedLetter = Boolean(
    (isIssued && (letterRequest.status === 'TERBIT' || letterRequest.status === 'DIBATALKAN' || issuance?.status === 'REVOKED')) ||
    Boolean(issuance?.signatoryName)
  );

  const namaKadesResolved = (isIssuedLetter && issuance?.signatoryName)
    ? issuance.signatoryName
    : (desaProfile.kepalaDesa?.nama || '');

  const nipKadesResolved = (isIssuedLetter && issuance?.signatoryNip !== undefined)
    ? (issuance.signatoryNip || '-')
    : (desaProfile.kepalaDesa?.nip || '-');

  const jabatanKadesResolved = (isIssuedLetter && issuance?.signatoryRole)
    ? issuance.signatoryRole
    : `Kepala Desa ${desaProfile.namaDesa || 'Beliti Jaya'}`;

  // Base Map
  const map: Record<string, string> = {
    // 1. Data Dokumen & Penomoran
    nomor_surat: nomorSuratValue,
    no_surat: nomorSuratValue,
    nomor_registrasi: nomorRegistrasiValue,
    no_registrasi: nomorRegistrasiValue,
    id_pengajuan: letterRequest.id || '-',
    kode_pengajuan: letterRequest.id || '-',
    status_pengajuan: isIssued ? 'TERBIT' : (letterRequest.status || '-'),
    tanggal_pengajuan: formatIndonesianDate(letterRequest.submittedAt),
    tanggal_terbit: isIssued ? formatIndonesianDate(effectiveDate) : '-',

    // 2. Data Kependudukan Pemohon (Snapshot Administrasi Kependudukan)
    nama: auto.nama || '-',
    nama_penduduk: auto.nama || '-',
    nama_pemohon: auto.nama || '-',
    nik: auto.nik || '-',
    nik_pemohon: auto.nik || '-',
    no_kk: auto.noKk || '-',
    nomor_kk: auto.noKk || '-',
    tempat_lahir: auto.tempatLahir || '-',
    tanggal_lahir: auto.tanggalLahir ? formatIndonesianDate(auto.tanggalLahir) : '-',
    ttl: `${auto.tempatLahir || '-'}, ${auto.tanggalLahir ? formatIndonesianDate(auto.tanggalLahir) : '-'}`,
    jenis_kelamin: auto.jenisKelamin || '-',
    agama: auto.agama || '-',
    status_perkawinan: auto.statusPerkawinan || '-',
    status_keluarga: auto.statusKeluarga || '-',
    pekerjaan: auto.pekerjaan || '-',
    pendidikan: auto.pendidikan || '-',
    alamat: auto.alamat || '-',
    rt: auto.rt || '-',
    rw: auto.rw || '-',
    dusun: auto.dusun ? `Dusun ${auto.dusun}` : '-',
    telepon: auto.telepon || '-',
    alamat_lengkap: `${auto.alamat || '-'}, RT ${auto.rt || '-'}/RW ${auto.rw || '-'}, Dusun ${auto.dusun || '-'}, Desa ${desaProfile.namaDesa || 'Beliti Jaya'}`,

    // 3. Data Profil Pemerintahan Desa Beliti Jaya
    // Untuk surat TERBIT: nama, nip, dan jabatan pejabat membaca snapshot issuance (immutability)
    desa: desaProfile.namaDesa || 'Beliti Jaya',
    nama_desa: desaProfile.namaDesa || 'Beliti Jaya',
    kecamatan: desaProfile.kecamatan || 'Muara Kelingi',
    nama_kecamatan: desaProfile.kecamatan || 'Muara Kelingi',
    kabupaten: desaProfile.kabupaten || 'Musi Rawas',
    nama_kabupaten: desaProfile.kabupaten || 'Musi Rawas',
    provinsi: desaProfile.provinsi || 'Sumatera Selatan',
    nama_provinsi: desaProfile.provinsi || 'Sumatera Selatan',
    alamat_kantor_desa: desaProfile.alamatKantor || 'Jl. Poros Beliti Jaya No. 01, Kode Pos 31662',
    alamat_kantor: desaProfile.alamatKantor || 'Jl. Poros Beliti Jaya No. 01, Kode Pos 31662',
    kode_pos: desaProfile.kodePos || '31662',
    telepon_desa: desaProfile.teleponDesa || '-',
    email_desa: desaProfile.emailDesa || 'kantor@belitijaya.desa.id',
    nama_kepala_desa: namaKadesResolved,
    nip_kepala_desa: nipKadesResolved,
    jabatan_kepala_desa: jabatanKadesResolved,
    nama_penandatangan: namaKadesResolved,
    nip_penandatangan: nipKadesResolved,
    jabatan_penandatangan: jabatanKadesResolved,

    // 4. Variabel Waktu & Penanggalan (Mengikuti effectiveDate dari issuance.issuedAt untuk surat terbit)
    tanggal_surat: formatIndonesianDate(effectiveDate),
    bulan_surat: [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ][effectiveDate.getMonth()],
    tahun_surat: String(effectiveDate.getFullYear()),
    bulan_romawi: getRomanMonth(effectiveDate)
  };

  // 5. Injeksi Form Data Custom Khusus Masing-masing Surat
  // Petakan key camelCase dan snake_case secara otomatis
  Object.entries(form).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    const strVal = String(val).trim();
    if (strVal === '') return;

    // Direct key
    map[key] = strVal;

    // snake_case key: namaUsaha -> nama_usaha
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    map[snakeKey] = strVal;

    // Special formatted dates if field contains date
    if (key.toLowerCase().includes('tgl') || key.toLowerCase().includes('tanggal')) {
      map[`formatted_${snakeKey}`] = formatIndonesianDate(strVal);
      // Juga timpa jika sesuai
      map[snakeKey] = formatIndonesianDate(strVal);
    }
  });

  // Khusus komposit Kelahiran
  if (form.tempatLahirAnak || form.tanggalLahirAnak) {
    const tglAnak = form.tanggalLahirAnak ? formatIndonesianDate(form.tanggalLahirAnak) : '-';
    map['ttl_anak'] = `${form.tempatLahirAnak || '-'}, ${tglAnak}`;
  }

  // 6. Pemetaan Variabel Khusus Surat Dinas
  if (letterRequest.isSuratDinas && letterRequest.suratDinasData) {
    const dinas = letterRequest.suratDinasData;
    map['tujuan_surat'] = dinas.tujuanSurat || '-';
    map['tujuan'] = dinas.tujuanSurat || '-';
    map['instansi_tujuan'] = dinas.instansiTujuan || '-';
    map['alamat_tujuan'] = dinas.alamatTujuan || '-';
    map['sifat_surat'] = dinas.sifatSurat || 'Biasa';
    map['sifat'] = dinas.sifatSurat || 'Biasa';
    map['lampiran'] = dinas.lampiran || '-';
    map['perihal'] = dinas.perihal || '-';
    map['isi_surat'] = dinas.isiSurat || '-';
    map['catatan_internal'] = dinas.catatanInternal || '-';
    if (dinas.tembusan && dinas.tembusan.length > 0) {
      map['tembusan'] = dinas.tembusan.join('\n');
    }
  }

  return map;
};

/**
 * Menggantikan variabel {{var_name}} dalam teks string secara aman
 */
export const replaceVariablesInText = (
  text: string,
  variableMap: Record<string, string>
): string => {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, varName) => {
    const key = varName.trim();
    const val = variableMap[key];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
    // Fallback: kembalikan placeholder aman
    return '-';
  });
};

/**
 * Resolver Utama Dokumen Surat
 * Menggabungkan template + letterRequest + desaProfile (+ optional snapshot LetterIssuance)
 */
export const resolveLetterVariables = (
  template: LetterTemplate,
  letterRequest: LetterRequest,
  desaProfile: DesaProfile,
  issuance?: LetterIssuance
): ResolvedLetterDocument => {
  const variableMap = buildVariableMap(letterRequest, desaProfile, issuance);
  const content = template.content;
  const isIssued = Boolean(issuance && issuance.status === 'ISSUED');

  // Title
  const title = content.title || 'SURAT KETERANGAN';

  // Format Nomor Surat
  const isNomorAvailable = Boolean(
    (isIssued && issuance?.nomorSurat) ||
    (letterRequest.nomorSurat && 
     letterRequest.nomorSurat.trim() !== '' && 
     letterRequest.nomorSurat !== 'Belum diterbitkan' &&
     !letterRequest.nomorSurat.toLowerCase().includes('belum'))
  );

  const effectiveNomorSurat = (isIssued && issuance?.nomorSurat) ? issuance.nomorSurat : letterRequest.nomorSurat;
  const nomorSuratDisplay = isNomorAvailable ? effectiveNomorSurat! : 'Belum diterbitkan';

  let fullNomorSurat = '';
  if (isNomorAvailable) {
    if (isIssued && issuance?.nomorSurat) {
      fullNomorSurat = issuance.nomorSurat;
    } else {
      fullNomorSurat = replaceVariablesInText(content.letterNumberFormat || '{{nomor_surat}}', variableMap);
    }
  } else {
    // Pada Tahap 5, tampilkan indikasi jelas bahwa nomor surat belum diterbitkan resmi
    const prefix = content.codePrefix || '470';
    fullNomorSurat = `${prefix} / [Belum Diterbitkan] / 2008 / ${variableMap.bulan_romawi} / ${variableMap.tahun_surat}`;
  }

  // Opening
  const opening = replaceVariablesInText(content.opening, variableMap);

  // Body Paragraphs
  const bodyParagraphs = (content.bodyParagraphs || []).map(p => 
    replaceVariablesInText(p, variableMap)
  );

  // Closing
  const closing = replaceVariablesInText(content.closing, variableMap);

  // Data Tabel Pemohon Standar
  const pemohonData: ResolvedDisplayItem[] = [
    { label: 'Nama Lengkap', value: variableMap.nama_penduduk },
    { label: 'Nomor Induk Kependudukan (NIK)', value: variableMap.nik },
    { label: 'Nomor Kartu Keluarga (KK)', value: variableMap.no_kk },
    { label: 'Tempat, Tanggal Lahir', value: variableMap.ttl },
    { label: 'Jenis Kelamin', value: variableMap.jenis_kelamin },
    { label: 'Agama', value: variableMap.agama },
    { label: 'Status Perkawinan', value: variableMap.status_perkawinan },
    { label: 'Pekerjaan', value: variableMap.pekerjaan },
    { label: 'Alamat / Tempat Tinggal', value: variableMap.alamat_lengkap }
  ];

  // Custom Display Fields spesifik jenis surat
  const customDisplayFields: ResolvedDisplayItem[] = [];
  if (content.customDisplayFields && content.customDisplayFields.length > 0) {
    for (const field of content.customDisplayFields) {
      const rawVal = variableMap[field.variableKey] || variableMap[field.variableKey.toLowerCase()] || '-';
      let formattedVal = rawVal;
      if (formattedVal !== '-' && field.prefix) {
        formattedVal = `${field.prefix} ${formattedVal}`;
      }
      if (formattedVal !== '-' && field.suffix) {
        formattedVal = `${formattedVal}${field.suffix}`;
      }
      customDisplayFields.push({
        label: field.label,
        value: formattedVal
      });
    }
  }

  // Signatory: Jika dokumen sudah terbit (ISSUED/REVOKED), prioritaskan snapshot LetterIssuance / LetterArchive.
  // Untuk dokumen belum terbit, gunakan DesaProfile aktif via variableMap.
  const isIssuedLetter = Boolean(
    (isIssued && (letterRequest.status === 'TERBIT' || letterRequest.status === 'DIBATALKAN' || issuance?.status === 'REVOKED')) ||
    Boolean(issuance?.signatoryName)
  );

  const signatoryRole = (isIssuedLetter && issuance?.signatoryRole)
    ? issuance.signatoryRole
    : (content.signatoryRole || 'Kepala Desa Beliti Jaya');

  const signatoryName = (isIssuedLetter && issuance?.signatoryName)
    ? issuance.signatoryName
    : replaceVariablesInText(content.signatoryName || '{{nama_kepala_desa}}', variableMap);

  const signatoryNip = (isIssuedLetter && issuance?.signatoryNip !== undefined)
    ? (issuance.signatoryNip || '-')
    : replaceVariablesInText(content.signatoryNip || '{{nip_kepala_desa}}', variableMap);

  const datePlace = `${desaProfile.namaDesa || 'Beliti Jaya'}, ${variableMap.tanggal_surat}`;

  // Ekstraksi Data Naskah Dinas Terstruktur (Stage 7.2B.4B)
  let suratDinasDataExtract = undefined;
  let dinasDetails: ResolvedDisplayItem[] = [];

  if (letterRequest.isSuratDinas && letterRequest.suratDinasData) {
    const dinas = letterRequest.suratDinasData;
    suratDinasDataExtract = {
      tujuanSurat: dinas.tujuanSurat || '-',
      instansiTujuan: dinas.instansiTujuan || undefined,
      alamatTujuan: dinas.alamatTujuan || undefined,
      sifatSurat: dinas.sifatSurat || 'Biasa',
      lampiran: dinas.lampiran || '-',
      perihal: dinas.perihal || '-',
      isiSurat: dinas.isiSurat || undefined,
      tembusan: dinas.tembusan && dinas.tembusan.length > 0 ? dinas.tembusan : undefined
    };

    // Parameter Khusus Sesuai Jenis Surat Dinas
    const form = letterRequest.formData || {};
    if (letterRequest.letterTypeCode === 'DINAS_UNDANGAN') {
      dinasDetails = [
        { label: 'Acara', value: form.acara || '-' },
        { label: 'Hari / Tanggal', value: form.hariTanggal || '-' },
        { label: 'Waktu', value: form.waktu || '-' },
        { label: 'Tempat', value: form.tempat || '-' }
      ];
    } else if (letterRequest.letterTypeCode === 'DINAS_TUGAS') {
      dinasDetails = [
        { label: 'Nama Petugas', value: form.namaPetugas || '-' },
        { label: 'Jabatan Petugas', value: form.jabatanPetugas || '-' },
        { label: 'Maksud & Uraian Tugas', value: form.tujuanTugas || '-' },
        { label: 'Tempat / Lokasi Tugas', value: form.lokasiTugas || '-' },
        { label: 'Jangka Waktu Pelaksanaan', value: form.jangkaWaktu || '-' }
      ];
    } else if (letterRequest.letterTypeCode === 'DINAS_EDARAN') {
      dinasDetails = [
        { label: 'Pokok Pemberitahuan', value: form.halPemberitahuan || '-' },
        { label: 'Sasaran Penerima Edaran', value: form.sasaranPenerima || '-' },
        { label: 'Poin Pokok Instruksi / Arahan', value: form.ringkasanInstruksi || '-' }
      ];
    } else if (letterRequest.letterTypeCode === 'DINAS_REKOMENDASI') {
      dinasDetails = [
        { label: 'Pihak yang Direkomendasikan', value: form.pihakDirekomendasikan || '-' },
        { label: 'Maksud / Keperluan', value: form.maksudRekomendasi || '-' },
        { label: 'Dasar / Pertimbangan', value: form.dasarPertimbangan || '-' }
      ];
    }
  }

  return {
    templateId: template.id,
    templateCode: template.code,
    templateVersion: template.version,
    title,
    codePrefix: content.codePrefix || '470',
    nomorSuratDisplay,
    fullNomorSurat,
    opening,
    pemohonData: letterRequest.isSuratDinas ? [] : pemohonData,
    bodyParagraphs,
    customDisplayFields,
    closing,
    datePlace,
    signatoryRole,
    signatoryName,
    signatoryNip,
    isPublished: isNomorAvailable,
    variableMap,
    isSuratDinas: letterRequest.isSuratDinas === true,
    suratDinasData: suratDinasDataExtract,
    dinasDetails
  };
};

/**
 * Validasi apakah permohonan surat siap untuk digenerate preview dokumen
 */
export const validateLetterForPreview = (params: {
  template?: LetterTemplate | null;
  letterRequest?: LetterRequest | null;
  actorRole: 'warga' | 'aparatur';
  wargaAccountId?: string;
  pendudukId?: string;
  isIssued?: boolean;
  isTemplatePreview?: boolean;
}): { valid: boolean; error?: string } => {
  const { template, letterRequest, actorRole, wargaAccountId, pendudukId, isTemplatePreview } = params;

  if (!letterRequest) {
    return { valid: false, error: 'Data pengajuan surat tidak ditemukan di sistem.' };
  }

  // Jika dalam mode Pratinjau Template (Template Builder / Preview A4)
  if (isTemplatePreview) {
    if (!template) {
      return { valid: false, error: 'Template surat tidak ditemukan di sistem.' };
    }
    return { valid: true };
  }

  // Hak Akses Warga: Warga hanya boleh membuka pengajuan miliknya sendiri
  if (actorRole === 'warga') {
    if (letterRequest.isSuratDinas) {
      return { 
        valid: false, 
        error: 'Akses ditolak. Dokumen persuratan dinas hanya dapat diakses oleh aparatur pemerintah desa.' 
      };
    }

    const isOwner = 
      (wargaAccountId && letterRequest.wargaAccountId === wargaAccountId) ||
      (pendudukId && letterRequest.pendudukId === pendudukId);

    if (!isOwner) {
      return { 
        valid: false, 
        error: 'Akses ditolak. Anda tidak berhak melihat preview dokumen pengajuan warga lain.' 
      };
    }
  }

  // Deteksi status terbit surat secara deterministik (Stage 7.2D.1.1)
  const isIssued = params.isIssued ?? (
    letterRequest.status === 'TERBIT' ||
    Boolean(letterRequest.publishedAt) ||
    Boolean(letterRequest.nomorSurat && letterRequest.nomorSurat.trim() !== '' && letterRequest.nomorSurat !== 'Belum diterbitkan')
  );

  if (!template) {
    if (isIssued) {
      return { 
        valid: false, 
        error: `Template surat historis untuk dokumen terbit "${letterRequest.letterTypeName}" tidak ditemukan di sistem.` 
      };
    }
    return { 
      valid: false, 
      error: `Template surat aktif belum tersedia untuk jenis surat "${letterRequest.letterTypeName}". Hubungi operator desa.` 
    };
  }

  // ATURAN INTEGRITAS TEMPLATE (Stage 7.2D.1.1):
  // 1. Dokumen yang SUDAH TERBIT:
  //    - Template boleh berstatus 'ACTIVE' atau 'INACTIVE' (misal: template v1 dinonaktifkan karena sudah ada v2 aktif)
  //    - Status 'INACTIVE' BUKAN berarti invalid bagi dokumen yang telah diterbitkan secara sah di masa lampau
  // 2. Pengajuan yang BELUM TERBIT:
  //    - Template WAJIB berstatus 'ACTIVE'
  if (isIssued) {
    if (letterRequest.templateId && template.id !== letterRequest.templateId) {
      return {
        valid: false,
        error: `Referensi template surat tidak sesuai dengan catatan dokumen terbit (tercatat: ${letterRequest.templateId}, ditemukan: ${template.id}).`
      };
    }
    if (letterRequest.templateVersion && template.version !== letterRequest.templateVersion) {
      return {
        valid: false,
        error: `Versi template surat tidak sesuai dengan catatan dokumen terbit (versi: ${template.version}, dokumen: ${letterRequest.templateVersion}).`
      };
    }
    if (template.status !== 'ACTIVE' && template.status !== 'INACTIVE') {
      return {
        valid: false,
        error: 'Status template surat tidak valid untuk menampilkan dokumen resmi terbit.'
      };
    }
  } else {
    if (template.status !== 'ACTIVE') {
      return { 
        valid: false, 
        error: 'Template surat yang terkait saat ini sedang dinonaktifkan oleh administrator desa.' 
      };
    }
  }

  // Branch Khusus Surat Dinas (Stage 7.2B.4B)
  if (letterRequest.isSuratDinas) {
    if (template.letterTypeId !== letterRequest.letterTypeId) {
      return {
        valid: false,
        error: `Template surat (${template.name}) tidak cocok dengan jenis surat dinas "${letterRequest.letterTypeName}".`
      };
    }

    const tujuan = letterRequest.suratDinasData?.tujuanSurat?.trim();
    if (!tujuan) {
      return {
        valid: false,
        error: 'Tujuan naskah dinas belum ditentukan.'
      };
    }

    const perihal = letterRequest.suratDinasData?.perihal?.trim();
    if (!perihal) {
      return {
        valid: false,
        error: 'Perihal naskah dinas belum ditentukan.'
      };
    }

    return { valid: true };
  }

  // Branch Surat Warga Existing
  if (!letterRequest.autoData || !letterRequest.autoData.nik || !letterRequest.autoData.nama) {
    return { 
      valid: false, 
      error: 'Data kependudukan pemohon belum lengkap untuk menghasilkan preview dokumen surat.' 
    };
  }

  return { valid: true };
};
