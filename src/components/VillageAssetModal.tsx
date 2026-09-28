import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AsetDesa, 
  KondisiAset, 
  DusunWilayah, 
  User, 
  DesaProfile 
} from '../types';
import { 
  resolveImageUrl, 
  isGoogleDriveUrl, 
  extractGoogleDriveFileId 
} from '../utils/imageUtils';
import { formatRupiah, generateInventoryRegisterPDF } from '../utils/pdfExport';
import { 
  Building2, 
  HardHat, 
  Landmark, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Printer, 
  X, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  Eye, 
  Layers, 
  FileSpreadsheet,
  ArrowLeft,
  Info,
  Image as ImageIcon,
  Camera,
  Maximize2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Check,
  Lock,
  Download,
  UserCheck,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface VillageAssetModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBackToMap?: () => void;
  isFullPage?: boolean;
  asetList: AsetDesa[];
  onSaveAset: (aset: Omit<AsetDesa, 'id' | 'createdAt' | 'updatedAt'>, editingId?: string) => void;
  onDeleteAset: (id: string) => void;
  onFocusOnMap: (aset: AsetDesa) => void;
  currentUser: User | null;
  initialKategori?: 'all' | 'pembangunan' | 'non_pembangunan';
  targetAsetId?: string | null;
  onOpenAssetDetail?: (aset: AsetDesa) => void;
  desaProfile?: DesaProfile;
}

