import React, { useState, useMemo, useEffect } from 'react';
import { 
  LetterType, 
  WargaSession, 
  LetterFormFieldConfig, 
  Penduduk, 
  Keluarga,
  WorkflowLevel
} from '../../types';
import { StorageService } from '../../services/storageService';
import { LetterIssuanceService } from '../../services/letterIssuanceService';
import { 
  Home, 
  Briefcase, 
  HeartHandshake, 
  Send, 
  UserCheck, 
  AlertCircle, 
  Baby, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Building2, 
  User, 
  Check, 
  AlertTriangle, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface WargaFormPengajuanSuratProps {
  currentWarga: WargaSession;
  initialLetterTypeId?: string;
  onSuccess: (requestId: string) => void;
  onCancel: () => void;
  onNavigateToDataChange: () => void;
}

export const WargaFormPengajuanSurat: React.FC<WargaFormPengajuanSuratProps> = ({
  currentWarga,
  initialLetterTypeId,
  onSuccess,
  onCancel,
  onNavigateToDataChange
}) => {
  // Master kependudukan pemohon (Single Source of Truth)
  const [pendudukData, setPendudukData] = useState<{ penduduk: Penduduk; keluarga: Keluarga } | null>(() => {
    return StorageService.getPendudukById(currentWarga.pendudukId);
  });

  const letterTypes = useMemo(() => StorageService.getLetterTypes(), []);
  
  // State langkah / wizard (1: Pilih Surat, 2: Isi Data, 3: Persyaratan, 4: Periksa, 5: Konfirmasi & Kirim)
  const [currentStep, setCurrentStep] = useState<number>(initialLetterTypeId ? 2 : 1);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(initialLetterTypeId || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchLetter, setSearchLetter] = useState<string>('');

  // Form data dinamis
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Checklist persyaratan
  const [confirmedRequirements, setConfirmedRequirements] = useState<string[]>([]);
  
  // Pernyataan kebenaran data
  const [isStatementAgreed, setIsStatementAgreed] = useState(false);
  const [catatanPemohon, setCatatanPemohon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedLetterType: LetterType | undefined = useMemo(() => {
    return letterTypes.find(t => t.id === selectedTypeId);
  }, [letterTypes, selectedTypeId]);

  // Inisialisasi default form data saat jenis surat terpilih
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

  // Sinkronisasi jika initialLetterTypeId berubah dari luar
  useEffect(() => {
    if (initialLetterTypeId) {
      setSelectedTypeId(initialLetterTypeId);
      setCurrentStep(2);
    }
  }, [initialLetterTypeId]);

  // Sinkronisasi data penduduk jika sesi berubah
  useEffect(() => {
    if (currentWarga?.pendudukId && !pendudukData) {
      const data = StorageService.getPendudukById(currentWarga.pendudukId);
      if (data) {
        setPendudukData(data);
      }
    }
  }, [currentWarga?.pendudukId, pendudukData]);

  // Helper render icon
  const renderLetterIcon = (iconName: string, className = "w-6 h-6") => {
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

  const filteredLetterTypes = useMemo(() => {
    return letterTypes.filter(lt => {
      const matchCat = selectedCategory === 'all' || lt.category === selectedCategory;
      const matchSearch = 
        lt.name.toLowerCase().includes(searchLetter.toLowerCase()) ||
        lt.description.toLowerCase().includes(searchLetter.toLowerCase()) ||
        lt.code.toLowerCase().includes(searchLetter.toLowerCase());
      return matchCat && matchSearch && lt.active;
    });
  }, [letterTypes, selectedCategory, searchLetter]);

  // Validasi Step 2 (Form Isian)
  const validateStep2 = (): boolean => {
    if (!selectedLetterType) return false;
    const errors: Record<string, string> = {};

    for (const field of selectedLetterType.requiredFields) {
      const val = formData[field.name];
      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[field.name] = `${field.label} wajib diisi.`;
        }
      }

      if (field.type === 'number' && val !== undefined && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          errors[field.name] = `${field.label} harus berupa angka valid.`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validasi Step 3 (Persyaratan)
  const validateStep3 = (): boolean => {
    if (!selectedLetterType) return false;
    if (selectedLetterType.requirements.length > 0 && confirmedRequirements.length === 0) {
      setSubmitError('Harap konfirmasi ketersediaan minimal salah satu dokumen persyaratan.');
      return false;
    }
    setSubmitError(null);
    return true;
  };

  const handleNextStep = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (!selectedTypeId) {
        setSubmitError('Harap pilih salah satu jenis surat yang ingin diajukan.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        setSubmitError('Harap lengkapi semua kolom isian formulir yang wajib.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) {
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStatementAgreed) {
      setSubmitError('Anda harus menyetujui pernyataan kebenaran data sebelum mengirim permohonan.');
      return;
    }

    if (!selectedLetterType || !pendudukData) {
      setSubmitError('Sesi atau data jenis surat tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = StorageService.createLetterRequest({
      wargaSession: currentWarga,
      letterTypeId: selectedLetterType.id,
      formData,
      confirmedRequirements,
      notes: catatanPemohon.trim() || undefined
    });

    if (res.success && res.request) {
      // LEVEL 1 INSTAN: Penomoran dan Penerbitan Otomatis (Tanpa Menunggu Operator)
      if (selectedLetterType.workflowLevel === 'LEVEL_1_INSTAN') {
        await LetterIssuanceService.issueLetter({
          letterRequestId: res.request.id,
          actor: {
            id: currentWarga.wargaAccountId,
            name: currentWarga.nama,
            role: 'WARGA_MANDIRI'
          }
        });
      }
      setIsSubmitting(false);
      onSuccess(res.request.id);
    } else {
      setIsSubmitting(false);
      setSubmitError(res.error || 'Terjadi kesalahan saat memproses pengajuan surat.');
    }
  };

  const getWorkflowBadge = (level: WorkflowLevel) => {
    switch (level) {
      case 'LEVEL_1_INSTAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Level 1 • Instan
          </span>
        );
      case 'LEVEL_2_VERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Level 2 • Verifikasi Operator
          </span>
        );
      case 'LEVEL_3_PERSETUJUAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-700/60">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Level 3 • Persetujuan Kades
          </span>
        );
      default:
        return null;
    }
  };

  const stepsList = [
    { num: 1, label: 'Pilih Surat' },
    { num: 2, label: 'Isi Data' },
    { num: 3, label: 'Persyaratan' },
    { num: 4, label: 'Periksa' },
    { num: 5, label: 'Konfirmasi' }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Step Indicator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-emerald-400" />
              Layanan Surat Mandiri
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Ajukan permohonan surat administrasi desa secara mandiri dan transparan.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 w-full z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-300 z-0" 
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />

            {stepsList.map(s => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                      isPassed
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${
                    isCurrent ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert Error Box */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-200 text-sm flex items-start gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block">Perhatian:</strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 1: PILIH JENIS SURAT ──────────────── */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter & Search Bar */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'kependudukan', label: 'Kependudukan' },
                { id: 'usaha', label: 'Usaha & Ekonomi' },
                { id: 'sosial', label: 'Sosial & Bantuan' },
                { id: 'umum', label: 'Umum' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={searchLetter}
              onChange={e => setSearchLetter(e.target.value)}
              placeholder="Cari surat..."
              className="w-full sm:w-60 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Grid Katalog Surat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLetterTypes.map(type => {
              const isSelected = selectedTypeId === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setSubmitError(null);
                  }}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-4 h-4 font-bold" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        isSelected 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 group-hover:text-emerald-400 group-hover:border-emerald-700/40'
                      }`}>
                        {renderLetterIcon(type.icon)}
                      </div>
                      <div className="pr-6">
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                          {type.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {type.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      {getWorkflowBadge(type.workflowLevel)}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {type.estimatedTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-xs text-slate-500">
                      {type.requiredFields.length} kolom isian • {type.requirements.length} syarat
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTypeId(type.id);
                        setCurrentStep(2);
                        setSubmitError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                      <span>Ajukan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────── STEP 2: ISI DATA PEMOHON & FORMULIR ──────────────── */}
      {currentStep === 2 && selectedLetterType && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card Info Jenis Surat Terpilih */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                {renderLetterIcon(selectedLetterType.icon, "w-5 h-5")}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedLetterType.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Estimasi: {selectedLetterType.estimatedTime}</span>
                  <span>•</span>
                  {getWorkflowBadge(selectedLetterType.workflowLevel)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-400 hover:text-emerald-400 underline shrink-0"
            >
              Ganti Surat
            </button>
          </div>

          {/* Section 1: Data Kependudukan Pemohon (READ-ONLY) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200">Data Administrasi Kependudukan (Read-Only)</h4>
              </div>
              <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                Terkoneksi Master Penduduk
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>
                  Data di bawah ini ditarik secara otomatis dari Administrasi Kependudukan Desa Beliti Jaya dan dikunci demi kepatuhan hukum. Jika terdapat kesalahan biodata:
                </span>
                <button
                  type="button"
                  onClick={onNavigateToDataChange}
                  className="ml-1.5 font-bold text-amber-300 underline hover:text-white inline-flex items-center gap-1"
                >
                  Laporkan Perubahan Data <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {pendudukData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Nama Lengkap:</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{pendudukData.penduduk.nama}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">NIK:</span>
                  <span className="font-mono font-semibold text-slate-200 mt-0.5 block">{pendudukData.penduduk.nik}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Nomor KK:</span>
                  <span className="font-mono text-slate-300 mt-0.5 block">{pendudukData.keluarga.noKk}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Tempat, Tanggal Lahir:</span>
                  <span className="text-slate-300 mt-0.5 block">{pendudukData.penduduk.tempatLahir}, {pendudukData.penduduk.tanggalLahir}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Jenis Kelamin / Agama:</span>
                  <span className="text-slate-300 mt-0.5 block">{pendudukData.penduduk.jenisKelamin} / {pendudukData.penduduk.agama}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Pekerjaan:</span>
                  <span className="text-slate-300 mt-0.5 block">{pendudukData.penduduk.pekerjaan}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-2 md:col-span-3">
                  <span className="text-slate-500 block">Alamat Domisili KTP:</span>
                  <span className="text-slate-300 mt-0.5 block">
                    {pendudukData.keluarga.alamat}, RT {pendudukData.keluarga.rt} / RW {pendudukData.keluarga.rw}, {pendudukData.keluarga.dusun}, Desa Beliti Jaya
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Formulir Isian Tambahan Dinamis */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Kolom Isian Khusus Surat
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Lengkapi rincian keterangan khusus yang dibutuhkan untuk penerbitan surat ini.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedLetterType.requiredFields.map(field => {
                const isFullWidth = field.type === 'textarea' || field.name.toLowerCase().includes('alamat');
                return (
                  <div key={field.name} className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </span>
                    </label>

                    {/* Render input by type */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={e => {
                          setFormData({ ...formData, [field.name]: e.target.value });
                          if (formErrors[field.name]) {
                            setFormErrors({ ...formErrors, [field.name]: '' });
                          }
                        }}
                        placeholder={field.placeholder}
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none ${
                          formErrors[field.name] 
                            ? 'border-rose-500 focus:border-rose-500' 
                            : 'border-slate-700/80 focus:border-emerald-500'
                        }`}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        value={formData[field.name] || ''}
                        onChange={e => {
                          setFormData({ ...formData, [field.name]: e.target.value });
                          if (formErrors[field.name]) {
                            setFormErrors({ ...formErrors, [field.name]: '' });
                          }
                        }}
                        placeholder={field.placeholder}
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none ${
                          formErrors[field.name] 
                            ? 'border-rose-500 focus:border-rose-500' 
                            : 'border-slate-700/80 focus:border-emerald-500'
                        }`}
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={formData[field.name] || ''}
                        onChange={e => {
                          setFormData({ ...formData, [field.name]: e.target.value });
                          if (formErrors[field.name]) {
                            setFormErrors({ ...formErrors, [field.name]: '' });
                          }
                        }}
                        placeholder={field.placeholder}
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none ${
                          formErrors[field.name] 
                            ? 'border-rose-500 focus:border-rose-500' 
                            : 'border-slate-700/80 focus:border-emerald-500'
                        }`}
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={e => {
                          setFormData({ ...formData, [field.name]: e.target.value });
                          if (formErrors[field.name]) {
                            setFormErrors({ ...formErrors, [field.name]: '' });
                          }
                        }}
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none ${
                          formErrors[field.name] 
                            ? 'border-rose-500 focus:border-rose-500' 
                            : 'border-slate-700/80 focus:border-emerald-500'
                        }`}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        value={formData[field.name] || ''}
                        onChange={e => {
                          setFormData({ ...formData, [field.name]: e.target.value });
                          if (formErrors[field.name]) {
                            setFormErrors({ ...formErrors, [field.name]: '' });
                          }
                        }}
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none ${
                          formErrors[field.name] 
                            ? 'border-rose-500 focus:border-rose-500' 
                            : 'border-slate-700/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">-- Pilih {field.label} --</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.helpText && (
                      <p className="text-[11px] text-slate-500">{field.helpText}</p>
                    )}

                    {formErrors[field.name] && (
                      <p className="text-[11px] text-rose-400">{formErrors[field.name]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 3: PERSYARATAN BERKAS ──────────────── */}
      {currentStep === 3 && selectedLetterType && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Daftar Dokumen Persyaratan Berkas Fisik
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Harap beri tanda centang pada dokumen fisik yang Anda miliki dan siap ditunjukkan kepada petugas di Balai Desa Beliti Jaya saat pengambilan/verifikasi surat.
              </p>
            </div>

            {selectedLetterType.requirements.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Surat ini tidak memerlukan kelengkapan dokumen khusus.</p>
            ) : (
              <div className="space-y-3">
                {selectedLetterType.requirements.map((reqText, idx) => {
                  const isChecked = confirmedRequirements.includes(reqText);
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-emerald-950/20 border-emerald-500/60 text-slate-200' 
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setConfirmedRequirements([...confirmedRequirements, reqText]);
                          } else {
                            setConfirmedRequirements(confirmedRequirements.filter(r => r !== reqText));
                          }
                          setSubmitError(null);
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                      />
                      <div className="text-xs sm:text-sm font-medium">
                        {reqText}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Pada Tahap 4 Anjungan Mandiri ini, Anda belum diwajibkan mengunggah pindaian file digital. Cukup konfirmasikan ketersediaan berkas fisik asli atau fotokopi untuk dicocokkan petugas.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 4: PERIKSA PENGAJUAN (PREVIEW) ──────────────── */}
      {currentStep === 4 && selectedLetterType && pendudukData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Pratinjau Pengajuan Surat
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Periksa kembali ringkasan data sebelum melakukan konfirmasi akhir.
                </p>
              </div>
              {getWorkflowBadge(selectedLetterType.workflowLevel)}
            </div>

            {/* Info Surat */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-300">
                {renderLetterIcon(selectedLetterType.icon, "w-5 h-5")}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedLetterType.name}</h4>
                <p className="text-xs text-slate-400">Kode: {selectedLetterType.code} • Estimasi: {selectedLetterType.estimatedTime}</p>
              </div>
            </div>

            {/* Data Pemohon */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">1. Data Pemohon (Kependudukan)</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Nama:</span> <strong className="text-slate-200">{pendudukData.penduduk.nama}</strong>
                </div>
                <div>
                  <span className="text-slate-500">NIK:</span> <strong className="font-mono text-slate-200">{pendudukData.penduduk.nik}</strong>
                </div>
                <div>
                  <span className="text-slate-500">No. KK:</span> <span className="font-mono text-slate-300">{pendudukData.keluarga.noKk}</span>
                </div>
                <div>
                  <span className="text-slate-500">TTL:</span> <span className="text-slate-300">{pendudukData.penduduk.tempatLahir}, {pendudukData.penduduk.tanggalLahir}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Alamat:</span> <span className="text-slate-300">{pendudukData.keluarga.alamat}, RT {pendudukData.keluarga.rt}/RW {pendudukData.keluarga.rw}, {pendudukData.keluarga.dusun}</span>
                </div>
              </div>
            </div>

            {/* Data Isian Formulir */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">2. Rincian Isian Formulir</h5>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                {selectedLetterType.requiredFields.map(f => (
                  <div key={f.name} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-850 last:border-0">
                    <span className="text-slate-400">{f.label}:</span>
                    <span className="font-semibold text-slate-200 sm:text-right">{String(formData[f.name] || '-')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Persyaratan Terkonfirmasi */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">3. Persyaratan Dokumen Fisik</h5>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                {confirmedRequirements.map((cr, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{cr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 5: KONFIRMASI & SUBMIT ──────────────── */}
      {currentStep === 5 && selectedLetterType && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Pernyataan & Pengesahan Pengajuan
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Langkah terakhir untuk menyelesaikan permohonan surat administrasi desa.
              </p>
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Catatan Tambahan untuk Petugas Desa (Opsional)
              </label>
              <textarea
                rows={2}
                value={catatanPemohon}
                onChange={e => setCatatanPemohon(e.target.value)}
                placeholder="Contoh: Mohon diproses sebelum hari Kamis karena batas akhir pendaftaran beasiswa..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Checkbox Konfirmasi */}
            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/60 cursor-pointer hover:bg-emerald-950/30 transition-all">
              <input
                type="checkbox"
                checked={isStatementAgreed}
                onChange={e => {
                  setIsStatementAgreed(e.target.checked);
                  setSubmitError(null);
                }}
                className="mt-1 w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
              <div className="text-xs sm:text-sm text-slate-200">
                <strong className="block font-semibold text-emerald-300 mb-0.5">
                  Pernyataan Kebenaran Data Pemohon
                </strong>
                Saya menyatakan dengan sesungguhnya bahwa seluruh data yang saya ajukan pada formulir ini adalah benar, sah, dan sesuai dengan dokumen kependudukan asli yang berlaku. Apabila di kemudian hari ditemukan keterangan yang tidak benar, saya bersedia bertanggung jawab sesuai dengan peraturan perundang-undangan.
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
        <div>
          {currentStep > 1 && (
            <button
              disabled={isSubmitting}
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep < 5 ? (
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
            >
              Lanjutkan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled={!isStatementAgreed || isSubmitting}
              onClick={handleSubmit}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                isStatementAgreed && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting 
                ? 'Memproses & Menerbitkan Surat...' 
                : selectedLetterType.workflowLevel === 'LEVEL_1_INSTAN'
                  ? 'Kirim & Terbitkan Surat Instan'
                  : 'Kirim Pengajuan Surat'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
