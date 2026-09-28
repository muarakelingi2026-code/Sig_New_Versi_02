import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Penduduk, 
  Keluarga, 
  LetterType, 
  LetterRequest, 
  User, 
  RolePermissions, 
  WorkflowLevel,
  DesaProfile
} from '../../types';
import { StorageService } from '../../services/storageService';
import { LetterIssuanceService } from '../../services/letterIssuanceService';
import { DocumentPreviewWorkspace } from './DocumentPreviewWorkspace';
import { 
  FileText, 
  Search, 
  UserCheck, 
  Home, 
  Briefcase, 
  HeartHandshake, 
  Send, 
  AlertCircle, 
  Baby, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Check, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Save, 
  Printer, 
  Download, 
  RotateCcw, 
  AlertTriangle, 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  Building2, 
  Info,
  Layers,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Lock
} from 'lucide-react';

interface AparaturBuatSuratWargaProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBackToDashboard?: () => void;
  onOpenArsip?: () => void;
  onDataChanged?: () => void;
}

interface ResidentWithFamily {
  penduduk: Penduduk;
  keluarga: Keluarga;
}

export const AparaturBuatSuratWarga: React.FC<AparaturBuatSuratWargaProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBackToDashboard,
  onOpenArsip,
  onDataChanged
}) => {
  // Master Data Kependudukan (Single Source of Truth)
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>(() => StorageService.getKeluargaList());
  const [letterTypes, setLetterTypes] = useState<LetterType[]>(() => StorageService.getLetterTypes());

  // Search & Filter Warga
  const [searchWargaQuery, setSearchWargaQuery] = useState('');
  const [filterDusun, setFilterDusun] = useState<string>('all');
  
  // Warga Terpilih
  const [selectedResident, setSelectedResident] = useState<ResidentWithFamily | null>(null);

  // Jenis Surat Terpilih
  const [selectedLetterTypeId, setSelectedLetterTypeId] = useState<string>('');
  const [letterCategory, setLetterCategory] = useState<string>('all');
  const [searchLetterQuery, setSearchLetterQuery] = useState<string>('');

  // Form Data Dinamis & Dokumen Checklist
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmedRequirements, setConfirmedRequirements] = useState<string[]>([]);
  const [catatanPetugas, setCatatanPetugas] = useState('');

  // State Eksekusi & Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedRequest, setCompletedRequest] = useState<LetterRequest | null>(null);
  const [previewingRequest, setPreviewingRequest] = useState<LetterRequest | null>(null);
  const isSubmittingRef = useRef(false);

  // Susun data gabungan penduduk beserta kartu keluarganya dari master data
  const residentsList = useMemo<ResidentWithFamily[]>(() => {
    const list: ResidentWithFamily[] = [];
    for (const keluarga of keluargaList) {
      if (Array.isArray(keluarga.anggotaKeluarga)) {
        for (const penduduk of keluarga.anggotaKeluarga) {
          list.push({ penduduk, keluarga });
        }
      }
    }
    return list;
  }, [keluargaList]);

  // Hasil filter pencarian penduduk
  const filteredResidents = useMemo(() => {
    const q = searchWargaQuery.trim().toLowerCase();
    return residentsList.filter(item => {
      // Filter Dusun jika dipilih
      if (filterDusun !== 'all' && item.keluarga.dusun !== filterDusun) {
        return false;
      }
      if (!q) return true;

      const nikMatch = (item.penduduk.nik || '').toLowerCase().includes(q);
      const namaMatch = (item.penduduk.nama || '').toLowerCase().includes(q);
      const kkMatch = (item.keluarga.noKk || '').toLowerCase().includes(q);
      const alamatMatch = (item.keluarga.alamat || '').toLowerCase().includes(q);
      
      return nikMatch || namaMatch || kkMatch || alamatMatch;
    });
  }, [residentsList, searchWargaQuery, filterDusun]);

  // Jenis surat yang sedang aktif dipilih
  const selectedLetterType = useMemo<LetterType | undefined>(() => {
    return letterTypes.find(t => t.id === selectedLetterTypeId);
  }, [letterTypes, selectedLetterTypeId]);

  // Inisialisasi default form data ketika jenis surat berubah
  useEffect(() => {
    if (selectedLetterType) {
      const initial: Record<string, any> = {};
      selectedLetterType.requiredFields.forEach(f => {
        initial[f.name] = f.defaultValue || '';
      });
      setFormData(initial);
      setConfirmedRequirements([]);
      setFormErrors({});
      setSubmitError(null);
    }
  }, [selectedLetterType]);

  // Helper mask NIK & No KK untuk privasi
  const maskIdentity = (val?: string) => {
    if (!val) return '-';
    if (val.length >= 10) {
      return `${val.slice(0, 6)}******${val.slice(-4)}`;
    }
    return val;
  };

  // Helper render icon surat
  const renderLetterIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'Home':
        return <Home className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'Send':
        return <Send className={className} />;
      case 'UserCheck':
        return <UserCheck className={className} />;
      case 'AlertCircle':
        return <AlertCircle className={className} />;
      case 'Baby':
        return <Baby className={className} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={className} />;
      default:
        return <FileText className={className} />;
    }
  };

  // Helper badge level workflow
  const renderWorkflowBadge = (level: WorkflowLevel) => {
    switch (level) {
      case 'LEVEL_1_INSTAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Level 1 • Terbit Instan
          </span>
        );
      case 'LEVEL_2_VERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-700/60 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Level 2 • Verifikasi Operator
          </span>
        );
      case 'LEVEL_3_PERSETUJUAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-700/60 shadow-xs">
            <Clock className="w-3 h-3 text-purple-400" />
            Level 3 • Persetujuan Kades
          </span>
        );
      default:
        return null;
    }
  };

  // Filter jenis surat berdasarkan kategori & pencarian
  const filteredLetterTypes = useMemo(() => {
    return letterTypes.filter(lt => {
      if (!lt.active) return false;
      if (letterCategory !== 'all' && lt.category !== letterCategory) return false;
      if (searchLetterQuery.trim()) {
        const q = searchLetterQuery.toLowerCase();
        return lt.name.toLowerCase().includes(q) || lt.code.toLowerCase().includes(q) || lt.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [letterTypes, letterCategory, searchLetterQuery]);

  // Validasi form data sebelum proses
  const validateForm = (): boolean => {
    if (!selectedLetterType) return false;
    const errors: Record<string, string> = {};

    selectedLetterType.requiredFields.forEach(f => {
      if (f.required) {
        const val = formData[f.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[f.name] = `${f.label} wajib diisi.`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Bangun snapshot surat untuk preview
  const handleOpenPreview = () => {
    if (!selectedResident || !selectedLetterType) return;

    const { penduduk, keluarga } = selectedResident;
    const autoDataSnapshot = {
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

    const previewReq: LetterRequest = {
      id: `preview-temp-${Date.now()}`,
      wargaAccountId: `aparatur-${currentUser.id}`,
      pendudukId: penduduk.id,
      letterTypeId: selectedLetterType.id,
      letterTypeCode: selectedLetterType.code,
      letterTypeName: selectedLetterType.name,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: selectedLetterType.workflowLevel === 'LEVEL_1_INSTAN' ? 'SIAP_DITERBITKAN' : 'MENUNGGU_VERIFIKASI',
      workflowLevel: selectedLetterType.workflowLevel,
      autoData: autoDataSnapshot,
      formData: { ...formData },
      confirmedRequirements: [...confirmedRequirements],
      notes: catatanPetugas || undefined,
      nomorSurat: '470 / **** / 2008 / PRATINJAU',
      createdByType: 'APARATUR',
      createdByActorId: currentUser.id,
      createdByActorName: currentUser.name,
      createdByRole: currentUser.role
    };

    setPreviewingRequest(previewReq);
  };

  // Simpan Sebagai Draft
  const handleSaveDraft = () => {
    if (isSubmittingRef.current || isProcessing) {
      console.warn('[LETTER DEBUG] Blocked duplicate draft attempt: operation already in progress');
      return;
    }

    if (!selectedResident) {
      setSubmitError('Pilih warga terlebih dahulu.');
      return;
    }
    if (!selectedLetterType) {
      setSubmitError('Pilih jenis surat terlebih dahulu.');
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);
    setSubmitError(null);

    console.log('[LETTER DEBUG] create request START (DRAFT)', {
      source: 'APARATUR_BUAT_SURAT_WARGA',
      pendudukId: selectedResident.penduduk.id,
      letterTypeCode: selectedLetterType.code
    });

    const res = StorageService.createLetterRequestByAparatur({
      currentUser,
      pendudukId: selectedResident.penduduk.id,
      letterTypeId: selectedLetterType.id,
      formData,
      confirmedRequirements,
      notes: catatanPetugas,
      isDraft: true
    });

    setIsProcessing(false);

    if (res.success && res.request) {
      console.log('[LETTER DEBUG] create request RESULT (DRAFT)', {
        requestId: res.request.id
      });
      setCompletedRequest(res.request);
      if (onDataChanged) onDataChanged();
    } else {
      isSubmittingRef.current = false;
      setSubmitError(res.error || 'Gagal menyimpan draft surat.');
    }
  };

  // Proses & Terbitkan Surat
  const handleSubmitProcess = async () => {
    if (isSubmittingRef.current || isProcessing) {
      console.warn('[LETTER DEBUG] Blocked re-entrant submit attempt: submission already in progress');
      return;
    }

    if (!selectedResident) {
      setSubmitError('Pilih warga terlebih dahulu.');
      return;
    }
    if (!selectedLetterType) {
      setSubmitError('Pilih jenis surat terlebih dahulu.');
      return;
    }

    if (!validateForm()) {
      setSubmitError('Harap periksa dan lengkapi semua kolom bertanda bintang (*).');
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);
    setSubmitError(null);

    console.log('[LETTER DEBUG] create request START', {
      source: 'APARATUR_BUAT_SURAT_WARGA',
      pendudukId: selectedResident.penduduk.id,
      letterTypeCode: selectedLetterType.code
    });

    const res = StorageService.createLetterRequestByAparatur({
      currentUser,
      pendudukId: selectedResident.penduduk.id,
      letterTypeId: selectedLetterType.id,
      formData,
      confirmedRequirements,
      notes: catatanPetugas,
      isDraft: false
    });

    if (!res.success || !res.request) {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setSubmitError(res.error || 'Gagal memproses permohonan surat.');
      return;
    }

    const createdReq = res.request;
    console.log('[LETTER DEBUG] create request RESULT', {
      requestId: createdReq.id
    });

    // Untuk LEVEL 1 INSTAN: Otomatis terbitkan surat dengan nomor resmi menggunakan engine existing
    if (selectedLetterType.workflowLevel === 'LEVEL_1_INSTAN') {
      console.log('[LETTER DEBUG] issue START', {
        requestId: createdReq.id
      });

      const issueRes = await LetterIssuanceService.issueLetter({
        letterRequestId: createdReq.id,
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        }
      });

      setIsProcessing(false);

      if (issueRes.success && issueRes.issuance) {
        console.log('[LETTER DEBUG] issue RESULT', {
          issuanceId: issueRes.issuance.id,
          requestId: issueRes.issuance.letterRequestId
        });
        const refreshedReq = StorageService.getLetterRequestById(createdReq.id);
        setCompletedRequest(refreshedReq || createdReq);
        if (onDataChanged) onDataChanged();
      } else {
        setSubmitError(issueRes.error || 'Surat tersimpan namun gagal menerbitkan nomor resmi.');
        setCompletedRequest(createdReq);
        if (onDataChanged) onDataChanged();
      }
    } else {
      setIsProcessing(false);
      setCompletedRequest(createdReq);
      if (onDataChanged) onDataChanged();
    }
  };

  // Reset form untuk membuat surat baru lagi
  const handleResetForNewLetter = () => {
    isSubmittingRef.current = false;
    setIsProcessing(false);
    setSelectedResident(null);
    setSelectedLetterTypeId('');
    setFormData({});
    setFormErrors({});
    setConfirmedRequirements([]);
    setCatatanPetugas('');
    setCompletedRequest(null);
    setSubmitError(null);
    setSearchWargaQuery('');
  };

  // RBAC Guard (HIGH-02): Operator Aset tidak diperbolehkan mengakses pembuatan Surat Warga
  const isOperatorAset = currentUser.role === 'operator_aset';

  if (isOperatorAset) {
    return (
      <div className="p-8 sm:p-12 bg-slate-900/95 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Akses Dibatasi: Pembuatan Surat Keterangan Warga</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Akun Operator Aset tidak memiliki izin untuk membuat atau menerbitkan Surat Keterangan Kependudukan Warga.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ──────────────── HEADER UTAMA CIVIC DESIGN ──────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Layanan Persuratan Administrasi Desa</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-teal-400 shrink-0" />
              <span>BUAT SURAT UNTUK WARGA</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Buat dan proses surat warga langsung dari data kependudukan desa. Warga tidak wajib login ke anjungan mandiri; petugas memproses langsung menggunakan data master penduduk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start md:self-auto">
            {onOpenArsip && (
              <button
                type="button"
                onClick={onOpenArsip}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Buka Buku Arsip</span>
              </button>
            )}

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Peta</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold text-[10px]">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block leading-none">Petugas Pembuat:</span>
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indikator Alur / Step Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
            !selectedResident
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-300'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedResident ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'
            }`}>
              {selectedResident ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 1</span>
              <span className="text-xs font-bold truncate block">Pilih Warga</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
            selectedResident && !selectedLetterType
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
              : selectedLetterType
              ? 'bg-slate-950/40 border-slate-800 text-slate-300'
              : 'bg-slate-950/20 border-slate-850 text-slate-500'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedLetterType ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedLetterType ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 2</span>
              <span className="text-xs font-bold truncate block">Pilih Jenis Surat</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
            selectedResident && selectedLetterType && !completedRequest
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
              : completedRequest
              ? 'bg-slate-950/40 border-slate-800 text-slate-300'
              : 'bg-slate-950/20 border-slate-850 text-slate-500'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              completedRequest ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {completedRequest ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 3</span>
              <span className="text-xs font-bold truncate block">Form & Kelengkapan</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
            completedRequest
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/20 border-slate-850 text-slate-500'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              completedRequest ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {completedRequest ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '4'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 4</span>
              <span className="text-xs font-bold truncate block">Penerbitan / Terbit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Error Box */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-3 shadow-lg animate-shake">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block text-rose-300">Pemberitahuan Sistem:</strong>
            <p className="mt-0.5 leading-relaxed">{submitError}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setSubmitError(null)} 
            className="text-rose-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ──────────────── JIKA SURAT SUDAH SELESAI DIPROSES (SUCCESS STATE) ──────────────── */}
      {completedRequest && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 mb-1">
                {completedRequest.status === 'TERBIT' 
                  ? 'Surat Resmi Diterbitkan' 
                  : completedRequest.status === 'DRAFT' 
                  ? 'Draft Berhasil Disimpan' 
                  : 'Pengajuan Surat Dalam Antrean'}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {completedRequest.letterTypeName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Surat untuk warga <strong className="text-white">{completedRequest.autoData?.nama || '-'}</strong> (NIK: {completedRequest.autoData?.nik || '-'}) berhasil diproses oleh {completedRequest.createdByActorName || currentUser.name}.
              </p>
            </div>
          </div>

          {/* Rincian Status & Nomor Registrasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Nomor Surat Resmi</span>
              <strong className="text-sm sm:text-base font-mono font-bold text-emerald-400 block truncate">
                {completedRequest.nomorSurat && completedRequest.nomorSurat !== 'Belum diterbitkan'
                  ? completedRequest.nomorSurat 
                  : completedRequest.status === 'DRAFT' 
                  ? '(Masih Draft)' 
                  : '(Diterbitkan saat Verifikasi Selesai)'}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Status Alur Berkas</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  completedRequest.status === 'TERBIT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : completedRequest.status === 'DRAFT'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {completedRequest.status}
                </span>
                <span className="text-xs text-slate-400">{completedRequest.workflowLevel}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Waktu Pengesahan</span>
              <span className="text-xs sm:text-sm font-medium text-slate-200 block">
                {new Date(completedRequest.submittedAt).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons Selesai */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetForNewLetter}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Buat Surat untuk Warga Lainnya</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewingRequest(completedRequest)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Buka Pratinjau / Cetak Dokumen</span>
              </button>

              {onOpenArsip && (
                <button
                  type="button"
                  onClick={onOpenArsip}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-all cursor-pointer"
                >
                  Lihat di Buku Arsip
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── WIZARD PEMBUATAN SURAT BARU ──────────────── */}
      {!completedRequest && (
        <div className="space-y-6">
          {/* ========================================================
              BAGIAN 1: PILIH WARGA (DARI MASTER DATA PENDUDUK)
              ======================================================== */}
          {!selectedResident ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-teal-400" />
                    <span>Langkah 1: Pilih Warga dari Master Kependudukan</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cari warga berdasarkan Nama, NIK, atau Nomor Kartu Keluarga dari master kependudukan desa.
                  </p>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Total Master: <strong>{residentsList.length}</strong> jiwa</span>
                </div>
              </div>

              {/* Baris Pencarian & Filter Dusun */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchWargaQuery}
                    onChange={e => setSearchWargaQuery(e.target.value)}
                    placeholder="Cari NIK, Nama, atau No. KK warga..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  {searchWargaQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchWargaQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={filterDusun}
                    onChange={e => setFilterDusun(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="all">Semua Wilayah Dusun</option>
                    <option value="Dusun I">Dusun I</option>
                    <option value="Dusun II">Dusun II</option>
                    <option value="Dusun III">Dusun III</option>
                    <option value="Dusun IV">Dusun IV</option>
                  </select>
                </div>
              </div>

              {/* Tabel / Kartu Hasil Pencarian Warga */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Daftar Penduduk Ditemukan ({filteredResidents.length})</span>
                  {searchWargaQuery && (
                    <span className="text-teal-400 font-normal lowercase">kata kunci: &ldquo;{searchWargaQuery}&rdquo;</span>
                  )}
                </div>

                {filteredResidents.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                    <UserIcon className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-300 font-semibold">Data Warga Tidak Ditemukan</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Periksa kembali ejaan nama, digit NIK, atau nomor Kartu Keluarga yang Anda masukkan.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                          <th className="px-3 py-3 font-semibold">NIK</th>
                          <th className="px-3 py-3 font-semibold">No. KK</th>
                          <th className="px-3 py-3 font-semibold">L/P</th>
                          <th className="px-3 py-3 font-semibold">Alamat & Dusun</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {filteredResidents.slice(0, 15).map(({ penduduk, keluarga }) => {
                          const isMeninggal = penduduk.statusKematian === 'Meninggal';
                          return (
                            <tr 
                              key={penduduk.id} 
                              className={`hover:bg-slate-800/60 transition-colors ${
                                isMeninggal ? 'opacity-85 bg-rose-950/10' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-semibold text-slate-100 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span>{penduduk.nama}</span>
                                  {penduduk.statusKeluarga === 'Kepala Keluarga' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-950 text-teal-300 border border-teal-800/50">
                                      Kepala KK
                                    </span>
                                  )}
                                  {isMeninggal && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-950 text-rose-300 border border-rose-800/50">
                                      Meninggal
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {penduduk.pekerjaan || 'Belum Bekerja'}
                                </div>
                              </td>

                              <td className="px-3 py-3 font-mono text-slate-300 whitespace-nowrap">
                                {maskIdentity(penduduk.nik)}
                              </td>

                              <td className="px-3 py-3 font-mono text-slate-400 whitespace-nowrap">
                                {maskIdentity(keluarga.noKk)}
                              </td>

                              <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                                {penduduk.jenisKelamin === 'Laki-Laki' ? 'L' : 'P'}
                              </td>

                              <td className="px-3 py-3 text-slate-300">
                                <div className="truncate max-w-xs">{keluarga.alamat}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {keluarga.dusun} RT {keluarga.rt} / RW {keluarga.rw}
                                </div>
                              </td>

                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  isMeninggal
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                }`}>
                                  {isMeninggal ? 'Meninggal' : 'Hidup (Aktif)'}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResident({ penduduk, keluarga });
                                    setSubmitError(null);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <span>PILIH WARGA</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {filteredResidents.length > 15 && (
                      <div className="p-2.5 text-center text-xs text-slate-400 bg-slate-950/60 border-t border-slate-800">
                        Menampilkan 15 dari {filteredResidents.length} warga. Gunakan kotak pencarian untuk mempersempit hasil.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================
               PANEL DATA WARGA TERPILIH
               ======================================================== */
            <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>DATA WARGA TERPILIH</span>
                      {selectedResident.penduduk.statusKematian === 'Meninggal' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                          Meninggal
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Identitas pemohon surat resmi dari master kependudukan Desa Beliti Jaya.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedResident(null);
                    setSelectedLetterTypeId('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>GANTI WARGA</span>
                </button>
              </div>

              {/* Grid Rincian Identitas Warga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Nama Lengkap</span>
                  <strong className="text-slate-100 text-sm block truncate">{selectedResident.penduduk.nama}</strong>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">NIK (Kependudukan)</span>
                  <strong className="font-mono text-teal-300 text-sm block">{selectedResident.penduduk.nik}</strong>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Nomor Kartu Keluarga (KK)</span>
                  <span className="font-mono text-slate-200 text-sm block">{selectedResident.keluarga.noKk}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Tempat, Tanggal Lahir</span>
                  <span className="text-slate-200 block truncate">
                    {selectedResident.penduduk.tempatLahir}, {selectedResident.penduduk.tanggalLahir}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Jenis Kelamin</span>
                  <span className="text-slate-200 block">{selectedResident.penduduk.jenisKelamin}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Status Perkawinan</span>
                  <span className="text-slate-200 block">{selectedResident.penduduk.statusPerkawinan}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Pekerjaan</span>
                  <span className="text-slate-200 block truncate">{selectedResident.penduduk.pekerjaan || '-'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Dusun & RT / RW</span>
                  <span className="text-slate-200 block truncate">
                    {selectedResident.keluarga.dusun}, RT {selectedResident.keluarga.rt}/RW {selectedResident.keluarga.rw}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5 sm:col-span-2 md:col-span-3 lg:col-span-4">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Alamat Tempat Tinggal</span>
                  <span className="text-slate-200 block">{selectedResident.keluarga.alamat}</span>
                </div>
              </div>

              {/* Informasi Kebijakan Data Master */}
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
                <Info className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  Data kependudukan di atas otomatis terhubung dengan master keluarga desa. Jika terdapat perubahan identitas, lakukan pembaruan melalui <strong>Modul Data Kependudukan</strong>.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================
              BAGIAN 2: PILIH JENIS SURAT
              ======================================================== */}
          {selectedResident && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <span>Langkah 2: Pilih Jenis Surat</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tentukan jenis surat administrasi yang diajukan oleh atau untuk warga ini.
                  </p>
                </div>

                {selectedLetterType && (
                  <button
                    type="button"
                    onClick={() => setSelectedLetterTypeId('')}
                    className="text-xs text-teal-400 hover:text-teal-300 font-medium cursor-pointer self-start sm:self-auto"
                  >
                    Ganti Jenis Surat
                  </button>
                )}
              </div>

              {/* Baris Kategori & Pencarian Surat */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'Semua Kategori' },
                    { id: 'kependudukan', label: 'Kependudukan' },
                    { id: 'usaha', label: 'Usaha & SKU' },
                    { id: 'sosial', label: 'Sosial / SKTM' },
                    { id: 'umum', label: 'Umum' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setLetterCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        letterCategory === cat.id
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchLetterQuery}
                    onChange={e => setSearchLetterQuery(e.target.value)}
                    placeholder="Cari jenis surat..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Grid Kartu Jenis Surat */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLetterTypes.map(type => {
                  const isSelected = selectedLetterTypeId === type.id;
                  const isDeceased = selectedResident.penduduk.statusKematian === 'Meninggal';
                  const isDeathLetter = type.code === 'SK_KEMATIAN';
                  // Jika penduduk meninggal, kunci semua surat selain surat kematian
                  const isDisabled = isDeceased && !isDeathLetter;

                  return (
                    <div
                      key={type.id}
                      onClick={() => {
                        if (isDisabled) return;
                        setSelectedLetterTypeId(type.id);
                        setSubmitError(null);
                      }}
                      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                        isDisabled
                          ? 'opacity-40 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/30 cursor-pointer shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer group'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                              : 'bg-slate-850 border-slate-700 text-slate-300 group-hover:text-teal-400 group-hover:border-teal-700/50'
                          }`}>
                            {renderLetterIcon(type.icon)}
                          </div>

                          <div className="pr-5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700 font-bold">
                                {type.code}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors mt-1">
                              {type.name}
                            </h4>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {type.description}
                        </p>

                        {/* Persyaratan Ringkas */}
                        {type.requirements && type.requirements.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Persyaratan Fisik:
                            </span>
                            <ul className="text-[11px] text-slate-400 space-y-0.5">
                              {type.requirements.slice(0, 2).map((req, idx) => (
                                <li key={idx} className="flex items-center gap-1.5 truncate">
                                  <span className="w-1 h-1 rounded-full bg-teal-400 shrink-0" />
                                  <span className="truncate">{req}</span>
                                </li>
                              ))}
                              {type.requirements.length > 2 && (
                                <li className="text-[10px] text-slate-500">
                                  +{type.requirements.length - 2} persyaratan lainnya
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {renderWorkflowBadge(type.workflowLevel)}

                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDisabled) return;
                            setSelectedLetterTypeId(type.id);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? 'Terpilih' : 'Pilih Surat'}
                        </button>
                      </div>

                      {isDisabled && (
                        <div className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded-lg border border-rose-900/60 mt-2">
                          Warga berstatus meninggal dunia (hanya dapat membuat SK Kematian).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              BAGIAN 3: FORM SURAT & PERSYARATAN
              ======================================================== */}
          {selectedResident && selectedLetterType && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    <span>Langkah 3: Lengkapi Formulir & Persyaratan</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Identitas pokok otomatis diambil dari data master. Aparatur hanya mengisi data pendukung sesuai template {selectedLetterType.name}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {renderWorkflowBadge(selectedLetterType.workflowLevel)}
                </div>
              </div>

              {/* Snapshot Data Otomatis (Read-Only) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Identitas Pokok Terverifikasi dari Master Penduduk (Otomatis)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nama:</span>
                    <strong className="text-slate-100">{selectedResident.penduduk.nama}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NIK:</span>
                    <span className="font-mono text-slate-200">{selectedResident.penduduk.nik}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">No. KK:</span>
                    <span className="font-mono text-slate-200">{selectedResident.keluarga.noKk}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TTL / Usia:</span>
                    <span className="text-slate-200">{selectedResident.penduduk.tempatLahir}, {selectedResident.penduduk.tanggalLahir}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">Alamat Domisili:</span>
                    <span className="text-slate-200">{selectedResident.keluarga.alamat}, {selectedResident.keluarga.dusun}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pekerjaan:</span>
                    <span className="text-slate-200">{selectedResident.penduduk.pekerjaan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status Perkawinan:</span>
                    <span className="text-slate-200">{selectedResident.penduduk.statusPerkawinan}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Required Form Fields */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    <span>Kolom Isian Khusus Surat ({selectedLetterType.code})</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Isi kolom tambahan yang diperlukan sesuai peruntukan surat.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedLetterType.requiredFields.map(field => {
                    const error = formErrors[field.name];

                    return (
                      <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2 space-y-1.5' : 'space-y-1.5'}>
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                          <span>
                            {field.label} {field.required && <span className="text-rose-400">*</span>}
                          </span>
                          {field.helpText && (
                            <span className="text-[10px] text-slate-500 font-normal">{field.helpText}</span>
                          )}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={formData[field.name] || ''}
                            onChange={e => {
                              setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                              if (formErrors[field.name]) {
                                setFormErrors(prev => {
                                  const n = { ...prev };
                                  delete n[field.name];
                                  return n;
                                });
                              }
                            }}
                            placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}...`}
                            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors ${
                              error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700/80 focus:border-teal-500'
                            }`}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.name] || ''}
                            onChange={e => {
                              setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                              if (formErrors[field.name]) {
                                setFormErrors(prev => {
                                  const n = { ...prev };
                                  delete n[field.name];
                                  return n;
                                });
                              }
                            }}
                            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition-colors ${
                              error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700/80 focus:border-teal-500'
                            }`}
                          >
                            <option value="">-- Pilih {field.label} --</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={formData[field.name] || ''}
                            onChange={e => {
                              setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                              if (formErrors[field.name]) {
                                setFormErrors(prev => {
                                  const n = { ...prev };
                                  delete n[field.name];
                                  return n;
                                });
                              }
                            }}
                            placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}...`}
                            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition-colors ${
                              error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700/80 focus:border-teal-500'
                            }`}
                          />
                        )}

                        {error && (
                          <span className="text-[11px] text-rose-400 block">{error}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checklist Dokumen Fisik Persyaratan */}
              {selectedLetterType.requirements && selectedLetterType.requirements.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>Verifikasi Kelengkapan Berkas Fisik Warga</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Tandai berkas fisik asli atau fotokopi yang telah diserahkan warga ke kantor desa.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedLetterType.requirements.map(reqText => {
                      const isChecked = confirmedRequirements.includes(reqText);
                      return (
                        <label
                          key={reqText}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-teal-950/30 border-teal-500/60 text-slate-100'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setConfirmedRequirements(prev => [...prev, reqText]);
                              } else {
                                setConfirmedRequirements(prev => prev.filter(r => r !== reqText));
                              }
                            }}
                            className="w-4 h-4 rounded text-teal-600 bg-slate-900 border-slate-700 focus:ring-teal-500"
                          />
                          <span className="text-xs">{reqText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Catatan Tambahan Petugas */}
              <div className="space-y-1.5 pt-4 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">
                  Catatan Internal / Keterangan Petugas (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatanPetugas}
                  onChange={e => setCatatanPetugas(e.target.value)}
                  placeholder="Contoh: Pemohon datang langsung ke kantor desa didampingi Ketua RT 02..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Area Aksi Tombol */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLetterTypeId('')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Pilihan Surat</span>
                </button>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleOpenPreview}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Pratinjau Surat</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4 text-slate-400" />
                    <span>Simpan Draft</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSubmitProcess}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-teal-950/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isProcessing 
                        ? 'Memproses Surat...' 
                        : selectedLetterType.workflowLevel === 'LEVEL_1_INSTAN'
                        ? 'Proses & Terbitkan Surat'
                        : 'Proses & Masukkan Antrean'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── MODAL PRATINJAU DOKUMEN RESMI (REUSING DocumentPreviewWorkspace) ──────────────── */}
      {previewingRequest && (
        <DocumentPreviewWorkspace
          letterRequest={previewingRequest}
          onBack={() => setPreviewingRequest(null)}
          onClose={() => setPreviewingRequest(null)}
          mode="aparatur"
          currentUser={currentUser}
          customProfile={desaProfile}
        />
      )}
    </div>
  );
};
