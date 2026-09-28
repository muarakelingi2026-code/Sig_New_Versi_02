import React, { useState, useMemo, useEffect } from 'react';
import { 
  LetterRequest, 
  LetterRequestStatus, 
  LetterArchive, 
  User, 
  RolePermissions, 
  DesaProfile 
} from '../../types';
import { StorageService } from '../../services/storageService';
import { LayananSuratSubTab } from './AparaturLayananSuratView';
import { DocumentPreviewWorkspace } from './DocumentPreviewWorkspace';
import { 
  FileText, 
  Users, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Archive, 
  Search, 
  Filter, 
  Plus, 
  ArrowLeft, 
  ChevronRight, 
  ShieldCheck, 
  FileSignature, 
  Inbox, 
  Eye, 
  AlertTriangle, 
  Info, 
  Check, 
  X,
  ExternalLink,
  RotateCcw,
  Hash
} from 'lucide-react';

export interface AparaturPersuratanDashboardViewProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBackToMap: () => void;
  onOpenBuatSuratWarga: () => void;
  onOpenBuatSuratDinas: () => void;
  onOpenLayananSurat: (subTab?: LayananSuratSubTab) => void;
  onOpenBukuArsip: (archiveType?: 'ALL' | 'WARGA' | 'DINAS') => void;
  onOpenTemplateSurat?: () => void;
  onOpenPenomoranSurat?: () => void;
  onDataChanged?: () => void;
}

type QuickFilterType = 
  | 'ALL' 
  | 'WARGA' 
  | 'DINAS' 
  | 'MENUNGGU_VERIFIKASI' 
  | 'MENUNGGU_PERSETUJUAN' 
  | 'TERBIT' 
  | 'DITOLAK' 
  | 'REVOKED';

