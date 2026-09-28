import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keluarga, 
  Penduduk, 
  User, 
  DusunWilayah, 
  StatusKesejahteraan, 
  JenisBantuanSosial, 
  StatusPenduduk 
} from '../types';
import { 
  ArrowLeft,
  Home, 
  Users, 
  MapPin, 
  Building2, 
  HeartHandshake, 
  Upload, 
  Crosshair, 
  Sparkles,
  RotateCcw,
  Camera,
  User as UserIcon,
  Link as LinkIcon,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  X,
  FileText,
  FileCheck,
  Clock,
  Compass,
  FolderOpen,
  RefreshCw,
  Check
} from 'lucide-react';

interface ModernSelectOption<T extends string | number> {
  value: T;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface ModernSelectProps<T extends string | number> {
  value: T;
  onChange: (val: T) => void;
  options: (ModernSelectOption<T> | T)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

function ModernSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  disabled = false,
  className = '',
  size = 'md'
}: ModernSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedOptions: ModernSelectOption<T>[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null && 'value' in opt) {
        return opt as ModernSelectOption<T>;
      }
      return {
        value: opt as T,
        label: String(opt)
      };
    });
  }, [options]);

  const selectedOption = parsedOptions.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = size === 'sm' 
    ? 'px-3 py-1.5 text-xs' 
    : 'px-3.5 py-2 text-xs';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border font-medium text-left transition-all cursor-pointer ${sizeClasses} ${
          disabled 
            ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed' 
            : isOpen
              ? 'bg-slate-900 text-white border-emerald-500 ring-2 ring-emerald-500/25 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950/80 hover:bg-slate-900/90 text-slate-200 border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl shadow-black/80 max-h-56 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700"
          >
            {parsedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-600/20 text-emerald-300 font-semibold border-l-2 border-emerald-400' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface FamilyFormViewProps {
  initialData?: Keluarga | null;
  initialDraft?: any | null;
  onClose: () => void;
  onSave: (keluargaData: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'>) => void;
  currentUser: User;
  onPickCoordinateOnMap: (draftState: any) => void;
  pickedCoords?: { lat: number; lng: number } | null;
  backLabel?: string;
}

/**
 * Client-side image compression to lightweight JPEG Base64
 * Prevents localStorage quota overflows while maintaining crisp photo quality
 */
const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const FamilyFormView: React.FC<FamilyFormViewProps> = ({
  initialData,
  initialDraft,
  onClose,
  onSave,
  currentUser,
  onPickCoordinateOnMap,
  pickedCoords,
  backLabel = 'Kembali ke Peta'
}) => {
  const isEditing = !!initialData;

  // Layout sidebar states inspired by the reference portal
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  
  // State and hover delay ref for floating "Ikhtisar Data Pokok" icon hover card
  const [isOverviewHovered, setIsOverviewHovered] = useState<boolean>(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterOverview = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOverviewHovered(true);
  };

  const handleMouseLeaveOverview = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOverviewHovered(false);
    }, 220);
  };

  // Dynamic offset and position tracking for floating navigation dock
  const [headerOffset, setHeaderOffset] = useState<number>(118);
  const asideRef = useRef<HTMLElement>(null);
  const [sidebarLeft, setSidebarLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateOffsetAndPos = () => {
      const mainHeader = document.getElementById('main-header');
      if (mainHeader) {
        setHeaderOffset(mainHeader.offsetHeight + 8);
      }
      if (asideRef.current) {
        const rect = asideRef.current.getBoundingClientRect();
        setSidebarLeft(rect.left);
      }
    };

    updateOffsetAndPos();
    const timer = setTimeout(updateOffsetAndPos, 150);
    window.addEventListener('resize', updateOffsetAndPos);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateOffsetAndPos);
    };
  }, [isSidebarCollapsed]);

  // Active section tab for horizontal underline bar & sidebar navigation
  const [activeTab, setActiveTab] = useState<'profil' | 'gis' | 'fisik' | 'bansos' | 'anggota' | 'semua'>('profil');

  // Helper to generate a clean empty family member record
  const createEmptyMember = (
    role: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain' = 'Kepala Keluarga', 
    idx = 0,
    defaultStatus: StatusPenduduk = 'Tetap'
  ): Penduduk => ({
    id: `pen_${Date.now()}_${idx + 1}`,
    nik: '',
    noKk: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: role === 'Istri' ? 'Perempuan' : 'Laki-Laki',
    agama: 'Islam',
    statusPerkawinan: role === 'Kepala Keluarga' || role === 'Istri' ? 'Kawin' : 'Belum Kawin',
    statusKeluarga: role,
    pendidikan: 'SMA',
    pekerjaan: '',
    penghasilanBulanan: 0,
    statusKematian: 'Hidup',
    statusPenduduk: defaultStatus,
    foto: '',
    bantuanPribadi: []
  });

  // Form States
  const [noKk, setNoKk] = useState<string>('');
  const [namaKepalaKeluarga, setNamaKepalaKeluarga] = useState<string>('');
  const [nikKepala, setNikKepala] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [dusun, setDusun] = useState<DusunWilayah>('Dusun I');
  const [rt, setRt] = useState<string>('');
  const [rw, setRw] = useState<string>('');
  const [statusPenduduk, setStatusPenduduk] = useState<StatusPenduduk>('Tetap');
  
  // Coordinates
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');

  // Kesejahteraan & Bansos
  const [statusKesejahteraan, setStatusKesejahteraan] = useState<StatusKesejahteraan>('Desil 1 (Sangat Miskin)');
  const [penerimaBansos, setPenerimaBansos] = useState<boolean>(false);
  const [daftarBansos, setDaftarBansos] = useState<JenisBantuanSosial[]>(['Tidak Menerima']);
  const [totalNominal, setTotalNominal] = useState<number | ''>('');

  // Kondisi Fisik Rumah
  const [fotoRumah, setFotoRumah] = useState<string>('');
  const [tipeBangunan, setTipeBangunan] = useState<'Permanen' | 'Semi Permanen' | 'Panggung Kayu' | 'Bambu/Papan'>('Permanen');
  const [luasBangunanM2, setLuasBangunanM2] = useState<number | ''>('');
  const [sumberAirMinum, setSumberAirMinum] = useState<'Sumur Bor' | 'Sumur Gali' | 'Sungai Beliti' | 'PDAM/Depot'>('Sumur Bor');
  const [dayaListrik, setDayaListrik] = useState<'450 VA (Subsidi)' | '900 VA (Subsidi)' | '900 VA (Non Subsidi)' | '1300 VA+' | 'Tanpa Listrik'>('450 VA (Subsidi)');
  const [statusKepemilikan, setStatusKepemilikan] = useState<'Milik Sendiri' | 'Sewa/Kontrak' | 'Menumpang' | 'Rumah Dinas'>('Milik Sendiri');
  const [kondisiLantai, setKondisiLantai] = useState<'Keramik' | 'Semen' | 'Papan/Kayu' | 'Tanah'>('Semen');
  const [kondisiDinding, setKondisiDinding] = useState<'Tembok/Batu Bata' | 'Papan/Kayu' | 'Bambu' | 'Seng'>('Tembok/Batu Bata');
  const [fasilitasJamban, setFasilitasJamban] = useState<'Milik Sendiri (Leher Angsa)' | 'Jamban Cemplung' | 'MCK Umum' | 'Tidak Ada/Sungai'>('Milik Sendiri (Leher Angsa)');

  // Anggota Keluarga List
  const [anggotaList, setAnggotaList] = useState<Penduduk[]>([createEmptyMember('Kepala Keluarga', 0)]);

  // UI state for photo upload inputs
  const [showKepalaUrlInput, setShowKepalaUrlInput] = useState<boolean>(false);
  const [showRumahUrlInput, setShowRumahUrlInput] = useState<boolean>(false);
  const [openMemberUrlIdx, setOpenMemberUrlIdx] = useState<number | null>(null);

  // Photo of Kepala Keluarga is synced with anggotaList[0]?.foto
  const fotoKepala = anggotaList[0]?.foto || '';

  // Form section references for smooth scrolling when in 'semua' mode
  const sectionPokokRef = useRef<HTMLDivElement>(null);
  const sectionGisRef = useRef<HTMLDivElement>(null);
  const sectionFisikRef = useRef<HTMLDivElement>(null);
  const sectionBansosRef = useRef<HTMLDivElement>(null);
  const sectionAnggotaRef = useRef<HTMLDivElement>(null);

  // Process uploaded image file
  const handleProcessImageFile = async (file: File, onDone: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file format gambar (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Harap pilih gambar di bawah 12MB.');
      return;
    }
    try {
      const compressed = await compressImage(file, 600, 600, 0.85);
      onDone(compressed);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      alert('Terjadi kesalahan saat memproses gambar.');
    }
  };

  // Update Kepala Keluarga photo
  const handleUpdateKepalaFoto = (fotoUrl: string) => {
    setAnggotaList(prev => {
      if (prev.length === 0) return [createEmptyMember('Kepala Keluarga', 0)];
      const updated = [...prev];
      updated[0] = { ...updated[0], foto: fotoUrl };
      return updated;
    });
  };

  // Reset form to pristine clean state
  const resetToEmptyForm = () => {
    setNoKk('');
    setNamaKepalaKeluarga('');
    setNikKepala('');
    setAlamat('');
    setDusun('Dusun I');
    setRt('');
    setRw('');
    setStatusPenduduk('Tetap');
    setLat(pickedCoords ? pickedCoords.lat : '');
    setLng(pickedCoords ? pickedCoords.lng : '');
    setStatusKesejahteraan('Desil 1 (Sangat Miskin)');
    setPenerimaBansos(false);
    setDaftarBansos(['Tidak Menerima']);
    setTotalNominal('');
    setFotoRumah('');
    setTipeBangunan('Permanen');
    setLuasBangunanM2('');
    setSumberAirMinum('Sumur Bor');
    setDayaListrik('450 VA (Subsidi)');
    setStatusKepemilikan('Milik Sendiri');
    setKondisiLantai('Semen');
    setKondisiDinding('Tembok/Batu Bata');
    setFasilitasJamban('Milik Sendiri (Leher Angsa)');
    setAnggotaList([createEmptyMember('Kepala Keluarga', 0)]);
    setShowKepalaUrlInput(false);
    setShowRumahUrlInput(false);
    setOpenMemberUrlIdx(null);
  };

  // Populate from initialData or initialDraft
  useEffect(() => {
    if (initialDraft) {
      const draftNoKk = initialDraft.noKk || '';
      const draftNama = initialDraft.namaKepalaKeluarga || initialDraft.anggotaList?.[0]?.nama || '';
      const draftNik = initialDraft.nikKepala || initialDraft.anggotaList?.[0]?.nik || '';
      setNoKk(draftNoKk);
      setNamaKepalaKeluarga(draftNama);
      setNikKepala(draftNik);
      setAlamat(initialDraft.alamat || '');
      setDusun(initialDraft.dusun || 'Dusun I');
      setRt(initialDraft.rt || '');
      setRw(initialDraft.rw || '');
      setStatusPenduduk(initialDraft.statusPenduduk || 'Tetap');
      setLat(initialDraft.lat ?? (pickedCoords ? pickedCoords.lat : ''));
      setLng(initialDraft.lng ?? (pickedCoords ? pickedCoords.lng : ''));
      setStatusKesejahteraan(initialDraft.statusKesejahteraan || 'Desil 1 (Sangat Miskin)');
      setPenerimaBansos(initialDraft.penerimaBansos ?? false);
      setDaftarBansos(initialDraft.daftarBansos?.length ? initialDraft.daftarBansos : ['Tidak Menerima']);
      setTotalNominal(initialDraft.totalNominal ?? '');
      setFotoRumah(initialDraft.fotoRumah || '');
      setTipeBangunan(initialDraft.tipeBangunan || 'Permanen');
      setLuasBangunanM2(initialDraft.luasBangunanM2 ?? '');
      setSumberAirMinum(initialDraft.sumberAirMinum || 'Sumur Bor');
      setDayaListrik(initialDraft.dayaListrik || '450 VA (Subsidi)');
      setStatusKepemilikan(initialDraft.statusKepemilikan || 'Milik Sendiri');
      setKondisiLantai(initialDraft.kondisiLantai || 'Semen');
      setKondisiDinding(initialDraft.kondisiDinding || 'Tembok/Batu Bata');
      setFasilitasJamban(initialDraft.fasilitasJamban || 'Milik Sendiri (Leher Angsa)');
      
      const rawList: Penduduk[] = initialDraft.anggotaList?.length ? initialDraft.anggotaList : [createEmptyMember('Kepala Keluarga', 0)];
      const syncedList = rawList.map((m, i) => {
        if (i === 0 || m.statusKeluarga === 'Kepala Keluarga') {
          return {
            ...m,
            nama: draftNama || m.nama || '',
            nik: draftNik || m.nik || '',
            noKk: draftNoKk || m.noKk || '',
            statusKeluarga: 'Kepala Keluarga'
          };
        }
        return m;
      });
      setAnggotaList(syncedList);
    } else if (initialData) {
      const initNoKk = initialData.noKk || '';
      const initNama = initialData.namaKepalaKeluarga || initialData.anggotaKeluarga?.[0]?.nama || '';
      const initNik = initialData.nikKepala || initialData.anggotaKeluarga?.[0]?.nik || '';
      setNoKk(initNoKk);
      setNamaKepalaKeluarga(initNama);
      setNikKepala(initNik);
      setAlamat(initialData.alamat || '');
      setDusun(initialData.dusun || 'Dusun I');
      setRt(initialData.rt || '');
      setRw(initialData.rw || '');
      setStatusPenduduk(initialData.statusPenduduk || 'Tetap');
      setLat(initialData.koordinat?.lat ?? '');
      setLng(initialData.koordinat?.lng ?? '');
      setStatusKesejahteraan(initialData.statusKesejahteraan || 'Desil 1 (Sangat Miskin)');
      setPenerimaBansos(initialData.penerimaBansos ?? false);
      setDaftarBansos(initialData.daftarBansos?.length ? initialData.daftarBansos : ['Tidak Menerima']);
      setTotalNominal(initialData.totalNominalBantuanBulanan || '');
      setFotoRumah(initialData.fotoRumah || '');
      setTipeBangunan(initialData.kondisiRumah?.tipeBangunan || 'Permanen');
      setLuasBangunanM2(initialData.kondisiRumah?.luasBangunanM2 || '');
      setSumberAirMinum(initialData.kondisiRumah?.sumberAirMinum || 'Sumur Bor');
      setDayaListrik(initialData.kondisiRumah?.dayaListrik || '450 VA (Subsidi)');
      setStatusKepemilikan((initialData.kondisiRumah?.statusKepemilikan as any) || 'Milik Sendiri');
      setKondisiLantai((initialData.kondisiRumah?.kondisiLantai as any) || 'Semen');
      setKondisiDinding((initialData.kondisiRumah?.kondisiDinding as any) || 'Tembok/Batu Bata');
      setFasilitasJamban((initialData.kondisiRumah?.fasilitasJamban as any) || 'Milik Sendiri (Leher Angsa)');
      
      const rawList: Penduduk[] = initialData.anggotaKeluarga?.length ? initialData.anggotaKeluarga : [createEmptyMember('Kepala Keluarga', 0)];
      const syncedList = rawList.map((m, i) => {
        if (i === 0 || m.statusKeluarga === 'Kepala Keluarga') {
          return {
            ...m,
            nama: initNama || m.nama || '',
            nik: initNik || m.nik || '',
            noKk: initNoKk || m.noKk || '',
            statusKeluarga: 'Kepala Keluarga'
          };
        }
        return m;
      });
      setAnggotaList(syncedList);
    } else if (!pickedCoords) {
      resetToEmptyForm();
    }
  }, [initialData, initialDraft]);

  // Sync picked coords if changed from map
  useEffect(() => {
    if (pickedCoords) {
      setLat(pickedCoords.lat);
      setLng(pickedCoords.lng);
      // Auto focus to GIS or keep current
    }
  }, [pickedCoords]);

  // Sync Kepala Keluarga fields into member list
  const handleNoKkChange = (val: string) => {
    setNoKk(val);
    setAnggotaList(prev => prev.map((m, i) => (i === 0 || m.statusKeluarga === 'Kepala Keluarga' || !m.noKk) ? { ...m, noKk: val } : m));
  };

  const handleNamaKepalaChange = (val: string) => {
    setNamaKepalaKeluarga(val);
    setAnggotaList(prev => {
      if (prev.length === 0) return [{ ...createEmptyMember('Kepala Keluarga', 0), nama: val }];
      const kkIdx = prev.findIndex(m => m.statusKeluarga === 'Kepala Keluarga');
      const targetIdx = kkIdx !== -1 ? kkIdx : 0;
      const copy = [...prev];
      copy[targetIdx] = { ...copy[targetIdx], nama: val, statusKeluarga: 'Kepala Keluarga' };
      return copy;
    });
  };

  const handleNikKepalaChange = (val: string) => {
    setNikKepala(val);
    setAnggotaList(prev => {
      if (prev.length === 0) return [{ ...createEmptyMember('Kepala Keluarga', 0), nik: val }];
      const kkIdx = prev.findIndex(m => m.statusKeluarga === 'Kepala Keluarga');
      const targetIdx = kkIdx !== -1 ? kkIdx : 0;
      const copy = [...prev];
      copy[targetIdx] = { ...copy[targetIdx], nik: val, statusKeluarga: 'Kepala Keluarga' };
      return copy;
    });
  };

  // Toggle Bansos program
  const handleToggleBansos = (prog: JenisBantuanSosial) => {
    if (prog === 'Tidak Menerima') {
      setDaftarBansos(['Tidak Menerima']);
      setPenerimaBansos(false);
      setTotalNominal('');
      return;
    }

    const filtered = daftarBansos.filter(b => b !== 'Tidak Menerima');
    if (filtered.includes(prog)) {
      const next = filtered.filter(b => b !== prog);
      if (next.length === 0) {
        setDaftarBansos(['Tidak Menerima']);
        setPenerimaBansos(false);
        setTotalNominal('');
      } else {
        setDaftarBansos(next);
        setPenerimaBansos(true);
      }
    } else {
      const next = [...filtered, prog];
      setDaftarBansos(next);
      setPenerimaBansos(true);
    }
  };

  // Change status penduduk at family level
  const handleStatusPendudukChange = (val: StatusPenduduk) => {
    setStatusPenduduk(val);
    setAnggotaList(prev => prev.map(m => ({
      ...m,
      statusPenduduk: val
    })));
  };

  // Add new family member
  const handleAddMember = () => {
    const nextRole = anggotaList.length === 1 ? 'Istri' : 'Anak';
    const newMember = createEmptyMember(nextRole, anggotaList.length, statusPenduduk);
    newMember.noKk = noKk;
    setAnggotaList([...anggotaList, newMember]);
  };

  // Update member field
  const handleUpdateMember = (index: number, field: keyof Penduduk, value: any) => {
    const updated = [...anggotaList];
    updated[index] = { ...updated[index], [field]: value };
    
    const isKepala = index === 0 || updated[index].statusKeluarga === 'Kepala Keluarga';
    if (isKepala && field === 'nama') {
      setNamaKepalaKeluarga(value);
    }
    if (isKepala && field === 'nik') {
      setNikKepala(value);
    }
    if (isKepala && field === 'noKk') {
      setNoKk(value);
    }
    setAnggotaList(updated);
  };

  // Remove member
  const handleRemoveMember = (index: number) => {
    if (anggotaList.length <= 1) {
      alert('Keluarga harus memiliki minimal 1 anggota (Kepala Keluarga)');
      return;
    }
    setAnggotaList(anggotaList.filter((_, i) => i !== index));
  };

  // Quick village center coordinates
  const handleSetVillageCenterCoords = () => {
    setLat(-2.9661);
    setLng(103.1581);
  };

  // Build draft state to pass to map coordinate picker
  const getCurrentFormDraft = () => ({
    noKk,
    namaKepalaKeluarga,
    nikKepala,
    alamat,
    dusun,
    rt,
    rw,
    statusPenduduk,
    lat,
    lng,
    statusKesejahteraan,
    penerimaBansos,
    daftarBansos,
    totalNominal,
    fotoRumah,
    tipeBangunan,
    luasBangunanM2,
    sumberAirMinum,
    dayaListrik,
    statusKepemilikan,
    kondisiLantai,
    kondisiDinding,
    fasilitasJamban,
    anggotaList
  });

  // Trigger map coordinate picker with saved draft
  const handleTriggerPickOnMap = () => {
    onPickCoordinateOnMap(getCurrentFormDraft());
  };

  // Switch tab and smooth scroll if in 'semua'
  const handleSelectTab = (tab: 'profil' | 'gis' | 'fisik' | 'bansos' | 'anggota' | 'semua') => {
    setActiveTab(tab);
    if (tab === 'semua') return;
    if (activeTab === 'semua') {
      if (tab === 'profil') sectionPokokRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (tab === 'gis') sectionGisRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (tab === 'fisik') sectionFisikRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (tab === 'bansos') sectionBansosRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (tab === 'anggota') sectionAnggotaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Form completion stats
  const completionStats = useMemo(() => {
    let completed = 0;
    const total = 6;
    if (noKk.trim().length >= 10) completed++;
    if (namaKepalaKeluarga.trim().length > 0) completed++;
    if (nikKepala.trim().length >= 10) completed++;
    if (alamat.trim().length > 0) completed++;
    if (lat !== '' && lng !== '' && !isNaN(Number(lat)) && !isNaN(Number(lng))) completed++;
    if (anggotaList.length > 0 && anggotaList[0].nama.trim().length > 0) completed++;

    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100)
    };
  }, [noKk, namaKepalaKeluarga, nikKepala, alamat, lat, lng, anggotaList]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!noKk.trim()) {
      alert('Harap isi Nomor Kartu Keluarga (KK).');
      setActiveTab('profil');
      return;
    }
    if (!namaKepalaKeluarga.trim()) {
      alert('Harap isi Nama Kepala Keluarga.');
      setActiveTab('profil');
      return;
    }
    if (!nikKepala.trim()) {
      alert('Harap isi NIK Kepala Keluarga.');
      setActiveTab('profil');
      return;
    }
    if (lat === '' || lng === '' || isNaN(Number(lat)) || isNaN(Number(lng))) {
      alert('Harap tentukan titik koordinat GIS (Latitude & Longitude) dengan memilih titik di peta atau memasukkan koordinat.');
      setActiveTab('gis');
      return;
    }

    const finalMembers = [...anggotaList];
    if (finalMembers.length > 0) {
      finalMembers[0].nama = namaKepalaKeluarga.trim();
      finalMembers[0].nik = nikKepala.trim();
      finalMembers[0].noKk = noKk.trim();
      finalMembers[0].statusKeluarga = 'Kepala Keluarga';
    }
    finalMembers.forEach(m => {
      if (!m.statusPenduduk) {
        m.statusPenduduk = statusPenduduk;
      }
    });

    const payload: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'> = {
      noKk: noKk.trim(),
      namaKepalaKeluarga: namaKepalaKeluarga.trim(),
      nikKepala: nikKepala.trim(),
      alamat: alamat.trim(),
      dusun,
      rt: rt.trim() || '00',
      rw: rw.trim() || '00',
      koordinat: { lat: Number(lat), lng: Number(lng) },
      statusKesejahteraan,
      statusPenduduk,
      penerimaBansos: daftarBansos.length > 0 && !daftarBansos.includes('Tidak Menerima'),
      daftarBansos,
      totalNominalBantuanBulanan: Number(totalNominal) || 0,
      fotoRumah: fotoRumah.trim(),
      kondisiRumah: {
        tipeBangunan,
        luasBangunanM2: Number(luasBangunanM2) || 0,
        sumberAirMinum: sumberAirMinum as any,
        dayaListrik,
        statusKepemilikan: statusKepemilikan as any,
        kondisiLantai: kondisiLantai as any,
        kondisiDinding: kondisiDinding as any,
        fasilitasJamban: fasilitasJamban as any
      },
      anggotaKeluarga: finalMembers,
      lastModifiedBy: currentUser.name
    };

    onSave(payload);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pb-20 space-y-4"
    >
      {/* Main Grid: Left Collapsible Portal Sidebar + Right Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* ========================================================================= */}
        {/* PANEL KIRI: PORTAL NAVIGASI MELAYANG (MODERN FLOATING SIDEBAR DOCK)       */}
        {/* ========================================================================= */}
        <aside 
          ref={asideRef}
          className={`shrink-0 transition-all duration-300 w-full ${
            isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
          }`}
        >
          <div 
            style={{ 
              top: `${headerOffset}px`,
              ...(sidebarLeft !== null ? { left: `${sidebarLeft}px` } : {})
            }}
            className={`transition-all duration-300 z-40 bg-slate-900 border border-emerald-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/20 rounded-2xl p-3 space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin w-full lg:fixed before:content-[''] before:absolute before:-top-24 before:-left-6 before:-right-6 before:h-24 before:bg-slate-950 before:-z-10 before:pointer-events-none ${
              isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
            }`}
          >
            
            {/* Sidebar Header: Floating Indicator + Brand + Collapse Toggle */}
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/50 shrink-0 ring-1 ring-emerald-400/40">
                    <Compass className="w-4 h-4 text-emerald-100" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-bold text-white tracking-tight">Navigasi Form</h3>
                    <p className="text-[10px] text-slate-400">SIG Beliti Jaya</p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-collapse-sidebar"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 shadow-sm"
                  title="Ciutkan Menu Samping Melayang"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/50 shrink-0 ring-1 ring-emerald-400/40">
                  <Compass className="w-4 h-4 text-emerald-100" />
                </div>
                <button
                  type="button"
                  id="btn-expand-sidebar"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                  title="Perluas Menu Samping Melayang"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sidebar Navigation Items */}
            <nav className="space-y-1 text-xs">
              {[
                { id: 'profil', label: 'Identitas & Data Pokok', icon: FileText, badge: noKk ? '✓' : null },
                { id: 'gis', label: 'Wilayah & Titik GIS', icon: MapPin, badge: lat && lng ? 'GIS' : '!' },
                { id: 'fisik', label: 'Fisik Bangunan', icon: Building2, badge: tipeBangunan ? '8' : null },
                { id: 'bansos', label: 'Kesejahteraan & Bansos', icon: HeartHandshake, badge: penerimaBansos ? 'DTKS' : null },
                { id: 'anggota', label: `Anggota (${anggotaList.length} Jiwa)`, icon: Users, badge: anggotaList.length },
                { id: 'semua', label: 'Tampilkan Semua Seksi', icon: Layers, badge: null }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id as any)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-white font-bold border-l-4 border-emerald-400 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/25'
                        : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/70 font-medium'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'
                      }`} />
                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!isSidebarCollapsed && (
                      <div className="flex items-center gap-1 shrink-0">
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            isActive
                              ? 'bg-emerald-500/30 text-emerald-200'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-slate-600'}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Secondary Group: Status Berjalan */}
            {!isSidebarCollapsed && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Status Pengisian</span>
                  <span className="text-emerald-400 font-bold font-mono">{completionStats.percent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${completionStats.percent}%` }}
                  />
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* ========================================================================= */}
        {/* AREA KERJA KANAN: IKHTISAR PROFIL KELUARGA & FORMULIR LENGKAP             */}
        {/* ========================================================================= */}
        <main className="flex-1 w-full min-w-0 space-y-4">
          
          {/* ========================================================================= */}
          {/* KOTAK JUDUL & TAB BAR (MODERN FLOATING TITLE CARD DUDUK MELAYANG DI ATAS) */}
          {/* ========================================================================= */}
          <div 
            style={{ top: `${headerOffset}px` }}
            className="sticky z-30 bg-slate-900 border border-emerald-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/20 rounded-2xl p-4 sm:p-5 transition-all before:content-[''] before:absolute before:-top-24 before:-left-6 before:-right-6 before:h-24 before:bg-slate-950 before:-z-10 before:pointer-events-none"
          >
            {/* Header Judul Utama (Modern Floating Title Header) */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/50 shrink-0 ring-1 ring-emerald-400/40">
                  <FileText className="w-5 h-5 text-emerald-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {isEditing ? 'Ikhtisar Profil Data Keluarga & KK' : 'Pendaftaran Data Penduduk & Kartu Keluarga'}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                      Formulir Resmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Desa Beliti Jaya, Kec. Muara Kelingi, Kab. Musi Rawas • Operator: <span className="text-emerald-400 font-medium">{currentUser.name}</span>
                  </p>
                </div>
              </div>

              {/* KOTAK IKHTISAR DATA POKOK: ICON DENGAN EFEK HOVER OTOMATIS */}
              <div 
                className="relative shrink-0"
                onMouseEnter={handleMouseEnterOverview}
                onMouseLeave={handleMouseLeaveOverview}
              >
                <button
                  type="button"
                  id="btn-hover-overview-icon"
                  onClick={() => setIsOverviewHovered(prev => !prev)}
                  className={`group relative p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-md ${
                    isOverviewHovered
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/40'
                      : 'bg-slate-800/90 hover:bg-emerald-950/70 text-slate-300 hover:text-emerald-300 border-slate-700/80 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-slate-700/60 hover:ring-emerald-500/30'
                  }`}
                  title="Ikhtisar Data Pokok (Nama & Alamat) • Arahkan kursor ke sini untuk membuka"
                  aria-label="Ikhtisar Data Pokok (Nama & Alamat)"
                >
                  <div className="relative flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                </button>

                {/* Popover Card yang Muncul Otomatis Saat Hover */}
                <AnimatePresence>
                  {isOverviewHovered && (
                    <motion.div
                      key="floating-hover-overview-card"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full mt-2.5 w-[330px] sm:w-[500px] md:w-[620px] max-w-[92vw] z-50 p-4 sm:p-5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.92),0_0_35px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/25 pointer-events-auto text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                    >
                      {/* Header Popover */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/90">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs tracking-tight">
                              Ikhtisar Data Pokok (Nama & Alamat)
                            </h4>
                            <p className="text-[10px] text-slate-400">Ringkasan cepat data keluarga & domisili</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          Otomatis (Hover)
                        </span>
                      </div>

                      {/* Isi Grid Data */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 p-3.5 rounded-xl bg-slate-950/75 border border-slate-800/80">
                        {/* Kolom Kiri */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <span className="col-span-5 text-slate-400 font-medium">Kepala Keluarga</span>
                            <span className="col-span-1 text-slate-600">:</span>
                            <span className="col-span-6 font-bold text-white truncate">
                              {namaKepalaKeluarga || <span className="text-slate-500 font-normal italic">Belum Diisi</span>}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <span className="col-span-5 text-slate-400 font-medium">Nomor KK</span>
                            <span className="col-span-1 text-slate-600">:</span>
                            <span className="col-span-6 font-mono text-emerald-300 font-semibold tracking-wider">
                              {noKk || <span className="text-slate-500 font-normal font-sans italic">Belum Diisi</span>}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <span className="col-span-5 text-slate-400 font-medium">NIK Kepala</span>
                            <span className="col-span-1 text-slate-600">:</span>
                            <span className="col-span-6 font-mono text-slate-200 tracking-wider">
                              {nikKepala || <span className="text-slate-500 font-normal font-sans italic">Belum Diisi</span>}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <span className="col-span-5 text-slate-400 font-medium">Status Warga</span>
                            <span className="col-span-1 text-slate-600">:</span>
                            <span className="col-span-6">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                statusPenduduk === 'Tetap'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}>
                                {statusPenduduk === 'Tetap' ? 'Warga Tetap' : 'Warga Sementara'}
                              </span>
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <span className="col-span-5 text-slate-400 font-medium">Status DTKS</span>
                            <span className="col-span-1 text-slate-600">:</span>
                            <span className="col-span-6 text-slate-300 font-medium">
                              {statusKesejahteraan}
                            </span>
                          </div>
                        </div>

                        {/* Kolom Kanan */}
                        <div className="space-y-2.5 md:border-l md:border-slate-800/80 md:pl-4">
                          <div>
                            <span className="block font-bold text-white text-[11px] uppercase tracking-wider mb-0.5">
                              Alamat & Domisili
                            </span>
                            <p className="text-slate-300 leading-relaxed text-[11px]">
                              {alamat ? `${alamat}, ` : ''}
                              RT {rt || '00'} RW {rw || '00'}, {dusun}, 
                              Desa Beliti Jaya, Kec. Muara Kelingi
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="block font-bold text-white text-[11px] uppercase tracking-wider mb-0.5 flex items-center justify-between">
                              <span>Koordinat Titik GIS</span>
                              <button
                                type="button"
                                onClick={handleTriggerPickOnMap}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-normal cursor-pointer"
                              >
                                <Crosshair className="w-3 h-3" />
                                <span>Ubah di Peta</span>
                              </button>
                            </span>
                            <p className="font-mono text-slate-400 text-[11px]">
                              {lat && lng ? (
                                <span className="text-emerald-400">
                                  Lat: {Number(lat).toFixed(6)}, Lng: {Number(lng).toFixed(6)}
                                </span>
                              ) : (
                                <span className="text-amber-400">Titik belum dipilih pada peta desa</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Popover */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Arahkan kursor menjauh untuk menutup otomatis</span>
                        <span className="text-emerald-400/80 font-mono">Total Anggota: {anggotaList.length} Jiwa</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Horizontal Underline Tabs (Profil, GIS, Fisik, Bansos, Anggota, Semua) */}
            <div className="flex items-center gap-5 sm:gap-7 pt-2.5 overflow-x-auto scrollbar-none text-xs">
              {[
                { id: 'profil', label: 'Profil & Identitas KK' },
                { id: 'gis', label: 'Lokasi & Titik GIS' },
                { id: 'fisik', label: 'Fisik Bangunan & Rumah' },
                { id: 'bansos', label: 'Bansos & DTKS' },
                { id: 'anggota', label: `Daftar Anggota (${anggotaList.length})` },
                { id: 'semua', label: 'Semua Seksi' }
              ].map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTab(t.id as any)}
                    className={`pb-1 font-medium whitespace-nowrap transition-all cursor-pointer relative ${
                      isActive
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{t.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FORMULIR INPUT BODY (CARD TERSENDIRI SEHINGGA MENGGULIR BEBAS)            */}
          {/* ========================================================================= */}
          <div className="relative z-10 isolate bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* =================================================================== */}
              {/* SEKSI 1: IDENTITAS & DATA POKOK                                    */}
              {/* =================================================================== */}
              {(activeTab === 'profil' || activeTab === 'semua') && (
                <div ref={sectionPokokRef} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Identitas Resmi Kartu Keluarga & Kepala Keluarga</span>
                    </h2>
                    <span className="text-[11px] text-slate-500 font-mono">Wajib Diisi</span>
                  </div>

                  {/* Input Grid Pokok */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold text-xs mb-1">
                        Nomor Kartu Keluarga (KK) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={noKk}
                        onChange={e => handleNoKkChange(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-xs tracking-wider"
                        placeholder="16 Digit No. KK"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {noKk.length}/16 digit {noKk.length === 16 ? '✓ Sesuai' : ''}
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold text-xs mb-1">
                        Nama Kepala Keluarga <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaKepalaKeluarga}
                        onChange={e => handleNamaKepalaChange(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-xs"
                        placeholder="Nama Lengkap Kepala Keluarga"
                      />
                      <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Tersinkron otomatis ke Tab Daftar Anggota (Kepala Keluarga)</span>
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold text-xs mb-1">
                        NIK Kepala Keluarga <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nikKepala}
                        onChange={e => handleNikKepalaChange(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-xs tracking-wider"
                        placeholder="16 Digit NIK"
                      />
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Tersinkron otomatis ke Tab Daftar Anggota</span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {nikKepala.length}/16 digit {nikKepala.length === 16 ? '✓ Sesuai' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Baris Status Kependudukan Keluarga & Pas Foto Resmi Kepala Keluarga (Berdampingan) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Kependudukan Dropdown */}
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2.5">
                      <div>
                        <label htmlFor="select-status-penduduk" className="block text-slate-200 font-semibold text-xs mb-1">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Status Kependudukan Keluarga <span className="text-rose-400">*</span></span>
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Tentukan apakah keluarga berstatus Warga Tetap Desa atau Pendatang Sementara.
                        </p>
                      </div>
                      <div>
                        <ModernSelect<StatusPenduduk>
                          value={statusPenduduk}
                          onChange={(val) => handleStatusPendudukChange(val)}
                          options={[
                            { value: 'Tetap', label: 'Tetap (Warga Asli Desa)', badge: '✓ Warga Asli' },
                            { value: 'Sementara', label: 'Sementara (Pendatang / Domisili)', badge: '⏳ Pendatang' }
                          ]}
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Pas Foto Kepala Keluarga (Di sebelah kanan dropdown) */}
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {fotoKepala ? (
                              <div className="relative group">
                                <img
                                  src={fotoKepala}
                                  alt="Foto Kepala Keluarga"
                                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/70 shadow"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateKepalaFoto('')}
                                  className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-500 cursor-pointer"
                                  title="Hapus Foto"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <span className="text-[7px] mt-0.5">Pas Foto</span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">Pas Foto Resmi Kepala Keluarga</span>
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              Unggah dari galeri atau tautkan link URL
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{fotoKepala ? 'Ganti' : 'Unggah'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                    handleUpdateKepalaFoto(dataUrl);
                                  });
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setShowKepalaUrlInput(!showKepalaUrlInput)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Tautkan Gambar via URL"
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>URL</span>
                          </button>
                        </div>
                      </div>

                      {showKepalaUrlInput && (
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex gap-2 mt-1">
                          <input
                            type="text"
                            value={fotoKepala}
                            onChange={(e) => handleUpdateKepalaFoto(e.target.value)}
                            placeholder="https://... (Tautan link foto langsung)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKepalaUrlInput(false)}
                            className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs"
                          >
                            Tutup
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* SEKSI 2: WILAYAH & TITIK GIS                                       */}
              {/* =================================================================== */}
              {(activeTab === 'gis' || activeTab === 'semua') && (
                <div ref={sectionGisRef} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>Alamat Domisili Administrasi & Titik Spasial GIS</span>
                    </h2>
                    <span className="text-[11px] text-slate-500 font-mono">Wajib Dilengkapi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    <div className="sm:col-span-6">
                      <label className="block text-slate-300 font-semibold text-xs mb-1">
                        Alamat / Nama Jalan / Lorong <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={alamat}
                        onChange={e => setAlamat(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
                        placeholder="Contoh: Jl. Utama Beliti Jaya"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-slate-300 font-semibold text-xs mb-1">Wilayah Dusun</label>
                      <ModernSelect<DusunWilayah>
                        value={dusun}
                        onChange={(val) => setDusun(val)}
                        options={[
                          { value: 'Dusun I', label: 'Dusun I', badge: 'RT 01-02' },
                          { value: 'Dusun II', label: 'Dusun II', badge: 'RT 03-04' },
                          { value: 'Dusun III', label: 'Dusun III', badge: 'RT 05-06' },
                          { value: 'Dusun IV', label: 'Dusun IV', badge: 'RT 07-08' }
                        ]}
                        size="md"
                      />
                    </div>

                    <div className="sm:col-span-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-semibold text-xs mb-1">RT</label>
                        <input
                          type="text"
                          value={rt}
                          onChange={e => setRt(e.target.value)}
                          className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
                          placeholder="01"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold text-xs mb-1">RW</label>
                        <input
                          type="text"
                          value={rw}
                          onChange={e => setRw(e.target.value)}
                          className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
                          placeholder="01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Koordinat Box */}
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        <span>Koordinat Spasial GIS (Latitude & Longitude) <span className="text-rose-400">*</span></span>
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSetVillageCenterCoords}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pusat Desa</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTriggerPickOnMap}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Pilih Titik di Peta Interaktif</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium text-xs mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={lat}
                          placeholder="-2.966100"
                          onChange={e => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium text-xs mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={lng}
                          placeholder="103.158100"
                          onChange={e => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* SEKSI 3: FISIK BANGUNAN & FOTO RUMAH                              */}
              {/* =================================================================== */}
              {(activeTab === 'fisik' || activeTab === 'semua') && (
                <div ref={sectionFisikRef} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Foto Hunian & 8 Parameter Kelayakan Fisik Bangunan (BPS)</span>
                    </h2>
                    <span className="text-[11px] text-slate-500 font-mono">Standar BPS</span>
                  </div>

                  {/* Foto Rumah Uploader & Presets */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Foto Tampak Depan Bangunan / Rumah Warga</span>
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{fotoRumah ? 'Ganti Foto' : 'Unggah File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                  setFotoRumah(dataUrl);
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowRumahUrlInput(!showRumahUrlInput)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>URL</span>
                        </button>

                        {fotoRumah && (
                          <button
                            type="button"
                            onClick={() => setFotoRumah('')}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {showRumahUrlInput && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <input
                          type="text"
                          value={fotoRumah}
                          onChange={e => setFotoRumah(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 text-xs font-mono"
                          placeholder="https://... (URL foto rumah)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRumahUrlInput(false)}
                          className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs"
                        >
                          Tutup
                        </button>
                      </div>
                    )}

                    {fotoRumah ? (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-900/90 rounded-xl border border-slate-700/80">
                        <img 
                          src={fotoRumah} 
                          alt="Preview Rumah" 
                          className="w-24 h-16 object-cover rounded-lg border border-slate-700 shrink-0" 
                        />
                        <div>
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Foto Bangunan Terpasang</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Telah terkompresi otomatis untuk efisiensi penyimpanan spasial.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1.5">
                          Pilihan foto referensi hunian desa:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: 'Permanen Minimalis', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80' },
                            { label: 'Rumah Kayu Desa', url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&auto=format&fit=crop&q=80' },
                            { label: 'Hunian Modern', url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&auto=format&fit=crop&q=80' },
                            { label: 'Panggung Tradisional', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFotoRumah(preset.url)}
                              className={`rounded-xl overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                                fotoRumah === preset.url 
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-slate-800' 
                                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                              }`}
                            >
                              <img src={preset.url} alt={preset.label} className="w-full h-14 object-cover rounded-lg" />
                              <span className="text-[10px] text-slate-300 font-medium mt-1 block truncate">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grid 8 Parameter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Tipe Bangunan</label>
                      <ModernSelect<string>
                        value={tipeBangunan}
                        onChange={(val) => setTipeBangunan(val as any)}
                        options={[
                          { value: 'Permanen', label: 'Permanen', badge: 'Kokoh' },
                          { value: 'Semi Permanen', label: 'Semi Permanen', badge: 'Sedang' },
                          { value: 'Panggung Kayu', label: 'Panggung Kayu', badge: 'Kayu' },
                          { value: 'Bambu/Papan', label: 'Bambu/Papan', badge: 'Sederhana' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Luas Bangunan (m²)</label>
                      <input
                        type="number"
                        value={luasBangunanM2}
                        onChange={e => setLuasBangunanM2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        placeholder="36"
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Status Kepemilikan</label>
                      <ModernSelect<string>
                        value={statusKepemilikan}
                        onChange={(val) => setStatusKepemilikan(val as any)}
                        options={[
                          { value: 'Milik Sendiri', label: 'Milik Sendiri', badge: 'Pribadi' },
                          { value: 'Sewa/Kontrak', label: 'Sewa/Kontrak', badge: 'Sewa' },
                          { value: 'Menumpang', label: 'Menumpang', badge: 'Menumpang' },
                          { value: 'Rumah Dinas', label: 'Rumah Dinas', badge: 'Dinas' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Sumber Air Minum</label>
                      <ModernSelect<string>
                        value={sumberAirMinum}
                        onChange={(val) => setSumberAirMinum(val as any)}
                        options={[
                          { value: 'Sumur Bor', label: 'Sumur Bor', badge: 'Layak' },
                          { value: 'Sumur Gali', label: 'Sumur Gali', badge: 'Tradisional' },
                          { value: 'Sungai Beliti', label: 'Sungai Beliti', badge: 'Alami' },
                          { value: 'PDAM/Depot', label: 'PDAM/Depot', badge: 'Higienis' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Daya Listrik</label>
                      <ModernSelect<string>
                        value={dayaListrik}
                        onChange={(val) => setDayaListrik(val as any)}
                        options={[
                          { value: '450 VA (Subsidi)', label: '450 VA (Subsidi)', badge: 'Subsidi' },
                          { value: '900 VA (Subsidi)', label: '900 VA (Subsidi)', badge: 'Subsidi' },
                          { value: '900 VA (Non Subsidi)', label: '900 VA (Non Subsidi)', badge: 'PLN' },
                          { value: '1300 VA+', label: '1300 VA+', badge: 'PLN' },
                          { value: 'Tanpa Listrik', label: 'Tanpa Listrik', badge: 'Non-PLN' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Kondisi Lantai</label>
                      <ModernSelect<string>
                        value={kondisiLantai}
                        onChange={(val) => setKondisiLantai(val as any)}
                        options={[
                          { value: 'Keramik', label: 'Keramik', badge: 'Baik' },
                          { value: 'Semen', label: 'Semen', badge: 'Cukup' },
                          { value: 'Papan/Kayu', label: 'Papan/Kayu', badge: 'Kayu' },
                          { value: 'Tanah', label: 'Tanah', badge: 'RTLH' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Kondisi Dinding</label>
                      <ModernSelect<string>
                        value={kondisiDinding}
                        onChange={(val) => setKondisiDinding(val as any)}
                        options={[
                          { value: 'Tembok/Batu Bata', label: 'Tembok/Batu Bata', badge: 'Kokoh' },
                          { value: 'Papan/Kayu', label: 'Papan/Kayu', badge: 'Cukup' },
                          { value: 'Bambu', label: 'Bambu', badge: 'RTLH' },
                          { value: 'Seng', label: 'Seng', badge: 'RTLH' }
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium text-xs mb-1">Fasilitas Jamban</label>
                      <ModernSelect<string>
                        value={fasilitasJamban}
                        onChange={(val) => setFasilitasJamban(val as any)}
                        options={[
                          { value: 'Milik Sendiri (Leher Angsa)', label: 'Milik Sendiri (Leher Angsa)', badge: 'Saniter' },
                          { value: 'Jamban Cemplung', label: 'Jamban Cemplung', badge: 'Sederhana' },
                          { value: 'MCK Umum', label: 'MCK Umum', badge: 'Bersama' },
                          { value: 'Tidak Ada/Sungai', label: 'Tidak Ada/Sungai', badge: 'BABS' }
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* SEKSI 4: KESEJAHTERAAN & BANSOS DTKS                              */}
              {/* =================================================================== */}
              {(activeTab === 'bansos' || activeTab === 'semua') && (
                <div ref={sectionBansosRef} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-emerald-400" />
                      <span>Klasifikasi Kesejahteraan & Jaring Pengaman Sosial (DTKS)</span>
                    </h2>
                    <span className="text-[11px] text-slate-500 font-mono">DTKS Kemensos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold text-xs mb-1">
                        Status Kesejahteraan (Desil DTKS Kemensos)
                      </label>
                      <ModernSelect<StatusKesejahteraan>
                        value={statusKesejahteraan}
                        onChange={(val) => setStatusKesejahteraan(val)}
                        options={[
                          { value: 'Desil 1 (Sangat Miskin)', label: 'Desil 1 (Sangat Miskin)', badge: 'Prioritas 1' },
                          { value: 'Desil 2 (Miskin)', label: 'Desil 2 (Miskin)', badge: 'Prioritas 2' },
                          { value: 'Desil 3 (Hampir Miskin)', label: 'Desil 3 (Hampir Miskin)', badge: 'Prioritas 3' },
                          { value: 'Desil 4 (Rentan Miskin)', label: 'Desil 4 (Rentan Miskin)', badge: 'Rentan' },
                          { value: 'Non-DTKS (Mampu)', label: 'Non-DTKS (Mampu)', badge: 'Mandiri' }
                        ]}
                        size="md"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold text-xs mb-1">
                        Total Nominal Bantuan Diterima / Bulan (Rp)
                      </label>
                      <input
                        type="number"
                        value={totalNominal}
                        onChange={e => setTotalNominal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs"
                        placeholder="0"
                      />
                      {totalNominal !== '' && Number(totalNominal) > 0 && (
                        <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                          Rp {Number(totalNominal).toLocaleString('id-ID')} / bulan
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-2">
                      Program Bantuan Sosial Aktif yang Diterima:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {[
                        'Tidak Menerima',
                        'PKH',
                        'BPNT/Sembako',
                        'BLT-Dana Desa',
                        'Bansos Beras (PBP)',
                        'PIP (Pendidikan)',
                        'KIS/PBI-JK'
                      ].map((prog, idx) => {
                        const isChecked = daftarBansos.includes(prog as any);
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-950/30 border-emerald-500/80 text-white font-medium shadow-sm'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBansos(prog as any)}
                              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 shrink-0"
                            />
                            <span className="text-xs">{prog}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* SEKSI 5: BIODATA ANGGOTA KELUARGA                                  */}
              {/* =================================================================== */}
              {(activeTab === 'anggota' || activeTab === 'semua') && (
                <div ref={sectionAnggotaRef} className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Biodata Anggota Keluarga ({anggotaList.length} Jiwa Terdaftar)</span>
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Catat data setiap jiwa dalam Kartu Keluarga beserta pas foto masing-masing
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border border-emerald-400/30"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Anggota</span>
                    </button>
                  </div>

                  {/* List Anggota */}
                  <div className="space-y-3.5">
                    {anggotaList.map((member, idx) => {
                      const isKepala = idx === 0 || member.statusKeluarga === 'Kepala Keluarga';
                      const currentNama = isKepala ? (namaKepalaKeluarga || member.nama) : member.nama;
                      const currentNik = isKepala ? (nikKepala || member.nik) : member.nik;

                      return (
                      <div 
                        key={idx} 
                        className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm"
                      >
                        {/* Header Kartu Anggota */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-emerald-400 font-mono text-xs font-bold border border-slate-700">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {isKepala ? 'Kepala Keluarga' : member.statusKeluarga}
                            </span>
                            {currentNama && (
                              <span className="text-slate-400 font-medium text-xs truncate max-w-[150px] sm:max-w-none">
                                - <strong className="text-white">{currentNama}</strong>
                              </span>
                            )}
                            {isKepala && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20 flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Sinkron Profil KK</span>
                              </span>
                            )}
                          </div>

                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(idx)}
                              className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>

                        {/* Pas Foto Per Jiwa */}
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              {member.foto ? (
                                <div className="relative group">
                                  <img
                                    src={member.foto}
                                    alt={member.nama || 'Anggota'}
                                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/60 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMember(idx, 'foto', '')}
                                    className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-500 cursor-pointer"
                                  >
                                    <X className="w-2 h-2" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                                  <UserIcon className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                            </div>

                            <div>
                              <span className="text-slate-200 font-semibold text-xs flex items-center gap-1">
                                <Camera className="w-3 h-3 text-emerald-400" />
                                <span>Pas Foto {isKepala ? 'Kepala Keluarga' : member.statusKeluarga}</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {member.foto ? 'Foto terpasang' : 'Opsional (unggah file / URL)'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>{member.foto ? 'Ganti' : 'Unggah'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                      handleUpdateMember(idx, 'foto', dataUrl);
                                    });
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setOpenMemberUrlIdx(openMemberUrlIdx === idx ? null : idx)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <LinkIcon className="w-3 h-3 text-slate-400" />
                              <span>URL</span>
                            </button>
                          </div>
                        </div>

                        {openMemberUrlIdx === idx && (
                          <div className="p-2 bg-slate-900 rounded-xl border border-slate-700 flex gap-2">
                            <input
                              type="text"
                              value={member.foto}
                              onChange={(e) => handleUpdateMember(idx, 'foto', e.target.value)}
                              placeholder="https://... (URL foto)"
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setOpenMemberUrlIdx(null)}
                              className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs"
                            >
                              Tutup
                            </button>
                          </div>
                        )}

                        {/* Input Fields Anggota */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">
                              {isKepala ? 'Nama Kepala Keluarga' : 'Nama Lengkap'} <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={currentNama}
                              onChange={e => {
                                if (isKepala) {
                                  handleNamaKepalaChange(e.target.value);
                                } else {
                                  handleUpdateMember(idx, 'nama', e.target.value);
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                              placeholder={isKepala ? 'Nama Lengkap Kepala Keluarga' : 'Nama Lengkap'}
                            />
                            {isKepala && (
                              <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Tersinkron dengan Profil KK</span>
                              </span>
                            )}
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">
                              {isKepala ? 'NIK Kepala Keluarga' : 'NIK (16 Digit)'} <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={currentNik}
                              onChange={e => {
                                if (isKepala) {
                                  handleNikKepalaChange(e.target.value);
                                } else {
                                  handleUpdateMember(idx, 'nik', e.target.value);
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs tracking-wider focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                              placeholder="16 Digit NIK"
                            />
                            {isKepala ? (
                              <div className="flex items-center justify-between text-[10px] mt-1">
                                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Tersinkron dengan Profil KK</span>
                                </span>
                                <span className="text-slate-400 font-mono">
                                  {nikKepala.length}/16 digit {nikKepala.length === 16 ? '✓' : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {member.nik.length}/16 digit {member.nik.length === 16 ? '✓ Sesuai' : ''}
                              </span>
                            )}
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">
                              Hubungan Keluarga
                            </label>
                            {idx === 0 ? (
                              <input
                                type="text"
                                disabled
                                value="Kepala Keluarga"
                                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-400 text-xs"
                              />
                            ) : (
                              <ModernSelect<string>
                                value={member.statusKeluarga}
                                onChange={(val) => handleUpdateMember(idx, 'statusKeluarga', val)}
                                options={[
                                  { value: 'Istri', label: 'Istri', badge: 'Pasangan' },
                                  { value: 'Anak', label: 'Anak', badge: 'Anak' },
                                  { value: 'Orang Tua', label: 'Orang Tua', badge: 'Ortu' },
                                  { value: 'Famili Lain', label: 'Famili Lain', badge: 'Kerabat' }
                                ]}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>

                        {/* Baris 2: Detail */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Jenis Kelamin</label>
                            <ModernSelect<string>
                              value={member.jenisKelamin}
                              onChange={(val) => handleUpdateMember(idx, 'jenisKelamin', val)}
                              options={[
                                { value: 'Laki-Laki', label: 'Laki-Laki', badge: 'L' },
                                { value: 'Perempuan', label: 'Perempuan', badge: 'P' }
                              ]}
                              size="sm"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Tanggal Lahir</label>
                            <input
                              type="date"
                              value={member.tanggalLahir}
                              onChange={e => handleUpdateMember(idx, 'tanggalLahir', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Pendidikan</label>
                            <ModernSelect<string>
                              value={member.pendidikan}
                              onChange={(val) => handleUpdateMember(idx, 'pendidikan', val)}
                              options={[
                                { value: 'Tidak/Belum Sekolah', label: 'Tidak/Belum Sekolah' },
                                { value: 'SD', label: 'SD / Sederajat', badge: 'Dasar' },
                                { value: 'SMP', label: 'SMP / Sederajat', badge: 'Menengah' },
                                { value: 'SMA', label: 'SMA / SMK', badge: 'Atas' },
                                { value: 'Diploma (D1-D3)', label: 'Diploma (D1-D3)', badge: 'Vokasi' },
                                { value: 'S1/Kuliah', label: 'S1 / Sarjana', badge: 'PT' },
                                { value: 'S2/S3', label: 'S2 / S3 Pascasarjana', badge: 'PT' }
                              ]}
                              size="sm"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Status Kawin</label>
                            <ModernSelect<string>
                              value={member.statusPerkawinan}
                              onChange={(val) => handleUpdateMember(idx, 'statusPerkawinan', val)}
                              options={[
                                { value: 'Belum Kawin', label: 'Belum Kawin', badge: 'Lajang' },
                                { value: 'Kawin', label: 'Kawin', badge: 'Menikah' },
                                { value: 'Cerai Hidup', label: 'Cerai Hidup', badge: 'Duda/Janda' },
                                { value: 'Cerai Mati', label: 'Cerai Mati', badge: 'Duda/Janda' }
                              ]}
                              size="sm"
                            />
                          </div>
                        </div>

                        {/* Baris 3: Pekerjaan & Kependudukan */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Tempat Lahir</label>
                            <input
                              type="text"
                              value={member.tempatLahir}
                              onChange={e => handleUpdateMember(idx, 'tempatLahir', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                              placeholder="Beliti Jaya"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Pekerjaan</label>
                            <input
                              type="text"
                              value={member.pekerjaan}
                              onChange={e => handleUpdateMember(idx, 'pekerjaan', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                              placeholder="Petani / Karyawan"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Penghasilan/Bln (Rp)</label>
                            <input
                              type="number"
                              value={member.penghasilanBulanan === 0 ? '' : member.penghasilanBulanan}
                              onChange={e => handleUpdateMember(idx, 'penghasilanBulanan', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium text-xs mb-1">Status Kependudukan</label>
                            <ModernSelect<StatusPenduduk>
                              value={member.statusPenduduk || statusPenduduk || 'Tetap'}
                              onChange={(val) => handleUpdateMember(idx, 'statusPenduduk', val)}
                              options={[
                                { value: 'Tetap', label: 'Tetap', badge: 'Asli' },
                                { value: 'Sementara', label: 'Sementara', badge: 'Pendatang' }
                              ]}
                              size="sm"
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* Bottom Sticky Action Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  <span>Data siap diverifikasi oleh sistem administrasi Desa Beliti Jaya</span>
                </div>

                <div className="flex items-center gap-2.5 justify-end flex-wrap">
                  {/* Tombol Kembali ke Data Kependudukan */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Kembali ke Data Kependudukan"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kembali ke Data Kependudukan</span>
                  </button>

                  {/* Tombol Reset */}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={resetToEmptyForm}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-colors"
                      title="Kosongkan seluruh isian formulir"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset</span>
                    </button>
                  )}

                  {/* Tombol Batal */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
                  >
                    Batal
                  </button>

                  {/* Tombol Simpan Data KK */}
                  <button
                    type="submit"
                    id="btn-save-family-final"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer border border-emerald-400/40 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Simpan Perubahan Data KK' : 'Simpan Data Kartu Keluarga'}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>

        </main>

      </div>
    </motion.div>
  );
};

export default FamilyFormView;
