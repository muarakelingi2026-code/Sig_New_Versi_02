import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LetterTemplate, 
  LetterTemplateContent, 
  LetterCustomDisplayField, 
  LetterTemplateAuditLogEntry, 
  User, 
  RolePermissions, 
  DesaProfile, 
  LetterRequest 
} from '../../types';
import { StorageService } from '../../services/storageService';
import { DocumentPreviewWorkspace } from './DocumentPreviewWorkspace';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  History, 
  ShieldCheck, 
  Building2, 
  Users, 
  Layers, 
  AlertTriangle, 
  Info, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  MoveUp, 
  MoveDown, 
  Trash2, 
  Lock, 
  Edit3, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Hash
} from 'lucide-react';

export interface AparaturTemplateSuratViewProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBack: () => void;
  onOpenDashboard?: () => void;
  onOpenPenomoran?: () => void;
}

export const AparaturTemplateSuratView: React.FC<AparaturTemplateSuratViewProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBack,
  onOpenDashboard,
  onOpenPenomoran
}) => {
  // ── RBAC VALIDATION ──
  const isAdmin = currentUser.role === 'admin';
  const isOperator = currentUser.role === 'operator';
  const isOperatorAset = currentUser.role === 'operator_aset';
  const canMutate = isAdmin; // Hanya Admin yang berhak memutasi/membuat versi template

  // ── CORE DATA ──
  const [templates, setTemplates] = useState<LetterTemplate[]>(() => StorageService.getLetterTemplates());
  const [auditLogs, setAuditLogs] = useState<LetterTemplateAuditLogEntry[]>(() => StorageService.getLetterTemplateAuditLogs());

  const refreshTemplates = () => {
    setTemplates(StorageService.getLetterTemplates());
    setAuditLogs(StorageService.getLetterTemplateAuditLogs());
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  // ── VIEW TABS ──
  const [activeMainTab, setActiveMainTab] = useState<'templates' | 'audit'>('templates');

  // ── FILTERS ──
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'WARGA' | 'DINAS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DRAFT'>('ALL');
  const [versionFilter, setVersionFilter] = useState<'ALL' | 'LATEST' | 'OLD'>('ALL');

  // Helper untuk menentukan apakah template merupakan versi tertinggi (latest) untuk jenis suratnya
  const latestVersionMap = useMemo(() => {
    const map = new Map<string, number>();
    templates.forEach(t => {
      const curMax = map.get(t.letterTypeId) || 0;
      if (t.version > curMax) {
        map.set(t.letterTypeId, t.version);
      }
    });
    return map;
  }, [templates]);

  // Helper cek apakah template adalah dinas
  const isTemplateDinas = (tpl: LetterTemplate): boolean => {
    return tpl.letterTypeId.startsWith('lt-dinas-') || 
           tpl.code.toLowerCase().includes('dinas') ||
           ['lt-dinas-undangan', 'lt-dinas-tugas', 'lt-dinas-edaran', 'lt-dinas-rekomendasi'].includes(tpl.letterTypeId);
  };

  // ── STATISTIK TEMPLATE (DIHITUNG DARI DATA MASTER TEMPLATE, BUKAN LETTER REQUEST) ──
  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter(t => t.status === 'ACTIVE').length;
    const inactive = templates.filter(t => t.status === 'INACTIVE').length;
    const versions = templates.reduce((acc, t) => acc + t.version, 0);

    const wargaTemplates = templates.filter(t => !isTemplateDinas(t));
    const dinasTemplates = templates.filter(t => isTemplateDinas(t));

    return {
      total,
      active,
      inactive,
      versions,
      warga: {
        total: wargaTemplates.length,
        active: wargaTemplates.filter(t => t.status === 'ACTIVE').length,
        inactive: wargaTemplates.filter(t => t.status === 'INACTIVE').length,
        versions: wargaTemplates.reduce((acc, t) => acc + t.version, 0)
      },
      dinas: {
        total: dinasTemplates.length,
        active: dinasTemplates.filter(t => t.status === 'ACTIVE').length,
        inactive: dinasTemplates.filter(t => t.status === 'INACTIVE').length,
        versions: dinasTemplates.reduce((acc, t) => acc + t.version, 0)
      }
    };
  }, [templates]);

  // ── FILTERED TEMPLATES LIST ──
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const isDinas = isTemplateDinas(t);

      // 1. Category Filter
      if (categoryFilter === 'WARGA' && isDinas) return false;
      if (categoryFilter === 'DINAS' && !isDinas) return false;

      // 2. Status Filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // 3. Version Filter
      const maxVer = latestVersionMap.get(t.letterTypeId) || 1;
      const isLatest = t.version === maxVer;
      if (versionFilter === 'LATEST' && !isLatest) return false;
      if (versionFilter === 'OLD' && isLatest) return false;

      // 4. Search Filter (nama template, kode, jenis surat, classification code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        const matchLetterType = t.letterTypeId.toLowerCase().includes(q);
        const matchPrefix = t.content.codePrefix?.toLowerCase().includes(q) || false;
        const matchTitle = t.content.title.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLetterType && !matchPrefix && !matchTitle) {
          return false;
        }
      }

      return true;
    });
  }, [templates, categoryFilter, statusFilter, versionFilter, searchQuery, latestVersionMap]);

  // ── DUMMY DATA GENERATOR UNTUK PREVIEW TEMPLATE A4 ──
  // HANYA untuk preview, JANGAN PERNAH disimpan ke storage (LetterRequest / Issuance / Archive)
  const buildPreviewDummyRequest = (tpl: LetterTemplate): LetterRequest => {
    const isDinas = isTemplateDinas(tpl);
    const now = new Date();
    const codePrefix = tpl.content.codePrefix || (isDinas ? '005' : '470');
    const dummyNomor = `${codePrefix} / 0001 / 2008 / IX / ${now.getFullYear()}`;

    if (isDinas) {
      return {
        id: `preview-dinas-${tpl.id}`,
        letterTypeId: tpl.letterTypeId,
        letterTypeCode: tpl.code,
        letterTypeName: tpl.name,
        submittedAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: 'DRAFT',
        workflowLevel: 'LEVEL_2_VERIFIKASI',
        isSuratDinas: true,
        // Naskah Dinas: Tidak menggunakan data kependudukan NIK/KK/pemohonData
        autoData: undefined,
        suratDinasData: {
          tujuanSurat: 'Camat Muara Kelingi',
          instansiTujuan: 'Pemerintah Kecamatan Muara Kelingi',
          alamatTujuan: 'Jl. Raya Muara Kelingi No. 05, Kab. Musi Rawas',
          sifatSurat: 'Penting',
          lampiran: '1 (satu) Berkas Terlampir',
          perihal: tpl.content.title,
          isiSurat: 'Sehubungan dengan agenda rutin penyelenggaraan tata kelola pemerintahan desa Beliti Jaya...',
          tembusan: [
            'Bupati Musi Rawas di Muara Beliti (sebagai laporan)',
            'Ketua BPD Beliti Jaya',
            'Arsip Pemerintahan Desa'
          ]
        },
        formData: {
          tujuanSurat: 'Camat Muara Kelingi',
          instansiTujuan: 'Pemerintah Kecamatan Muara Kelingi',
          alamatTujuan: 'Jl. Raya Muara Kelingi No. 05, Kab. Musi Rawas',
          sifatSurat: 'Penting',
          lampiran: '1 (satu) Berkas Terlampir',
          perihal: tpl.content.title,
          // Field tambahan spesifik dinas
          hariTanggal: 'Senin, 28 September 2026',
          hari_tanggal: 'Senin, 28 September 2026',
          waktuAcara: '09.00 WIB s/d Selesai',
          waktu_acara: '09.00 WIB s/d Selesai',
          tempatAcara: 'Balai Pertemuan Desa Beliti Jaya',
          tempat_acara: 'Balai Pertemuan Desa Beliti Jaya',
          agendaAcara: 'Musyawarah Rencana Kerja Pemerintah Desa (RKPDes)',
          agenda_acara: 'Musyawarah Rencana Kerja Pemerintah Desa (RKPDes)',
          namaPetugas: 'BAMBANG HERMANTO, S.Pd',
          nama_petugas: 'BAMBANG HERMANTO, S.Pd',
          nipPetugas: '198204152009021003',
          nip_petugas: '198204152009021003',
          jabatanPetugas: 'Kepala Seksi Pelayanan & Kesra Desa Beliti Jaya',
          jabatan_petugas: 'Kepala Seksi Pelayanan & Kesra Desa Beliti Jaya',
          uraianTugas: 'Melakukan pendampingan teknis dan verifikasi lapangan fasilitas umum.',
          uraian_tugas: 'Melakukan pendampingan teknis dan verifikasi lapangan fasilitas umum.',
          lokasiTugas: 'Wilayah Dusun I s/d Dusun IV Desa Beliti Jaya',
          lokasi_tugas: 'Wilayah Dusun I s/d Dusun IV Desa Beliti Jaya',
          jangkaWaktu: '3 (tiga) Hari Kerja',
          jangka_waktu: '3 (tiga) Hari Kerja',
          halPemberitahuan: 'Peningkatan Kebersihan Lingkungan dan Penertiban Drainase Dusun',
          hal_pemberitahuan: 'Peningkatan Kebersihan Lingkungan dan Penertiban Drainase Dusun',
          sasaranPenerima: 'Seluruh Kepala Dusun, Ketua RT, dan Tokoh Masyarakat',
          sasaran_penerima: 'Seluruh Kepala Dusun, Ketua RT, dan Tokoh Masyarakat',
          ringkasanInstruksi: 'Mempedomani pelaksanaan gotong royong terpadu secara tertib dan berkala.',
          ringkasan_instruksi: 'Mempedomani pelaksanaan gotong royong terpadu secara tertib dan berkala.',
          pihakDirekomendasikan: 'Kelompok Tani Harapan Makmur Dusun II Beliti Jaya',
          pihak_direkomendasikan: 'Kelompok Tani Harapan Makmur Dusun II Beliti Jaya',
          maksudRekomendasi: 'Permohonan Bantuan Benih Tanaman Pangan & Sarana Pertanian',
          maksud_rekomendasi: 'Permohonan Bantuan Benih Tanaman Pangan & Sarana Pertanian',
          dasarPertimbangan: 'Telah terdaftar resmi dan aktif dalam kegiatan ketahanan pangan desa.'
        },
        confirmedRequirements: [],
        nomorSurat: dummyNomor,
        templateId: tpl.id,
        templateVersion: tpl.version
      };
    }

    // Dokumen Warga
    return {
      id: `preview-warga-${tpl.id}`,
      wargaAccountId: 'preview-warga-account',
      pendudukId: 'preview-penduduk-id',
      letterTypeId: tpl.letterTypeId,
      letterTypeCode: tpl.code,
      letterTypeName: tpl.name,
      submittedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'DRAFT',
      workflowLevel: 'LEVEL_1_INSTAN',
      autoData: {
        nama: 'AHMAD BUDIMAN',
        nik: '1605091205850001',
        noKk: '1605092008120002',
        tempatLahir: 'Beliti Jaya',
        tanggalLahir: '1985-05-12',
        jenisKelamin: 'Laki-laki',
        agama: 'Islam',
        statusPerkawinan: 'Kawin',
        statusKeluarga: 'Kepala Keluarga',
        pekerjaan: 'Petani / Pekebun',
        pendidikan: 'SMA / Sederajat',
        alamat: 'Jl. Poros Beliti Jaya No. 12',
        rt: '01',
        rw: '01',
        dusun: 'I',
        telepon: '081234567890'
      },
      formData: {
        keperluan: 'Persyaratan Kelengkapan Administrasi & Legalitas Kependudukan',
        lamaTinggal: '12 Tahun',
        lama_tinggal: '12 Tahun',
        namaUsaha: 'Toko Kelontong Berkah Mandiri',
        nama_usaha: 'Toko Kelontong Berkah Mandiri',
        bidangUsaha: 'Perdagangan Bahan Pokok',
        bidang_usaha: 'Perdagangan Bahan Pokok',
        alamatUsaha: 'Dusun I, RT 01 Desa Beliti Jaya',
        alamat_usaha: 'Dusun I, RT 01 Desa Beliti Jaya',
        lamaUsaha: '5 Tahun',
        lama_usaha: '5 Tahun',
        tujuanSurat: 'Bank BRI Unit Muara Kelingi',
        keperluanSurat: 'Pengajuan Fasilitas Kredit Usaha Rakyat (KUR)',
        keperluan_surat: 'Pengajuan Fasilitas Kredit Usaha Rakyat (KUR)',
        barangHilang: 'KTP Asli dan Kartu Keluarga (KK)',
        barang_hilang: 'KTP Asli dan Kartu Keluarga (KK)',
        lokasiKehilangan: 'Jalan Poros Pasar Muara Kelingi',
        lokasi_kehilangan: 'Jalan Poros Pasar Muara Kelingi',
        waktuKehilangan: 'Kemarin siang pukul 11.30 WIB',
        waktu_kehilangan: 'Kemarin siang pukul 11.30 WIB',
        namaAnak: 'MUHAMMAD RIZKY PRATAMA',
        nama_anak: 'MUHAMMAD RIZKY PRATAMA',
        tempatLahirAnak: 'Beliti Jaya',
        tempat_lahir_anak: 'Beliti Jaya',
        tanggalLahirAnak: '2026-02-15',
        tanggal_lahir_anak: '2026-02-15',
        jenisKelaminAnak: 'Laki-laki',
        jenis_kelamin_anak: 'Laki-laki',
        namaAyah: 'AHMAD BUDIMAN',
        nama_ayah: 'AHMAD BUDIMAN',
        namaIbu: 'SITI AMINAH',
        nama_ibu: 'SITI AMINAH',
        namaJenazah: 'H. MARZUKI EFFENDI',
        nama_jenazah: 'H. MARZUKI EFFENDI',
        tanggalMeninggal: '2026-03-01',
        tanggal_meninggal: '2026-03-01',
        tempatMeninggal: 'Puskesmas Muara Kelingi',
        tempat_meninggal: 'Puskesmas Muara Kelingi',
        sebabMeninggal: 'Sakit Usia Lanjut',
        sebab_meninggal: 'Sakit Usia Lanjut'
      },
      confirmedRequirements: [],
      nomorSurat: dummyNomor,
      templateId: tpl.id,
      templateVersion: tpl.version
    };
  };

  // ── PREVIEW WORKSPACE STATE ──
  const [previewTarget, setPreviewTarget] = useState<{
    template: LetterTemplate;
    dummyRequest: LetterRequest;
  } | null>(null);

  const handleOpenPreview = (tpl: LetterTemplate) => {
    const dummyReq = buildPreviewDummyRequest(tpl);
    setPreviewTarget({
      template: tpl,
      dummyRequest: dummyReq
    });
  };

  // ── VERSION LINEAGE MODAL STATE ──
  const [lineageLetterTypeId, setLineageLetterTypeId] = useState<string | null>(null);
  const lineageTemplates = useMemo(() => {
    if (!lineageLetterTypeId) return [];
    return templates
      .filter(t => t.letterTypeId === lineageLetterTypeId)
      .sort((a, b) => b.version - a.version);
  }, [templates, lineageLetterTypeId]);

  // ── MUTATION SYNCHRONOUS MUTEX (PENCEGAHAN DOUBLE ACTION RAPID CLICK) ──
  const isMutatingRef = useRef(false);

  // ── TOAST NOTIFICATION ──
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // ── CONFIRMATION MODAL STATE ──
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warningNote?: string;
    confirmText: string;
    confirmVariant?: 'emerald' | 'amber' | 'blue';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {}
  });

  // ── STRUCTURED EDITOR STATE ──
  const [editingTemplate, setEditingTemplate] = useState<{
    baseTemplate: LetterTemplate;
    isNewVersionMode: boolean;
    formData: {
      name: string;
      description: string;
      title: string;
      codePrefix: string;
      letterNumberFormat: string;
      opening: string;
      bodyParagraphs: string[];
      closing: string;
      signatoryRole: string;
      signatoryName: string;
      signatoryNip: string;
      customDisplayFields: LetterCustomDisplayField[];
    };
  } | null>(null);

  // Buka editor terstruktur
  const handleOpenEditor = (baseTpl: LetterTemplate, asNewVersion: boolean = true) => {
    setEditingTemplate({
      baseTemplate: baseTpl,
      isNewVersionMode: asNewVersion,
      formData: {
        name: baseTpl.name,
        description: baseTpl.description,
        title: baseTpl.content.title,
        codePrefix: baseTpl.content.codePrefix || '',
        letterNumberFormat: baseTpl.content.letterNumberFormat,
        opening: baseTpl.content.opening || '',
        bodyParagraphs: [...baseTpl.content.bodyParagraphs],
        closing: baseTpl.content.closing || '',
        signatoryRole: baseTpl.content.signatoryRole || 'Kepala Desa Beliti Jaya',
        signatoryName: baseTpl.content.signatoryName || '',
        signatoryNip: baseTpl.content.signatoryNip || '',
        customDisplayFields: (baseTpl.content.customDisplayFields || []).map(f => ({ ...f }))
      }
    });
  };

  // Handler Uji Pratinjau Langsung dari Editor
  const handlePreviewEditorDraft = () => {
    if (!editingTemplate) return;
    const { baseTemplate, formData } = editingTemplate;
    const draftTemplate: LetterTemplate = {
      ...baseTemplate,
      name: formData.name,
      description: formData.description,
      content: {
        title: formData.title,
        codePrefix: formData.codePrefix,
        letterNumberFormat: formData.letterNumberFormat,
        opening: formData.opening,
        bodyParagraphs: formData.bodyParagraphs.filter(p => p.trim() !== ''),
        closing: formData.closing,
        signatoryRole: formData.signatoryRole,
        signatoryName: formData.signatoryName,
        signatoryNip: formData.signatoryNip,
        customDisplayFields: formData.customDisplayFields
      }
    };
    const dummyReq = buildPreviewDummyRequest(draftTemplate);
    setPreviewTarget({
      template: draftTemplate,
      dummyRequest: dummyReq
    });
  };

  // Handler Simpan Versi Baru (IMMUTABLE VERSIONING)
  const handleSaveAsNewVersion = () => {
    if (!editingTemplate) return;
    if (!canMutate) {
      showToast('Akses ditolak: Hanya Administrator Persuratan yang berwenang membuat versi template baru.', 'warning');
      return;
    }

    const { baseTemplate, formData } = editingTemplate;

    // VALIDASI EDITOR
    if (!formData.title.trim()) {
      showToast('Judul surat wajib diisi.', 'error');
      return;
    }
    if (!formData.letterNumberFormat.trim()) {
      showToast('Format nomor surat wajib diisi.', 'error');
      return;
    }
    const cleanParagraphs = formData.bodyParagraphs.filter(p => p.trim() !== '');
    if (cleanParagraphs.length === 0) {
      showToast('Paragraf isi surat minimal harus memiliki 1 paragraf yang tidak kosong.', 'error');
      return;
    }
    if (!formData.closing.trim()) {
      showToast('Teks penutup surat wajib diisi.', 'error');
      return;
    }
    if (!formData.signatoryRole.trim()) {
      showToast('Jabatan penandatangan wajib diisi.', 'error');
      return;
    }

    // Validasi custom display fields
    for (const field of formData.customDisplayFields) {
      if (!field.label.trim() || !field.variableKey.trim()) {
        showToast('Setiap field kustom harus memiliki Label dan Variable Key yang valid.', 'error');
        return;
      }
    }

    // Buka Konfirmasi Mutasi
    const nextVersion = (latestVersionMap.get(baseTemplate.letterTypeId) || baseTemplate.version) + 1;
    setConfirmationModal({
      isOpen: true,
      title: `Buat Versi Baru (v${nextVersion})?`,
      message: `Versi lama (v${baseTemplate.version}) dari "${baseTemplate.name}" akan tetap tersimpan sebagai arsip historis dan TIDAK akan diubah. Versi baru (v${nextVersion}) akan otomatis diaktifkan untuk pengajuan surat baru.`,
      warningNote: 'Dokumen surat yang sudah pernah diterbitkan di masa lalu akan tetap terikat aman dengan versi historisnya.',
      confirmText: 'SIMPAN SEBAGAI VERSI BARU',
      confirmVariant: 'emerald',
      onConfirm: () => {
        if (isMutatingRef.current) return;
        isMutatingRef.current = true;

        try {
          const updates: Partial<LetterTemplate> = {
            name: formData.name.trim() || baseTemplate.name,
            description: formData.description.trim() || baseTemplate.description,
            status: 'ACTIVE',
            content: {
              title: formData.title.trim(),
              codePrefix: formData.codePrefix.trim(),
              letterNumberFormat: formData.letterNumberFormat.trim(),
              opening: formData.opening.trim(),
              bodyParagraphs: cleanParagraphs,
              closing: formData.closing.trim(),
              signatoryRole: formData.signatoryRole.trim(),
              signatoryName: formData.signatoryName.trim() || undefined,
              signatoryNip: formData.signatoryNip.trim() || undefined,
              customDisplayFields: formData.customDisplayFields
            }
          };

          const newTemplate = StorageService.createNewTemplateVersion(baseTemplate.id, updates, currentUser);
          if (newTemplate) {
            refreshTemplates();
            setEditingTemplate(null);
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            showToast(`Versi baru "${newTemplate.name}" (v${newTemplate.version}) berhasil dibuat dan diaktifkan.`, 'success');
          } else {
            showToast('Gagal membuat versi baru. Template dasar tidak ditemukan.', 'error');
          }
        } finally {
          isMutatingRef.current = false;
        }
      }
    });
  };

  // Handler Aktivasi Template
  const handleActivateTemplate = (tpl: LetterTemplate) => {
    if (!canMutate) {
      showToast('Akses ditolak: Hanya Administrator Persuratan yang berwenang mengaktifkan template.', 'warning');
      return;
    }
    if (tpl.status === 'ACTIVE') return;

    setConfirmationModal({
      isOpen: true,
      title: `Aktifkan Template Versi v${tpl.version}?`,
      message: `Mengaktifkan "${tpl.name}" (v${tpl.version}) akan secara otomatis menonaktifkan versi aktif lainnya untuk jenis surat ini. Konten dokumen tidak akan diubah.`,
      confirmText: 'AKTIFKAN TEMPLATE',
      confirmVariant: 'emerald',
      onConfirm: () => {
        if (isMutatingRef.current) return;
        isMutatingRef.current = true;

        try {
          const res = StorageService.updateLetterTemplate(tpl.id, { status: 'ACTIVE' }, currentUser);
          if (res) {
            refreshTemplates();
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            showToast(`Template "${tpl.name}" (v${tpl.version}) berhasil diaktifkan.`, 'success');
          }
        } finally {
          isMutatingRef.current = false;
        }
      }
    });
  };

  // Handler Nonaktifkan Template
  const handleDeactivateTemplate = (tpl: LetterTemplate) => {
    if (!canMutate) {
      showToast('Akses ditolak: Hanya Administrator Persuratan yang berwenang menonaktifkan template.', 'warning');
      return;
    }
    if (tpl.status === 'INACTIVE') return;

    // Periksa apakah ini template ACTIVE terakhir untuk letterTypeId ini
    const activeSameType = templates.filter(t => t.letterTypeId === tpl.letterTypeId && t.status === 'ACTIVE');
    const isLastActive = activeSameType.length <= 1;

    setConfirmationModal({
      isOpen: true,
      title: `Nonaktifkan Template Versi v${tpl.version}?`,
      message: `Template "${tpl.name}" (v${tpl.version}) akan diubah statusnya menjadi INACTIVE. Template ini tidak akan dihapus dan tetap dapat digunakan untuk menampilkan dokumen historis.`,
      warningNote: isLastActive 
        ? 'PERINGATAN: Template ini adalah satu-satunya template aktif untuk jenis surat ini. Menonaktifkannya akan membuat pengajuan baru untuk jenis surat ini tidak dapat diproses sampai ada template aktif baru!' 
        : undefined,
      confirmText: 'NONAKTIFKAN',
      confirmVariant: 'amber',
      onConfirm: () => {
        if (isMutatingRef.current) return;
        isMutatingRef.current = true;

        try {
          const res = StorageService.updateLetterTemplate(tpl.id, { status: 'INACTIVE' }, currentUser);
          if (res) {
            refreshTemplates();
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            showToast(`Template "${tpl.name}" (v${tpl.version}) dinonaktifkan.`, 'info');
          }
        } finally {
          isMutatingRef.current = false;
        }
      }
    });
  };

  // ── VARIABLE HELPER COPY FUNCTION ──
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const handleCopyVariable = (varName: string) => {
    navigator.clipboard.writeText(varName);
    setCopiedVar(varName);
    showToast(`Disalin ke clipboard: ${varName}`, 'info');
    setTimeout(() => {
      setCopiedVar(prev => prev === varName ? null : prev);
    }, 2500);
  };

  // Jika role operator_aset: Blokir akses ke template builder
  if (isOperatorAset) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Akses Dibatasi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Akun Operator Aset difokuskan pada pengelolaan Buku Inventaris & Peta Aset Desa. Modul Template Surat Desa hanya dapat diakses oleh Administrator dan Operator Persuratan.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-text">
      
      {/* ── HEADER HALAMAN UTAMA (FULL PAGE) ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-3 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Tombol KEMBALI & Judul */}
          <div className="flex items-center gap-3">
            <button
              id="btn-template-kembali"
              onClick={onBack}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 shadow-md transition-all cursor-pointer shrink-0"
              title="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>KEMBALI</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  TEMPLATE SURAT
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Builder & Versioning
                </span>
                {!isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Mode Lihat (Operator)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola format dan versi template surat desa (Surat Warga & Surat Dinas)
              </p>
            </div>
          </div>

          {/* Tab Switcher & Quick Navigation */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveMainTab('templates')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMainTab === 'templates'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Daftar Template ({templates.length})</span>
              </button>
              <button
                onClick={() => setActiveMainTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMainTab === 'audit'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Perubahan ({auditLogs.length})</span>
              </button>
            </div>

            {onOpenPenomoran && (
              <button
                onClick={onOpenPenomoran}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Buka Pengaturan Penomoran Surat"
              >
                <Hash className="w-3.5 h-3.5 text-teal-400" />
                <span>Penomoran</span>
              </button>
            )}

            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Buka Dashboard Persuratan"
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── NOTIFIKASI TOAST ── */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-fadeIn">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 ${
            toast.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' 
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : toast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
              : 'bg-slate-900/95 border-slate-700 text-slate-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── BODY KONTEN ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">

        {/* ── BANNER INFORMASI INTEGRITAS VERSI DOKUMEN (STAGE 7.2D.1.1) ── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-blue-100 flex items-center gap-2">
                <span>Integritas Versi Template Terjamin (Immutable Versioning)</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                  Sistem Baku
                </span>
              </p>
              <p className="text-blue-300/80 leading-relaxed">
                Template terbit menggunakan versi yang tersimpan saat surat diterbitkan. Dokumen historis yang telah terbit sah tidak akan berubah meskipun format template diperbarui di masa mendatang.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono shrink-0">
            Storage: <span className="text-emerald-400 font-semibold">v1_immutable</span>
          </div>
        </div>

        {/* ── TAB 1: DAFTAR TEMPLATE ── */}
        {activeMainTab === 'templates' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* ── STATISTIK TEMPLATE (4 KARTU UTAMA + BREAKDOWN) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* 1. Total Template Master */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Total Template</span>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{stats.total}</div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Warga: <strong className="text-slate-200">{stats.warga.total}</strong></span>
                  <span>Dinas: <strong className="text-slate-200">{stats.dinas.total}</strong></span>
                </div>
              </div>

              {/* 2. Template Aktif */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Template Aktif</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.active}</div>
                <div className="text-[11px] text-emerald-400/80 flex items-center justify-between pt-1 border-t border-emerald-900/40">
                  <span>Warga: <strong className="text-emerald-200">{stats.warga.active}</strong></span>
                  <span>Dinas: <strong className="text-emerald-200">{stats.dinas.active}</strong></span>
                </div>
              </div>

              {/* 3. Template Inaktif (Arsip Versi Lama) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Template Inaktif</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-300">{stats.inactive}</div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Warga: <strong className="text-slate-200">{stats.warga.inactive}</strong></span>
                  <span>Dinas: <strong className="text-slate-200">{stats.dinas.inactive}</strong></span>
                </div>
              </div>

              {/* 4. Total Versi Terkelola */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Jumlah Versi</span>
                  <History className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-300">{stats.versions}</div>
                <div className="text-[11px] text-indigo-400/80 flex items-center justify-between pt-1 border-t border-indigo-900/40">
                  <span>Warga: <strong className="text-indigo-200">{stats.warga.versions}</strong></span>
                  <span>Dinas: <strong className="text-indigo-200">{stats.dinas.versions}</strong></span>
                </div>
              </div>
            </div>

            {/* ── FILTER & PENCARIAN ── */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari template: nama, kode, klasifikasi (470, 503, dll), judul..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs text-slate-100 placeholder:text-slate-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Kategori */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Kategori:</span>
                  {(['ALL', 'WARGA', 'DINAS'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        categoryFilter === cat
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                      }`}
                    >
                      {cat === 'ALL' ? 'Semua' : cat === 'WARGA' ? 'Surat Warga' : 'Surat Dinas'}
                    </button>
                  ))}
                </div>

                {/* Filter Status */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Status:</span>
                  {(['ALL', 'ACTIVE', 'INACTIVE', 'DRAFT'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === st
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua' : st}
                    </button>
                  ))}
                </div>

                {/* Filter Versi */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Versi:</span>
                  {(['ALL', 'LATEST', 'OLD'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setVersionFilter(v)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        versionFilter === v
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                      }`}
                    >
                      {v === 'ALL' ? 'Semua' : v === 'LATEST' ? 'Versi Terbaru' : 'Versi Lama'}
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* ── DAFTAR TEMPLATE (TABEL & CARD RESPONSIVE) ── */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Daftar Template Surat Terdaftar</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Menampilkan {filteredTemplates.length} dari {templates.length} template sistem</p>
                </div>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Tidak ada template yang cocok dengan filter pencarian</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('ALL');
                      setStatusFilter('ALL');
                      setVersionFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Jenis Surat & Template</th>
                        <th className="py-3.5 px-3">Kode & Klasifikasi</th>
                        <th className="py-3.5 px-3 text-center">Kategori</th>
                        <th className="py-3.5 px-3 text-center">Versi</th>
                        <th className="py-3.5 px-3 text-center">Status</th>
                        <th className="py-3.5 px-3">Terakhir Diperbarui</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTemplates.map(tpl => {
                        const isDinas = isTemplateDinas(tpl);
                        const maxVer = latestVersionMap.get(tpl.letterTypeId) || 1;
                        const isLatest = tpl.version === maxVer;

                        return (
                          <tr key={tpl.id} className="hover:bg-slate-850/50 transition-colors">
                            {/* Jenis Surat & Nama Template */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-xs">{tpl.content.title}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{tpl.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {tpl.id}</div>
                            </td>

                            {/* Kode & Klasifikasi */}
                            <td className="py-3.5 px-3">
                              <div className="font-mono text-emerald-400 font-semibold text-[11px]">{tpl.code}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>Klasifikasi:</span>
                                <span className="font-mono text-slate-200 font-bold">{tpl.content.codePrefix || '-'}</span>
                              </div>
                            </td>

                            {/* Kategori (Warga vs Dinas) */}
                            <td className="py-3.5 px-3 text-center">
                              {isDinas ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <Building2 className="w-3 h-3 text-purple-400" />
                                  <span>Dinas</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  <Users className="w-3 h-3 text-teal-400" />
                                  <span>Warga</span>
                                </span>
                              )}
                            </td>

                            {/* Versi */}
                            <td className="py-3.5 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                                v{tpl.version}
                              </span>
                              {isLatest && (
                                <div className="text-[9px] text-emerald-400 font-bold mt-0.5">Terbaru</div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3 text-center">
                              {tpl.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>ACTIVE</span>
                                </span>
                              ) : tpl.status === 'INACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-750 text-slate-400 border border-slate-700">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>INACTIVE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <span>DRAFT</span>
                                </span>
                              )}
                            </td>

                            {/* Terakhir Diperbarui */}
                            <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                              <div className="text-slate-300 font-medium">
                                {tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{tpl.updatedBy || tpl.createdBy || 'Sistem'}</div>
                            </td>

                            {/* Aksi */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Tombol LIHAT / DETAIL */}
                                <button
                                  onClick={() => handleOpenEditor(tpl, false)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Lihat rincian template dan struktur konten"
                                >
                                  LIHAT
                                </button>

                                {/* Tombol PREVIEW A4 */}
                                <button
                                  onClick={() => handleOpenPreview(tpl)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 hover:text-blue-200 border border-blue-800/60 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Pratinjau lembar surat A4"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>PREVIEW</span>
                                </button>

                                {/* Tombol RIWAYAT VERSI */}
                                <button
                                  onClick={() => setLineageLetterTypeId(tpl.letterTypeId)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Lihat riwayat seluruh versi untuk jenis surat ini"
                                >
                                  VERSI
                                </button>

                                {/* Tombol BUAT VERSI BARU (Khusus Admin) */}
                                {canMutate && (
                                  <button
                                    onClick={() => handleOpenEditor(tpl, true)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                    title="Edit dan simpan sebagai versi baru tanpa mengubah dokumen terbit lama"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>BUAT VERSI</span>
                                  </button>
                                )}

                                {/* Tombol AKTIFKAN / NONAKTIFKAN (Khusus Admin) */}
                                {canMutate && (
                                  tpl.status === 'ACTIVE' ? (
                                    <button
                                      onClick={() => handleDeactivateTemplate(tpl)}
                                      className="px-2 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border border-amber-800/60 text-[11px] font-semibold transition-colors cursor-pointer"
                                      title="Nonaktifkan template ini"
                                    >
                                      NONAKTIFKAN
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivateTemplate(tpl)}
                                      className="px-2 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-800/60 text-[11px] font-semibold transition-colors cursor-pointer"
                                      title="Aktifkan template ini"
                                    >
                                      AKTIFKAN
                                    </button>
                                  )
                                )}

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 2: AUDIT LOG PERUBAHAN TEMPLATE ── */}
        {activeMainTab === 'audit' && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Riwayat Audit Perubahan Template Surat</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Merekam pembuatan versi baru, aktivasi, nonaktivasi, dan audit perbaikan template
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Total: {auditLogs.length} catatan</span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada aktivitas audit log perubahan template yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-3">Aksi</th>
                      <th className="py-3 px-3">Aktor</th>
                      <th className="py-3 px-3">Template</th>
                      <th className="py-3 px-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-850/50">
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          {log.action === 'TEMPLATE_CREATED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              CREATED
                            </span>
                          )}
                          {log.action === 'TEMPLATE_ACTIVATED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              ACTIVATED
                            </span>
                          )}
                          {log.action === 'TEMPLATE_DEACTIVATED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              DEACTIVATED
                            </span>
                          )}
                          {log.action === 'TEMPLATE_UPDATED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              UPDATED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{log.actorName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{log.actorRole}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-200 font-medium truncate max-w-xs">{log.templateName || log.templateId}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.templateId}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-xs leading-relaxed">
                          {log.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── MODAL WORKSPACE EDITOR TERSTRUKTUR ── */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Editor Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{editingTemplate.isNewVersionMode ? 'Buat Versi Baru Template' : 'Lihat / Edit Detail Template'}</span>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Base: v{editingTemplate.baseTemplate.version} → Target: v{(latestVersionMap.get(editingTemplate.baseTemplate.letterTypeId) || editingTemplate.baseTemplate.version) + 1}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingTemplate.baseTemplate.name} • {isTemplateDinas(editingTemplate.baseTemplate) ? 'Surat Dinas' : 'Surat Warga'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingTemplate(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Modal Editor Form Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {/* Notice Immutability */}
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-100">Aturan Versioning Mutlak:</strong> Menyimpan perubahan akan secara otomatis membuat <strong>Versi Baru yang Terpisah (Immutable Version)</strong>. Template lama v{editingTemplate.baseTemplate.version} akan tetap dipertahankan utuh untuk menjamin validitas cetak dan verifikasi dokumen yang sudah pernah terbit.
                </div>
              </div>

              {/* Grid 2 Kolom: Form Editor di Kiri + Variable Helper di Kanan */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── KOLOM KIRI & TENGAH (EDITOR KONTEN TERSTRUKTUR) ── */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* A. INFORMASI TEMPLATE */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>A. Metadata & Nama Template</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Template</label>
                        <input
                          type="text"
                          value={editingTemplate.formData.name}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            formData: { ...editingTemplate.formData, name: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                        <input
                          type="text"
                          value={editingTemplate.formData.description}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            formData: { ...editingTemplate.formData, description: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* B. JUDUL SURAT & FORMAT PENOMORAN */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>B. Judul Surat & Format Penomoran</span>
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Judul Surat Resmi (Huruf Kapital) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingTemplate.formData.title}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            formData: { ...editingTemplate.formData, title: e.target.value }
                          })}
                          placeholder="SURAT KETERANGAN DOMISILI"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 focus:border-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Kode Klasifikasi <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.formData.codePrefix}
                            onChange={e => setEditingTemplate({
                              ...editingTemplate,
                              formData: { ...editingTemplate.formData, codePrefix: e.target.value }
                            })}
                            placeholder="470 / 503 / 100"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-100 focus:border-teal-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Format Penomoran Template <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.formData.letterNumberFormat}
                            onChange={e => setEditingTemplate({
                              ...editingTemplate,
                              formData: { ...editingTemplate.formData, letterNumberFormat: e.target.value }
                            })}
                            placeholder="{{kode_klasifikasi}} / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Contoh Live Preview Format Nomor */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Contoh Hasil Nomor Surat:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {editingTemplate.formData.codePrefix || '470'} / 0001 / 2008 / IX / {new Date().getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* C. PEMBUKA (OPENING) */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>C. Kalimat Pembuka (Opening)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Kalimat pengantar sebelum daftar data kependudukan atau pokok surat:
                    </p>
                    <textarea
                      rows={3}
                      value={editingTemplate.formData.opening}
                      onChange={e => setEditingTemplate({
                        ...editingTemplate,
                        formData: { ...editingTemplate.formData, opening: e.target.value }
                      })}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-teal-500 leading-relaxed"
                    />
                  </div>

                  {/* D. PARAGRAF ISI (BODY PARAGRAPHS ARRAY) */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>D. Paragraf Isi Surat ({editingTemplate.formData.bodyParagraphs.length})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate({
                            ...editingTemplate,
                            formData: {
                              ...editingTemplate.formData,
                              bodyParagraphs: [...editingTemplate.formData.bodyParagraphs, '']
                            }
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Paragraf</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editingTemplate.formData.bodyParagraphs.map((paragraph, pIdx) => (
                        <div key={pIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300">
                              Paragraf {pIdx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={pIdx === 0}
                                onClick={() => {
                                  if (pIdx === 0) return;
                                  const arr = [...editingTemplate.formData.bodyParagraphs];
                                  const temp = arr[pIdx - 1];
                                  arr[pIdx - 1] = arr[pIdx];
                                  arr[pIdx] = temp;
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    formData: { ...editingTemplate.formData, bodyParagraphs: arr }
                                  });
                                }}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="Pindah ke atas"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={pIdx === editingTemplate.formData.bodyParagraphs.length - 1}
                                onClick={() => {
                                  if (pIdx === editingTemplate.formData.bodyParagraphs.length - 1) return;
                                  const arr = [...editingTemplate.formData.bodyParagraphs];
                                  const temp = arr[pIdx + 1];
                                  arr[pIdx + 1] = arr[pIdx];
                                  arr[pIdx] = temp;
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    formData: { ...editingTemplate.formData, bodyParagraphs: arr }
                                  });
                                }}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="Pindah ke bawah"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                              {/* Hapus */}
                              <button
                                type="button"
                                disabled={editingTemplate.formData.bodyParagraphs.length <= 1}
                                onClick={() => {
                                  const arr = editingTemplate.formData.bodyParagraphs.filter((_, idx) => idx !== pIdx);
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    formData: { ...editingTemplate.formData, bodyParagraphs: arr }
                                  });
                                }}
                                className="p-1 rounded bg-rose-950/60 text-rose-400 hover:text-rose-300 disabled:opacity-30 cursor-pointer"
                                title="Hapus paragraf ini"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={paragraph}
                            onChange={e => {
                              const arr = [...editingTemplate.formData.bodyParagraphs];
                              arr[pIdx] = e.target.value;
                              setEditingTemplate({
                                ...editingTemplate,
                                formData: { ...editingTemplate.formData, bodyParagraphs: arr }
                              });
                            }}
                            placeholder="Tuliskan isi kalimat paragraf..."
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-teal-500 leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* E. PENUTUP (CLOSING) */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>E. Kalimat Penutup (Closing)</span>
                    </h4>
                    <textarea
                      rows={2}
                      value={editingTemplate.formData.closing}
                      onChange={e => setEditingTemplate({
                        ...editingTemplate,
                        formData: { ...editingTemplate.formData, closing: e.target.value }
                      })}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-teal-500 leading-relaxed"
                    />
                  </div>

                  {/* F. PENANDATANGAN */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>F. Informasi Pejabat Penandatangan</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Surat resmi menggunakan tanda tangan manual fisik + stempel cap desa (bukan sertifikat TTE):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jabatan</label>
                        <input
                          type="text"
                          value={editingTemplate.formData.signatoryRole}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            formData: { ...editingTemplate.formData, signatoryRole: e.target.value }
                          })}
                          placeholder="Kepala Desa Beliti Jaya"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Nama Pejabat <span className="text-slate-500 font-normal">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={editingTemplate.formData.signatoryName}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            formData: { ...editingTemplate.formData, signatoryName: e.target.value }
                          })}
                          placeholder="Kosongkan untuk auto profil desa"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          NIP Pejabat <span className="text-slate-500 font-normal">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={editingTemplate.formData.signatoryNip}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            formData: { ...editingTemplate.formData, signatoryNip: e.target.value }
                          })}
                          placeholder="-"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* G. CUSTOM DISPLAY FIELDS */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>G. Custom Display Fields ({editingTemplate.formData.customDisplayFields.length})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate({
                            ...editingTemplate,
                            formData: {
                              ...editingTemplate.formData,
                              customDisplayFields: [
                                ...editingTemplate.formData.customDisplayFields,
                                { label: '', variableKey: '' }
                              ]
                            }
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Field</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editingTemplate.formData.customDisplayFields.map((field, fIdx) => (
                        <div key={fIdx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={field.label}
                              onChange={e => {
                                const arr = [...editingTemplate.formData.customDisplayFields];
                                arr[fIdx].label = e.target.value;
                                setEditingTemplate({
                                  ...editingTemplate,
                                  formData: { ...editingTemplate.formData, customDisplayFields: arr }
                                });
                              }}
                              placeholder="Label: Keperluan"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={field.variableKey}
                              onChange={e => {
                                const arr = [...editingTemplate.formData.customDisplayFields];
                                arr[fIdx].variableKey = e.target.value;
                                setEditingTemplate({
                                  ...editingTemplate,
                                  formData: { ...editingTemplate.formData, customDisplayFields: arr }
                                });
                              }}
                              placeholder="Key: keperluan"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const arr = editingTemplate.formData.customDisplayFields.filter((_, idx) => idx !== fIdx);
                                setEditingTemplate({
                                  ...editingTemplate,
                                  formData: { ...editingTemplate.formData, customDisplayFields: arr }
                                });
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Hapus field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── KOLOM KANAN (VARIABLE HELPER PANEL) ── */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 sticky top-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        <span>Variabel Tersedia</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Klik untuk menyalin</span>
                    </div>

                    {/* Variabel Dokumen Umum */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen & Wilayah</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '{{nomor_surat}}',
                          '{{tanggal_surat}}',
                          '{{bulan_surat}}',
                          '{{tahun_surat}}',
                          '{{bulan_romawi}}',
                          '{{nama_desa}}',
                          '{{nama_kecamatan}}',
                          '{{nama_kabupaten}}',
                          '{{nama_provinsi}}'
                        ].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleCopyVariable(v)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-[11px] font-mono text-teal-300 transition-colors cursor-pointer"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variabel Surat Warga */}
                    {!isTemplateDinas(editingTemplate.baseTemplate) && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Kependudukan Warga</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            '{{nama}}',
                            '{{nik}}',
                            '{{no_kk}}',
                            '{{tempat_lahir}}',
                            '{{tanggal_lahir}}',
                            '{{ttl}}',
                            '{{jenis_kelamin}}',
                            '{{agama}}',
                            '{{status_perkawinan}}',
                            '{{pekerjaan}}',
                            '{{pendidikan}}',
                            '{{alamat}}',
                            '{{dusun}}',
                            '{{rt}}',
                            '{{rw}}',
                            '{{alamat_lengkap}}',
                            '{{keperluan}}',
                            '{{lama_tinggal}}',
                            '{{nama_usaha}}',
                            '{{bidang_usaha}}',
                            '{{alamat_usaha}}'
                          ].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => handleCopyVariable(v)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-[11px] font-mono text-cyan-300 transition-colors cursor-pointer"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variabel Surat Dinas */}
                    {isTemplateDinas(editingTemplate.baseTemplate) && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Naskah Dinas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            '{{tujuan_surat}}',
                            '{{instansi_tujuan}}',
                            '{{alamat_tujuan}}',
                            '{{sifat_surat}}',
                            '{{lampiran}}',
                            '{{perihal}}',
                            '{{isi_surat}}',
                            '{{tembusan}}',
                            '{{hari_tanggal}}',
                            '{{waktu_acara}}',
                            '{{tempat_acara}}',
                            '{{nama_petugas}}',
                            '{{nip_petugas}}',
                            '{{uraian_tugas}}',
                            '{{hal_pemberitahuan}}',
                            '{{pihak_direkomendasikan}}'
                          ].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => handleCopyVariable(v)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-[11px] font-mono text-purple-300 transition-colors cursor-pointer"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      Gunakan kurung ganda <code className="text-teal-400 font-mono">{'{{nama_variable}}'}</code> di dalam paragraf pembuka, isi, maupun penutup.
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Editor Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                BATAL
              </button>

              <div className="flex items-center gap-2.5">
                {/* Uji Pratinjau Sebelum Simpan */}
                <button
                  type="button"
                  onClick={handlePreviewEditorDraft}
                  className="px-4 py-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 text-blue-200 border border-blue-700/60 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Lihat simulasi cetak A4 dokumen dengan draf yang baru diedit"
                >
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>UJI PRATINJAU</span>
                </button>

                {/* Tombol Simpan Versi Baru */}
                {canMutate && (
                  <button
                    type="button"
                    onClick={handleSaveAsNewVersion}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/50 cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>SIMPAN SEBAGAI VERSI BARU</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL RIWAYAT VERSI (VERSION LINEAGE) ── */}
      {lineageLetterTypeId && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Riwayat Versi Template</h3>
                  <p className="text-xs text-slate-400">{lineageTemplates[0]?.name || lineageLetterTypeId}</p>
                </div>
              </div>
              <button
                onClick={() => setLineageLetterTypeId(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {lineageTemplates.map(verTpl => (
                <div 
                  key={verTpl.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    verTpl.status === 'ACTIVE'
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-extrabold text-white">v{verTpl.version}</span>
                      {verTpl.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ACTIVE (Aktif)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          INACTIVE (Arsip Historis)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {verTpl.createdAt ? new Date(verTpl.createdAt).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mt-2">
                    {verTpl.content.title} • Kode: <span className="font-mono text-slate-400">{verTpl.code}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Dibuat oleh: <span className="text-slate-300">{verTpl.createdBy || 'Sistem'}</span>
                  </div>

                  {/* Actions for this version */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setLineageLetterTypeId(null);
                        handleOpenPreview(verTpl);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/50 cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview v{verTpl.version}</span>
                    </button>

                    {canMutate && (
                      <button
                        onClick={() => {
                          setLineageLetterTypeId(null);
                          handleOpenEditor(verTpl, true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer flex items-center gap-1"
                        title="Gunakan versi ini sebagai dasar untuk membuat versi baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Buat Versi Dari Ini</span>
                      </button>
                    )}

                    {canMutate && verTpl.status === 'INACTIVE' && (
                      <button
                        onClick={() => {
                          setLineageLetterTypeId(null);
                          handleActivateTemplate(verTpl);
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 font-semibold cursor-pointer"
                      >
                        Aktifkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setLineageLetterTypeId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── DIALOG KONFIRMASI MUTASI (MUTEX PROTECTED) ── */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${
                confirmationModal.confirmVariant === 'amber'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{confirmationModal.title}</h3>
                <p className="text-xs text-slate-400">Konfirmasi Tindakan Mutasi Template</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              <p>{confirmationModal.message}</p>
              {confirmationModal.warningNote && (
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-700/60 text-amber-200 text-[11px] leading-relaxed">
                  {confirmationModal.warningNote}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => confirmationModal.onConfirm()}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                  confirmationModal.confirmVariant === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                }`}
              >
                {confirmationModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRATINJAU DOKUMEN RESMI A4 (MENGGUNAKAN DOCUMENTPREVIEWWORKSPACE) ── */}
      {previewTarget && (
        <DocumentPreviewWorkspace
          letterRequest={previewTarget.dummyRequest}
          templateOverride={previewTarget.template}
          isTemplatePreview={true}
          mode="aparatur"
          currentUser={currentUser}
          customProfile={desaProfile}
          onClose={() => setPreviewTarget(null)}
          onBack={() => setPreviewTarget(null)}
        />
      )}

    </div>
  );
};
