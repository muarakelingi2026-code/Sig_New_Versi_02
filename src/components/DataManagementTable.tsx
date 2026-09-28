import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keluarga, Penduduk, User, RolePermissions } from '../types';
import { generateFamilyProfilePDF, generateResidentProfilePDF } from '../utils/pdfExport';
import { 
  Users, 
  Home, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  HeartHandshake, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Filter, 
  Layers,
  Phone,
  GraduationCap,
  Printer,
  FileText,
  X,
  Lock,
  Copy,
  Check,
  Calendar,
  IdCard,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

// Motion variants for smooth government dashboard & premium SaaS UI
const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } 
  }
};

const modalPanelVariants = {
  hidden: { 
    opacity: 0, 
    x: 40, 
    scale: 0.98 
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      duration: 0.35, 
      ease: [0.22, 1, 0.36, 1] 
    } 
  },
  exit: { 
    opacity: 0, 
    x: 30, 
    scale: 0.98,
    transition: { 
      duration: 0.25, 
      ease: [0.22, 1, 0.36, 1] 
    } 
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

interface DataManagementTableProps {
  keluargaList: Keluarga[];
  pendudukList: Penduduk[];
  onSelectKeluarga: (keluarga: Keluarga) => void;
  onAddNewKeluarga: () => void;
  onEditKeluarga: (keluarga: Keluarga) => void;
  onDeleteKeluarga: (keluarga: Keluarga) => void;
  currentUser: User;
  permissions?: RolePermissions;
  onOpenAnalytics?: () => void;
}

export const DataManagementTable: React.FC<DataManagementTableProps> = ({
  keluargaList,
  pendudukList,
  onSelectKeluarga,
  onAddNewKeluarga,
  onEditKeluarga,
  onDeleteKeluarga,
  currentUser,
  permissions,
  onOpenAnalytics
}) => {
  const isOperator = currentUser.role === 'operator';
  const isRestricted = isOperator && (permissions?.operatorOnlyAddKK ?? true);
  const allowEdit = !isRestricted || (permissions?.allowOperatorEditKK ?? false);
  const allowDelete = !isRestricted || (permissions?.allowOperatorDeleteKK ?? false);
  const allowExport = !isRestricted || (permissions?.allowOperatorExport ?? false);
  const [subTab, setSubTab] = useState<'keluarga' | 'penduduk'>('keluarga');
  const [search, setSearch] = useState('');
  const [dusunFilter, setDusunFilter] = useState('semua');
  const [bansosFilter, setBansosFilter] = useState('semua');
  const [selectedResident, setSelectedResident] = useState<Penduduk | null>(null);
  const [copiedNik, setCopiedNik] = useState(false);
  const [isFabHovered, setIsFabHovered] = useState(false);

  // Seluruh data penduduk disinkronkan langsung secara reaktif dari keluargaList
  const effectivePendudukList = useMemo(() => {
    if (keluargaList && keluargaList.length > 0) {
      return keluargaList.flatMap(k => k.anggotaKeluarga || []);
    }
    return pendudukList || [];
  }, [keluargaList, pendudukList]);

  // Indikator Ringkasan Kependudukan
  const totalKeluargaCount = keluargaList.length;
  const totalPendudukCount = effectivePendudukList.length;
  const maleCount = useMemo(() => {
    return effectivePendudukList.filter(p => {
      const jk = (p.jenisKelamin || '').trim().toLowerCase();
      return jk === 'laki-laki' || jk === 'l' || jk.startsWith('laki');
    }).length;
  }, [effectivePendudukList]);
  const femaleCount = useMemo(() => {
    return effectivePendudukList.filter(p => {
      const jk = (p.jenisKelamin || '').trim().toLowerCase();
      return jk === 'perempuan' || jk === 'p' || jk.startsWith('perempuan');
    }).length;
  }, [effectivePendudukList]);

  if (currentUser.role === 'operator_aset') {
    return (
      <div id="operator-aset-crud-restricted" className="p-12 bg-slate-900/90 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">Akses Dibatasi: Menu Data Kependudukan</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Akun Operator Aset tidak diperbolehkan mengakses menu Data Kependudukan. Akun Anda difokuskan khusus pada pengelolaan Aset & Buku Inventaris Desa.
          </p>
        </div>
      </div>
    );
  }

  // Filtered families
  const filteredKeluarga = keluargaList.filter(k => {
    if (dusunFilter !== 'semua' && k.dusun !== dusunFilter) return false;
    if (bansosFilter === 'penerima' && !k.penerimaBansos) return false;
    if (bansosFilter === 'bukan' && k.penerimaBansos) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKk = k.noKk.toLowerCase().includes(q);
      const matchKepala = k.namaKepalaKeluarga.toLowerCase().includes(q);
      const matchAlamat = k.alamat.toLowerCase().includes(q);
      const matchAnggota = k.anggotaKeluarga.some(a => a.nama.toLowerCase().includes(q) || a.nik.toLowerCase().includes(q));
      if (!matchKk && !matchKepala && !matchAlamat && !matchAnggota) return false;
    }
    return true;
  });

  // Filtered residents (menggunakan effectivePendudukList agar tabel dan widget selalu sinkron sempurna)
  const filteredPenduduk = effectivePendudukList.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNik = p.nik.toLowerCase().includes(q);
      const matchNama = p.nama.toLowerCase().includes(q);
      const matchPekerjaan = p.pekerjaan.toLowerCase().includes(q);
      if (!matchNik && !matchNama && !matchPekerjaan) return false;
    }
    return true;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div id="data-management-view" className="space-y-4 max-w-7xl mx-auto">
      
      {/* Top Controls Header (Modern Government Dashboard + Premium SaaS UI) */}
      <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-hidden">
        {/* Subtle Ambient Glow Highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent pointer-events-none" />

        {/* Sub-tab Switchers - Segmented Modern Capsule */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner h-12">
          <motion.button
            type="button"
            id="subtab-btn-keluarga"
            whileTap={{ scale: 0.96 }}
            onClick={() => setSubTab('keluarga')}
            className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'keluarga'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_2px_12px_rgba(16,185,129,0.3)] border border-emerald-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Data Kartu Keluarga</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/25 text-emerald-200 border border-white/10 font-mono">
              {keluargaList.length} KK
            </span>
          </motion.button>

          <motion.button
            type="button"
            id="subtab-btn-penduduk"
            whileTap={{ scale: 0.96 }}
            onClick={() => setSubTab('penduduk')}
            className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'penduduk'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_2px_12px_rgba(16,185,129,0.3)] border border-emerald-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Penduduk Perorangan</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/25 text-emerald-200 border border-white/10 font-mono">
              {pendudukList.length} Jiwa
            </span>
          </motion.button>
        </div>

        {/* Ringkasan Statistik Kependudukan di Pojok Kanan (Tinggi Identik h-12) */}
        <div id="kependudukan-header-dashboard" className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-start md:justify-end">
          {/* Widget 1: Total KK */}
          <div id="widget-total-kk" className="flex items-center gap-2.5 px-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl shadow-inner h-12">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none">Total KK</div>
              <div className="text-xs sm:text-sm font-bold text-white font-mono leading-tight mt-0.5">
                {totalKeluargaCount} <span className="text-[10px] font-normal text-slate-400 font-sans">KK</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Total Penduduk */}
          <div id="widget-total-penduduk" className="flex items-center gap-2.5 px-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl shadow-inner h-12">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none">Total Penduduk</div>
              <div className="text-xs sm:text-sm font-bold text-white font-mono leading-tight mt-0.5">
                {totalPendudukCount} <span className="text-[10px] font-normal text-slate-400 font-sans">Jiwa</span>
              </div>
            </div>
          </div>

          {/* Widget 3: Laki-Laki */}
          <div id="widget-laki-laki" className="flex items-center gap-2.5 px-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl shadow-inner h-12">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none">Laki-Laki</div>
              <div className="text-xs sm:text-sm font-bold text-blue-300 font-mono leading-tight mt-0.5">
                {maleCount} <span className="text-[10px] font-normal text-slate-400 font-sans">Jiwa</span>
              </div>
            </div>
          </div>

          {/* Widget 4: Perempuan */}
          <div id="widget-perempuan" className="flex items-center gap-2.5 px-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl shadow-inner h-12">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none">Perempuan</div>
              <div className="text-xs sm:text-sm font-bold text-rose-300 font-mono leading-tight mt-0.5">
                {femaleCount} <span className="text-[10px] font-normal text-slate-400 font-sans">Jiwa</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar for Table */}
      <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md group">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder={subTab === 'keluarga' ? 'Cari Nomor KK, Nama Kepala, Alamat...' : 'Cari NIK, Nama Penduduk, Pekerjaan...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.12)] transition-all duration-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {subTab === 'keluarga' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <select
                value={dusunFilter}
                onChange={e => setDusunFilter(e.target.value)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 focus:border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                <option value="semua">Semua Dusun</option>
                <option value="Dusun I">Dusun I</option>
                <option value="Dusun II">Dusun II</option>
                <option value="Dusun III">Dusun III</option>
                <option value="Dusun IV">Dusun IV</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={bansosFilter}
                onChange={e => setBansosFilter(e.target.value)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 focus:border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                <option value="semua">Semua Kategori</option>
                <option value="penerima">Penerima Bansos</option>
                <option value="bukan">Bukan Penerima</option>
              </select>
            </div>

            {/* Counter Badge Hasil Filter */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-medium">
              <span>Menampilkan:</span>
              <span className="text-emerald-400 font-bold font-mono">{filteredKeluarga.length}</span>
              <span>/ {keluargaList.length} KK</span>
            </div>
          </div>
        )}

        {subTab === 'penduduk' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-medium">
            <span>Menampilkan:</span>
            <span className="text-emerald-400 font-bold font-mono">{filteredPenduduk.length}</span>
            <span>/ {pendudukList.length} Jiwa</span>
          </div>
        )}
      </div>

      {/* SUBTAB 1: TABEL DATA KARTU KELUARGA (KK) */}
      {subTab === 'keluarga' && (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/70 text-slate-400 font-bold border-b border-slate-700/70 text-[10.5px] uppercase tracking-wider backdrop-blur-xs">
                <tr>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Rumah & No. KK</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Kepala Keluarga</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Alamat & Wilayah</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Anggota Keluarga</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Status DTKS</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Bantuan Sosial</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400 text-right">Aksi & Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredKeluarga.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">Tidak ada data keluarga yang sesuai</p>
                      <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau sesuaikan filter dusun/bansos</p>
                    </td>
                  </tr>
                ) : (
                  filteredKeluarga.map(kel => (
                    <tr 
                      key={kel.id} 
                      className="group border-b border-slate-800/40 hover:bg-slate-800/45 hover:border-slate-700/60 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative overflow-hidden rounded-xl border border-slate-700/80 shadow-xs shrink-0 group-hover:border-emerald-500/40 transition-colors">
                            <img
                              src={kel.fotoRumah}
                              alt="Rumah"
                              className="w-12 h-10 object-cover rounded-xl transition-transform duration-200 ease-out group-hover:scale-105"
                            />
                          </div>
                          <div>
                            <div className="font-mono font-bold text-white text-xs tracking-tight group-hover:text-emerald-300 transition-colors">
                              {kel.noKk}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                              <span>{kel.koordinat.lat.toFixed(4)}, {kel.koordinat.lng.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm tracking-tight group-hover:text-emerald-300 transition-colors">
                          {kel.namaKepalaKeluarga}
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                          NIK: <span className="text-slate-300 font-semibold">{kel.nikKepala}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{kel.dusun} • RT {kel.rt}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={kel.alamat}>
                          {kel.alamat}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/90 text-emerald-300 border border-emerald-500/25 shadow-xs">
                            {kel.anggotaKeluarga.length} Jiwa
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            (kel.statusPenduduk || 'Tetap') === 'Sementara'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300/80 border-emerald-500/20'
                          }`}>
                            {kel.statusPenduduk || 'Tetap'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10.5px] font-bold border shadow-xs ${
                          kel.statusKesejahteraan.includes('Desil 1') ? 'bg-rose-500/15 text-rose-300 border-rose-500/35' :
                          kel.statusKesejahteraan.includes('Desil 2') ? 'bg-orange-500/15 text-orange-300 border-orange-500/35' :
                          kel.statusKesejahteraan.includes('Desil 3') ? 'bg-amber-500/15 text-amber-300 border-amber-500/35' :
                          'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        }`}>
                          {kel.statusKesejahteraan.split(' ')[0]} {kel.statusKesejahteraan.split(' ')[1] || ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {kel.penerimaBansos ? (
                          <div className="space-y-0.5">
                            <div className="text-emerald-400 font-bold font-mono text-xs flex items-center gap-1">
                              <HeartHandshake className="w-3 h-3 text-emerald-400" />
                              <span>{formatRupiah(kel.totalNominalBantuanBulanan)}/bln</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={kel.daftarBansos.join(', ')}>
                              {kel.daftarBansos.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-800/40 border border-slate-700/50">
                            Non-Bansos
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {allowExport && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => generateFamilyProfilePDF(kel)}
                              className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white rounded-xl transition-all border border-emerald-500/30 cursor-pointer shadow-xs"
                              title="Cetak Profil Lengkap Kartu Keluarga (PDF)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => onSelectKeluarga(kel)}
                            className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Lihat Detail Lengkap & Peta"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          </motion.button>
                          {allowEdit ? (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => onEditKeluarga(kel)}
                              className="p-2 bg-slate-800 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 border border-slate-700/80 hover:border-blue-500/40 rounded-xl transition-all cursor-pointer shadow-xs"
                              title="Edit Data Keluarga"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            </motion.button>
                          ) : (
                            <span 
                              className="p-2 bg-slate-900/40 text-slate-600 rounded-xl cursor-not-allowed opacity-40 inline-flex border border-slate-800"
                              title="Akses Edit dibatasi untuk Administrator. Operator hanya dapat menambah data baru."
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {allowDelete ? (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => onDeleteKeluarga(kel)}
                              className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer shadow-xs"
                              title={currentUser.role === 'admin' ? 'Hapus Data KK' : 'Ajukan Hapus ke Admin'}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            </motion.button>
                          ) : (
                            <span 
                              className="p-2 bg-slate-900/40 text-slate-600 rounded-xl cursor-not-allowed opacity-40 inline-flex border border-slate-800"
                              title="Akses Hapus dibatasi untuk Administrator"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TABEL DATA PENDUDUK PERORANGAN */}
      {subTab === 'penduduk' && (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/70 text-slate-400 font-bold border-b border-slate-700/70 text-[10.5px] uppercase tracking-wider backdrop-blur-xs">
                <tr>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Foto & NIK</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Nama Penduduk</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Gender & Usia</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Status Hubungan</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Pendidikan</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Pekerjaan & Gaji</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Status Vital</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400 text-right">Aksi & Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPenduduk.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">Tidak ada data penduduk yang sesuai</p>
                      <p className="text-xs text-slate-500">Coba gunakan kata kunci pencarian NIK, nama, atau pekerjaan lain</p>
                    </td>
                  </tr>
                ) : (
                  filteredPenduduk.map(p => {
                    const matchingKeluarga = keluargaList.find(k => k.noKk === p.noKk);
                    return (
                      <tr 
                        key={p.id} 
                        className="group border-b border-slate-800/40 hover:bg-slate-800/45 hover:border-slate-700/60 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative overflow-hidden rounded-xl border border-slate-700/80 shadow-xs shrink-0 group-hover:border-emerald-500/40 transition-colors">
                              <img
                                src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                alt={p.nama}
                                className="w-9 h-9 object-cover rounded-xl transition-transform duration-200 ease-out group-hover:scale-105"
                              />
                            </div>
                            <div className="font-mono text-slate-300 font-semibold text-xs tracking-tight group-hover:text-emerald-300 transition-colors">
                              {p.nik}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm tracking-tight group-hover:text-emerald-300 transition-colors">
                            {p.nama}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Tempat Lahir: <span className="text-slate-300">{p.tempatLahir}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium text-xs">{p.jenisKelamin}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{calculateAge(p.tanggalLahir)} Tahun</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800/90 text-emerald-300 font-semibold text-[10.5px] border border-emerald-500/25 shadow-xs">
                            {p.statusKeluarga}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-200 font-medium">{p.pendidikan}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium">{p.pekerjaan}</div>
                          <div className="text-emerald-400 font-mono font-semibold text-[10px] mt-0.5">
                            {p.penghasilanBulanan > 0 ? formatRupiah(p.penghasilanBulanan) : 'Tidak Berpenghasilan'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {p.statusKematian === 'Hidup' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold text-center">
                                Hidup
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold text-center">
                                Wafat
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-center border ${
                              (p.statusPenduduk || 'Tetap') === 'Sementara'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {p.statusPenduduk || 'Tetap'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => generateResidentProfilePDF(p, matchingKeluarga)}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-medium flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-400/30 transition-all cursor-pointer"
                              title={`Cetak Surat Biodata PDF untuk ${p.nama}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cetak PDF</span>
                            </motion.button>
                            <motion.button
                              type="button"
                              id={`btn-view-data-penduduk-${p.nik}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => setSelectedResident(p)}
                              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              title={`Lihat Rincian Lengkap Biodata ${p.nama}`}
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View Data</span>
                            </motion.button>
                            {matchingKeluarga && (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => onSelectKeluarga(matchingKeluarga)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 border border-slate-700/80 rounded-xl transition-all cursor-pointer"
                                title="Buka Detail KK & Peta"
                              >
                                <Home className="w-3.5 h-3.5" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIVIDUAL RESIDENT DETAIL PREVIEW MODAL / DRAWER (ANIMASI CINEMATIC, SMOOTH, PREMIUM SAAS) */}
      <AnimatePresence>
        {selectedResident && (
          <motion.div 
            key="resident-detail-backdrop"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/75 backdrop-blur-[6px] p-3 sm:p-5 overflow-y-auto"
            onClick={() => setSelectedResident(null)}
          >
            <motion.div 
              key="resident-detail-panel"
              variants={modalPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative max-w-2xl sm:max-w-3xl w-full bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-slate-100 max-h-[92vh] my-auto backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal View Data with Subtle Ambient Gradient */}
              <div className="relative px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950/90 via-slate-900/95 to-slate-950/90 flex items-center justify-between gap-4 shrink-0">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        Biodata Resmi Kependudukan
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                        Pemerintah Desa Beliti Jaya
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                      Detail Data: {selectedResident.nama}
                    </h3>
                  </div>
                </div>

                {/* Tombol Close (X) with Micro-interaction */}
                <motion.button
                  type="button"
                  id="btn-close-resident-view-data"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedResident(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                  title="Tutup (Esc)"
                  aria-label="Tutup Form View Data Penduduk"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Body View Data with Stagger Animation */}
              <motion.div 
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
                className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs"
              >
                {/* 1. Profil Atas */}
                <motion.div 
                  variants={staggerItemVariants}
                  className="bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-4"
                >
                  <div className="relative overflow-hidden rounded-2xl border-2 border-slate-700 shadow-lg shrink-0 bg-slate-950 group">
                    <img
                      src={selectedResident.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                      alt={selectedResident.nama}
                      className="w-24 h-28 sm:w-28 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
                        selectedResident.statusKeluarga === 'Kepala Keluarga'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        {selectedResident.statusKeluarga}
                      </span>

                      {selectedResident.statusKematian === 'Meninggal' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Meninggal Dunia ({selectedResident.tanggalMeninggal || '-'})</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Status: Hidup</span>
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                        {selectedResident.jenisKelamin}
                      </span>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        (selectedResident.statusPenduduk || 'Tetap') === 'Sementara'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {(selectedResident.statusPenduduk || 'Tetap') === 'Sementara' ? '⏳ Penduduk Sementara' : '✓ Penduduk Tetap'}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {selectedResident.nama}
                    </h2>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedResident.nik);
                          setCopiedNik(true);
                          setTimeout(() => setCopiedNik(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-emerald-300 transition-all cursor-pointer shadow-xs"
                        title="Klik untuk menyalin NIK"
                      >
                        <span className="text-slate-400">NIK:</span>
                        <span className="font-bold">{selectedResident.nik}</span>
                        {copiedNik ? (
                          <span className="text-[10px] text-emerald-400 font-sans font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Tersalin!
                          </span>
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </motion.button>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 shadow-xs">
                        <span className="text-slate-400">No. KK:</span>
                        <span className="font-semibold text-slate-200">{selectedResident.noKk}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 2. Grid 4 Cardlet Rincian */}
                <motion.div variants={staggerItemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Identitas Pribadi & Kelahiran</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Tempat & Tanggal Lahir:</span>
                        <span className="font-medium text-slate-200">{selectedResident.tempatLahir}, {selectedResident.tanggalLahir}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/50">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Jenis Kelamin:</span>
                          <span className="font-medium text-slate-200">{selectedResident.jenisKelamin}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Agama:</span>
                          <span className="font-medium text-slate-200">{selectedResident.agama || 'Islam'}</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Status Perkawinan:</span>
                        <span className="font-medium text-slate-200">{selectedResident.statusPerkawinan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                      <GraduationCap className="w-4 h-4 text-teal-400" />
                      <span>Pendidikan & Pekerjaan</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Pendidikan Terakhir:</span>
                        <span className="font-semibold text-emerald-300">{selectedResident.pendidikan}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Pekerjaan:</span>
                        <span className="font-medium text-slate-200">{selectedResident.pekerjaan}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Penghasilan Bulanan:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {selectedResident.penghasilanBulanan > 0 ? formatRupiah(selectedResident.penghasilanBulanan) : 'Tidak Berpenghasilan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                      <HeartHandshake className="w-4 h-4 text-rose-400" />
                      <span>Jaminan Sosial & Catatan Khusus</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 text-[11px] block mb-1">Bantuan Sosial Pribadi:</span>
                        {selectedResident.bantuanPribadi && selectedResident.bantuanPribadi.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedResident.bantuanPribadi.map((b, bi) => (
                              <span key={bi} className="px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-medium">
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tidak memiliki bantuan pribadi.</span>
                        )}
                      </div>
                      {selectedResident.disabilitas && (
                        <div className="pt-1 border-t border-slate-800/50">
                          <span className="text-slate-400 text-[11px] block">Disabilitas:</span>
                          <span className="text-amber-300 font-medium">{selectedResident.disabilitas}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                      <Phone className="w-4 h-4 text-amber-400" />
                      <span>Kontak & Komunikasi</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Nomor Telepon / WhatsApp:</span>
                        {selectedResident.nomorTelepon ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="font-semibold text-emerald-300 font-mono">
                              {selectedResident.nomorTelepon}
                            </span>
                            <a
                              href={`https://wa.me/${selectedResident.nomorTelepon.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-md text-[10px] font-semibold border border-emerald-500/30 inline-flex items-center gap-1 transition-all"
                            >
                              Hubungi WA
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tidak tercatat</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Footer Modal with Subtle Ambient Glow */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sistem Informasi Geografis Kependudukan Desa</span>
                </div>
                <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      const matchK = keluargaList.find(k => k.noKk === selectedResident.noKk);
                      generateResidentProfilePDF(selectedResident, matchK);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Profil PDF</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedResident(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer border border-slate-700/80 flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tutup</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button Modern & Profesional (Icon saat diam, memanjang menampilkan judul saat hover dengan transisi halus) */}
      <div 
        id="floating-add-kk-container" 
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 print:hidden"
      >
        <motion.button
          type="button"
          id="btn-floating-add-new-family"
          onMouseEnter={() => setIsFabHovered(true)}
          onMouseLeave={() => setIsFabHovered(false)}
          onFocus={() => setIsFabHovered(true)}
          onBlur={() => setIsFabHovered(false)}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={onAddNewKeluarga}
          className={`group flex items-center h-11 sm:h-12 rounded-full font-medium shadow-xl shadow-slate-950/70 border border-slate-700/80 hover:border-emerald-500/60 bg-slate-900/95 hover:bg-slate-850 backdrop-blur-md cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] select-none pl-1.5 sm:pl-2 ${
            isFabHovered 
              ? 'pr-4 sm:pr-4.5' 
              : 'pr-1.5 sm:pr-2'
          }`}
          title="Tambah Data KK & Titik Baru"
        >
          {/* Plus Icon container: subtle crisp emerald badge, rotates 90deg on hover smoothly */}
          <div className="w-8 h-8 rounded-full bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:rotate-90">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>

          {/* Text Container: Collapsed when mouse is away, smoothly expands with gentle deceleration */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] whitespace-nowrap flex items-center gap-2 ${
              isFabHovered
                ? 'max-w-[280px] opacity-100 ml-2.5'
                : 'max-w-0 opacity-0 ml-0 pointer-events-none'
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold tracking-tight text-white leading-none">
              Tambah Data KK & Titik Baru
            </span>
            {isRestricted && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-medium shrink-0">
                Utama
              </span>
            )}
          </div>
        </motion.button>
      </div>

    </div>
  );
};