export const AparaturPersuratanDashboardView: React.FC<AparaturPersuratanDashboardViewProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBackToMap,
  onOpenBuatSuratWarga,
  onOpenBuatSuratDinas,
  onOpenLayananSurat,
  onOpenBukuArsip,
  onOpenTemplateSurat,
  onOpenPenomoranSurat,
  onDataChanged
}) => {
  // Core Data - purely read from existing StorageService
  const [requests, setRequests] = useState<LetterRequest[]>(() => StorageService.getLetterRequests());
  const [archives, setArchives] = useState<LetterArchive[]>(() => StorageService.getLetterArchives());

  // Reload data on focus/mount
  const refreshData = () => {
    setRequests(StorageService.getLetterRequests());
    setArchives(StorageService.getLetterArchives());
    if (onDataChanged) {
      onDataChanged();
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // UI States
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('ALL');
  const [previewingRequest, setPreviewingRequest] = useState<LetterRequest | null>(null);

  // RBAC checks
  const isAdmin = currentUser.role === 'admin';
  const isOperator = currentUser.role === 'operator';
  const canApprove = isAdmin; // Persetujuan Level 3 Kades diakses oleh Admin / Kepala Desa

  // Current Month calculation for 'TERBIT BULAN INI'
  const currentMonthDate = new Date();
  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();
  const namaBulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ][currentMonth];

  // ── STATISTIK UTAMA (DIHITUNG DARI DATA AKTUAL) ──
  const totalPengajuan = requests.length;
  const countMenungguVerifikasi = useMemo(() => {
    return requests.filter(r => r.status === 'MENUNGGU_VERIFIKASI').length;
  }, [requests]);

  const countMenungguPersetujuan = useMemo(() => {
    return requests.filter(r => r.status === 'MENUNGGU_PERSETUJUAN' || r.status === 'DIVERIFIKASI').length;
  }, [requests]);

  const countTerbitBulanIni = useMemo(() => {
    return archives.filter(a => {
      if (a.status !== 'ISSUED') return false;
      const d = a.tanggalTerbit ? new Date(a.tanggalTerbit) : (a.createdAt ? new Date(a.createdAt) : null);
      if (!d || isNaN(d.getTime())) return false;
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [archives, currentMonth, currentYear]);

  const countDitolak = useMemo(() => {
    return requests.filter(r => r.status === 'DITOLAK' || r.status === 'DIBATALKAN').length;
  }, [requests]);

  const countDicabut = useMemo(() => {
    return archives.filter(a => a.status === 'REVOKED').length;
  }, [archives]);

  // ── STATISTIK TERPISAH: SURAT WARGA VS SURAT DINAS ──
  const statsWarga = useMemo(() => {
    const wargaReqs = requests.filter(r => !r.isSuratDinas);
    const wargaArcs = archives.filter(a => !a.isSuratDinas);
    return {
      total: wargaReqs.length,
      menungguVerif: wargaReqs.filter(r => r.status === 'MENUNGGU_VERIFIKASI').length,
      menungguPersetujuan: wargaReqs.filter(r => r.status === 'MENUNGGU_PERSETUJUAN' || r.status === 'DIVERIFIKASI').length,
      terbitSah: wargaArcs.filter(a => a.status === 'ISSUED').length
    };
  }, [requests, archives]);

  const statsDinas = useMemo(() => {
    const dinasReqs = requests.filter(r => r.isSuratDinas === true);
    const dinasArcs = archives.filter(a => a.isSuratDinas === true);
    return {
      total: dinasReqs.length,
      menungguVerif: dinasReqs.filter(r => r.status === 'MENUNGGU_VERIFIKASI').length,
      menungguPersetujuan: dinasReqs.filter(r => r.status === 'MENUNGGU_PERSETUJUAN' || r.status === 'DIVERIFIKASI').length,
      terbitSah: dinasArcs.filter(a => a.status === 'ISSUED').length
    };
  }, [requests, archives]);

  // ── SECTION: PERLU TINDAKAN (BERDASARKAN ROLE) ──
  const pendingTasks = useMemo(() => {
    if (isAdmin) {
      // Admin: perlu verifikasi & persetujuan
      return requests.filter(r => 
        r.status === 'MENUNGGU_VERIFIKASI' || 
        r.status === 'MENUNGGU_PERSETUJUAN' || 
        r.status === 'DIVERIFIKASI'
      );
    }
    // Operator: hanya tugas verifikasi yang diizinkan
    return requests.filter(r => r.status === 'MENUNGGU_VERIFIKASI');
  }, [requests, isAdmin]);

  // ── SEARCH & FILTER UNTUK TABEL PENGAJUAN / AKTIVITAS ──
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // 1. Quick Filter
      if (quickFilter === 'WARGA' && req.isSuratDinas) return false;
      if (quickFilter === 'DINAS' && !req.isSuratDinas) return false;
      if (quickFilter === 'MENUNGGU_VERIFIKASI' && req.status !== 'MENUNGGU_VERIFIKASI') return false;
      if (quickFilter === 'MENUNGGU_PERSETUJUAN' && !(req.status === 'MENUNGGU_PERSETUJUAN' || req.status === 'DIVERIFIKASI')) return false;
      if (quickFilter === 'TERBIT' && req.status !== 'TERBIT') return false;
      if (quickFilter === 'DITOLAK' && !(req.status === 'DITOLAK' || req.status === 'DIBATALKAN')) return false;
      if (quickFilter === 'REVOKED') {
        // Tampilkan surat terbit yang nomornya terdaftar revoked di arsip
        const isRevoked = archives.some(a => a.letterRequestId === req.id && a.status === 'REVOKED');
        if (!isRevoked) return false;
      }

      // 2. Search Query (Aman & Membedakan Surat Warga vs Surat Dinas)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = (req.nomorSurat && req.nomorSurat.toLowerCase().includes(q)) ||
          req.id.toLowerCase().includes(q);
        const matchTypeName = req.letterTypeName.toLowerCase().includes(q);

        if (req.isSuratDinas) {
          // Surat Dinas: Periksa tujuanSurat, instansiTujuan, perihal (JANGAN cari NIK!)
          const dinas = req.suratDinasData;
          const matchTujuan = dinas?.tujuanSurat?.toLowerCase().includes(q) || false;
          const matchInstansi = dinas?.instansiTujuan?.toLowerCase().includes(q) || false;
          const matchPerihal = dinas?.perihal?.toLowerCase().includes(q) || false;
          if (!matchNumber && !matchTypeName && !matchTujuan && !matchInstansi && !matchPerihal) {
            return false;
          }
        } else {
          // Surat Warga: Periksa nama pemohon dan NIK
          const nama = req.autoData?.nama?.toLowerCase() || '';
          const nik = req.autoData?.nik || '';
          const matchWarga = nama.includes(q) || nik.includes(q);
          if (!matchNumber && !matchTypeName && !matchWarga) {
            return false;
          }
        }
      }

      return true;
    });
  }, [requests, archives, quickFilter, searchQuery]);

  // Urutkan berdasarkan waktu pembaruan terbaru, batasi 8-10 item
  const recentActivities = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.submittedAt).getTime();
      const timeB = new Date(b.updatedAt || b.submittedAt).getTime();
      return timeB - timeA;
    }).slice(0, 10);
  }, [filteredRequests]);

  // Helper Badge Status
  const renderStatusBadge = (status: LetterRequestStatus, reqId?: string) => {
    // Cek apakah tercatat dicabut di arsip
    if (reqId && archives.some(a => a.letterRequestId === reqId && a.status === 'REVOKED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <Ban className="w-3 h-3 text-rose-400" />
          Dicabut
        </span>
      );
    }

    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/60">
            <Clock className="w-3 h-3 text-slate-400" />
            Draft
          </span>
        );
      case 'MENUNGGU_VERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
            Menunggu Verifikasi
          </span>
        );
      case 'DIVERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Diverifikasi
          </span>
        );
      case 'MENUNGGU_PERSETUJUAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Clock className="w-3 h-3 text-purple-400" />
            Menunggu Persetujuan
          </span>
        );
      case 'DISETUJUI':
      case 'SIAP_DITERBITKAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Disetujui
          </span>
        );
      case 'TERBIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Terbit Sah
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            Ditolak
          </span>
        );
      case 'DIBATALKAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/60">
            <Ban className="w-3 h-3 text-slate-400" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans select-text pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 1. HEADER DASHBOARD PERSURATAN APARATUR ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1.5">
              <button
                onClick={onBackToMap}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                title="Kembali ke Portal Peta Spasial GIS"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal Peta GIS</span>
              </button>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {desaProfile.namaDesa}, Kec. {desaProfile.kecamatan}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-900/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span>PERSURATAN DESA</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Layanan Surat Menyurat dan Arsip Desa
            </p>
          </div>

          {/* Tombol Utama Header */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* Tombol Buka Arsip */}
            <button
              id="btn-dashboard-buka-arsip"
              onClick={() => onOpenBukuArsip('ALL')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
              title="Buka Buku Register Arsip Surat Desa"
            >
              <Archive className="w-4 h-4 text-emerald-400" />
              <span>BUKA ARSIP</span>
            </button>

            {/* Tombol Template Surat */}
            {onOpenTemplateSurat && (
              <button
                id="btn-dashboard-template-surat"
                onClick={onOpenTemplateSurat}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
                title="Kelola Format Baku & Versi Template Surat Desa"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">TEMPLATE SURAT</span>
                <span className="sm:hidden">TEMPLATE</span>
              </button>
            )}

            {/* Tombol Pengaturan Penomoran */}
            {onOpenPenomoranSurat && (
              <button
                id="btn-dashboard-penomoran-surat"
                onClick={onOpenPenomoranSurat}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
                title="Kelola Format, Kode Klasifikasi, & Register Nomor Surat"
              >
                <Hash className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">PENOMORAN</span>
                <span className="sm:hidden">#</span>
              </button>
            )}

            {/* Tombol + Buat Surat (Membuka Pilihan Warga vs Dinas) */}
            <button
              id="btn-dashboard-buat-surat"
              onClick={() => setIsCreateChoiceOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-teal-950/50 hover:shadow-teal-900/60"
              title="Buat Surat Baru (Pilih Surat Warga atau Surat Dinas)"
            >
              <Plus className="w-4 h-4" />
              <span>+ BUAT SURAT</span>
            </button>
          </div>
        </div>

        {/* ── 2. ALERT INDIKATOR NOTIFIKASI TUGAS ── */}
        {(countMenungguVerifikasi > 0 || (canApprove && countMenungguPersetujuan > 0)) && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-amber-100">
                  Perhatian: Terdapat berkas pengajuan yang memerlukan tindakan aparatur
                </p>
                <p className="text-amber-300/80">
                  {countMenungguVerifikasi > 0 && `${countMenungguVerifikasi} surat menunggu verifikasi operator. `}
                  {canApprove && countMenungguPersetujuan > 0 && `${countMenungguPersetujuan} surat menunggu persetujuan Kepala Desa.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {countMenungguVerifikasi > 0 && (
                <button
                  onClick={() => onOpenLayananSurat('verifikasi')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Proses Verifikasi
                </button>
              )}
              {canApprove && countMenungguPersetujuan > 0 && (
                <button
                  onClick={() => onOpenLayananSurat('persetujuan')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Tinjau Persetujuan
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 3. STATISTIK UTAMA (6 KARTU DATA AKTUAL) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* 1. Total Pengajuan */}
          <div 
            onClick={() => onOpenLayananSurat('masuk')}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm group"
            title="Klik untuk membuka semua Pengajuan Masuk"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Pengajuan</span>
              <Inbox className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">{totalPengajuan}</p>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <span>Buka daftar</span>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          {/* 2. Menunggu Verifikasi */}
          <div 
            onClick={() => onOpenLayananSurat('verifikasi')}
            className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/30 hover:bg-amber-950/45 border border-amber-800/40 hover:border-amber-700/60 transition-all cursor-pointer shadow-sm group"
            title="Klik untuk membuka antrean Verifikasi Berkas"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-200 mt-2">{countMenungguVerifikasi}</p>
            <span className="text-[11px] text-amber-400/80 flex items-center gap-1 mt-1">
              <span>Periksa berkas</span>
              <ChevronRight className="w-3 h-3 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          {/* 3. Menunggu Persetujuan */}
          <div 
            onClick={() => onOpenLayananSurat('persetujuan')}
            className="p-3.5 sm:p-4 rounded-2xl bg-purple-950/30 hover:bg-purple-950/45 border border-purple-800/40 hover:border-purple-700/60 transition-all cursor-pointer shadow-sm group"
            title="Klik untuk membuka antrean Persetujuan Kepala Desa"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">Persetujuan Kades</span>
              <FileSignature className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-200 mt-2">{countMenungguPersetujuan}</p>
            <span className="text-[11px] text-purple-400/80 flex items-center gap-1 mt-1">
              <span>Level 3 Otorisasi</span>
              <ChevronRight className="w-3 h-3 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          {/* 4. Terbit Bulan Ini */}
          <div 
            onClick={() => onOpenBukuArsip('ALL')}
            className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/30 hover:bg-emerald-950/45 border border-emerald-800/40 hover:border-emerald-700/60 transition-all cursor-pointer shadow-sm group"
            title="Klik untuk membuka Arsip Surat Terbit"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Terbit Bulan Ini</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-200 mt-2">{countTerbitBulanIni}</p>
            <span className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-1 truncate">
              <span>{namaBulanIndo} {currentYear}</span>
              <ChevronRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </span>
          </div>

          {/* 5. Surat Ditolak */}
          <div 
            onClick={() => {
              setQuickFilter('DITOLAK');
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/20 hover:bg-rose-950/35 border border-rose-900/40 hover:border-rose-800/60 transition-all cursor-pointer shadow-sm group"
            title="Klik untuk memfilter surat yang ditolak"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Surat Ditolak</span>
              <XCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-200 mt-2">{countDitolak}</p>
            <span className="text-[11px] text-rose-400/80 flex items-center gap-1 mt-1">
              <span>Berkas tidak sah</span>
              <ChevronRight className="w-3 h-3 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          {/* 6. Surat Dicabut */}
          <div 
            onClick={() => onOpenBukuArsip('ALL')}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm group"
            title="Klik untuk melihat arsip surat yang dicabut"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Surat Dicabut</span>
              <Ban className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-200 mt-2">{countDicabut}</p>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <span>Revokasi arsip</span>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* ── 4. PEMISAHAN PANEL: SURAT WARGA VS SURAT DINAS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* PANEL KIRI: PELAYANAN SURAT WARGA */}
          <div className="rounded-3xl bg-gradient-to-b from-teal-950/30 to-slate-900/80 border border-teal-800/40 p-5 sm:p-6 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>SURAT UNTUK WARGA</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        Kependudukan
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Surat permohonan warga: domisili, usaha, kematian, kelahiran, keterangan dll.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ringkasan Angka Surat Warga */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Menunggu Verif</span>
                  <span className="text-lg font-black text-amber-300">{statsWarga.menungguVerif}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Menunggu Setuju</span>
                  <span className="text-lg font-black text-purple-300">{statsWarga.menungguPersetujuan}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Terbit di Arsip</span>
                  <span className="text-lg font-black text-emerald-300">{statsWarga.terbitSah}</span>
                </div>
              </div>
            </div>

            {/* Shortcut Aksi Surat Warga */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-teal-900/40">
              <button
                onClick={onOpenBuatSuratWarga}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Surat Warga</span>
              </button>
              <button
                onClick={() => onOpenBukuArsip('WARGA')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-800/40 transition-all cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Buku Surat Warga</span>
              </button>
            </div>
          </div>

          {/* PANEL KANAN: PELAYANAN SURAT DINAS */}
          <div className="rounded-3xl bg-gradient-to-b from-blue-950/30 to-slate-900/80 border border-blue-800/40 p-5 sm:p-6 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>SURAT DINAS PEMERINTAH</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        Kedinasan
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Naskah dinas: Undangan Rapat/Musdes, Surat Tugas, Edaran, & Rekomendasi Dinas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ringkasan Angka Surat Dinas */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Menunggu Verif</span>
                  <span className="text-lg font-black text-amber-300">{statsDinas.menungguVerif}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Menunggu Setuju</span>
                  <span className="text-lg font-black text-purple-300">{statsDinas.menungguPersetujuan}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Terbit di Arsip</span>
                  <span className="text-lg font-black text-blue-300">{statsDinas.terbitSah}</span>
                </div>
              </div>
            </div>

            {/* Shortcut Aksi Surat Dinas */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-blue-900/40">
              <button
                onClick={onOpenBuatSuratDinas}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Surat Dinas</span>
              </button>
              <button
                onClick={() => onOpenBukuArsip('DINAS')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-800/40 transition-all cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Buku Surat Dinas</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 5. SECTION: AKSI CEPAT WORKSPACE ── */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>AKSI CEPAT PERSURATAN</span>
            </h3>
            <span className="text-[11px] text-slate-500">Shortcut Navigasi Operator & Pimpinan</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* 1. Surat Warga */}
            <button
              onClick={onOpenBuatSuratWarga}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 group-hover:bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Surat Warga</span>
            </button>

            {/* 2. Surat Dinas */}
            <button
              onClick={onOpenBuatSuratDinas}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Surat Dinas</span>
            </button>

            {/* 3. Pengajuan Masuk */}
            <button
              onClick={() => onOpenLayananSurat('masuk')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Pengajuan Masuk</span>
            </button>

            {/* 4. Verifikasi */}
            <button
              onClick={() => onOpenLayananSurat('verifikasi')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs relative"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Verifikasi</span>
              {countMenungguVerifikasi > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                  {countMenungguVerifikasi}
                </span>
              )}
            </button>

            {/* 5. Persetujuan */}
            <button
              onClick={() => onOpenLayananSurat('persetujuan')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs relative"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <FileSignature className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Persetujuan</span>
              {countMenungguPersetujuan > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500 text-white">
                  {countMenungguPersetujuan}
                </span>
              )}
            </button>

            {/* 6. Buku Surat Warga */}
            <button
              onClick={() => onOpenBukuArsip('WARGA')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Buku Surat Warga</span>
            </button>

            {/* 7. Buku Surat Dinas */}
            <button
              onClick={() => onOpenBukuArsip('DINAS')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Buku Surat Dinas</span>
            </button>
          </div>
        </div>

        {/* ── 6. SECTION: PERLU TINDAKAN (PENDING WORK BY ROLE) ── */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>PERLU TINDAKAN</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {pendingTasks.length} Berkas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Antrean berkas persuratan yang membutuhkan verifikasi atau persetujuan pimpinan
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Peran Aktif:</span>
              <strong className="text-emerald-400 uppercase">{currentUser.role}</strong>
              <span className="text-slate-600">•</span>
              <span>{currentUser.name}</span>
            </div>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Tidak Ada Berkas Tertunda</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Seluruh pengajuan persuratan warga dan naskah dinas telah selesai diverifikasi dan diproses dengan baik.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingTasks.slice(0, 4).map(req => (
                <div 
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        req.isSuratDinas 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}>
                        {req.isSuratDinas ? 'Surat Dinas' : 'Surat Warga'}
                      </span>
                      {renderStatusBadge(req.status)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{req.letterTypeName}</h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {req.isSuratDinas 
                        ? `Tujuan: ${req.suratDinasData?.tujuanSurat || '-'} • Perihal: ${req.suratDinasData?.perihal || '-'}`
                        : `Pemohon: ${req.autoData?.nama || 'Warga'} (NIK: ${req.autoData?.nik || '-'})`
                      }
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setPreviewingRequest(req)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    {req.status === 'MENUNGGU_VERIFIKASI' && (
                      <button
                        onClick={() => onOpenLayananSurat('verifikasi')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verifikasi</span>
                      </button>
                    )}
                    {canApprove && (req.status === 'MENUNGGU_PERSETUJUAN' || req.status === 'DIVERIFIKASI') && (
                      <button
                        onClick={() => onOpenLayananSurat('persetujuan')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-xs"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>Tinjau & Setujui</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 7. PENCARIAN & QUICK FILTER TERINTEGRASI ── */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nomor surat, jenis surat, nama warga, NIK, atau perihal dinas..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Reset Search / Filter Button */}
            {(searchQuery !== '' || quickFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setQuickFilter('ALL');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                title="Reset Pencarian & Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>

            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Semua ({requests.length})
            </button>

            <button
              onClick={() => setQuickFilter('WARGA')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'WARGA'
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-teal-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Surat Warga ({statsWarga.total})
            </button>

            <button
              onClick={() => setQuickFilter('DINAS')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'DINAS'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-blue-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Surat Dinas ({statsDinas.total})
            </button>

            <button
              onClick={() => setQuickFilter('MENUNGGU_VERIFIKASI')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'MENUNGGU_VERIFIKASI'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-amber-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Menunggu Verifikasi ({countMenungguVerifikasi})
            </button>

            <button
              onClick={() => setQuickFilter('MENUNGGU_PERSETUJUAN')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'MENUNGGU_PERSETUJUAN'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-purple-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Menunggu Persetujuan ({countMenungguPersetujuan})
            </button>

            <button
              onClick={() => setQuickFilter('TERBIT')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'TERBIT'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-emerald-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Terbit Sah ({requests.filter(r => r.status === 'TERBIT').length})
            </button>

            <button
              onClick={() => setQuickFilter('DITOLAK')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'DITOLAK'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-rose-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Ditolak ({countDitolak})
            </button>

            <button
              onClick={() => setQuickFilter('REVOKED')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                quickFilter === 'REVOKED'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'bg-slate-950 text-orange-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Dicabut ({countDicabut})
            </button>
          </div>
        </div>

        {/* ── 8. SECTION: AKTIVITAS / PENGAJUAN TERBARU ── */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm space-y-0">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>AKTIVITAS & PENGAJUAN TERBARU</span>
                <span className="text-xs font-normal text-slate-400">
                  (Menampilkan {recentActivities.length} data)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pembaruan status dokumen pengajuan surat warga dan naskah dinas terkini
              </p>
            </div>

            <button
              onClick={() => onOpenLayananSurat('masuk')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>Buka Seluruh Layanan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Belum Ada Data Persuratan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || quickFilter !== 'ALL'
                  ? 'Tidak ada permohonan atau naskah surat yang cocok dengan kriteria pencarian / filter Anda.'
                  : 'Belum ada berkas surat yang diajukan atau diterbitkan. Silakan klik tombol "+ Buat Surat" untuk memulai.'}
              </p>
              {searchQuery || quickFilter !== 'ALL' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setQuickFilter('ALL');
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateChoiceOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Buat Surat
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Jenis Surat</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-4">Nomor / Registrasi</th>
                    <th className="py-3 px-4">Nama Warga / Tujuan Dinas</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {recentActivities.map(req => (
                    <tr 
                      key={req.id} 
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Jenis Surat */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{req.letterTypeName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{req.letterTypeCode}</div>
                      </td>

                      {/* Kategori Warga vs Dinas */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.isSuratDinas 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        }`}>
                          {req.isSuratDinas ? 'Dinas' : 'Warga'}
                        </span>
                      </td>

                      {/* Nomor / Registrasi */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {req.nomorSurat ? (
                          <span className="text-emerald-300 font-bold">{req.nomorSurat}</span>
                        ) : (
                          <span className="text-slate-400">ID: {req.id.substring(0, 16)}...</span>
                        )}
                      </td>

                      {/* Nama Warga ATAU Tujuan Dinas */}
                      <td className="py-3 px-4">
                        {req.isSuratDinas ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-200 truncate max-w-xs">
                              {req.suratDinasData?.tujuanSurat || 'Kedinasan Desa'}
                            </div>
                            {req.suratDinasData?.perihal && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                Perihal: {req.suratDinasData.perihal}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-200">
                              {req.autoData?.nama || 'Warga Desa'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              NIK: {req.autoData?.nik || '-'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(req.updatedAt || req.submittedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderStatusBadge(req.status, req.id)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewingRequest(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-950/60 hover:bg-teal-900 text-teal-300 border border-teal-800/60 transition-all cursor-pointer"
                            title="Pratinjau Lembar Dokumen Resmi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => {
                              if (req.status === 'TERBIT') {
                                onOpenBukuArsip(req.isSuratDinas ? 'DINAS' : 'WARGA');
                              } else {
                                onOpenLayananSurat(
                                  req.status === 'MENUNGGU_VERIFIKASI' ? 'verifikasi' :
                                  req.status === 'MENUNGGU_PERSETUJUAN' || req.status === 'DIVERIFIKASI' ? 'persetujuan' : 'masuk'
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                            title="Buka pada Ruang Kerja Persuratan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── 9. MODAL PILIHAN BUAT SURAT (WARGA VS DINAS) ── */}
      {isCreateChoiceOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Pilih Jenis Pembuatan Surat</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tentukan jenis naskah surat yang ingin Anda terbitkan
                </p>
              </div>
              <button
                onClick={() => setIsCreateChoiceOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Opsi 1: Surat untuk Warga */}
              <button
                onClick={() => {
                  setIsCreateChoiceOpen(false);
                  onOpenBuatSuratWarga();
                }}
                className="p-4 rounded-2xl bg-teal-950/40 hover:bg-teal-950/70 border border-teal-700/50 hover:border-teal-500 text-left transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    Surat untuk Warga
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Surat Keterangan Domisili, Usaha, Kelahiran, Kematian, Tidak Mampu, Beda Nama, Belum Menikah dll.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 pt-2 border-t border-teal-900/50">
                  <span>Buka Form Warga</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Opsi 2: Surat Dinas */}
              <button
                onClick={() => {
                  setIsCreateChoiceOpen(false);
                  onOpenBuatSuratDinas();
                }}
                className="p-4 rounded-2xl bg-blue-950/40 hover:bg-blue-950/70 border border-blue-700/50 hover:border-blue-500 text-left transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    Surat Dinas Pemerintah
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Undangan Resmi Rapat/Musdes, Surat Perintah Tugas (SPT), Surat Edaran, & Rekomendasi Dinas.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 pt-2 border-t border-blue-900/50">
                  <span>Buka Form Dinas</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. PREVIEW DOKUMEN RESMI (REUSE DocumentPreviewWorkspace) ── */}
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
