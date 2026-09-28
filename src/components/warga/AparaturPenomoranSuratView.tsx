import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  User, 
  RolePermissions, 
  DesaProfile, 
  LetterNumberingConfig,
  LetterIssuance,
  LetterTemplate
} from '../../types';
import { StorageService } from '../../services/storageService';
import { getRomanMonth } from '../../utils/letterVariableResolver';
import { 
  Hash, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Save, 
  RotateCcw, 
  Lock, 
  Eye, 
  Sparkles, 
  Building2, 
  Layers, 
  Calendar, 
  FileText, 
  Sliders, 
  AlertOctagon,
  Copy,
  Check,
  Activity
} from 'lucide-react';

export interface AparaturPenomoranSuratViewProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBack: () => void;
  onOpenDashboard?: () => void;
  onOpenTemplates?: () => void;
}

export const AparaturPenomoranSuratView: React.FC<AparaturPenomoranSuratViewProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBack,
  onOpenDashboard,
  onOpenTemplates
}) => {
  // ── RBAC VALIDATION ──
  const isAdmin = currentUser.role === 'admin';
  const isOperator = currentUser.role === 'operator';
  const isOperatorAset = currentUser.role === 'operator_aset';
  const canMutate = isAdmin; // Hanya Admin yang berwenang menyimpan perubahan konfigurasi

  // ── READ REAL STORAGE DATA ──
  const [config, setConfig] = useState<LetterNumberingConfig>(() => StorageService.getLetterNumberingConfig());
  const [issuances, setIssuances] = useState<LetterIssuance[]>(() => StorageService.getLetterIssuances());
  const [templates, setTemplates] = useState<LetterTemplate[]>(() => StorageService.getLetterTemplates());

  const refreshData = () => {
    setConfig(StorageService.getLetterNumberingConfig());
    setIssuances(StorageService.getLetterIssuances());
    setTemplates(StorageService.getLetterTemplates());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // ── FORM EDITING STATE ──
  const [format, setFormat] = useState(config.format);
  const [kodeDesa, setKodeDesa] = useState(config.kodeDesa);
  const [paddingDigits, setPaddingDigits] = useState<number>(config.paddingDigits || 4);
  const [resetTahunan, setResetTahunan] = useState<boolean>(config.resetTahunan ?? true);
  const [classifications, setClassifications] = useState<Record<string, string>>({ ...config.classifications });

  // Update form when storage config changes
  useEffect(() => {
    setFormat(config.format);
    setKodeDesa(config.kodeDesa);
    setPaddingDigits(config.paddingDigits || 4);
    setResetTahunan(config.resetTahunan ?? true);
    setClassifications({ ...config.classifications });
  }, [config]);

  // ── SYNCHRONOUS MUTEX UNTUK 1 KLIK = 1 MUTATION ──
  const isSavingRef = useRef(false);

  // ── TOAST NOTIFICATION ──
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // ── HELPER COPY TOKEN ──
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const handleCopyToken = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(tok);
    showToast(`Token disalin: ${tok}`, 'info');
    setTimeout(() => {
      setCopiedToken(prev => prev === tok ? null : prev);
    }, 2000);
  };

  // ── LIVE PREVIEW CALCULATOR (SIMULASI READ-ONLY, TANPA STORAGE MUTATION) ──
  const currentYear = new Date().getFullYear();
  const currentRomanMonth = getRomanMonth(new Date());

  const generateSimulatedNumber = (
    fmt: string,
    clsCode: string,
    num: number,
    kDesa: string,
    pad: number,
    romanM: string,
    yr: number
  ) => {
    const padded = String(num).padStart(pad, '0');
    return (fmt || '{{kode_klasifikasi}} / {{nomor_urut}} / {{kode_desa}} / {{bulan_romawi}} / {{tahun}}')
      .replace(/{{kode_klasifikasi}}/g, clsCode || '470')
      .replace(/{{nomor_urut}}/g, padded)
      .replace(/{{nomor}}/g, padded)
      .replace(/{{kode_desa}}/g, kDesa || '2008')
      .replace(/{{bulan_romawi}}/g, romanM || 'IX')
      .replace(/{{tahun}}/g, String(yr));
  };

  // Live preview standar
  const livePreviewStandard = useMemo(() => {
    return generateSimulatedNumber(
      format,
      '470',
      1,
      kodeDesa,
      Number(paddingDigits) || 4,
      currentRomanMonth,
      currentYear
    );
  }, [format, kodeDesa, paddingDigits, currentRomanMonth, currentYear]);

  // ── SECTION 5: MONITOR REGISTER NOMOR (DIHITUNG DARI LETTER_ISSUANCES REAL) ──
  const counterMonitorData = useMemo(() => {
    // Map untuk menampung nomor urut tertinggi per tahun dari data riil issuances
    const maxNumberByYear: Record<string, number> = {};
    const totalIssuedByYear: Record<string, number> = {};

    issuances.forEach(iss => {
      // Hanya hitung dokumen yang benar-benar berstatus resmi TERBIT (ISSUED)
      if (iss.status !== 'ISSUED') return;
      const yr = String(iss.tahun || currentYear);
      totalIssuedByYear[yr] = (totalIssuedByYear[yr] || 0) + 1;

      // Ambil nomor urut: prioritaskan iss.urutanNomor dari LetterIssuance resmi,
      // fallback ekstraksi dari string nomorSurat aktual (token nomor urut di posisi format)
      let num = iss.urutanNomor || 0;
      if (!num && iss.nomorSurat) {
        const parts = iss.nomorSurat.split('/');
        if (parts.length >= 2) {
          const parsed = parseInt(parts[1].trim(), 10);
          if (!isNaN(parsed)) num = parsed;
        }
      }

      if (num > (maxNumberByYear[yr] || 0)) {
        maxNumberByYear[yr] = num;
      }
    });

    // Gabungkan dengan tahun-tahun yang ada pada config.counterByYear
    const allYears = Array.from(
      new Set([
        String(currentYear),
        ...Object.keys(config.counterByYear || {}),
        ...Object.keys(maxNumberByYear)
      ])
    ).sort((a, b) => Number(b) - Number(a));

    return allYears.map(yr => {
      const configCounter = (config.counterByYear || {})[yr] || 0;
      const highestIssued = maxNumberByYear[yr] || 0;
      const totalIssued = totalIssuedByYear[yr] || 0;
      const isConsistent = configCounter >= highestIssued;

      return {
        year: yr,
        configCounter,
        highestIssued,
        totalIssued,
        isConsistent
      };
    });
  }, [issuances, config.counterByYear, currentYear]);

  // ── SECTION 6: DAFTAR KLASIFIKASI TERDAFTAR ──
  const letterTypeDefinitions = useMemo(() => {
    return [
      // Kategori Warga (8 jenis)
      { code: 'SK_DOMISILI', name: 'Surat Keterangan Domisili', category: 'WARGA', defaultPrefix: '470' },
      { code: 'SK_USAHA', name: 'Surat Keterangan Usaha (SKU)', category: 'WARGA', defaultPrefix: '503' },
      { code: 'SK_TIDAK_MAMPU', name: 'Surat Keterangan Tidak Mampu (SKTM)', category: 'WARGA', defaultPrefix: '401' },
      { code: 'SK_PENGANTAR', name: 'Surat Pengantar Kependudukan', category: 'WARGA', defaultPrefix: '470' },
      { code: 'SK_BELUM_MENIKAH', name: 'Surat Keterangan Belum Menikah', category: 'WARGA', defaultPrefix: '474.2' },
      { code: 'SK_KEHILANGAN', name: 'Surat Pengantar Kehilangan', category: 'WARGA', defaultPrefix: '300' },
      { code: 'SK_KELAHIRAN', name: 'Surat Keterangan Kelahiran', category: 'WARGA', defaultPrefix: '472.11' },
      { code: 'SK_KEMATIAN', name: 'Surat Keterangan Kematian', category: 'WARGA', defaultPrefix: '472.12' },
      // Kategori Dinas (4 jenis)
      { code: 'DINAS_UNDANGAN', name: 'Surat Undangan Kedinasan', category: 'DINAS', defaultPrefix: '005' },
      { code: 'DINAS_TUGAS', name: 'Surat Perintah Tugas (SPT)', category: 'DINAS', defaultPrefix: '090' },
      { code: 'DINAS_EDARAN', name: 'Surat Edaran Pemerintah Desa', category: 'DINAS', defaultPrefix: '100' },
      { code: 'DINAS_REKOMENDASI', name: 'Surat Rekomendasi Kedinasan', category: 'DINAS', defaultPrefix: '800' }
    ];
  }, []);

  // Cek apakah ada perbedaan antara classification di form vs template aktif
  const templateMismatchList = useMemo(() => {
    const list: { typeCode: string; configCode: string; templatePrefix: string; templateName: string }[] = [];
    letterTypeDefinitions.forEach(item => {
      const activeTpl = templates.find(t => 
        (t.code === item.code || t.letterTypeId.includes(item.code.toLowerCase().replace(/_/g, '-'))) && 
        t.status === 'ACTIVE'
      );
      if (activeTpl && activeTpl.content.codePrefix) {
        const curConfigVal = classifications[item.code] || item.defaultPrefix;
        if (curConfigVal !== activeTpl.content.codePrefix) {
          list.push({
            typeCode: item.code,
            configCode: curConfigVal,
            templatePrefix: activeTpl.content.codePrefix,
            templateName: activeTpl.name
          });
        }
      }
    });
    return list;
  }, [templates, classifications, letterTypeDefinitions]);

  // ── SECTION 7: STATUS KONSISTENSI PENOMORAN (10 CHECKS DARI DATA RUNTIME) ──
  const consistencyAudit = useMemo(() => {
    const checks: { label: string; passed: boolean; message: string; critical: boolean }[] = [];

    // 1. Config tersedia
    checks.push({
      label: 'Konfigurasi Penomoran Tersedia',
      passed: Boolean(config),
      message: config ? 'Konfigurasi terbaca dari storage resmi' : 'Konfigurasi tidak ditemukan di storage',
      critical: true
    });

    // 2. Counter tersedia
    checks.push({
      label: 'Counter Register Tahunan Tersedia',
      passed: Boolean(config.counterByYear && typeof config.counterByYear === 'object'),
      message: 'Dictionary counterByYear terinisialisasi',
      critical: true
    });

    // 3. Tahun berjalan tersedia
    const hasCurrentYearCounter = config.counterByYear && config.counterByYear[String(currentYear)] !== undefined;
    checks.push({
      label: `Counter Tahun Berjalan (${currentYear})`,
      passed: hasCurrentYearCounter,
      message: hasCurrentYearCounter 
        ? `Tercatat pada counter register: ${config.counterByYear[String(currentYear)]}` 
        : `Belum ada entri (akan otomatis dimulai dari 0 saat surat pertama ${currentYear} terbit)`,
      critical: false
    });

    // 4. Format valid
    const formatHasNomor = format.includes('{{nomor_urut}}') || format.includes('{{nomor}}');
    const formatHasTahun = format.includes('{{tahun}}');
    const formatHasDesa = format.includes('{{kode_desa}}');
    const formatHasKlasifikasi = format.includes('{{kode_klasifikasi}}');
    const isFormatValid = format.trim().length > 0 && formatHasNomor && formatHasTahun && formatHasDesa && formatHasKlasifikasi;
    checks.push({
      label: 'Format Nomor Surat Lengkap',
      passed: isFormatValid,
      message: isFormatValid 
        ? 'Memuat seluruh token wajib ({{kode_klasifikasi}}, {{nomor_urut}}, {{kode_desa}}, {{tahun}})' 
        : 'Format kehilangan satu atau lebih token wajib!',
      critical: true
    });

    // 5. Kode desa tersedia
    const isKodeDesaValid = Boolean(kodeDesa && kodeDesa.trim().length > 0);
    checks.push({
      label: 'Kode Registrasi Desa',
      passed: isKodeDesaValid,
      message: isKodeDesaValid ? `Terdefinisi: "${kodeDesa}"` : 'Kode desa tidak boleh kosong',
      critical: true
    });

    // 6. Padding valid
    const isPaddingValid = paddingDigits >= 1 && paddingDigits <= 8;
    checks.push({
      label: 'Jumlah Digit Nomor Urut (Padding)',
      passed: isPaddingValid,
      message: isPaddingValid ? `${paddingDigits} Digit (Standar 1–8)` : 'Padding harus bernilai antara 1 s/d 8',
      critical: true
    });

    // 7. Semua LetterType aktif memiliki classification
    const missingClassifications = letterTypeDefinitions.filter(lt => !classifications[lt.code] || classifications[lt.code].trim() === '');
    const hasAllClassifications = missingClassifications.length === 0;
    checks.push({
      label: 'Pemetaan Seluruh Klasifikasi Surat',
      passed: hasAllClassifications,
      message: hasAllClassifications 
        ? 'Semua 12 jenis surat (8 Warga & 4 Dinas) memiliki kode klasifikasi' 
        : `${missingClassifications.length} jenis surat kehilangan kode klasifikasi`,
      critical: true
    });

    // 8. Template aktif memiliki classification
    const activeTemplatesWithoutPrefix = templates.filter(t => t.status === 'ACTIVE' && (!t.content.codePrefix || t.content.codePrefix.trim() === ''));
    checks.push({
      label: 'Klasifikasi Template Aktif Terdefinisi',
      passed: activeTemplatesWithoutPrefix.length === 0,
      message: activeTemplatesWithoutPrefix.length === 0 
        ? 'Seluruh template aktif memiliki metadata codePrefix' 
        : `${activeTemplatesWithoutPrefix.length} template aktif tidak memiliki codePrefix`,
      critical: false
    });

    // 9. Tidak ada duplicate mapping tidak disengaja
    const hasEmptyOrCorruptMap = Object.entries(classifications).some(([k, v]) => !k || !v || String(v).trim() === '');
    checks.push({
      label: 'Integritas Kamus Klasifikasi',
      passed: !hasEmptyOrCorruptMap,
      message: !hasEmptyOrCorruptMap ? 'Struktur kamus klasifikasi bersih' : 'Terdapat nilai klasifikasi kosong',
      critical: true
    });

    // 10. Counter config >= nomor terbit tertinggi
    const hasInconsistentCounter = counterMonitorData.some(c => !c.isConsistent);
    checks.push({
      label: 'Konsistensi Counter vs Surat Terbit',
      passed: !hasInconsistentCounter,
      message: !hasInconsistentCounter 
        ? 'Counter konfigurasi sinkron atau lebih besar dari surat yang sudah terbit' 
        : 'Counter konfigurasi lebih kecil daripada nomor surat yang sudah diterbitkan!',
      critical: true
    });

    const hasCriticalFailed = checks.some(c => c.critical && !c.passed);
    const hasWarning = checks.some(c => !c.critical && !c.passed) || templateMismatchList.length > 0;

    const status: 'AMAN' | 'PERLU_PERHATIAN' | 'TIDAK_VALID' = hasCriticalFailed 
      ? 'TIDAK_VALID' 
      : hasWarning 
        ? 'PERLU_PERHATIAN' 
        : 'AMAN';

    return {
      status,
      checks,
      hasCriticalFailed
    };
  }, [config, format, kodeDesa, paddingDigits, classifications, letterTypeDefinitions, templates, counterMonitorData, templateMismatchList, currentYear]);

  // ── SECTION 8: PREVIEW PER JENIS SURAT (SELECTOR SIMULASI READ-ONLY) ──
  const [selectedPreviewType, setSelectedPreviewType] = useState<string>('SK_DOMISILI');

  const selectedPreviewInfo = useMemo(() => {
    const def = letterTypeDefinitions.find(d => d.code === selectedPreviewType) || letterTypeDefinitions[0];
    const clsCode = classifications[def.code] || def.defaultPrefix;
    const simNumber = generateSimulatedNumber(
      format,
      clsCode,
      def.category === 'DINAS' ? 2 : 1,
      kodeDesa,
      Number(paddingDigits) || 4,
      currentRomanMonth,
      currentYear
    );

    return {
      ...def,
      clsCode,
      simNumber
    };
  }, [selectedPreviewType, letterTypeDefinitions, classifications, format, kodeDesa, paddingDigits, currentRomanMonth, currentYear]);

  // ── RESET KE AWAL SEBELUM DIEDIT ──
  const handleResetForm = () => {
    setFormat(config.format);
    setKodeDesa(config.kodeDesa);
    setPaddingDigits(config.paddingDigits || 4);
    setResetTahunan(config.resetTahunan ?? true);
    setClassifications({ ...config.classifications });
    showToast('Form dikembalikan ke konfigurasi tersimpan.', 'info');
  };

  // ── SECTION 9: SIMPAN PERUBAHAN (DENGAN PROTEKSI INTEGRITAS) ──
  const handleSaveConfig = () => {
    if (!canMutate) {
      showToast('Akses ditolak: Hanya Administrator yang berwenang mengubah konfigurasi penomoran.', 'warning');
      return;
    }

    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      // 1. Validasi Format
      if (!format || !format.trim()) {
        showToast('Format nomor surat wajib diisi.', 'error');
        return;
      }
      if (!format.includes('{{nomor_urut}}') && !format.includes('{{nomor}}')) {
        showToast('Format nomor surat wajib memuat token {{nomor_urut}} atau {{nomor}}.', 'error');
        return;
      }
      if (!format.includes('{{tahun}}')) {
        showToast('Format nomor surat wajib memuat token {{tahun}}.', 'error');
        return;
      }
      if (!format.includes('{{kode_desa}}')) {
        showToast('Format nomor surat wajib memuat token {{kode_desa}}.', 'error');
        return;
      }
      if (!format.includes('{{kode_klasifikasi}}')) {
        showToast('Format nomor surat wajib memuat token {{kode_klasifikasi}}.', 'error');
        return;
      }

      // 2. Validasi Kode Desa
      if (!kodeDesa || !kodeDesa.trim()) {
        showToast('Kode registrasi desa wajib diisi.', 'error');
        return;
      }

      // 3. Validasi Padding
      const padNum = Number(paddingDigits);
      if (isNaN(padNum) || padNum < 1 || padNum > 8) {
        showToast('Jumlah digit nomor urut (padding) harus bernilai antara 1 s/d 8.', 'error');
        return;
      }

      // 4. Validasi Klasifikasi
      for (const lt of letterTypeDefinitions) {
        const val = classifications[lt.code];
        if (!val || !val.trim()) {
          showToast(`Kode klasifikasi untuk "${lt.name}" (${lt.code}) tidak boleh kosong.`, 'error');
          return;
        }
      }

      // 5. Validasi Integritas Counter (Config counter >= highest issued)
      const yrStr = String(currentYear);
      const curCounterVal = (config.counterByYear || {})[yrStr] || 0;
      const yrMonitor = counterMonitorData.find(m => m.year === yrStr);
      if (yrMonitor && curCounterVal < yrMonitor.highestIssued) {
        showToast(
          `Counter konfigurasi (${curCounterVal}) lebih kecil daripada nomor surat yang sudah diterbitkan (${yrMonitor.highestIssued}). Konfigurasi tidak dapat disimpan sampai konsisten.`,
          'error'
        );
        return;
      }

      // Persiapkan data baru
      const updatedConfig: LetterNumberingConfig = {
        ...config,
        format: format.trim(),
        kodeDesa: kodeDesa.trim(),
        paddingDigits: padNum,
        resetTahunan: resetTahunan,
        classifications: { ...classifications }
      };

      // Simpan ke storage resmi (STORAGE_KEYS.LETTER_NUMBERING_CONFIG)
      StorageService.saveLetterNumberingConfig(updatedConfig);
      setConfig(updatedConfig);

      // Audit Log: Gunakan mekanisme log persuratan yang ada di storageService
      const changes: string[] = [];
      if (config.format !== updatedConfig.format) changes.push(`Format diubah`);
      if (config.kodeDesa !== updatedConfig.kodeDesa) changes.push(`Kode Desa diubah ke "${updatedConfig.kodeDesa}"`);
      if (config.paddingDigits !== updatedConfig.paddingDigits) changes.push(`Padding diubah ke ${updatedConfig.paddingDigits}`);
      if (config.resetTahunan !== updatedConfig.resetTahunan) changes.push(`Reset tahunan diubah ke ${updatedConfig.resetTahunan}`);

      // Cek perubahan klasifikasi
      Object.keys(updatedConfig.classifications).forEach(k => {
        if (config.classifications[k] !== updatedConfig.classifications[k]) {
          changes.push(`Klasifikasi ${k}: ${config.classifications[k] || '-'} → ${updatedConfig.classifications[k]}`);
        }
      });

      const auditDescription = changes.length > 0
        ? `Konfigurasi penomoran surat diperbarui oleh ${currentUser.name}: ${changes.join(', ')}`
        : `Konfigurasi penomoran surat disimpan ulang oleh ${currentUser.name}`;

      StorageService.logLetterAudit({
        actorType: 'aparatur',
        actorId: currentUser.id,
        actorName: currentUser.name,
        letterRequestId: 'SYS-NUMBERING-CONFIG',
        letterTypeCode: 'CONFIG_NUMBERING',
        action: 'LETTER_REQUEST_REVIEWED',
        notes: auditDescription
      });

      showToast('Konfigurasi penomoran surat berhasil disimpan.', 'success');
    } finally {
      isSavingRef.current = false;
    }
  };

  // ── BLOKIR OPERATOR ASET TOTAL ──
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
              Akun Operator Aset difokuskan pada pengelolaan Inventaris & Peta Aset Desa. Modul Konfigurasi Penomoran Surat hanya dapat diakses oleh Administrator dan Operator Persuratan.
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
      
      {/* ── HEADER FULL PAGE ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-3 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Tombol KEMBALI & Judul */}
          <div className="flex items-center gap-3">
            <button
              id="btn-penomoran-kembali"
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
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Hash className="w-5 h-5 text-teal-400" />
                  <span>PENGATURAN PENOMORAN SURAT</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Engine Baku
                </span>
                {!isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Mode Lihat (Operator)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola format, kode klasifikasi, dan monitor register nomor surat.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {onOpenTemplates && (
              <button
                onClick={onOpenTemplates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Buka Template Surat Builder"
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Template Builder</span>
              </button>
            )}
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Buka Dashboard Persuratan"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
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

      {/* ── MAIN BODY CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">

        {/* ── BANNER INFORMASI INTEGRITAS PENOMORAN ── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/30 text-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-teal-100 flex items-center gap-2">
                <span>Integritas Register Surat Terbit Terjamin</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                  Immutable Issued Number
                </span>
              </p>
              <p className="text-teal-300/80 leading-relaxed">
                Perubahan konfigurasi hanya berlaku untuk penerbitan surat berikutnya. Nomor surat yang telah terbit tidak berubah.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono shrink-0">
            Engine: <span className="text-emerald-400 font-semibold">sig_numbering_v1</span>
          </div>
        </div>

        {/* ── SECTION 7: PANEL STATUS KONSISTENSI PENOMORAN (STATUS KONSISTENSI PENOMORAN) ── */}
        <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
          consistencyAudit.status === 'AMAN' 
            ? 'bg-slate-900/90 border-emerald-500/30' 
            : consistencyAudit.status === 'PERLU_PERHATIAN'
            ? 'bg-slate-900/90 border-amber-500/40'
            : 'bg-rose-950/30 border-rose-500/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className={`w-5 h-5 ${
                consistencyAudit.status === 'AMAN' 
                  ? 'text-emerald-400' 
                  : consistencyAudit.status === 'PERLU_PERHATIAN' 
                  ? 'text-amber-400' 
                  : 'text-rose-400'
              }`} />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>STATUS KONSISTENSI PENOMORAN</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    consistencyAudit.status === 'AMAN'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : consistencyAudit.status === 'PERLU_PERHATIAN'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {consistencyAudit.status === 'AMAN' && 'HIJAU: AMAN'}
                    {consistencyAudit.status === 'PERLU_PERHATIAN' && 'KUNING: PERLU PERHATIAN'}
                    {consistencyAudit.status === 'TIDAK_VALID' && 'MERAH: TIDAK VALID'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verifikasi integritas engine terhadap 10 indikator sistem & data runtime storage.
                </p>
              </div>
            </div>
          </div>

          {/* List of 10 checks in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {consistencyAudit.checks.map((chk, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {chk.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : chk.critical ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200">{chk.label}</div>
                  <div className="text-[11px] text-slate-400 leading-tight">{chk.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning banner jika terdapat template mismatch */}
          {templateMismatchList.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-100">Perbedaan Kode Klasifikasi Template & Konfigurasi Penomoran: </span>
                <span>
                  {templateMismatchList.length} template memiliki codePrefix berbeda dengan konfigurasi penomoran aktif. Perubahan konfigurasi ini tidak mengubah template historis.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── DUA KOLOM UTAMA DESKTOP / STACKED MOBILE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── KOLOM KIRI (7 SPAN): FORM PENGATURAN PARAMETER ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* SECTION 1: FORMAT NOMOR SURAT */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span>SECTION 1 — FORMAT NOMOR SURAT</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pola pembentukan nomor surat resmi pada saat diterbitkan.
                  </p>
                </div>
              </div>

              {/* Input Format String */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Format Pola Penomoran</label>
                <input
                  type="text"
                  disabled={!canMutate}
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  placeholder="{{kode_klasifikasi}} / {{nomor_urut}} / {{kode_desa}} / {{bulan_romawi}} / {{tahun}}"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-mono text-emerald-300 disabled:opacity-60 transition-colors"
                />
              </div>

              {/* Token Helper Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Token Resmi Numbering Engine (Klik untuk Salin):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{{kode_klasifikasi}}',
                    '{{nomor_urut}}',
                    '{{kode_desa}}',
                    '{{bulan_romawi}}',
                    '{{tahun}}'
                  ].map(tok => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => handleCopyToken(tok)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                        copiedToken === tok
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-750 text-teal-300 border border-slate-700'
                      }`}
                      title="Klik untuk menyalin token"
                    >
                      {copiedToken === tok ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-teal-400" />}
                      <span>{tok}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">
                  * Catatan: Engine juga menerima alias <code className="text-slate-400">{'{{nomor}}'}</code> sebagai pengganti <code className="text-slate-400">{'{{nomor_urut}}'}</code>.
                </p>
              </div>
            </div>

            {/* SECTION 2 & 3: KODE DESA & PADDING */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* SECTION 2: KODE DESA */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>SECTION 2 — KODE DESA</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kode registrasi administratif desa pada kecamatan.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Kode Registrasi Desa</label>
                  <input
                    type="text"
                    disabled={!canMutate}
                    value={kodeDesa}
                    onChange={e => setKodeDesa(e.target.value)}
                    placeholder="2008"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-mono font-bold text-white disabled:opacity-60 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Kode ini digunakan pada nomor surat yang diterbitkan setelah konfigurasi disimpan. Nomor lama tidak berubah.
                </p>
              </div>

              {/* SECTION 3: PADDING DIGITS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-4 h-4 text-cyan-400" />
                    <span>SECTION 3 — PADDING DIGIT</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Panjang karakter digit nomor urut (1 s/d 8).
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Jumlah Digit Padding</label>
                    <span className="font-mono font-bold text-cyan-300">{paddingDigits} Digit</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    disabled={!canMutate}
                    value={paddingDigits}
                    onChange={e => setPaddingDigits(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-mono font-bold text-white disabled:opacity-60 transition-colors"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Contoh: 1 → <strong className="text-slate-200">{String(1).padStart(paddingDigits, '0')}</strong></span>
                  <span>12 → <strong className="text-slate-200">{String(12).padStart(paddingDigits, '0')}</strong></span>
                  <span>125 → <strong className="text-slate-200">{String(125).padStart(paddingDigits, '0')}</strong></span>
                </div>
              </div>
            </div>

            {/* SECTION 4: RESET TAHUNAN OTOMATIS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>SECTION 4 — RESET TAHUNAN</span>
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold">
                    RESET NOMOR OTOMATIS SETIAP TAHUN
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Counter menggunakan register berdasarkan tahun penerbitan. Pada 1 Januari tahun baru, nomor urut surat berikutnya otomatis diawali kembali dari 1.
                  </p>
                </div>

                {/* Sakelar Toggle */}
                <div className="shrink-0 pt-1">
                  <button
                    type="button"
                    disabled={!canMutate}
                    onClick={() => setResetTahunan(!resetTahunan)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                      resetTahunan ? 'bg-teal-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        resetTahunan ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 6: KODE KLASIFIKASI SURAT (SINGLE SOURCE OF TRUTH UNTUK NUMBERING ENGINE) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>SECTION 6 — KODE KLASIFIKASI SURAT</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sumber rujukan tunggal (<span className="text-purple-300 italic font-semibold">Single Source of Truth</span>) kode klasifikasi untuk penerbitan surat baru.
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  12 Jenis Terdaftar
                </span>
              </div>

              {/* TABEL KLASIFIKASI RESPONSIF (SCROLL HORIZONTAL) */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Jenis Layanan Surat</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Kode Jenis</th>
                      <th className="py-2.5 px-3 w-32">Kode Klasifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {letterTypeDefinitions.map(lt => {
                      const curVal = classifications[lt.code] || lt.defaultPrefix;
                      const activeTpl = templates.find(t => 
                        (t.code === lt.code || t.letterTypeId.includes(lt.code.toLowerCase().replace(/_/g, '-'))) && 
                        t.status === 'ACTIVE'
                      );
                      const isMismatch = activeTpl?.content.codePrefix && activeTpl.content.codePrefix !== curVal;

                      return (
                        <tr key={lt.code} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-200">{lt.name}</div>
                            {isMismatch && (
                              <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Template v{activeTpl?.version}: {activeTpl?.content.codePrefix}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {lt.category === 'WARGA' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                Warga
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                Dinas
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {lt.code}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              disabled={!canMutate}
                              value={curVal}
                              onChange={e => {
                                const nextVal = e.target.value;
                                setClassifications(prev => ({
                                  ...prev,
                                  [lt.code]: nextVal
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-mono font-bold text-emerald-400 text-center disabled:opacity-60"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                * Perubahan kode klasifikasi di atas hanya berlaku untuk nomor surat yang diterbitkan setelah konfigurasi disimpan. Dokumen terbit historis tidak akan terpengaruh.
              </p>
            </div>

          </div>

          {/* ── KOLOM KANAN (5 SPAN): LIVE PREVIEW, MONITOR COUNTER, & SIMULASI ── */}
          <div className="lg:col-span-5 space-y-6">

            {/* LIVE PREVIEW FORMAT (CARD UTAMA) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>LIVE PREVIEW NOMOR SURAT</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Simulasi
                </span>
              </div>

              {/* Tampilan Hasil Preview */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Contoh Nomor Surat Keluar Resmi
                </div>
                <div className="font-mono text-base sm:text-lg font-black text-emerald-300 tracking-wide select-all break-all">
                  {livePreviewStandard}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2 pt-1 border-t border-slate-900">
                  <span>Kode: 470</span>
                  <span>•</span>
                  <span>Urut: 1</span>
                  <span>•</span>
                  <span>Desa: {kodeDesa}</span>
                  <span>•</span>
                  <span>Bulan: {currentRomanMonth}</span>
                  <span>•</span>
                  <span>Tahun: {currentYear}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                Preview ini hanyalah simulasi visual secara dinamis di memori browser. Tidak membuat record transaksi dan tidak menaikkan angka counter register.
              </p>
            </div>

            {/* SECTION 8: PREVIEW PER JENIS SURAT (SELECTOR INTERAKTIF) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>SECTION 8 — PREVIEW PER JENIS SURAT</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Uji coba simulasi format untuk masing-masing dari 12 jenis surat.
                </p>
              </div>

              {/* Dropdown Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Pilih Jenis Surat</label>
                <select
                  value={selectedPreviewType}
                  onChange={e => setSelectedPreviewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <optgroup label="Surat Keterangan Warga">
                    {letterTypeDefinitions.filter(d => d.category === 'WARGA').map(d => (
                      <option key={d.code} value={d.code}>{d.name} ({classifications[d.code] || d.defaultPrefix})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Naskah Dinas Aparatur">
                    {letterTypeDefinitions.filter(d => d.category === 'DINAS').map(d => (
                      <option key={d.code} value={d.code}>{d.name} ({classifications[d.code] || d.defaultPrefix})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Rincian Hasil Per Jenis */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Kode Klasifikasi:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedPreviewInfo.clsCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Kategori Dokumen:</span>
                  <span className="font-semibold text-slate-200">{selectedPreviewInfo.category === 'WARGA' ? 'Pelayanan Warga' : 'Naskah Dinas'}</span>
                </div>
                <div className="pt-2 border-t border-slate-850">
                  <div className="text-[10px] text-slate-400 mb-1">Simulasi Nomor Surat:</div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-white bg-slate-900 p-2 rounded-lg border border-slate-800 text-center select-all">
                    {selectedPreviewInfo.simNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: MONITOR REGISTER NOMOR (DIHITUNG DARI LETTER_ISSUANCES REAL) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>SECTION 5 — MONITOR REGISTER NOMOR</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sinkronisasi counter konfigurasi dengan register fisik surat terbit.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  READ ONLY
                </span>
              </div>

              {/* Tabel Monitor Counter per Tahun */}
              <div className="space-y-2">
                {counterMonitorData.map(m => (
                  <div key={m.year} className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-400" />
                        <span className="font-black text-sm text-white font-mono">Tahun {m.year}</span>
                      </div>
                      {m.isConsistent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Konsisten</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3 text-rose-400" />
                          <span>Tertinggal</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-900">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-400">Counter Config</div>
                        <div className="font-mono font-bold text-white">{m.configCounter}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-400">Nomor Tertinggi</div>
                        <div className="font-mono font-bold text-emerald-400">{m.highestIssued}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-400">Total Terbit</div>
                        <div className="font-mono font-bold text-cyan-300">{m.totalIssued}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Catatan Read-Only Kebijakan Sistem */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Counter nomor surat dikelola otomatis oleh mesin penerbitan. Koreksi manual tidak tersedia pada tahap ini untuk mencegah benturan nomor.
              </div>
            </div>

            {/* SECTION 9: SAVE & CANCEL ACTION BUTTONS (SYNCHRONOUS MUTEX) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>BATAL / RESET</span>
                </button>

                <button
                  type="button"
                  id="btn-simpan-penomoran"
                  disabled={!canMutate || consistencyAudit.hasCriticalFailed}
                  onClick={handleSaveConfig}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 active:scale-95 text-white shadow-lg shadow-teal-900/40 border border-teal-500 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>SIMPAN PERUBAHAN</span>
                </button>
              </div>

              {!canMutate && (
                <p className="text-[11px] text-amber-400 text-center font-semibold pt-1">
                  Akun Operator dalam mode baca (Read-Only). Hanya Administrator yang dapat menyimpan perubahan.
                </p>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
