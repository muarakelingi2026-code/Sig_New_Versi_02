import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LetterType, 
  LetterRequest, 
  User, 
  RolePermissions, 
  WorkflowLevel,
  DesaProfile,
  SuratDinasData,
  SuratDinasSifat
} from '../../types';
import { StorageService } from '../../services/storageService';
import { DocumentPreviewWorkspace } from './DocumentPreviewWorkspace';
import { 
  Building2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  Save, 
  Send, 
  AlertCircle, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  Mail, 
  Briefcase, 
  Megaphone, 
  FileCheck, 
  Info, 
  ShieldCheck, 
  FileSignature, 
  RotateCcw,
  Sparkles,
  Inbox,
  Archive,
  Layers,
  Edit3,
  Calendar,
  MapPin,
  Lock
} from 'lucide-react';

interface AparaturBuatSuratDinasProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBack: () => void;
  onOpenArsip?: () => void;
  onOpenLayananSurat?: () => void;
  onDataChanged?: () => void;
}

type FormStep = 1 | 2 | 3 | 4;

export const AparaturBuatSuratDinas: React.FC<AparaturBuatSuratDinasProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBack,
  onOpenArsip,
  onOpenLayananSurat,
  onDataChanged
}) => {
  // RBAC Guard: Operator Aset tidak diperbolehkan mengakses pembuatan Surat Dinas
  const isOperatorAset = currentUser.role === 'operator_aset';

  // Master Data Jenis Surat Dinas (Single Source of Truth)
  const officialLetterTypes = useMemo<LetterType[]>(() => {
    return StorageService.getOfficialLetterTypes();
  }, []);

  // Step Management
  const [currentStep, setCurrentStep] = useState<FormStep>(1);

  // Draft Management State
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [existingDrafts, setExistingDrafts] = useState<LetterRequest[]>(() => {
    return StorageService.getSuratDinasRequests().filter(r => r.status === 'DRAFT');
  });

  // Step 1: Selected Letter Type
  const [selectedLetterTypeId, setSelectedLetterTypeId] = useState<string>('');

  // Step 2: Data Surat Umum Kedinasan
  const [tujuanSurat, setTujuanSurat] = useState('');
  const [instansiTujuan, setInstansiTujuan] = useState('');
  const [alamatTujuan, setAlamatTujuan] = useState('');
  const [sifatSurat, setSifatSurat] = useState<SuratDinasSifat>('Biasa');
  const [lampiran, setLampiran] = useState('');
  const [perihal, setPerihal] = useState('');
  const [isiSurat, setIsiSurat] = useState('');
  const [tembusanList, setTembusanList] = useState<string[]>([]);
  const [newTembusanInput, setNewTembusanInput] = useState('');
  const [catatanInternal, setCatatanInternal] = useState('');

  // Step 3: Data Khusus Form Dinamis
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Form Validation & Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Result state after save or submission
  const [completedRequest, setCompletedRequest] = useState<LetterRequest | null>(null);
  const [previewRequest, setPreviewRequest] = useState<LetterRequest | null>(null);

  // Synchronous Mutex Ref to prevent rapid double-clicks (Duplicate Protection UI)
  const submitLockRef = useRef<boolean>(false);

  // Selected LetterType Object
  const selectedLetterType = useMemo<LetterType | undefined>(() => {
    return officialLetterTypes.find(t => t.id === selectedLetterTypeId);
  }, [officialLetterTypes, selectedLetterTypeId]);

  // Check template availability in master templates
  const templateAvailable = useMemo<boolean>(() => {
    if (!selectedLetterType) return false;
    const allTemplates = StorageService.getLetterTemplates();
    return allTemplates.some(t => t.letterTypeId === selectedLetterType.id && t.status === 'ACTIVE');
  }, [selectedLetterType]);

  // Refresh Draft list
  const refreshDrafts = () => {
    setExistingDrafts(StorageService.getSuratDinasRequests().filter(r => r.status === 'DRAFT'));
  };

  // Helper Icon Resolver
  const getLetterTypeIcon = (code: string) => {
    switch (code) {
      case 'DINAS_UNDANGAN':
        return <Mail className="w-5 h-5 text-blue-400" />;
      case 'DINAS_TUGAS':
        return <Briefcase className="w-5 h-5 text-emerald-400" />;
      case 'DINAS_EDARAN':
        return <Megaphone className="w-5 h-5 text-amber-400" />;
      case 'DINAS_REKOMENDASI':
        return <FileCheck className="w-5 h-5 text-purple-400" />;
      default:
        return <Building2 className="w-5 h-5 text-teal-400" />;
    }
  };

  // Switch to draft
  const handleLoadDraft = (draft: LetterRequest) => {
    setActiveDraftId(draft.id);
    setSelectedLetterTypeId(draft.letterTypeId);
    setTujuanSurat(draft.suratDinasData?.tujuanSurat || '');
    setInstansiTujuan(draft.suratDinasData?.instansiTujuan || '');
    setAlamatTujuan(draft.suratDinasData?.alamatTujuan || '');
    setSifatSurat(draft.suratDinasData?.sifatSurat || 'Biasa');
    setLampiran(draft.suratDinasData?.lampiran || '');
    setPerihal(draft.suratDinasData?.perihal || '');
    setIsiSurat(draft.suratDinasData?.isiSurat || '');
    setTembusanList(draft.suratDinasData?.tembusan || []);
    setCatatanInternal(draft.suratDinasData?.catatanInternal || '');
    setFormData(draft.formData || {});
    setCompletedRequest(null);
    setErrors({});
    setSubmitError(null);
    setCurrentStep(2);
  };

  // Add Tembusan item
  const handleAddTembusan = () => {
    const clean = newTembusanInput.trim();
    if (!clean) return;
    setTembusanList(prev => [...prev, clean]);
    setNewTembusanInput('');
  };

  // Remove Tembusan item
  const handleRemoveTembusan = (idx: number) => {
    setTembusanList(prev => prev.filter((_, i) => i !== idx));
  };

  // Client-side Validation (UX Guide)
  const validateForm = (isDraftMode: boolean = false): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedLetterTypeId) {
      newErrors.letterType = 'Pilih jenis Surat Dinas terlebih dahulu.';
    }

    if (!isDraftMode) {
      if (!tujuanSurat.trim()) {
        newErrors.tujuanSurat = 'Tujuan surat wajib diisi.';
      }

      if (!perihal.trim()) {
        newErrors.perihal = 'Perihal surat wajib diisi.';
      }

      // Validasi field khusus sesuai jenis surat yang dipilih
      if (selectedLetterType) {
        for (const f of selectedLetterType.requiredFields) {
          if (f.required) {
            const val = formData[f.name];
            if (val === undefined || val === null || String(val).trim() === '') {
              newErrors[f.name] = `${f.label} wajib diisi.`;
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Prepare SuratDinasData payload
  const buildSuratDinasData = (): SuratDinasData => {
    return {
      tujuanSurat: tujuanSurat.trim(),
      instansiTujuan: instansiTujuan.trim() || undefined,
      alamatTujuan: alamatTujuan.trim() || undefined,
      sifatSurat: sifatSurat || 'Biasa',
      lampiran: lampiran.trim() || undefined,
      perihal: perihal.trim(),
      isiSurat: isiSurat.trim() || undefined,
      tembusan: tembusanList.length > 0 ? tembusanList : undefined,
      catatanInternal: catatanInternal.trim() || undefined
    };
  };

  // Action: Simpan Draft (Draft Engine)
  const handleSaveDraft = () => {
    if (submitLockRef.current || isProcessing) return;

    if (!selectedLetterTypeId) {
      setSubmitError('Pilih jenis surat dinas terlebih dahulu.');
      return;
    }

    submitLockRef.current = true;
    setIsProcessing(true);
    setSubmitError(null);

    try {
      const suratDinasData = buildSuratDinasData();

      if (activeDraftId) {
        // Update existing draft
        const res = StorageService.updateSuratDinas({
          requestId: activeDraftId,
          currentUser,
          suratDinasData,
          formData,
          notes: catatanInternal,
          status: 'DRAFT'
        });

        if (res.success && res.request) {
          setCompletedRequest(res.request);
          refreshDrafts();
          if (onDataChanged) onDataChanged();
        } else {
          setSubmitError(res.error || 'Gagal memperbarui draft surat dinas.');
        }
      } else {
        // Create new draft
        const res = StorageService.createSuratDinasByAparatur({
          currentUser,
          letterTypeId: selectedLetterTypeId,
          suratDinasData,
          formData,
          notes: catatanInternal,
          isDraft: true
        });

        if (res.success && res.request) {
          setActiveDraftId(res.request.id);
          setCompletedRequest(res.request);
          refreshDrafts();
          if (onDataChanged) onDataChanged();
        } else {
          setSubmitError(res.error || 'Gagal menyimpan draft surat dinas.');
        }
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Terjadi kesalahan sistem saat menyimpan draft.');
    } finally {
      setIsProcessing(false);
      submitLockRef.current = false;
    }
  };

  // Action: Proses Surat (Submit Request)
  const handleSubmitProcess = () => {
    if (submitLockRef.current || isProcessing) {
      console.warn('[SURAT DINAS] Submission locked by mutex.');
      return;
    }

    if (!validateForm(false)) {
      setSubmitError('Harap lengkapi semua kolom wajib bertanda bintang (*).');
      return;
    }

    submitLockRef.current = true;
    setIsProcessing(true);
    setSubmitError(null);

    try {
      const suratDinasData = buildSuratDinasData();

      if (activeDraftId) {
        // Promosikan draft yang ada menjadi pengajuan aktif
        const res = StorageService.updateSuratDinas({
          requestId: activeDraftId,
          currentUser,
          suratDinasData,
          formData,
          notes: catatanInternal,
          status: 'MENUNGGU_VERIFIKASI'
        });

        if (res.success && res.request) {
          setCompletedRequest(res.request);
          refreshDrafts();
          if (onDataChanged) onDataChanged();
        } else {
          setSubmitError(res.error || 'Gagal memproses permohonan surat dinas.');
        }
      } else {
        // Buat pengajuan baru
        const res = StorageService.createSuratDinasByAparatur({
          currentUser,
          letterTypeId: selectedLetterTypeId,
          suratDinasData,
          formData,
          notes: catatanInternal,
          isDraft: false
        });

        if (res.success && res.request) {
          setCompletedRequest(res.request);
          refreshDrafts();
          if (onDataChanged) onDataChanged();
        } else {
          setSubmitError(res.error || 'Gagal memproses pengajuan surat dinas.');
        }
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Terjadi kesalahan sistem saat memproses surat dinas.');
    } finally {
      setIsProcessing(false);
      submitLockRef.current = false;
    }
  };

  // Reset form untuk input baru
  const handleResetForm = () => {
    setActiveDraftId(null);
    setSelectedLetterTypeId('');
    setTujuanSurat('');
    setInstansiTujuan('');
    setAlamatTujuan('');
    setSifatSurat('Biasa');
    setLampiran('');
    setPerihal('');
    setIsiSurat('');
    setTembusanList([]);
    setNewTembusanInput('');
    setCatatanInternal('');
    setFormData({});
    setErrors({});
    setSubmitError(null);
    setCompletedRequest(null);
    setCurrentStep(1);
    submitLockRef.current = false;
    setIsProcessing(false);
  };

  // Jika operator aset mencoba masuk, tampilkan deny screen
  if (isOperatorAset) {
    return (
      <div className="p-8 sm:p-12 bg-slate-900/95 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Akses Dibatasi: Pembuatan Surat Dinas</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Akun Operator Aset tidak memiliki izin untuk membuat atau mengelola Surat Dinas Pemerintah Desa.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>
        </div>
      </div>
    );
  }

  // Jika permohonan berhasil diproses / disimpan
  if (completedRequest) {
    const isDraft = completedRequest.status === 'DRAFT';

    return (
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Header Selesai */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Persuratan Kedinasan Pemerintah Desa</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <span>
                  {isDraft ? 'DRAFT SURAT DINAS TERSIMPAN' : 'SURAT DINAS BERHASIL DIAJUKAN'}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {isDraft
                  ? 'Draft surat dinas telah disimpan dengan aman dalam sistem dan dapat disunting kembali sewaktu-waktu.'
                  : 'Pengajuan surat dinas telah berhasil dibuat dan diteruskan ke tahap verifikasi dan pengesahan.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/40 border border-teal-500/50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Surat Dinas Baru</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kartu Rincian Hasil */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block font-mono">Kode Referensi Permohonan</span>
              <span className="text-lg font-bold text-white font-mono">{completedRequest.id}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isDraft
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isDraft ? 'Status: DRAFT' : 'Status: MENUNGGU_VERIFIKASI'}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {completedRequest.workflowLevel === 'LEVEL_3_PERSETUJUAN' ? 'Workflow: Level 3 (Persetujuan Kades)' : 'Workflow: Level 2 (Verifikasi)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Identitas Surat Dinas</span>
              </h3>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 block">Jenis Surat</span>
                  <span className="font-semibold text-white">{completedRequest.letterTypeName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Perihal</span>
                  <span className="font-semibold text-white">{completedRequest.suratDinasData?.perihal || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Sifat Surat</span>
                  <span className="font-semibold text-white">{completedRequest.suratDinasData?.sifatSurat || 'Biasa'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Nomor Surat Resmi</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {completedRequest.nomorSurat || 'Belum diterbitkan'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Tujuan & Aparatur Pembuat</span>
              </h3>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 block">Tujuan Surat</span>
                  <span className="font-semibold text-white">{completedRequest.suratDinasData?.tujuanSurat || '-'}</span>
                </div>
                {completedRequest.suratDinasData?.instansiTujuan && (
                  <div>
                    <span className="text-xs text-slate-400 block">Instansi Sasaran</span>
                    <span className="text-slate-200">{completedRequest.suratDinasData.instansiTujuan}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400 block">Dibuat Oleh</span>
                  <span className="text-slate-200">{completedRequest.createdByActorName} ({completedRequest.createdByRole})</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Waktu Pengajuan</span>
                  <span className="text-slate-200 font-mono text-xs">{new Date(completedRequest.submittedAt).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400" />
              <span>Surat Dinas diproses tanpa melibatkan data penduduk individual.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewRequest(completedRequest)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-950/40"
              >
                <FileText className="w-4 h-4" />
                <span>Lihat Pratinjau Dokumen</span>
              </button>

              {onOpenLayananSurat && (
                <button
                  type="button"
                  onClick={onOpenLayananSurat}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Inbox className="w-4 h-4 text-teal-400" />
                  <span>Buka Layanan Surat Masuk</span>
                </button>
              )}

              {onOpenArsip && (
                <button
                  type="button"
                  onClick={onOpenArsip}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-emerald-400" />
                  <span>Buka Buku Arsip</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Pratinjau Dokumen dari Hasil Permohonan */}
        {previewRequest && (
          <DocumentPreviewWorkspace
            letterRequest={previewRequest}
            mode="aparatur"
            currentUser={currentUser}
            customProfile={desaProfile}
            onClose={() => setPreviewRequest(null)}
            onBack={() => setPreviewRequest(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ──────────────── HEADER UTAMA CIVIC DESIGN ──────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Persuratan Kedinasan Pemerintah Desa</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileSignature className="w-7 h-7 sm:w-8 sm:h-8 text-teal-400 shrink-0" />
              <span>BUAT SURAT DINAS</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Persuratan kedinasan resmi Pemerintah Desa Beliti Jaya untuk keperluan undangan dinas, penugasan aparatur, surat edaran, serta rekomendasi kelembagaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start md:self-auto">
            {activeDraftId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Batalkan mode edit draft dan mulai formulir baru"
              >
                <Plus className="w-4 h-4" />
                <span>+ Formulir Baru</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold text-[10px]">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block leading-none">Aparatur Pembuat:</span>
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP INDICATOR WORKFLOW (STEP 1 - STEP 4) ── */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              currentStep === 1
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                : selectedLetterTypeId
                ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-950/20 border-slate-850 text-slate-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              selectedLetterTypeId ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'
            }`}>
              {selectedLetterTypeId ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 1</span>
              <span className="text-xs font-bold truncate block">Pilih Jenis Surat</span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (selectedLetterTypeId) setCurrentStep(2);
            }}
            disabled={!selectedLetterTypeId}
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
              !selectedLetterTypeId ? 'opacity-50 cursor-not-allowed border-slate-850 bg-slate-950/20 text-slate-500' : 'cursor-pointer'
            } ${
              currentStep === 2
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                : tujuanSurat && perihal
                ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-950/20 border-slate-850 text-slate-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              tujuanSurat && perihal ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {tujuanSurat && perihal ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 2</span>
              <span className="text-xs font-bold truncate block">Data Surat</span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              if (selectedLetterTypeId) setCurrentStep(3);
            }}
            disabled={!selectedLetterTypeId}
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
              !selectedLetterTypeId ? 'opacity-50 cursor-not-allowed border-slate-850 bg-slate-950/20 text-slate-500' : 'cursor-pointer'
            } ${
              currentStep === 3
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                : Object.keys(formData).length > 0
                ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-950/20 border-slate-850 text-slate-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              Object.keys(formData).length > 0 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {Object.keys(formData).length > 0 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 3</span>
              <span className="text-xs font-bold truncate block">Data Khusus</span>
            </div>
          </button>

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => {
              if (selectedLetterTypeId) setCurrentStep(4);
            }}
            disabled={!selectedLetterTypeId}
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
              !selectedLetterTypeId ? 'opacity-50 cursor-not-allowed border-slate-850 bg-slate-950/20 text-slate-500' : 'cursor-pointer'
            } ${
              currentStep === 4
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                : 'bg-slate-950/20 border-slate-850 text-slate-500 hover:border-slate-700'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-800 text-slate-400">
              4
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">Langkah 4</span>
              <span className="text-xs font-bold truncate block">Review & Simpan</span>
            </div>
          </button>
        </div>
      </div>

      {/* Alert Error Banner */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-400 hover:text-white p-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Notice Draft Aktif */}
      {activeDraftId && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              Sedang mengedit draft surat: <strong>{activeDraftId}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs underline hover:text-white cursor-pointer"
          >
            Buat Baru
          </button>
        </div>
      )}

      {/* Drafts Drawer / Existing Draft Banner */}
      {existingDrafts.length > 0 && !activeDraftId && currentStep === 1 && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Ditemukan {existingDrafts.length} Draft Surat Dinas Tersimpan:</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {existingDrafts.slice(0, 3).map(draft => (
              <div
                key={draft.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-white block truncate">{draft.letterTypeName}</span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {draft.suratDinasData?.perihal || draft.suratDinasData?.tujuanSurat || 'Draft'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadDraft(draft)}
                  className="px-2.5 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                >
                  Lanjut
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── KONTEN FORM BERDASARKAN STEP ──────────────── */}
      
      {/* ══════════════════════════════════════════════════════════════
          STEP 1: PILIH JENIS SURAT DINAS (4 KARTU MASTER)
         ══════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <span>Langkah 1: Pilih Jenis Surat Dinas</span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih jenis surat dinas yang akan diterbitkan oleh Pemerintah Desa Beliti Jaya
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialLetterTypes.map(letter => {
              const isSelected = selectedLetterTypeId === letter.id;
              const isLevel3 = letter.workflowLevel === 'LEVEL_3_PERSETUJUAN';

              return (
                <div
                  key={letter.id}
                  onClick={() => {
                    setSelectedLetterTypeId(letter.id);
                    // Reset field khusus jika ganti jenis surat
                    if (selectedLetterTypeId !== letter.id) {
                      const initialForm: Record<string, any> = {};
                      letter.requiredFields.forEach(f => {
                        initialForm[f.name] = f.defaultValue || '';
                      });
                      setFormData(initialForm);
                    }
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-teal-950/60 via-slate-900 to-slate-900 border-teal-500 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/50'
                      : 'bg-slate-900/80 hover:bg-slate-850/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-400/50 text-teal-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 group-hover:border-teal-500/40'
                        }`}>
                          {getLetterTypeIcon(letter.code)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                            {letter.name}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono">
                            Kode Klasifikasi: <strong>{letter.classificationCode}</strong>
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        isLevel3
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}>
                        {isLevel3 ? 'Level 3 (Persetujuan Kades)' : 'Level 2 (Verifikasi Sekdes)'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {letter.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-teal-400" />
                        <span>{letter.estimatedTime}</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold transition-all ${
                      isSelected ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}>
                      {isSelected ? 'Terpilih ✓' : 'Pilih Surat ini →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {errors.letterType && (
            <p className="text-xs text-rose-400 font-medium">{errors.letterType}</p>
          )}

          {/* Navigasi Step 1 */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              disabled={!selectedLetterTypeId}
              onClick={() => {
                if (selectedLetterTypeId) setCurrentStep(2);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                selectedLetterTypeId
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>Lanjut ke Data Surat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 2: DATA SURAT UMUM KEDINASAN
         ══════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span>Langkah 2: Data Umum Surat Kedinasan</span>
              </h2>
              <p className="text-xs text-slate-400">
                Lengkapi identitas tujuan dan metadata naskah dinas ({selectedLetterType?.name})
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Simpan Draft</span>
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tujuan Surat * */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Tujuan Surat (Nama Pejabat / Pihak yang Dituju) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Wajib diisi</span>
                </label>
                <input
                  type="text"
                  value={tujuanSurat}
                  onChange={e => setTujuanSurat(e.target.value)}
                  placeholder="Contoh: Camat Muara Kelingi / Kapolsek Muara Kelingi / Ketua BPD Beliti Jaya"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.tujuanSurat ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                  }`}
                />
                {errors.tujuanSurat && <p className="text-xs text-rose-400 font-medium">{errors.tujuanSurat}</p>}
                <p className="text-[11px] text-slate-400">
                  Masukkan nama jabatan, instansi, atau pejabat penerima naskah dinas resmi.
                </p>
              </div>

              {/* Instansi Tujuan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Instansi / Lembaga Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={instansiTujuan}
                  onChange={e => setInstansiTujuan(e.target.value)}
                  placeholder="Contoh: Kantor Kecamatan Muara Kelingi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all"
                />
              </div>

              {/* Sifat Surat */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Sifat Surat Kedinasan
                </label>
                <select
                  value={sifatSurat}
                  onChange={e => setSifatSurat(e.target.value as SuratDinasSifat)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all cursor-pointer"
                >
                  <option value="Biasa">Biasa</option>
                  <option value="Penting">Penting</option>
                  <option value="Segera">Segera</option>
                  <option value="Rahasia">Rahasia</option>
                </select>
              </div>

              {/* Alamat Tujuan */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-200">
                  Alamat / Tempat Kedudukan Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={alamatTujuan}
                  onChange={e => setAlamatTujuan(e.target.value)}
                  placeholder="Contoh: Jl. Lintas Musi Rawas - Sekayu KM. 45 di Muara Kelingi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all"
                />
              </div>

              {/* Perihal * */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Perihal Surat *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Wajib diisi</span>
                </label>
                <input
                  type="text"
                  value={perihal}
                  onChange={e => setPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Rapat Koordinasi Penataan Batas Wilayah Dusun"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.perihal ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                  }`}
                />
                {errors.perihal && <p className="text-xs text-rose-400 font-medium">{errors.perihal}</p>}
              </div>

              {/* Lampiran */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Lampiran (Opsional)
                </label>
                <input
                  type="text"
                  value={lampiran}
                  onChange={e => setLampiran(e.target.value)}
                  placeholder="Contoh: 1 (satu) Berkas Jadwal / -"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all"
                />
              </div>

              {/* Isi Surat Ringkas (Pengantar) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-200">
                  Isi Surat / Uraian Pengantar (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={isiSurat}
                  onChange={e => setIsiSurat(e.target.value)}
                  placeholder="Uraian ringkas maksud pengantar kedinasan..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all resize-y"
                />
              </div>

              {/* Daftar Tembusan Dinamis */}
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-200 block">
                  Tembusan Surat Kedinasan (Daftar Dinamis)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTembusanInput}
                    onChange={e => setNewTembusanInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTembusan();
                      }
                    }}
                    placeholder="Contoh: Camat Muara Kelingi / BPD Beliti Jaya / Arsip"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddTembusan}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600/80 hover:bg-teal-600 text-white flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                {/* List Tembusan */}
                {tembusanList.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {tembusanList.map((item, idx) => (
                      <li
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl flex items-center justify-between text-xs text-slate-200"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{idx + 1}.</span>
                          <span>{item}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTembusan(idx)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          title="Hapus tembusan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Belum ada tembusan yang ditambahkan. (Opsional)
                  </p>
                )}
              </div>

              {/* Catatan Internal */}
              <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Catatan Internal Aparatur Desa (Tidak tercetak di surat resmi)</span>
                </label>
                <textarea
                  rows={2}
                  value={catatanInternal}
                  onChange={e => setCatatanInternal(e.target.value)}
                  placeholder="Catatan administratif internal untuk operator atau sekretaris desa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Navigasi Step 2 */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Simpan Draft</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateForm(true)) {
                    setCurrentStep(3);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/40 cursor-pointer flex items-center gap-2 transition-all"
              >
                <span>Lanjut ke Data Khusus</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 3: DATA KHUSUS (BERUBAH BERDASARKAN LETTER TYPE)
         ══════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-teal-400" />
                <span>Langkah 3: Data Khusus {selectedLetterType?.name}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Isi parameter khusus yang diperlukan naskah dinas jenis ini
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Simpan Draft</span>
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            {/* Dinamis Berdasarkan LetterType */}
            {selectedLetterType?.code === 'DINAS_UNDANGAN' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-blue-200">
                  <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>
                    Surat Undangan Dinas memerlukan parameter agenda rapat/acara, jadwal hari/tanggal, waktu, serta lokasi pertemuan.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Acara * */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-200">
                      Nama / Tajuk Acara atau Rapat *
                    </label>
                    <input
                      type="text"
                      value={formData.acara || ''}
                      onChange={e => setFormData(prev => ({ ...prev, acara: e.target.value }))}
                      placeholder="Contoh: Rapat Koordinasi Penataan Batas Wilayah & Tata Ruang Desa"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.acara ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.acara && <p className="text-xs text-rose-400">{errors.acara}</p>}
                  </div>

                  {/* Hari/Tanggal * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Hari / Tanggal Acara *
                    </label>
                    <input
                      type="text"
                      value={formData.hariTanggal || ''}
                      onChange={e => setFormData(prev => ({ ...prev, hariTanggal: e.target.value }))}
                      placeholder="Contoh: Senin, 12 Oktober 2026"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.hariTanggal ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.hariTanggal && <p className="text-xs text-rose-400">{errors.hariTanggal}</p>}
                  </div>

                  {/* Waktu * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Waktu Pelaksanaan *
                    </label>
                    <input
                      type="text"
                      value={formData.waktu || ''}
                      onChange={e => setFormData(prev => ({ ...prev, waktu: e.target.value }))}
                      placeholder="Contoh: 09.00 WIB s/d Selesai"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.waktu ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.waktu && <p className="text-xs text-rose-400">{errors.waktu}</p>}
                  </div>

                  {/* Tempat * */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-200">
                      Tempat / Lokasi Acara *
                    </label>
                    <input
                      type="text"
                      value={formData.tempat || ''}
                      onChange={e => setFormData(prev => ({ ...prev, tempat: e.target.value }))}
                      placeholder="Contoh: Balai Pertemuan Kantor Desa Beliti Jaya"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.tempat ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.tempat && <p className="text-xs text-rose-400">{errors.tempat}</p>}
                  </div>
                </div>
              </div>
            )}

            {selectedLetterType?.code === 'DINAS_TUGAS' && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
                  <Briefcase className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Surat Tugas kedinasan memerlukan rincian aparatur/petugas, jabatan, maksud penugasan, lokasi, serta jangka waktu.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Petugas * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Nama Aparatur / Petugas yang Ditugaskan *
                    </label>
                    <input
                      type="text"
                      value={formData.namaPetugas || ''}
                      onChange={e => setFormData(prev => ({ ...prev, namaPetugas: e.target.value }))}
                      placeholder="Contoh: AHMAD FAUZI, S.AP / Tim Verifikasi Lapangan"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.namaPetugas ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.namaPetugas && <p className="text-xs text-rose-400">{errors.namaPetugas}</p>}
                  </div>

                  {/* Jabatan Petugas * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Jabatan Aparatur / Petugas *
                    </label>
                    <input
                      type="text"
                      value={formData.jabatanPetugas || ''}
                      onChange={e => setFormData(prev => ({ ...prev, jabatanPetugas: e.target.value }))}
                      placeholder="Contoh: Kasi Pemerintahan Desa Beliti Jaya"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.jabatanPetugas ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.jabatanPetugas && <p className="text-xs text-rose-400">{errors.jabatanPetugas}</p>}
                  </div>

                  {/* Tujuan Tugas * */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-200">
                      Maksud & Uraian Tugas Kedinasan *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.tujuanTugas || ''}
                      onChange={e => setFormData(prev => ({ ...prev, tujuanTugas: e.target.value }))}
                      placeholder="Contoh: Menghadiri Rapat Koordinasi Sinkronisasi Data Kemiskinan Ekstrem di Kantor Camat Muara Kelingi"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all resize-y ${
                        errors.tujuanTugas ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.tujuanTugas && <p className="text-xs text-rose-400">{errors.tujuanTugas}</p>}
                  </div>

                  {/* Lokasi Tugas * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Tempat / Lokasi Pelaksanaan Tugas *
                    </label>
                    <input
                      type="text"
                      value={formData.lokasiTugas || ''}
                      onChange={e => setFormData(prev => ({ ...prev, lokasiTugas: e.target.value }))}
                      placeholder="Contoh: Aula Kantor Kecamatan Muara Kelingi"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.lokasiTugas ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.lokasiTugas && <p className="text-xs text-rose-400">{errors.lokasiTugas}</p>}
                  </div>

                  {/* Jangka Waktu * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Waktu / Jangka Waktu Pelaksanaan *
                    </label>
                    <input
                      type="text"
                      value={formData.jangkaWaktu || ''}
                      onChange={e => setFormData(prev => ({ ...prev, jangkaWaktu: e.target.value }))}
                      placeholder="Contoh: 1 (satu) hari kerja pada tanggal 15 Oktober 2026"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.jangkaWaktu ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.jangkaWaktu && <p className="text-xs text-rose-400">{errors.jangkaWaktu}</p>}
                  </div>
                </div>
              </div>
            )}

            {selectedLetterType?.code === 'DINAS_EDARAN' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
                  <Megaphone className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    Surat Edaran/Pemberitahuan memerlukan rincian hal pokok pemberitahuan, sasaran penerima, serta poin-poin instruksi.
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Hal Pemberitahuan * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Pokok Pemberitahuan / Himbauan *
                    </label>
                    <input
                      type="text"
                      value={formData.halPemberitahuan || ''}
                      onChange={e => setFormData(prev => ({ ...prev, halPemberitahuan: e.target.value }))}
                      placeholder="Contoh: Himbauan Pelaksanaan Gotong Royong Kebersihan Saluran Irigasi Lingkungan Dusun"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.halPemberitahuan ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.halPemberitahuan && <p className="text-xs text-rose-400">{errors.halPemberitahuan}</p>}
                  </div>

                  {/* Sasaran Penerima * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Sasaran Penerima Edaran *
                    </label>
                    <input
                      type="text"
                      value={formData.sasaranPenerima || ''}
                      onChange={e => setFormData(prev => ({ ...prev, sasaranPenerima: e.target.value }))}
                      placeholder="Contoh: Seluruh Ketua RT 01 s/d RT 06, Tokoh Masyarakat, dan Warga se-Desa Beliti Jaya"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.sasaranPenerima ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.sasaranPenerima && <p className="text-xs text-rose-400">{errors.sasaranPenerima}</p>}
                  </div>

                  {/* Ringkasan Instruksi * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Poin Pokok Instruksi / Himbauan *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.ringkasanInstruksi || ''}
                      onChange={e => setFormData(prev => ({ ...prev, ringkasanInstruksi: e.target.value }))}
                      placeholder="Contoh: 1. Melaksanakan pembersihan parit di depan pekarangan masing-masing; 2. Menjaga ketertiban umum..."
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all resize-y ${
                        errors.ringkasanInstruksi ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.ringkasanInstruksi && <p className="text-xs text-rose-400">{errors.ringkasanInstruksi}</p>}
                  </div>
                </div>
              </div>
            )}

            {selectedLetterType?.code === 'DINAS_REKOMENDASI' && (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-purple-200">
                  <FileCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>
                    Surat Rekomendasi Kedinasan (Level 3 Persetujuan Kades) memerlukan rincian pihak yang direkomendasikan, maksud keperluan, dan dasar pertimbangan.
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Pihak yang Direkomendasikan * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Pihak / Lembaga / Personil yang Direkomendasikan *
                    </label>
                    <input
                      type="text"
                      value={formData.pihakDirekomendasikan || ''}
                      onChange={e => setFormData(prev => ({ ...prev, pihakDirekomendasikan: e.target.value }))}
                      placeholder='Contoh: Kelompok Tani "Karya Mandiri" Dusun II Beliti Jaya'
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.pihakDirekomendasikan ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.pihakDirekomendasikan && <p className="text-xs text-rose-400">{errors.pihakDirekomendasikan}</p>}
                  </div>

                  {/* Maksud Rekomendasi * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Maksud / Keperluan Rekomendasi Kedinasan *
                    </label>
                    <input
                      type="text"
                      value={formData.maksudRekomendasi || ''}
                      onChange={e => setFormData(prev => ({ ...prev, maksudRekomendasi: e.target.value }))}
                      placeholder="Contoh: Usulan Permohonan Bantuan Sumur Bor Pertanian ke Dinas Pertanian Kab. Musi Rawas"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.maksudRekomendasi ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.maksudRekomendasi && <p className="text-xs text-rose-400">{errors.maksudRekomendasi}</p>}
                  </div>

                  {/* Dasar Pertimbangan * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Dasar / Pertimbangan Pemberian Rekomendasi *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.dasarPertimbangan || ''}
                      onChange={e => setFormData(prev => ({ ...prev, dasarPertimbangan: e.target.value }))}
                      placeholder="Contoh: Bahwa kelompok pemohon merupakan kelembagaan petani aktif dan terdaftar secara sah pada SIMLUHTAN..."
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all resize-y ${
                        errors.dasarPertimbangan ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 focus:border-teal-500 focus:ring-teal-500/30'
                      }`}
                    />
                    {errors.dasarPertimbangan && <p className="text-xs text-rose-400">{errors.dasarPertimbangan}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigasi Step 3 */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Simpan Draft</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateForm(false)) {
                    setCurrentStep(4);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/40 cursor-pointer flex items-center gap-2 transition-all"
              >
                <span>Lanjut ke Review & Simpan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 4: REVIEW & SIMPAN (RINGKASAN SEBELUM PROSES)
         ══════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <span>Langkah 4: Review & Simpan Surat Dinas</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tinjau kembali seluruh data naskah dinas sebelum diproses ke alur verifikasi
              </p>
            </div>
          </div>

          {/* Warning Template jika template resmi belum didaftarkan di master template */}
          {!templateAvailable && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Template Resmi Belum Tersedia</span>
                <p className="text-slate-300">
                  Template surat untuk jenis ini belum tersedia. Surat belum dapat diproses hingga template resmi naskah dinas didaftarkan pada tahap berikutnya. Anda dapat menyimpan pengajuan ini sebagai <strong>Draft</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Layout 2 Kolom Ringkasan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Ringkasan Rincian Form (2/3) */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Data Umum Naskah Dinas</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Jenis Surat Dinas</span>
                    <span className="font-bold text-white text-sm">{selectedLetterType?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Klasifikasi / Sifat</span>
                    <span className="font-semibold text-white">
                      {selectedLetterType?.classificationCode} • Sifat: <strong className="text-amber-400">{sifatSurat}</strong>
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">Tujuan Surat</span>
                    <span className="font-bold text-white text-sm">{tujuanSurat || '-'}</span>
                    {instansiTujuan && <span className="text-slate-300 block text-xs">({instansiTujuan})</span>}
                  </div>
                  {alamatTujuan && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block">Alamat Tujuan</span>
                      <span className="text-slate-200">{alamatTujuan}</span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">Perihal</span>
                    <span className="font-bold text-white text-sm">{perihal || '-'}</span>
                  </div>
                  {lampiran && (
                    <div>
                      <span className="text-slate-400 block">Lampiran</span>
                      <span className="text-slate-200">{lampiran}</span>
                    </div>
                  )}
                  {isiSurat && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block">Isi / Uraian Pengantar</span>
                      <p className="text-slate-300 whitespace-pre-line">{isiSurat}</p>
                    </div>
                  )}
                </div>

                {/* Tembusan */}
                {tembusanList.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400 block font-semibold mb-1">Daftar Tembusan:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                      {tembusanList.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Data Khusus Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4" />
                    <span>Parameter Khusus ({selectedLetterType?.name})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {selectedLetterType?.requiredFields.map(f => (
                    <div key={f.name}>
                      <span className="text-slate-400 block font-medium">{f.label}</span>
                      <span className="font-semibold text-white whitespace-pre-line">
                        {formData[f.name] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Status & Panel Eksekusi (1/3) */}
            <div className="space-y-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Alur Validasi & Persetujuan</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Tingkat Workflow:</span>
                    <span className="font-bold text-white">
                      {selectedLetterType?.workflowLevel === 'LEVEL_3_PERSETUJUAN'
                        ? 'Level 3 • Persetujuan Langsung Kepala Desa'
                        : 'Level 2 • Verifikasi Sekretariat & Register'}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Petugas Entri / Aparatur:</span>
                    <span className="font-bold text-white">{currentUser.name}</span>
                    <span className="text-slate-400 block text-[11px]">Role: {currentUser.role}</span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Nomor Registrasi Surat:</span>
                    <span className="font-mono text-amber-400 font-bold">Belum diterbitkan</span>
                    <span className="text-[10px] text-slate-500 block">Diterbitkan oleh engine nomor saat pengesahan</span>
                  </div>
                </div>

                {/* Tombol Eksekusi */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleSubmitProcess}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 active:scale-98 text-white shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isProcessing ? 'Memproses Permohonan...' : 'PROSES SURAT DINAS'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedLetterTypeId) return;
                      const tempRequest: LetterRequest = {
                        id: activeDraftId || `draft-preview-${Date.now()}`,
                        letterTypeId: selectedLetterTypeId,
                        letterTypeCode: selectedLetterType?.code || 'DINAS_UNDANGAN',
                        letterTypeName: selectedLetterType?.name || 'Surat Dinas',
                        status: 'DRAFT',
                        workflowLevel: selectedLetterType?.workflowLevel || 'LEVEL_2_VERIFIKASI',
                        submittedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        confirmedRequirements: [],
                        formData,
                        isSuratDinas: true,
                        suratDinasData: buildSuratDinasData(),
                        createdByActorId: currentUser.id,
                        createdByActorName: currentUser.name,
                        createdByRole: currentUser.role,
                        nomorSurat: 'Belum diterbitkan'
                      };
                      setPreviewRequest(tempRequest);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>PRATINJAU DRAF DOKUMEN</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>SIMPAN SEBAGAI DRAFT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigasi Step 4 */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Dokumen Pratinjau Draft / Permohonan */}
      {previewRequest && (
        <DocumentPreviewWorkspace
          letterRequest={previewRequest}
          mode="aparatur"
          currentUser={currentUser}
          customProfile={desaProfile}
          onClose={() => setPreviewRequest(null)}
          onBack={() => setPreviewRequest(null)}
        />
      )}
    </div>
  );
};
