import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  RolePermissions, 
  DesaProfile, 
  LetterArchive, 
  LetterRequest,
  LetterAutoDataSnapshot
} from '../../types';
import { StorageService } from '../../services/storageService';
import { LetterIssuanceService } from '../../services/letterIssuanceService';
import { exportOfficialLetterPdf } from '../../utils/pdfExport';
import { DocumentPreviewWorkspace } from './DocumentPreviewWorkspace';
import { PublicLetterVerificationModal } from './PublicLetterVerificationModal';
import { 
  ArrowLeft, 
  Archive, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Printer, 
  Download, 
  QrCode, 
  Ban, 
  FileText, 
  Plus, 
  Calendar, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Inbox,
  ShieldCheck,
  Users
} from 'lucide-react';

interface BukuArsipSuratViewProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBack: () => void;
  onOpenBuatSurat?: () => void;
  onOpenLayananSuratMasuk?: () => void;
  onDataChanged?: () => void;
  initialArchiveType?: 'ALL' | 'WARGA' | 'DINAS';
}

export const BukuArsipSuratView: React.FC<BukuArsipSuratViewProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBack,
  onOpenBuatSurat,
  onOpenLayananSuratMasuk,
  onDataChanged,
  initialArchiveType = 'ALL'
}) => {
  const [archives, setArchives] = useState<LetterArchive[]>(() => StorageService.getLetterArchives());
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveCategory, setArchiveCategory] = useState<'ALL' | 'WARGA' | 'DINAS'>(initialArchiveType);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ISSUED' | 'REVOKED'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sinkronisasi jika initialArchiveType berubah
  useEffect(() => {
    if (initialArchiveType) {
      setArchiveCategory(initialArchiveType);
    }
  }, [initialArchiveType]);

  // Modals & Action States
  const [previewingRequest, setPreviewingRequest] = useState<LetterRequest | null>(null);
  const [autoPrintWorkspace, setAutoPrintWorkspace] = useState(false);
  const [isVerifyingOpen, setIsVerifyingOpen] = useState(false);
  const [verifyTargetToken, setVerifyTargetToken] = useState<string>('');
  const [revokingArchive, setRevokingArchive] = useState<LetterArchive | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState('');
  const [actionAlert, setActionAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const refreshArchives = () => {
    const updated = StorageService.getLetterArchives();
    setArchives(updated);
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Daftar opsi jenis surat unik dari data arsip
  const availableLetterTypes = useMemo(() => {
    const typesMap = new Map<string, string>();
    archives.forEach(a => {
      if (a.letterTypeName) {
        typesMap.set(a.letterTypeId || a.letterTypeName, a.letterTypeName);
      }
    });
    return Array.from(typesMap.entries());
  }, [archives]);

  // Daftar tahun unik dari data arsip
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    archives.forEach(a => {
      if (a.tahun) {
        years.add(a.tahun);
      } else if (a.tanggalTerbit) {
        years.add(new Date(a.tanggalTerbit).getFullYear());
      }
    });
    if (years.size === 0) {
      years.add(2026);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [archives]);

  // Filter Data
  const filteredArchives = useMemo(() => {
    return archives.filter(arc => {
      // 0. Kategori Filter (Semua vs Surat Warga vs Surat Dinas)
      if (archiveCategory === 'WARGA' && arc.isSuratDinas) {
        return false;
      }
      if (archiveCategory === 'DINAS' && !arc.isSuratDinas) {
        return false;
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          arc.nomorSurat.toLowerCase().includes(q) ||
          arc.nomorRegistrasi.toLowerCase().includes(q) ||
          arc.letterTypeName.toLowerCase().includes(q) ||
          (arc.pemohonNama && arc.pemohonNama.toLowerCase().includes(q)) ||
          (arc.pemohonNik && arc.pemohonNik.toLowerCase().includes(q)) ||
          (arc.pemohonDusun && arc.pemohonDusun.toLowerCase().includes(q)) ||
          (arc.perihal && arc.perihal.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && arc.status !== statusFilter) {
        return false;
      }

      // 3. Jenis Surat Filter
      if (typeFilter !== 'all') {
        if (arc.letterTypeId !== typeFilter && arc.letterTypeName !== typeFilter) {
          return false;
        }
      }

      // 4. Tahun Filter
      if (yearFilter !== 'all') {
        const arcYear = arc.tahun || new Date(arc.tanggalTerbit).getFullYear();
        if (arcYear.toString() !== yearFilter) {
          return false;
        }
      }

      return true;
    });
  }, [archives, searchQuery, statusFilter, typeFilter, yearFilter, archiveCategory]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, yearFilter, archiveCategory]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage) || 1;
  const paginatedArchives = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArchives.slice(start, start + itemsPerPage);
  }, [filteredArchives, currentPage, itemsPerPage]);

  // Download PDF Arsip (Stage 7.2F.4: Archive snapshot -> Issuance snapshot -> Legacy fallback)
  const handleDownloadPdfForArchive = async (archive: LetterArchive) => {
    let req = StorageService.getLetterRequestById(archive.letterRequestId) ||
      StorageService.getLetterRequests().find(r => r.nomorSurat === archive.nomorSurat);
    let issuance = StorageService.getLetterIssuanceById(archive.issuanceId) ||
      StorageService.getLetterIssuances().find(i => i.nomorSurat === archive.nomorSurat);

    // Fallback: Jika issuance tidak ditemukan langsung di storage, rekonstruksi dari data arsip historis
    if (!issuance) {
      issuance = {
        id: archive.issuanceId || archive.id,
        letterRequestId: archive.letterRequestId,
        letterTypeId: archive.letterTypeId,
        letterTypeCode: archive.letterTypeCode,
        letterTypeName: archive.letterTypeName,
        templateId: archive.templateId,
        templateVersion: archive.templateVersion,
        nomorSurat: archive.nomorSurat,
        nomorRegistrasi: archive.nomorRegistrasi,
        urutanNomor: 1,
        tahun: archive.tahun,
        kodeKlasifikasi: '470',
        issuedAt: archive.tanggalTerbit,
        issuedBy: archive.issuedBy,
        issuedByRole: archive.issuedByRole,
        wargaAccountId: req?.wargaAccountId,
        pendudukId: req?.pendudukId,
        documentHash: archive.documentHash,
        verificationToken: archive.verificationToken,
        verificationUrl: LetterIssuanceService.generateVerificationUrl(archive.verificationToken),
        signatureType: 'MANUAL',
        signatoryName: archive.signatoryNameSnapshot || '',
        signatoryRole: archive.signatoryRoleSnapshot || 'Kepala Desa Beliti Jaya',
        signatoryNip: archive.signatoryNipSnapshot,
        status: archive.status === 'REVOKED' ? 'REVOKED' : 'ISSUED',
        pdfFileName: archive.pdfFileName,
        createdAt: archive.createdAt,
        updatedAt: archive.createdAt
      };
    } else if (archive.signatoryNameSnapshot) {
      // Prioritas 1: Gunakan snapshot penandatangan dari LetterArchive
      issuance = {
        ...issuance,
        signatoryName: archive.signatoryNameSnapshot,
        signatoryRole: archive.signatoryRoleSnapshot || issuance.signatoryRole,
        signatoryNip: archive.signatoryNipSnapshot !== undefined ? archive.signatoryNipSnapshot : issuance.signatoryNip
      };
    }

    if (!req) {
      // Rekonstruksi request dari archive jika data request terhapus
      const match = archive.pemohonNik ? StorageService.findPendudukByNik(archive.pemohonNik) : null;
      const penduduk = match?.penduduk;
      const keluarga = match?.keluarga;

      const fallbackAutoData: LetterAutoDataSnapshot = {
        nama: penduduk?.nama || archive.pemohonNama || 'Warga Desa Beliti Jaya',
        nik: archive.pemohonNik || '1605000000000000',
        noKk: keluarga?.noKk || '1605000000000000',
        tempatLahir: penduduk?.tempatLahir || 'Beliti Jaya',
        tanggalLahir: penduduk?.tanggalLahir || '1990-01-01',
        jenisKelamin: (penduduk?.jenisKelamin as any) || 'Laki-laki',
        agama: penduduk?.agama || 'Islam',
        statusPerkawinan: penduduk?.statusPerkawinan || 'Kawin',
        statusKeluarga: penduduk?.statusKeluarga || 'Kepala Keluarga',
        pekerjaan: penduduk?.pekerjaan || 'Petani / Pekebun',
        pendidikan: penduduk?.pendidikan || 'SMA / Sederajat',
        alamat: keluarga?.alamat || 'Jl. Poros Desa Beliti Jaya',
        rt: keluarga?.rt || '001',
        rw: keluarga?.rw || '001',
        dusun: archive.pemohonDusun || keluarga?.dusun || 'Dusun I',
        telepon: '-'
      };

      req = {
        id: archive.letterRequestId,
        wargaAccountId: 'aparatur_direct',
        pendudukId: penduduk?.id || 'warga_guest',
        letterTypeId: archive.letterTypeId,
        letterTypeCode: archive.letterTypeCode,
        letterTypeName: archive.letterTypeName,
        templateId: archive.templateId,
        templateVersion: archive.templateVersion,
        workflowLevel: 'LEVEL_1_INSTAN',
        autoData: fallbackAutoData,
        formData: {},
        confirmedRequirements: [],
        status: archive.status === 'REVOKED' ? 'DIBATALKAN' : 'TERBIT',
        nomorSurat: archive.nomorSurat,
        submittedAt: archive.tanggalTerbit,
        updatedAt: archive.createdAt
      };
    }

    try {
      await exportOfficialLetterPdf({
        letterRequest: req,
        issuance,
        saveFile: true
      });
      StorageService.logLetterAudit({
        actorType: 'aparatur',
        actorId: currentUser.id,
        actorName: currentUser.name,
        letterRequestId: req.id,
        letterTypeCode: req.letterTypeCode,
        action: 'LETTER_DOWNLOADED',
        notes: `Aparatur (${currentUser.name}) mengunduh PDF resmi nomor ${issuance.nomorSurat} dari Buku Arsip.`,
        issuanceId: issuance.id
      });
      setActionAlert({ text: `File PDF ${issuance.nomorSurat} berhasil diunduh.`, type: 'success' });
      setTimeout(() => setActionAlert(null), 3500);
    } catch (err) {
      console.error(err);
      setActionAlert({ text: 'Gagal mengunduh file PDF.', type: 'error' });
      setTimeout(() => setActionAlert(null), 3500);
    }
  };

  // Buka Preview Surat Resmi
  const handleOpenPreview = (archive: LetterArchive, autoPrint: boolean = false) => {
    const foundReq = StorageService.getLetterRequestById(archive.letterRequestId) ||
      StorageService.getLetterRequests().find(r => r.nomorSurat === archive.nomorSurat);

    if (foundReq) {
      setAutoPrintWorkspace(autoPrint);
      setPreviewingRequest(foundReq);
    } else {
      // Fallback request object if letterRequest was somehow decoupled
      const match = archive.pemohonNik ? StorageService.findPendudukByNik(archive.pemohonNik) : null;
      const penduduk = match?.penduduk;
      const keluarga = match?.keluarga;

      const fallbackAutoData: LetterAutoDataSnapshot = {
        nama: penduduk?.nama || archive.pemohonNama || 'Warga Desa Beliti Jaya',
        nik: archive.pemohonNik || '1605000000000000',
        noKk: keluarga?.noKk || '1605000000000000',
        tempatLahir: penduduk?.tempatLahir || 'Beliti Jaya',
        tanggalLahir: penduduk?.tanggalLahir || '1990-01-01',
        jenisKelamin: (penduduk?.jenisKelamin as any) || 'Laki-laki',
        agama: penduduk?.agama || 'Islam',
        statusPerkawinan: penduduk?.statusPerkawinan || 'Kawin',
        statusKeluarga: penduduk?.statusKeluarga || 'Kepala Keluarga',
        pekerjaan: penduduk?.pekerjaan || 'Petani / Pekebun',
        pendidikan: penduduk?.pendidikan || 'SMA / Sederajat',
        alamat: keluarga?.alamat || 'Jl. Poros Desa Beliti Jaya',
        rt: keluarga?.rt || '001',
        rw: keluarga?.rw || '001',
        dusun: archive.pemohonDusun || keluarga?.dusun || 'Dusun I',
        telepon: '-'
      };

      const fallbackReq: LetterRequest = {
        id: archive.letterRequestId,
        wargaAccountId: 'aparatur_direct',
        pendudukId: penduduk?.id || 'warga_guest',
        letterTypeId: archive.letterTypeId,
        letterTypeCode: archive.letterTypeCode,
        letterTypeName: archive.letterTypeName,
        templateId: archive.templateId,
        templateVersion: archive.templateVersion,
        workflowLevel: 'LEVEL_1_INSTAN',
        autoData: fallbackAutoData,
        formData: {},
        confirmedRequirements: [],
        status: archive.status === 'REVOKED' ? 'DIBATALKAN' : 'TERBIT',
        nomorSurat: archive.nomorSurat,
        submittedAt: archive.tanggalTerbit,
        updatedAt: archive.createdAt
      };
      setAutoPrintWorkspace(autoPrint);
      setPreviewingRequest(fallbackReq);
    }
  };

  // Konfirmasi Pencabutan Surat Resmi (Admin & Kades)
  const handleConfirmRevoke = () => {
    if (!revokingArchive) return;
    if (!revocationReasonInput.trim()) {
      setActionAlert({ text: 'Alasan resmi pencabutan surat wajib diisi.', type: 'error' });
      return;
    }
    const res = LetterIssuanceService.revokeLetter({
      issuanceId: revokingArchive.issuanceId,
      revocationReason: revocationReasonInput.trim(),
      actor: currentUser
    });
    if (res.success) {
      setActionAlert({
        text: `Surat nomor ${revokingArchive.nomorSurat} berhasil dicabut dari buku arsip aktif. Status surat kini tercatat DICABUT.`,
        type: 'success'
      });
      setRevokingArchive(null);
      setRevocationReasonInput('');
      refreshArchives();
    } else {
      setActionAlert({ text: res.error || 'Gagal mencabut surat resmi.', type: 'error' });
    }
    setTimeout(() => setActionAlert(null), 5000);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setYearFilter('all');
    setArchiveCategory('ALL');
    setCurrentPage(1);
  };

  const isFiltersActive = searchQuery !== '' || statusFilter !== 'all' || typeFilter !== 'all' || yearFilter !== 'all' || archiveCategory !== 'ALL';

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans select-text pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 1. HEADER HALAMAN FULL-PAGE BUKU ARSIP SURAT ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm mb-2"
              title="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>← KEMBALI</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  BUKU ARSIP SURAT
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Arsip Administrasi Surat Desa {desaProfile.namaDesa} • Kec. {desaProfile.kecamatan}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Seluruh surat resmi yang telah tercatat, diterbitkan, dan dialokasikan nomor definitif dalam sistem persuratan desa.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenLayananSuratMasuk && (
              <button
                onClick={onOpenLayananSuratMasuk}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                title="Buka Permohonan Surat Masuk dari Warga"
              >
                <Inbox className="w-3.5 h-3.5 text-teal-400" />
                <span>Pengajuan Masuk</span>
              </button>
            )}

            {onOpenBuatSurat && (
              <button
                onClick={onOpenBuatSurat}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/40 border border-teal-500/50 transition-all cursor-pointer"
                title="Buka Form Pembuatan Surat Mandiri untuk Warga"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Surat untuk Warga</span>
              </button>
            )}
          </div>
        </div>

        {/* ── ALERT NOTIFIKASI AKSI ── */}
        {actionAlert && (
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
            actionAlert.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button 
              onClick={() => setActionAlert(null)} 
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── 2. KARTU STATISTIK ARSIP SURAT ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Surat</span>
            <p className="text-2xl font-black text-slate-100 mt-1">{archives.length}</p>
            <span className="text-[11px] text-slate-500">Tercatat di Buku Arsip</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 shadow-sm">
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider block">Terbit Sah Aktif</span>
            <p className="text-2xl font-black text-emerald-300 mt-1">
              {archives.filter(a => a.status === 'ISSUED').length}
            </p>
            <span className="text-[11px] text-emerald-500/80">Terverifikasi QR Publik</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-800/40 shadow-sm">
            <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider block">Surat Warga</span>
            <p className="text-2xl font-black text-teal-300 mt-1">
              {archives.filter(a => a.pemohonNik && a.pemohonNik !== '-').length}
            </p>
            <span className="text-[11px] text-teal-500/80">Kependudukan & Usaha</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 shadow-sm">
            <span className="text-rose-400 text-xs font-semibold uppercase tracking-wider block">Surat Dicabut</span>
            <p className="text-2xl font-black text-rose-300 mt-1">
              {archives.filter(a => a.status === 'REVOKED').length}
            </p>
            <span className="text-[11px] text-rose-500/80">Dibatalkan / Tidak Sah</span>
          </div>
        </div>

        {/* ── 3. SEARCH & FILTER BAR ── */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-sm">
          {/* Category Tabs: Semua Dokumen, Buku Surat Warga, Buku Surat Dinas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Buku Register:</span>
            <button
              onClick={() => setArchiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                archiveCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Semua Dokumen ({archives.length})
            </button>
            <button
              onClick={() => setArchiveCategory('WARGA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                archiveCategory === 'WARGA'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-950 text-teal-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Buku Surat Warga ({archives.filter(a => !a.isSuratDinas).length})</span>
            </button>
            <button
              onClick={() => setArchiveCategory('DINAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                archiveCategory === 'DINAS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-950 text-blue-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Buku Surat Dinas ({archives.filter(a => a.isSuratDinas).length})</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nomor surat, nama pemohon, perihal..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Filter:</span>
              </div>

              {/* Filter Jenis Surat */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Jenis Surat</option>
                {availableLetterTypes.map(([typeId, typeName]) => (
                  <option key={typeId} value={typeId}>
                    {typeName}
                  </option>
                ))}
              </select>

              {/* Filter Tahun */}
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year.toString()}>
                    Tahun {year}
                  </option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="ISSUED">Sah / Terbit Aktif</option>
                <option value="REVOKED">Dicabut / Batal</option>
              </select>

              {/* Reset Filter Button */}
              {isFiltersActive && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Reset Semua Filter"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Indikator Hasil Pencarian / Filter */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
            <div>
              Menampilkan <span className="font-bold text-slate-200">{filteredArchives.length}</span> dokumen dari total <span className="font-bold text-slate-200">{archives.length}</span> arsip surat
            </div>
            <div className="font-mono text-slate-500">
              Kode Register Desa: <strong className="text-emerald-400">2008</strong>
            </div>
          </div>
        </div>

        {/* ── 4. TABEL BUKU ARSIP SURAT (FULL-WIDTH) ── */}
        {filteredArchives.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Archive className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">
              {archives.length === 0 ? 'Belum Ada Dokumen di Buku Arsip' : 'Tidak Ditemukan Dokumen yang Cocok'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {archives.length === 0
                ? 'Surat resmi yang diterbitkan melalui Layanan Surat atau Form Pembuatan Surat akan otomatis tercatat dan tersimpan permanen di sini.'
                : 'Coba ubah kata kunci pencarian atau reset filter untuk menampilkan kembali dokumen arsip desa.'}
            </p>
            {isFiltersActive && (
              <button
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nomor Surat Resmi</th>
                    <th className="py-3.5 px-4">Jenis Surat</th>
                    <th className="py-3.5 px-4">Pemohon</th>
                    <th className="py-3.5 px-4">Tanggal Terbit</th>
                    <th className="py-3.5 px-4">Penerbit</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {paginatedArchives.map((arc, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr 
                        key={arc.id} 
                        className={`hover:bg-slate-850/60 transition-colors ${
                          arc.status === 'REVOKED' ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-center">
                          {rowNumber}
                        </td>

                        {/* Nomor Surat & No Reg */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="font-bold text-slate-100 block text-xs">
                            {arc.nomorSurat}
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            Reg: {arc.nomorRegistrasi}
                          </span>
                        </td>

                        {/* Jenis Surat */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-200 block">
                            {arc.letterTypeName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Kode: {arc.letterTypeCode}
                          </span>
                        </td>

                        {/* Pemohon */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200 block text-xs">
                            {arc.pemohonNama || 'Warga Desa'}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>NIK: {arc.pemohonNik || '-'}</span>
                            {arc.pemohonDusun && arc.pemohonDusun !== '-' && (
                              <span>• Dusun {arc.pemohonDusun}</span>
                            )}
                          </div>
                        </td>

                        {/* Tanggal Terbit */}
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {new Date(arc.tanggalTerbit).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(arc.tanggalTerbit).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </span>
                        </td>

                        {/* Penerbit */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-xs text-slate-200 font-medium block">
                            {arc.issuedBy || 'Pemerintah Desa'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {arc.issuedByRole || 'Kepala Desa'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {arc.status === 'ISSUED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              TERBIT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              DICABUT
                            </span>
                          )}
                        </td>

                        {/* Aksi Dokumen */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Lihat Surat (Membuka DocumentPreviewWorkspace) */}
                            <button
                              onClick={() => handleOpenPreview(arc, false)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white font-semibold transition-all cursor-pointer shadow-xs"
                              title="Buka Pratinjau Dokumen Surat Resmi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Lihat</span>
                            </button>

                            {/* Tombol Cetak Surat (window.print()) */}
                            <button
                              onClick={() => handleOpenPreview(arc, true)}
                              className="p-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-xs"
                              title="Cetak Surat ke Printer A4"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-100" />
                            </button>

                            {/* Tombol Download PDF Resmi */}
                            <button
                              onClick={() => handleDownloadPdfForArchive(arc)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                              title="Download Berkas PDF Resmi"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                            </button>

                            {/* Tombol Verifikasi Keabsahan QR Publik */}
                            <button
                              onClick={() => {
                                setVerifyTargetToken(arc.verificationToken);
                                setIsVerifyingOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                              title="Periksa Keabsahan QR Verifikasi"
                            >
                              <QrCode className="w-3.5 h-3.5 text-purple-400" />
                            </button>

                            {/* Tombol Cabut Surat (Khusus Admin) */}
                            {currentUser.role === 'admin' && arc.status !== 'REVOKED' && (
                              <button
                                onClick={() => setRevokingArchive(arc)}
                                className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
                                title="Cabut Status Sah Surat Resmi"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60">
                <span className="text-xs text-slate-400">
                  Halaman <span className="font-bold text-slate-200">{currentPage}</span> dari <span className="font-bold text-slate-200">{totalPages}</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    if (
                      p === 1 || 
                      p === totalPages || 
                      (p >= currentPage - 1 && p <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === p
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === 2 && currentPage > 3) {
                      return <span key={p} className="text-slate-500 text-xs px-1">...</span>;
                    }
                    if (p === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key={p} className="text-slate-500 text-xs px-1">...</span>;
                    }
                    return null;
                  })}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 cursor-pointer"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL PRATINJAU DOKUMEN RESMI (FULL-SCREEN PORTAL DARI DocumentPreviewWorkspace) ── */}
      {previewingRequest && (
        <DocumentPreviewWorkspace
          letterRequest={previewingRequest}
          onBack={() => {
            setPreviewingRequest(null);
            setAutoPrintWorkspace(false);
            refreshArchives();
          }}
          onClose={() => {
            setPreviewingRequest(null);
            setAutoPrintWorkspace(false);
            refreshArchives();
          }}
          mode="aparatur"
          currentUser={currentUser}
          customProfile={desaProfile}
          autoPrint={autoPrintWorkspace}
        />
      )}

      {/* ── MODAL VERIFIKASI QR RESMI PUBLIK ── */}
      {isVerifyingOpen && (
        <PublicLetterVerificationModal
          isOpen={isVerifyingOpen}
          onClose={() => {
            setIsVerifyingOpen(false);
            setVerifyTargetToken('');
          }}
          initialToken={verifyTargetToken}
        />
      )}

      {/* ── MODAL KONFIRMASI PENCABUTAN SURAT RESMI ── */}
      {revokingArchive && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-700/80 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Pencabutan Surat Resmi</h3>
                <p className="text-xs text-rose-400 font-mono">{revokingArchive.nomorSurat}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tindakan ini akan membatalkan status keabsahan surat secara permanen pada Buku Arsip dan Portal Verifikasi Publik. Surat tidak akan berlaku lagi.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Alasan Resmi Pencabutan Surat (Wajib):
              </label>
              <textarea
                rows={3}
                value={revocationReasonInput}
                onChange={e => setRevocationReasonInput(e.target.value)}
                placeholder="Contoh: Ditemukan kekeliruan data pemohon setelah diklarifikasi..."
                className="w-full bg-slate-950 border border-rose-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRevokingArchive(null);
                  setRevocationReasonInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer"
              >
                Cabut Surat Resmi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