export const VillageAssetModal: React.FC<VillageAssetModalProps> = ({
  onBackToMap,
  asetList,
  onSaveAset,
  onDeleteAset,
  onFocusOnMap,
  currentUser,
  initialKategori = 'all',
  targetAsetId,
  onOpenAssetDetail,
  desaProfile
}) => {
  // Navigation & Filtering States
  const [activeTab, setActiveTab] = useState<'all' | 'pembangunan' | 'non_pembangunan'>(initialKategori);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDusun, setSelectedDusun] = useState<string>('all');
  const [selectedKondisi, setSelectedKondisi] = useState<string>('all');
  const [selectedSumberDana, setSelectedSumberDana] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Lightbox modal for enlarged image preview
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Form modal state for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAset, setEditingAset] = useState<AsetDesa | null>(null);
  
  // Form input fields
  const [formNama, setFormNama] = useState('');
  const [formKode, setFormKode] = useState('');
  const [formKategori, setFormKategori] = useState<'pembangunan' | 'non_pembangunan'>('pembangunan');
  const [formSubKategori, setFormSubKategori] = useState('');
  const [formTahun, setFormTahun] = useState<number>(new Date().getFullYear());
  const [formSumberDana, setFormSumberDana] = useState('Dana Desa (APBN)');
  const [formNilai, setFormNilai] = useState<number>(100000000);
  const [formKondisi, setFormKondisi] = useState<KondisiAset>('Baik');
  const [formDusun, setFormDusun] = useState<DusunWilayah>('Dusun I');
  const [formLat, setFormLat] = useState<number>(-2.9615);
  const [formLng, setFormLng] = useState<number>(103.1525);
  const [formLuas, setFormLuas] = useState('');
  const [formPenanggungJawab, setFormPenanggungJawab] = useState('Kaur Tata Usaha & Umum');
  const [formStatusPemanfaatan, setFormStatusPemanfaatan] = useState('Digunakan Aktif');
  const [formFoto, setFormFoto] = useState('');
  const [formFotoList, setFormFotoList] = useState<string[]>(['', '', '', '']);
  const [formKeterangan, setFormKeterangan] = useState('');
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Synchronize initial category and target asset if opened from map/analytics
  useEffect(() => {
    if (initialKategori) {
      setActiveTab(initialKategori);
    }
    if (targetAsetId) {
      const found = asetList.find(a => a.id === targetAsetId);
      if (found) {
        if (found.kategori) setActiveTab(found.kategori);
        setSearchQuery(found.namaAset);
      }
    }
  }, [initialKategori, targetAsetId, asetList]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalCount = asetList.length;
    const totalNilai = asetList.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    const pembangunan = asetList.filter(a => a.kategori === 'pembangunan');
    const pembangunanCount = pembangunan.length;
    const pembangunanNilai = pembangunan.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    const nonPembangunan = asetList.filter(a => a.kategori === 'non_pembangunan');
    const nonPembangunanCount = nonPembangunan.length;
    const nonPembangunanNilai = nonPembangunan.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    const kondisiBaik = asetList.filter(a => a.kondisi === 'Baik').length;
    const kondisiRusak = asetList.filter(a => a.kondisi !== 'Baik').length;
    const percentBaik = totalCount > 0 ? Math.round((kondisiBaik / totalCount) * 100) : 100;

    return {
      totalCount,
      totalNilai,
      pembangunanCount,
      pembangunanNilai,
      nonPembangunanCount,
      nonPembangunanNilai,
      kondisiBaik,
      kondisiRusak,
      percentBaik
    };
  }, [asetList]);

  // List of unique sources of funds
  const uniqueSumberDana = useMemo(() => {
    const set = new Set<string>();
    asetList.forEach(a => {
      if (a.sumberDana) set.add(a.sumberDana);
    });
    return Array.from(set);
  }, [asetList]);

  // Filtered Assets based on Active Tab, Search, Dusun, Kondisi, and Sumber Dana
  const filteredList = useMemo(() => {
    return asetList.filter(item => {
      // Category tab
      if (activeTab === 'pembangunan' && item.kategori !== 'pembangunan') return false;
      if (activeTab === 'non_pembangunan' && item.kategori !== 'non_pembangunan') return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.namaAset?.toLowerCase().includes(query);
        const matchKode = item.kodeRegister?.toLowerCase().includes(query);
        const matchSub = item.subKategori?.toLowerCase().includes(query);
        const matchPj = item.penanggungJawab?.toLowerCase().includes(query);
        const matchDusun = item.dusun?.toLowerCase().includes(query);
        const matchDana = item.sumberDana?.toLowerCase().includes(query);
        const matchKondisi = item.kondisi?.toLowerCase().includes(query);
        const matchTahun = item.tahunPengadaan ? String(item.tahunPengadaan).includes(query) : false;

        if (!matchName && !matchKode && !matchSub && !matchPj && !matchDusun && !matchDana && !matchKondisi && !matchTahun) {
          return false;
        }
      }

      // Dusun filter
      if (selectedDusun !== 'all' && item.dusun !== selectedDusun) return false;

      // Kondisi filter
      if (selectedKondisi !== 'all' && item.kondisi !== selectedKondisi) return false;

      // Sumber Dana filter
      if (selectedSumberDana !== 'all' && item.sumberDana !== selectedSumberDana) return false;

      return true;
    });
  }, [asetList, activeTab, searchQuery, selectedDusun, selectedKondisi, selectedSumberDana]);

  // Role permissions check
  const canAddAsset = currentUser?.role === 'admin' || currentUser?.role === 'operator_aset';

  const openAddForm = () => {
    if (!canAddAsset) {
      alert('Akses Dibatasi: Fitur Tambah Aset hanya dapat diakses oleh Administrator dan Operator Aset Desa.');
      return;
    }
    setEditingAset(null);
    setFormNama('');
    setFormKode(`KIB-${activeTab === 'non_pembangunan' ? 'A' : 'C'}/${String(asetList.length + 1).padStart(3, '0')}/BLT/${new Date().getFullYear()}`);
    setFormKategori(activeTab === 'non_pembangunan' ? 'non_pembangunan' : 'pembangunan');
    setFormSubKategori(activeTab === 'non_pembangunan' ? 'Tanah Kas Desa (KIB A)' : 'Gedung & Bangunan Publik');
    setFormTahun(new Date().getFullYear());
    setFormSumberDana('Dana Desa (APBN)');
    setFormNilai(125000000);
    setFormKondisi('Baik');
    setFormDusun('Dusun I');
    setFormLat(-2.9615);
    setFormLng(103.1525);
    setFormLuas('');
    setFormPenanggungJawab('Kaur Tata Usaha & Umum');
    setFormStatusPemanfaatan('Digunakan Aktif');
    
    const defaultPhotos = activeTab === 'non_pembangunan' ? [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80'
    ] : [
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80'
    ];
    setFormFoto(defaultPhotos[0]);
    setFormFotoList(defaultPhotos);
    setFormKeterangan('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: AsetDesa) => {
    setEditingAset(item);
    setFormNama(item.namaAset);
    setFormKode(item.kodeRegister);
    setFormKategori(item.kategori);
    setFormSubKategori(item.subKategori);
    setFormTahun(item.tahunPengadaan);
    setFormSumberDana(item.sumberDana);
    setFormNilai(item.nilaiPerolehan);
    setFormKondisi(item.kondisi);
    setFormDusun(item.dusun);
    setFormLat(item.koordinat.lat);
    setFormLng(item.koordinat.lng);
    setFormLuas(item.luasAtauVolume || '');
    setFormPenanggungJawab(item.penanggungJawab);
    setFormStatusPemanfaatan(item.statusPemanfaatan);
    setFormFoto(item.foto || '');
    
    const existingPhotos = item.fotoList && item.fotoList.length > 0
      ? [...item.fotoList]
      : (item.foto ? [item.foto] : []);
    while (existingPhotos.length < 4) {
      existingPhotos.push('');
    }
    setFormFotoList(existingPhotos);
    setFormKeterangan(item.keterangan || '');
    setIsFormOpen(true);
  };

  const handlePhotoUrlChange = (index: number, value: string) => {
    setFormFotoList(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddExtraPhotoSlot = () => {
    setFormFotoList(prev => [...prev, '']);
  };

  const handleRemovePhotoSlot = (index: number) => {
    if (formFotoList.length <= 4) {
      setFormFotoList(prev => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }
    setFormFotoList(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyPresetPhotos = (type: 'pembangunan' | 'non_pembangunan') => {
    if (type === 'pembangunan') {
      setFormFotoList([
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80'
      ]);
    } else {
      setFormFotoList([
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80'
      ]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    const cleanedPhotos = formFotoList.map(p => p.trim());
    const resolvedPhotos = cleanedPhotos.map(p => p ? resolveImageUrl(p) : '');
    while (resolvedPhotos.length < 4) {
      resolvedPhotos.push('');
    }
    const primaryFoto = resolvedPhotos.find(p => p.length > 0) || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';

    onSaveAset({
      namaAset: formNama.trim(),
      kodeRegister: formKode.trim(),
      kategori: formKategori,
      subKategori: formSubKategori.trim(),
      tahunPengadaan: Number(formTahun),
      sumberDana: formSumberDana,
      nilaiPerolehan: Number(formNilai),
      kondisi: formKondisi,
      dusun: formDusun,
      koordinat: { lat: Number(formLat), lng: Number(formLng) },
      luasAtauVolume: formLuas.trim(),
      penanggungJawab: formPenanggungJawab.trim(),
      statusPemanfaatan: formStatusPemanfaatan,
      foto: primaryFoto,
      fotoList: resolvedPhotos,
      keterangan: formKeterangan.trim()
    }, editingAset?.id);

    setIsFormOpen(false);
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await generateInventoryRegisterPDF(filteredList, desaProfile, activeTab, {
        search: searchQuery,
        dusun: selectedDusun,
        kondisi: selectedKondisi,
        sumberDana: selectedSumberDana
      });
    } catch (error) {
      console.error('Gagal mencetak / mengunduh laporan PDF inventaris:', error);
      alert('Terjadi kendala saat menyusun dokumen laporan PDF. Sistem akan membuka dialog cetak browser.');
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleOpenDetail = (aset: AsetDesa) => {
    if (onOpenAssetDetail) {
      onOpenAssetDetail(aset);
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDusun !== 'all' || selectedKondisi !== 'all' || selectedSumberDana !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedDusun('all');
    setSelectedKondisi('all');
    setSelectedSumberDana('all');
  };

  const villageName = desaProfile?.namaDesa || 'Beliti Jaya';
  const districtName = desaProfile?.kecamatan || 'Muara Kelingi';
  const regencyName = desaProfile?.kabupaten || 'Musi Rawas';

  return (
    <div id="village-inventory-fullpage" className="w-full space-y-6 pb-16 relative">
      {/* ── 1. OFFICIAL GOVERNMENT HEADER (HERO BANNER) ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061426] via-[#040D1A] to-[#02070E] border border-emerald-500/25 p-6 sm:p-8 shadow-2xl">
        {/* Ambient glow & decorative topographic wave line */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-96 h-96 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" className="w-full h-full text-emerald-400">
            <path d="M 0 100 Q 50 30 100 100 T 200 100" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M 0 130 Q 70 70 140 130 T 200 130" strokeWidth="1.2" />
            <path d="M 0 160 Q 60 110 120 160 T 200 160" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Sisi Kiri: Emblem & Identitas Resmi */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Logo / Badge Desa */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-800/30 border border-emerald-500/40 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/60 backdrop-blur-md">
              {desaProfile?.logoDesa ? (
                <img 
                  src={resolveImageUrl(desaProfile.logoDesa)} 
                  alt={villageName} 
                  className="w-full h-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Pemerintah Desa {villageName}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Kec. {districtName}, Kab. {regencyName}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Buku Inventaris Aset Desa
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Pencatatan resmi kekayaan milik desa (KIB A s.d. KIB F) terintegrasi secara geospasial dengan standar <strong className="text-emerald-300">Permendagri No. 1 Tahun 2016</strong>.
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons Hierarchy */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full sm:w-auto shrink-0">
            {/* 1. Kembali ke Peta */}
            {onBackToMap && (
              <button
                type="button"
                id="btn-inventory-back-to-map"
                onClick={onBackToMap}
                className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 hover:border-slate-500"
                title="Kembali ke Tampilan Peta Interaktif"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
                <span>Kembali ke Peta</span>
              </button>
            )}

            {/* 2. Unduh Laporan PDF (Otomatis dari tabel aset yang sedang difilter) */}
            <button
              type="button"
              id="btn-inventory-download-report"
              disabled={isExportingPDF}
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold border border-emerald-400/40 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/60 active:scale-95 disabled:opacity-50"
              title="Unduh Laporan Inventaris Resmi dalam format PDF dari data yang sedang difilter"
            >
              {isExportingPDF ? (
                <RefreshCw className="w-4 h-4 text-emerald-100 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-100" />
              )}
              <span>{isExportingPDF ? 'Menyiapkan PDF...' : 'Unduh Laporan'}</span>
            </button>

            {/* 3. Cetak Langsung / Print Preview */}
            <button
              type="button"
              id="btn-inventory-print-pdf"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 hover:border-slate-500"
              title="Cetak Halaman (Print Preview)"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* 4. Tambah Aset Baru (Primary Action) */}
            {canAddAsset ? (
              <button
                type="button"
                id="btn-inventory-add-asset"
                onClick={openAddForm}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/70 transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-emerald-400/40"
                title="Tambah Pencatatan Aset Baru"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tambah Aset</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-inventory-add-asset-disabled"
                onClick={() => {
                  alert('Akses Dibatasi: Fitur Tambah Aset hanya dapat diakses oleh Administrator dan Operator Aset Desa.');
                }}
                className="px-4 py-2.5 bg-slate-800/80 text-slate-400 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700/60 transition-all flex items-center gap-2 cursor-not-allowed opacity-75"
                title="Hanya Administrator & Operator Aset yang dapat menambah data aset baru"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>+ Tambah Aset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. EXECUTIVE METRIC CARDS (RINGKASAN STATISTIK RESMI) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Nilai Buku Aset */}
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('all')}
          className={`rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-4 transition-all group cursor-pointer border ${
            activeTab === 'all'
              ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/90 border-slate-800/90 hover:border-emerald-500/40'
          }`}
          title="Klik untuk melihat Seluruh Kategori Aset"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Coins className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Total Nilai Kekayaan Aset</div>
            <div className="text-lg sm:text-xl font-extrabold text-white font-mono truncate tracking-tight mt-0.5">
              {formatRupiah(stats.totalNilai)}
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
              {stats.totalCount} Unit Aset Tercatat Sah
            </div>
          </div>
        </motion.div>

        {/* Card 2: Aset Pembangunan (Fisik / Konstruksi) */}
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('pembangunan')}
          className={`rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-4 transition-all group cursor-pointer border ${
            activeTab === 'pembangunan'
              ? 'bg-slate-900 border-blue-500/60 ring-1 ring-blue-500/30'
              : 'bg-slate-900/90 border-slate-800/90 hover:border-blue-500/40'
          }`}
          title="Klik untuk memfilter Aset Pembangunan Fisik"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <HardHat className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Aset Pembangunan Fisik</div>
            <div className="text-lg sm:text-xl font-extrabold text-blue-200 font-mono truncate tracking-tight mt-0.5">
              {formatRupiah(stats.pembangunanNilai)}
            </div>
            <div className="text-[11px] text-blue-400/90 font-medium mt-0.5">
              {stats.pembangunanCount} Unit Sarana & Prasarana
            </div>
          </div>
        </motion.div>

        {/* Card 3: Aset Non-Pembangunan */}
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('non_pembangunan')}
          className={`rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-4 transition-all group cursor-pointer border ${
            activeTab === 'non_pembangunan'
              ? 'bg-slate-900 border-teal-500/60 ring-1 ring-teal-500/30'
              : 'bg-slate-900/90 border-slate-800/90 hover:border-teal-500/40'
          }`}
          title="Klik untuk memfilter Aset Non-Pembangunan"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Aset Non-Pembangunan</div>
            <div className="text-lg sm:text-xl font-extrabold text-teal-200 font-mono truncate tracking-tight mt-0.5">
              {formatRupiah(stats.nonPembangunanNilai)}
            </div>
            <div className="text-[11px] text-teal-400/90 font-medium mt-0.5">
              {stats.nonPembangunanCount} Unit (Tanah, Mesin & Alat)
            </div>
          </div>
        </motion.div>

        {/* Card 4: Kelaikan & Kondisi */}
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedKondisi(prev => prev === 'Baik' ? 'all' : 'Baik')}
          className={`rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-4 transition-all group cursor-pointer border ${
            selectedKondisi === 'Baik'
              ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/90 border-slate-800/90 hover:border-emerald-500/40'
          }`}
          title="Klik untuk memfilter aset kondisi Baik"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Tingkat Kelaikan Fisik</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-300 truncate tracking-tight mt-0.5 flex items-baseline gap-2">
              <span>{stats.percentBaik}%</span>
              <span className="text-xs font-normal text-slate-400 font-sans">Kondisi Baik</span>
            </div>
            <div className="text-[11px] text-amber-400 font-medium mt-0.5">
              {stats.kondisiRusak > 0 ? `${stats.kondisiRusak} Unit Perlu Pemeliharaan` : 'Seluruh Aset Layak Operasi'}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 3. INTEGRATED TOOLBAR & FILTER CONTROLS ── */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Category Filter Pills & View Mode Toggle with framer-motion */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          {/* Main Category Tabs with Sliding Pill Animation */}
          <div className="flex items-center bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none gap-1 shrink-0">
            {[
              {
                id: 'all' as const,
                label: 'Semua Kategori',
                icon: Building2,
                count: asetList.length,
                pillClass: 'bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600/70 shadow-md shadow-black/40',
                badgeActiveClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              },
              {
                id: 'pembangunan' as const,
                label: 'Aset Pembangunan (Fisik)',
                icon: HardHat,
                count: stats.pembangunanCount,
                pillClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/50 shadow-md shadow-blue-950/60',
                badgeActiveClass: 'bg-blue-950 text-blue-200 border border-blue-800/60'
              },
              {
                id: 'non_pembangunan' as const,
                label: 'Aset Non-Pembangunan',
                icon: Landmark,
                count: stats.nonPembangunanCount,
                pillClass: 'bg-gradient-to-r from-teal-600 to-emerald-600 border border-teal-400/50 shadow-md shadow-teal-950/60',
                badgeActiveClass: 'bg-teal-950 text-teal-200 border border-teal-800/60'
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-kategori-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer select-none ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTabPill"
                      className={`absolute inset-0 rounded-xl ${tab.pillClass}`}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
                        isActive
                          ? tab.badgeActiveClass
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Card vs Grid Table with Sliding Pill Animation */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Tampilan:</span>
            <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-view-card"
                onClick={() => setViewMode('grid')}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer select-none ${
                  viewMode === 'grid'
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Kartu Visual dengan Foto"
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="activeViewModeIndicator"
                    className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Kartu Visual</span>
                </span>
              </button>

              <button
                type="button"
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer select-none ${
                  viewMode === 'table'
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Grid Tabel Administrasi Resmi"
              >
                {viewMode === 'table' && (
                  <motion.div
                    layoutId="activeViewModeIndicator"
                    className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Grid Tabel Resmi</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="input-search-inventory"
              placeholder="Cari nama aset, kode KIB, dusun, penanggung jawab..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Select Filter Group */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Dusun */}
            <select
              id="select-filter-dusun"
              value={selectedDusun}
              onChange={e => setSelectedDusun(e.target.value)}
              className="bg-slate-950/90 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Dusun</option>
              <option value="Dusun I">Dusun I</option>
              <option value="Dusun II">Dusun II</option>
              <option value="Dusun III">Dusun III</option>
              <option value="Dusun IV">Dusun IV</option>
            </select>

            {/* Filter Kondisi */}
            <select
              id="select-filter-kondisi"
              value={selectedKondisi}
              onChange={e => setSelectedKondisi(e.target.value)}
              className="bg-slate-950/90 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Kondisi</option>
              <option value="Baik">Kondisi Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>

            {/* Filter Sumber Dana */}
            {uniqueSumberDana.length > 0 && (
              <select
                id="select-filter-dana"
                value={selectedSumberDana}
                onChange={e => setSelectedSumberDana(e.target.value)}
                className="bg-slate-950/90 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer hidden sm:block"
              >
                <option value="all">Semua Sumber Dana</option>
                {uniqueSumberDana.map(dana => (
                  <option key={dana} value={dana}>{dana}</option>
                ))}
              </select>
            )}

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset seluruh filter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Info Counter & Quick Download Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Menampilkan <strong>{filteredList.length}</strong> dari total <strong>{asetList.length}</strong> aset terdaftar
            </span>
            {hasActiveFilters && (
              <span className="text-emerald-400 font-medium text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                (Hasil Filter)
              </span>
            )}
            {searchQuery && (
              <span className="text-emerald-300 font-mono text-[11px]">
                • Kata kunci: "{searchQuery}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-filter-download-report"
              disabled={isExportingPDF}
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
              title="Unduh dokumen PDF dari tabel aset yang sedang difilter saat ini"
            >
              {isExportingPDF ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Unduh Laporan ({filteredList.length} Aset)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. CONTENT DISPLAY AREA: CARD VIEW VS GRID TABLE (SMOOTH FRAMER-MOTION TRANSITIONS) ── */}
      <AnimatePresence mode="wait">
        {filteredList.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 border border-slate-700">
              <Search className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Tidak Ada Aset yang Sesuai</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tidak ditemukan data aset desa yang cocok dengan kriteria pencarian dan filter yang Anda tentukan.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Reset Filter & Tampilkan Semua
              </button>
            </div>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* ── VIEW MODE: CARD GRID (KARTU VISUAL PREMIUM) ── */
          <motion.div
            key={`grid-${activeTab}`}
            initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
          {filteredList.map(item => {
            const isPembangunan = item.kategori === 'pembangunan';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/30 group"
              >
                <div>
                  {/* Card Image Banner with Badges */}
                  <div 
                    onClick={() => handleOpenDetail(item)}
                    className="relative h-48 w-full overflow-hidden bg-slate-950 cursor-pointer"
                    title="Klik untuk melihat rincian lengkap aset"
                  >
                    <img
                      src={resolveImageUrl(item.foto)}
                      alt={item.namaAset}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061220] via-transparent to-black/50" />

                    {/* Top Badges Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      {/* Category Badge */}
                      {isPembangunan ? (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-md border border-blue-400/40 flex items-center gap-1.5 shadow-md">
                          <HardHat className="w-3 h-3" />
                          <span>Pembangunan Fisik</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-teal-600/90 text-white backdrop-blur-md border border-teal-400/40 flex items-center gap-1.5 shadow-md">
                          <Landmark className="w-3 h-3" />
                          <span>Non-Pembangunan</span>
                        </span>
                      )}

                      {/* Condition Badge */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border shadow-md ${
                        item.kondisi === 'Baik' 
                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50' 
                          : item.kondisi === 'Rusak Ringan' 
                          ? 'bg-amber-500/25 text-amber-300 border-amber-400/50' 
                          : 'bg-rose-500/25 text-rose-300 border-rose-400/50'
                      }`}>
                        {item.kondisi}
                      </span>
                    </div>

                    {/* Bottom overlay: Monospace KIB Code */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        {item.kodeRegister}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <h3 
                        onClick={() => handleOpenDetail(item)}
                        className="text-base font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {item.namaAset}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {item.subKategori} {item.luasAtauVolume ? `• ${item.luasAtauVolume}` : ''}
                      </p>
                    </div>

                    {/* Price Tag Highlight */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                          Nilai Perolehan
                        </span>
                        <span className="text-base font-extrabold text-emerald-400 font-mono">
                          {formatRupiah(item.nilaiPerolehan)}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {item.sumberDana || 'APBDes'}
                      </span>
                    </div>

                    {/* Metadata Items */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.dusun}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Tahun {item.tahunPengadaan}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Pengelola: {item.penanggungJawab}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Detail Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                      title="Buka Rincian Lengkap Aset"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Detail</span>
                    </button>

                    {/* Map Focus Button */}
                    <button
                      type="button"
                      onClick={() => onFocusOnMap(item)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                      title="Lihat Titik Lokasi pada Peta GIS"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Peta</span>
                    </button>
                  </div>

                  {/* Edit & Delete (RBAC authorized) */}
                  {canAddAsset && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Aset"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Konfirmasi: Hapus pencatatan aset "${item.namaAset}" dari buku inventaris desa?`)) {
                            onDeleteAset(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Aset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </motion.div>
        ) : (
          /* ── VIEW MODE: OFFICIAL GRID TABLE (TABEL ADMINISTRASI RESMI) ── */
          <motion.div
            key={`table-${activeTab}`}
            initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-200 border-collapse min-w-[950px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-3 text-center w-12">No</th>
                  <th className="py-3.5 px-3">Kode KIB</th>
                  <th className="py-3.5 px-3 w-16">Foto</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Aset & Klasifikasi</th>
                  <th className="py-3.5 px-3 text-center">Kategori</th>
                  <th className="py-3.5 px-3">Dusun</th>
                  <th className="py-3.5 px-3 text-center">Tahun</th>
                  <th className="py-3.5 px-3">Sumber Dana</th>
                  <th className="py-3.5 px-4 text-right">Nilai Perolehan</th>
                  <th className="py-3.5 px-3 text-center">Kondisi</th>
                  <th className="py-3.5 px-3">Pengelola</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredList.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {item.kodeRegister}
                    </td>

                    <td className="py-3.5 px-3">
                      <div 
                        onClick={() => handleOpenDetail(item)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer shrink-0"
                      >
                        <img
                          src={resolveImageUrl(item.foto)}
                          alt={item.namaAset}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        className="font-bold text-white hover:text-emerald-400 text-left transition-colors cursor-pointer block leading-tight"
                      >
                        {item.namaAset}
                      </button>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.subKategori} {item.luasAtauVolume ? `(${item.luasAtauVolume})` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        item.kategori === 'pembangunan' 
                          ? 'bg-blue-900/40 text-blue-300 border border-blue-700/60' 
                          : 'bg-teal-900/40 text-teal-300 border border-teal-700/60'
                      }`}>
                        {item.kategori === 'pembangunan' ? 'Pembangunan' : 'Non-Pembangunan'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                      {item.dusun}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {item.tahunPengadaan}
                    </td>

                    <td className="py-3.5 px-3 text-slate-400 text-xs whitespace-nowrap">
                      {item.sumberDana || 'APBDes'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {formatRupiah(item.nilaiPerolehan)}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.kondisi === 'Baik' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : item.kondisi === 'Rusak Ringan' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {item.kondisi}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-400 text-[11px] truncate max-w-[140px]">
                      {item.penanggungJawab}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Rincian Lengkap Aset"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onFocusOnMap(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Lihat di Peta GIS"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>

                        {canAddAsset && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Aset"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Konfirmasi: Hapus pencatatan aset "${item.namaAset}"?`)) {
                                  onDeleteAset(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Aset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950/90 border-t-2 border-slate-800 text-xs font-semibold">
                <tr>
                  <td colSpan={8} className="py-3.5 px-4 text-right text-slate-300 font-bold uppercase tracking-wider">
                    Total Nilai Aset Terfilter ({filteredList.length} Unit):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-400 text-sm">
                    {formatRupiah(filteredList.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0))}
                  </td>
                  <td colSpan={3} className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      id="btn-tfoot-download-report"
                      disabled={isExportingPDF}
                      onClick={handleExportPDF}
                      className="px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold border border-emerald-500/40 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Unduh dokumen PDF dari tabel aset yang sedang difilter"
                    >
                      {isExportingPDF ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Unduh Laporan</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ── 5. SUB-MODALS: FORM TAMBAH / EDIT ASET DESA ── */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6"
            >
              <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingAset ? 'Edit Pencatatan Aset Desa' : 'Tambah Aset Desa Baru'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Format Kartu Inventaris Barang (KIB) Permendagri No. 1/2016
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                  title="Tutup Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5 sm:px-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Kategori Aset: Pembangunan vs Non-Pembangunan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategori Sifat Aset Desa <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formKategori === 'pembangunan'
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="formKategori"
                        value="pembangunan"
                        checked={formKategori === 'pembangunan'}
                        onChange={() => {
                          setFormKategori('pembangunan');
                          setFormSubKategori('Gedung & Bangunan Publik');
                        }}
                        className="hidden"
                      />
                      <HardHat className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Aset Pembangunan</div>
                        <div className="text-[10px] text-slate-400">Fisik, Gedung, Jalan, Irigasi</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formKategori === 'non_pembangunan'
                        ? 'bg-teal-950/60 border-teal-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="formKategori"
                        value="non_pembangunan"
                        checked={formKategori === 'non_pembangunan'}
                        onChange={() => {
                          setFormKategori('non_pembangunan');
                          setFormSubKategori('Tanah Kas Desa (KIB A)');
                        }}
                        className="hidden"
                      />
                      <Landmark className="w-4 h-4 text-teal-400 shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Non-Pembangunan</div>
                        <div className="text-[10px] text-slate-400">Tanah Kas, Mesin, Kendaraan</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Nama Aset & Kode Register */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Aset Desa <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Balai Desa Beliti Jaya"
                      value={formNama}
                      onChange={e => setFormNama(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kode Register KIB <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: KIB-C/001/BLT/2023"
                      value={formKode}
                      onChange={e => setFormKode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Sub Kategori & Luas/Volume */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Klasifikasi / Sub Kategori
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Tanah Kas Desa, Gedung Kantor, Jembatan"
                      value={formSubKategori}
                      onChange={e => setFormSubKategori(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Luas / Dimensi / Volume
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 1.200 m² atau 450 meter"
                      value={formLuas}
                      onChange={e => setFormLuas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Tahun Pengadaan & Nilai Perolehan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tahun Pengadaan <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1980}
                      max={new Date().getFullYear() + 1}
                      value={formTahun}
                      onChange={e => setFormTahun(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nilai Perolehan (Rupiah) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={100000}
                      value={formNilai}
                      onChange={e => setFormNilai(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Format: {formatRupiah(formNilai)}
                    </div>
                  </div>
                </div>

                {/* Sumber Dana, Kondisi & Dusun */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sumber Pembiayaan
                    </label>
                    <select
                      value={formSumberDana}
                      onChange={e => setFormSumberDana(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dana Desa (APBN)">Dana Desa (APBN)</option>
                      <option value="Alokasi Dana Desa (ADD)">Alokasi Dana Desa (ADD)</option>
                      <option value="Pendapatan Asli Desa (PADes)">Pendapatan Asli Desa (PADes)</option>
                      <option value="Bantuan Keuangan Provinsi">Bantuan Keuangan Provinsi</option>
                      <option value="Hibah / Sumbangan Warga">Hibah / Sumbangan Warga</option>
                      <option value="Kekayaan Asli Desa">Kekayaan Asli Desa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kondisi Fisik Terkini
                    </label>
                    <select
                      value={formKondisi}
                      onChange={e => setFormKondisi(e.target.value as KondisiAset)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Baik">Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Wilayah Dusun
                    </label>
                    <select
                      value={formDusun}
                      onChange={e => setFormDusun(e.target.value as DusunWilayah)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dusun I">Dusun I</option>
                      <option value="Dusun II">Dusun II</option>
                      <option value="Dusun III">Dusun III</option>
                      <option value="Dusun IV">Dusun IV</option>
                    </select>
                  </div>
                </div>

                {/* Koordinat Geospasial */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Latitude (Lintang) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formLat}
                      onChange={e => setFormLat(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Longitude (Bujur) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formLng}
                      onChange={e => setFormLng(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Penanggung Jawab & Status Pemanfaatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Penanggung Jawab / Pengelola
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kaur Tata Usaha & Umum"
                      value={formPenanggungJawab}
                      onChange={e => setFormPenanggungJawab(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status Pemanfaatan
                    </label>
                    <select
                      value={formStatusPemanfaatan}
                      onChange={e => setFormStatusPemanfaatan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Digunakan Aktif">Digunakan Aktif</option>
                      <option value="Dipinjampakaikan">Dipinjampakaikan</option>
                      <option value="Disewakan (PADes)">Disewakan (PADes)</option>
                      <option value="Belum Dimanfaatkan">Belum Dimanfaatkan</option>
                    </select>
                  </div>
                </div>

                {/* Dokumentasi Foto (Minimal 4 Link dengan Live Preview) */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Foto Dokumentasi Aset (Minimal 4 Sudut)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetPhotos(formKategori)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-emerald-500/30"
                      >
                        Contoh 4 Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormFotoList(['', '', '', ''])}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formFotoList.map((pUrl, idx) => {
                      const labels = ['Tampak Depan', 'Tampak Samping / Konstruksi', 'Prasasti / Papan Nama', 'Pemanfaatan Warga'];
                      const label = idx < labels.length ? labels[idx] : `Foto Tambahan ${idx + 1}`;

                      return (
                        <div key={idx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                            <span>{label}</span>
                            {idx >= 4 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePhotoSlot(idx)}
                                className="text-rose-400 hover:text-rose-300 text-[10px]"
                              >
                                Hapus Slot
                              </button>
                            )}
                          </div>

                          <input
                            type="url"
                            value={pUrl}
                            onChange={e => handlePhotoUrlChange(idx, e.target.value)}
                            placeholder="https://... atau Google Drive URL"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                          />

                          {pUrl.trim() && (
                            <div className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                              <img
                                src={resolveImageUrl(pUrl.trim())}
                                alt={label}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1 flex justify-center">
                    <button
                      type="button"
                      onClick={handleAddExtraPhotoSlot}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tambah Slot Foto ({formFotoList.length + 1})</span>
                    </button>
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Keterangan & Catatan Kondisi Lapangan
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Catatan historis, nomor sertifikat/surat tanah, pelaksana pembangunan, atau kondisi terkini..."
                    value={formKeterangan}
                    onChange={e => setFormKeterangan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 cursor-pointer"
                  >
                    {editingAset ? 'Simpan Perubahan' : 'Tambah ke Buku Inventaris'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. SUB-MODALS: LIGHTBOX IMAGE PREVIEW ── */}
      <AnimatePresence>
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white truncate max-w-md">{zoomedImage.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-black/70 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={resolveImageUrl(zoomedImage.url)}
                  alt={zoomedImage.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[72vh] object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
