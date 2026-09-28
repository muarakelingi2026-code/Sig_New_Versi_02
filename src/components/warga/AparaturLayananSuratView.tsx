import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LetterRequest, 
  LetterRequestStatus, 
  User, 
  RolePermissions,
  WorkflowLevel,
  LetterIssuance,
  LetterArchive,
  DesaProfile
} from '../../types';
import { StorageService } from '../../services/storageService';
import { LetterIssuanceService } from '../../services/letterIssuanceService';
import { exportOfficialLetterPdf } from '../../utils/pdfExport';
import { DocumentPreviewWorkspace } from './DocumentPreviewWorkspace';
import { PublicLetterVerificationModal } from './PublicLetterVerificationModal';
import { 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  AlertCircle, 
  Eye, 
  Building2, 
  User as UserIcon, 
  Calendar, 
  FileCheck,
  ShieldCheck, 
  Check, 
  X, 
  Sparkles, 
  Inbox, 
  Archive, 
  Download, 
  QrCode, 
  RotateCcw, 
  Printer,
  ArrowLeft,
  Plus,
  ChevronRight,
  Info,
  CheckSquare,
  FileSignature
} from 'lucide-react';

export type LayananSuratSubTab = 'masuk' | 'verifikasi' | 'persetujuan' | 'arsip';

interface AparaturLayananSuratViewProps {
  currentUser: User;
  permissions?: RolePermissions;
  desaProfile: DesaProfile;
  onBack: () => void;
  initialTab?: LayananSuratSubTab;
  onOpenBuatSuratWarga?: () => void;
  onOpenBuatSuratDinas?: () => void;
  onOpenBukuArsip?: () => void;
  onDataChanged?: () => void;
}

export const AparaturLayananSuratView: React.FC<AparaturLayananSuratViewProps> = ({
  currentUser,
  permissions,
  desaProfile,
  onBack,
  initialTab = 'masuk',
  onOpenBuatSuratWarga,
  onOpenBuatSuratDinas,
  onOpenBukuArsip,
  onDataChanged
}) => {
  // Subtab Navigation
  const [activeSubTab, setActiveSubTab] = useState<LayananSuratSubTab>(initialTab);

  // Synchronous Action Mutex Ref to prevent double submit
  const actionMutexRef = useRef<boolean>(false);

  // Core Data
  const [requests, setRequests] = useState<LetterRequest[]>(() => StorageService.getLetterRequests());
  const [archives, setArchives] = useState<LetterArchive[]>(() => StorageService.getLetterArchives());

  // Search & Filter for Requests
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  // Search & Filter for Archives
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<'all' | 'ISSUED' | 'REVOKED'>('all');

  // Modal / Detail / Action States
  const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
  const [previewingRequest, setPreviewingRequest] = useState<LetterRequest | null>(null);
  const [autoPrintWorkspace, setAutoPrintWorkspace] = useState(false);
  const [isVerifyingOpen, setIsVerifyingOpen] = useState(false);
  const [verifyTargetToken, setVerifyTargetToken] = useState<string>('');
  const [revokingArchive, setRevokingArchive] = useState<LetterArchive | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState('');

  // Review & Rejection Form State
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sinkronisasi tab saat initialTab berubah
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const refreshRequests = () => {
    const updated = StorageService.getLetterRequests();
    setRequests(updated);
    setArchives(StorageService.getLetterArchives());
    if (selectedRequest) {
      const found = updated.find(r => r.id === selectedRequest.id);
      setSelectedRequest(found || null);
    }
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Penerbitan Surat Resmi Definitif dengan Synchronous Mutex
  const handleIssueLetter = async (requestId: string) => {
    if (actionMutexRef.current) return;
    actionMutexRef.current = true;
    setIsProcessing(true);

    try {
      const res = await LetterIssuanceService.issueLetter({
        letterRequestId: requestId,
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        }
      });

      if (res.success && res.issuance) {
        setActionAlert({
          text: `Surat resmi berhasil diterbitkan! Nomor Surat: ${res.issuance.nomorSurat} (Registrasi: ${res.issuance.nomorRegistrasi})`,
          type: 'success'
        });
        refreshRequests();
        const updatedReq = StorageService.getLetterRequestById(requestId);
        if (updatedReq) {
          setSelectedRequest(updatedReq);
        }
      } else {
        setActionAlert({
          text: res.error || 'Gagal menerbitkan surat resmi.',
          type: 'error'
        });
      }
    } finally {
      setIsProcessing(false);
      actionMutexRef.current = false;
    }

    setTimeout(() => setActionAlert(null), 5000);
  };

  // Unduh PDF Resmi untuk Arsip (Stage 7.2F.4: Archive snapshot -> Issuance snapshot -> Legacy fallback)
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
      setActionAlert({ text: 'Data pengajuan surat tidak ditemukan.', type: 'error' });
      return;
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
        notes: `Aparatur (${currentUser.name}) mengunduh PDF resmi nomor ${issuance.nomorSurat}.`,
        issuanceId: issuance.id
      });
      setActionAlert({ text: `File PDF ${issuance.nomorSurat} berhasil diunduh.`, type: 'success' });
      setTimeout(() => setActionAlert(null), 3500);
    } catch (err) {
      console.error(err);
      setActionAlert({ text: 'Gagal mengunduh file PDF.', type: 'error' });
    }
  };

  // Konfirmasi Pencabutan Surat Resmi
  const handleConfirmRevoke = () => {
    if (!revokingArchive) return;
    if (!revocationReasonInput.trim()) {
      setActionAlert({ text: 'Alasan pencabutan surat wajib diisi.', type: 'error' });
      return;
    }
    const res = LetterIssuanceService.revokeLetter({
      issuanceId: revokingArchive.issuanceId,
      revocationReason: revocationReasonInput.trim(),
      actor: currentUser
    });
    if (res.success) {
      setActionAlert({
        text: `Surat nomor ${revokingArchive.nomorSurat} berhasil dicabut dari buku arsip aktif.`,
        type: 'success'
      });
      setRevokingArchive(null);
      setRevocationReasonInput('');
      refreshRequests();
    } else {
      setActionAlert({ text: res.error || 'Gagal mencabut surat.', type: 'error' });
    }
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Approval / Verifikasi Surat dengan Mutex
  const handleApproveOrVerify = (targetStatus: 'DIVERIFIKASI' | 'MENUNGGU_PERSETUJUAN' | 'SIAP_DITERBITKAN' | 'DISETUJUI') => {
    if (!selectedRequest || actionMutexRef.current) return;
    actionMutexRef.current = true;
    setIsProcessing(true);

    try {
      const res = StorageService.reviewLetterRequest({
        requestId: selectedRequest.id,
        reviewer: currentUser,
        status: targetStatus,
        notes: reviewNotes.trim() || undefined
      });

      if (res.success) {
        setActionAlert({ 
          text: `Status surat berhasil diperbarui menjadi ${targetStatus.replace(/_/g, ' ')}.`, 
          type: 'success' 
        });
        setReviewNotes('');
        refreshRequests();
      } else {
        setActionAlert({ text: res.error || 'Gagal memperbarui status.', type: 'error' });
      }
    } finally {
      setIsProcessing(false);
      actionMutexRef.current = false;
    }

    setTimeout(() => setActionAlert(null), 4000);
  };

  // Penolakan Surat dengan Mutex
  const handleReject = () => {
    if (!selectedRequest || actionMutexRef.current) return;
    if (!rejectionReason.trim()) {
      setActionAlert({ text: 'Alasan penolakan wajib dicantumkan.', type: 'error' });
      return;
    }

    actionMutexRef.current = true;
    setIsProcessing(true);

    try {
      const res = StorageService.rejectLetterRequest({
        requestId: selectedRequest.id,
        reviewer: currentUser,
        rejectionReason: rejectionReason.trim()
      });

      if (res.success) {
        setActionAlert({ text: 'Pengajuan surat berhasil ditolak.', type: 'success' });
        setIsRejecting(false);
        setRejectionReason('');
        refreshRequests();
      } else {
        setActionAlert({ text: res.error || 'Gagal menolak pengajuan.', type: 'error' });
      }
    } finally {
      setIsProcessing(false);
      actionMutexRef.current = false;
    }

    setTimeout(() => setActionAlert(null), 4000);
  };

  // Filtered Requests untuk Tab 1: Pengajuan Masuk (Semua)
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        req.letterTypeName.toLowerCase().includes(q) ||
        (req.autoData?.nama || '').toLowerCase().includes(q) ||
        (req.autoData?.nik || '').includes(searchQuery) ||
        (req.suratDinasData?.perihal || '').toLowerCase().includes(q) ||
        (req.suratDinasData?.tujuanSurat || '').toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q) ||
        (req.nomorSurat && req.nomorSurat.toLowerCase().includes(q));
      
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchWorkflow = workflowFilter === 'all' || req.workflowLevel === workflowFilter;
      return matchSearch && matchStatus && matchWorkflow;
    });
  }, [requests, searchQuery, statusFilter, workflowFilter]);

  // Filtered Requests untuk Tab 2: Verifikasi Berkas (Menunggu verifikasi operator)
  const verificationQueueRequests = useMemo(() => {
    return requests.filter(req => {
      const isPendingVerification = req.status === 'MENUNGGU_VERIFIKASI';
      if (!isPendingVerification) return false;

      const q = searchQuery.toLowerCase();
      return (
        req.letterTypeName.toLowerCase().includes(q) ||
        (req.autoData?.nama || '').toLowerCase().includes(q) ||
        (req.autoData?.nik || '').includes(searchQuery) ||
        (req.suratDinasData?.perihal || '').toLowerCase().includes(q) ||
        (req.suratDinasData?.tujuanSurat || '').toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  // Filtered Requests untuk Tab 3: Persetujuan Kepala Desa (Level 3 yang diverifikasi / menunggu persetujuan)
  const approvalQueueRequests = useMemo(() => {
    return requests.filter(req => {
      const isWaitingApproval = 
        req.status === 'MENUNGGU_PERSETUJUAN' || 
        req.status === 'DIVERIFIKASI' ||
        ((req.status === 'SIAP_DITERBITKAN' || req.status === 'DISETUJUI') && req.workflowLevel === 'LEVEL_3_PERSETUJUAN');
      
      if (!isWaitingApproval) return false;

      const q = searchQuery.toLowerCase();
      return (
        req.letterTypeName.toLowerCase().includes(q) ||
        (req.autoData?.nama || '').toLowerCase().includes(q) ||
        (req.autoData?.nik || '').includes(searchQuery) ||
        (req.suratDinasData?.perihal || '').toLowerCase().includes(q) ||
        (req.suratDinasData?.tujuanSurat || '').toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  // Filtered Archives untuk Tab 4: Arsip
  const filteredArchives = useMemo(() => {
    return archives.filter(arc => {
      const q = archiveSearchQuery.toLowerCase();
      const matchSearch = 
        arc.nomorSurat.toLowerCase().includes(q) ||
        arc.nomorRegistrasi.toLowerCase().includes(q) ||
        arc.pemohonNama.toLowerCase().includes(q) ||
        arc.pemohonNik.includes(archiveSearchQuery) ||
        arc.letterTypeName.toLowerCase().includes(q) ||
        arc.pemohonDusun.toLowerCase().includes(q);

      const matchStatus = archiveStatusFilter === 'all' || arc.status === archiveStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [archives, archiveSearchQuery, archiveStatusFilter]);

  // Counters
  const countMenungguVerifikasi = useMemo(() => {
    return requests.filter(r => r.status === 'MENUNGGU_VERIFIKASI').length;
  }, [requests]);

  const countMenungguPersetujuan = useMemo(() => {
    return requests.filter(r => r.status === 'MENUNGGU_PERSETUJUAN' || r.status === 'DIVERIFIKASI').length;
  }, [requests]);

  const countTerbit = useMemo(() => {
    return requests.filter(r => r.status === 'TERBIT').length;
  }, [requests]);

  const countDitolak = useMemo(() => {
    return requests.filter(r => r.status === 'DITOLAK' || r.status === 'DIBATALKAN').length;
  }, [requests]);

  const getStatusBadge = (status: LetterRequestStatus) => {
    switch (status) {
      case 'MENUNGGU_VERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Menunggu Verifikasi
          </span>
        );
      case 'DIVERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Diverifikasi
          </span>
        );
      case 'MENUNGGU_PERSETUJUAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Menunggu Persetujuan
          </span>
        );
      case 'DISETUJUI':
      case 'SIAP_DITERBITKAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {status === 'SIAP_DITERBITKAN' ? 'Siap Diterbitkan' : 'Disetujui'}
          </span>
        );
      case 'TERBIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Terbit Resmi
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Ditolak
          </span>
        );
      case 'DIBATALKAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            Dibatalkan Warga
          </span>
        );
      default:
        return null;
    }
  };

  const getWorkflowBadge = (level: WorkflowLevel) => {
    switch (level) {
      case 'LEVEL_1_INSTAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
            Level 1 • Instan
          </span>
        );
      case 'LEVEL_2_VERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/70 text-blue-300 border border-blue-800/60">
            Level 2 • Verifikasi Operator
          </span>
        );
      case 'LEVEL_3_PERSETUJUAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/70 text-purple-300 border border-purple-800/60">
            Level 3 • Persetujuan Kades
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans select-text pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 1. HEADER HALAMAN FULL-PAGE LAYANAN & VERIFIKASI SURAT ── */}
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
              <div className="w-10 h-10 rounded-2xl bg-teal-950/80 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  LAYANAN & VERIFIKASI SURAT
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Pengelolaan pengajuan dan proses verifikasi surat desa • {desaProfile.namaDesa}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Workspace terpadu aparatur desa untuk menelaah permohonan surat masuk, memverifikasi dokumen fisik, persetujuan Kepala Desa, serta penerbitan surat resmi ber-QR.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenBuatSuratWarga && (
              <button
                onClick={onOpenBuatSuratWarga}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/40 border border-teal-500/50 transition-all cursor-pointer"
                title="Buka Form Pembuatan Surat Mandiri untuk Warga"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Surat untuk Warga</span>
              </button>
            )}

            {onOpenBuatSuratDinas && (
              <button
                onClick={onOpenBuatSuratDinas}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border border-teal-500/40 hover:border-teal-400 transition-all cursor-pointer shadow-xs"
                title="Buka Form Pembuatan Surat Dinas Kedinasan"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>+ Buat Surat Dinas</span>
              </button>
            )}

            {onOpenBukuArsip && (
              <button
                onClick={onOpenBukuArsip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                title="Buka Buku Arsip Dokumen Surat Resmi Desa"
              >
                <Archive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buku Arsip Surat ({archives.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 2. ALERT NOTIFIKASI AKSI ── */}
        {actionAlert && (
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-md animate-fadeIn ${
            actionAlert.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {actionAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{actionAlert.text}</span>
            </div>
            <button 
              onClick={() => setActionAlert(null)} 
              className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── 3. SUBTAB NAVIGASI UTAMA WORKSPACE ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {/* Tab 1: Pengajuan Masuk */}
            <button
              onClick={() => {
                setActiveSubTab('masuk');
                setSelectedRequest(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeSubTab === 'masuk'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40 border border-teal-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Pengajuan Masuk</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'masuk' ? 'bg-teal-950 text-teal-200 border border-teal-400/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {requests.length}
              </span>
            </button>

            {/* Tab 2: Verifikasi */}
            <button
              onClick={() => {
                setActiveSubTab('verifikasi');
                setSelectedRequest(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeSubTab === 'verifikasi'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 border border-blue-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi Berkas</span>
              {countMenungguVerifikasi > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {countMenungguVerifikasi} Menunggu
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                  0
                </span>
              )}
            </button>

            {/* Tab 3: Persetujuan */}
            <button
              onClick={() => {
                setActiveSubTab('persetujuan');
                setSelectedRequest(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeSubTab === 'persetujuan'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40 border border-purple-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>Persetujuan Kades</span>
              {countMenungguPersetujuan > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {countMenungguPersetujuan}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                  0
                </span>
              )}
            </button>

            {/* Tab 4: Arsip */}
            <button
              onClick={() => {
                setActiveSubTab('arsip');
                setSelectedRequest(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeSubTab === 'arsip'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Arsip ({archives.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 px-3 hidden lg:flex items-center gap-2">
            <span>Aparatur: <strong className="text-slate-200">{currentUser.name}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="capitalize text-emerald-400 font-semibold">{currentUser.role}</span>
          </div>
        </div>

        {/* ── 4. STAT SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-xs font-medium">Total Permohonan</span>
            <p className="text-2xl font-bold text-slate-100 mt-1">{requests.length}</p>
            <span className="text-[11px] text-slate-500">Tercatat di sistem desa</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40">
            <span className="text-amber-400 text-xs font-medium">Menunggu Verifikasi</span>
            <p className="text-2xl font-bold text-amber-300 mt-1">{countMenungguVerifikasi}</p>
            <span className="text-[11px] text-amber-500/80">Perlu telaah aparatur</span>
          </div>
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40">
            <span className="text-purple-400 text-xs font-medium">Menunggu Otorisasi Kades</span>
            <p className="text-2xl font-bold text-purple-300 mt-1">{countMenungguPersetujuan}</p>
            <span className="text-[11px] text-purple-500/80">Level 3 • Kepala Desa</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
            <span className="text-emerald-400 text-xs font-medium">Surat Sah Terbit</span>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{countTerbit}</p>
            <span className="text-[11px] text-emerald-500/80">Nomor definitif & QR aktif</span>
          </div>
        </div>

        {/* ── 5. KONTEN TAB AKTIF ── */}

        {/* TAB 1: PENGAJUAN MASUK (SEMUA PERMOHONAN) */}
        {activeSubTab === 'masuk' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari pemohon, NIK, jenis surat, nomor surat..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Status:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                  <option value="DIVERIFIKASI">Diverifikasi</option>
                  <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
                  <option value="SIAP_DITERBITKAN">Siap Diterbitkan</option>
                  <option value="DISETUJUI">Disetujui</option>
                  <option value="TERBIT">Terbit Resmi</option>
                  <option value="DITOLAK">Ditolak</option>
                  <option value="DIBATALKAN">Dibatalkan</option>
                </select>

                <select
                  value={workflowFilter}
                  onChange={e => setWorkflowFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">Semua Level</option>
                  <option value="LEVEL_1_INSTAN">Level 1 • Instan</option>
                  <option value="LEVEL_2_VERIFIKASI">Level 2 • Verifikasi</option>
                  <option value="LEVEL_3_PERSETUJUAN">Level 3 • Persetujuan Kades</option>
                </select>
              </div>
            </div>

            {/* List Permohonan */}
            {filteredRequests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-850 flex items-center justify-center text-slate-500 border border-slate-750">
                  <Inbox className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-300">Tidak Ada Permohonan Surat</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Belum ada permohonan surat masuk yang sesuai dengan kata kunci pencarian atau filter status yang dipilih.
                </p>
                {(searchQuery || statusFilter !== 'all' || workflowFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setWorkflowFilter('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-100">{req.letterTypeName}</span>
                        {getStatusBadge(req.status)}
                        {getWorkflowBadge(req.workflowLevel)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
                        {req.isSuratDinas ? (
                          <>
                            <span>
                              Perihal: <strong className="text-slate-200">{req.suratDinasData?.perihal || '-'}</strong>
                            </span>
                            <span>
                              Tujuan: <strong className="text-slate-300">{req.suratDinasData?.tujuanSurat || '-'}</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              Pemohon: <strong className="text-slate-200">{req.autoData?.nama || '-'}</strong> (NIK: <span className="font-mono">{req.autoData?.nik || '-'}</span>)
                            </span>
                            <span>
                              Dusun: <strong className="text-slate-300">{req.autoData?.dusun || '-'}</strong>
                            </span>
                          </>
                        )}
                        <span>
                          Diajukan: {new Date(req.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        {req.nomorSurat && req.status === 'TERBIT' && (
                          <span className="text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                            No: {req.nomorSurat}
                          </span>
                        )}
                      </div>

                      {req.status === 'DITOLAK' && req.rejectionReason && (
                        <p className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/50">
                          <strong>Alasan Ditolak:</strong> {req.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                      {req.status === 'TERBIT' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewingRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Lihat Surat
                          </button>
                          <button
                            onClick={() => {
                              const iss = StorageService.getLetterIssuanceByRequestId(req.id);
                              if (iss) {
                                const arc = archives.find(a => a.issuanceId === iss.id);
                                if (arc) handleDownloadPdfForArchive(arc);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                            title="Download PDF Resmi"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            PDF
                          </button>
                          <button
                            onClick={() => {
                              const iss = StorageService.getLetterIssuanceByRequestId(req.id);
                              if (iss) {
                                setVerifyTargetToken(iss.verificationToken);
                                setIsVerifyingOpen(true);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                            title="Verifikasi QR Keabsahan"
                          >
                            <QrCode className="w-3.5 h-3.5 text-purple-400" />
                            QR
                          </button>
                        </div>
                      )}

                      {(req.status === 'SIAP_DITERBITKAN' || req.status === 'DISETUJUI') && (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleIssueLetter(req.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          title="Terbitkan Surat dan Catat Nomor Resmi"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terbitkan Surat
                        </button>
                      )}

                      <button
                        onClick={() => setPreviewingRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-all cursor-pointer"
                        title="Lihat Pratinjau Lembar Surat"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-400" />
                        Preview
                      </button>

                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Rincian
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFIKASI BERKAS (MENUNGGU VERIFIKASI OPERATOR) */}
        {activeSubTab === 'verifikasi' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-blue-200">Antrean Verifikasi Berkas Fisik & Kependudukan</h4>
                <p className="text-slate-300 leading-relaxed">
                  Daftar pengajuan surat yang memerlukan verifikasi kelengkapan berkas fisik dan validitas data kependudukan oleh aparatur desa sebelum diproses ke tahap penerbitan (Level 2) atau persetujuan Kepala Desa (Level 3).
                </p>
              </div>
            </div>

            {verificationQueueRequests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-200">Semua Berkas Sudah Diverifikasi!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ada permohonan surat warga yang sedang menunggu verifikasi berkas saat ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {verificationQueueRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-blue-900/40 hover:border-blue-700/60 rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-100">{req.letterTypeName}</span>
                        {getStatusBadge(req.status)}
                        {getWorkflowBadge(req.workflowLevel)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
                        {req.isSuratDinas ? (
                          <>
                            <span>Perihal: <strong className="text-slate-200">{req.suratDinasData?.perihal || '-'}</strong></span>
                            <span>Tujuan: <strong className="text-slate-300">{req.suratDinasData?.tujuanSurat || '-'}</strong></span>
                          </>
                        ) : (
                          <>
                            <span>Pemohon: <strong className="text-slate-200">{req.autoData?.nama || '-'}</strong> (NIK: <span className="font-mono">{req.autoData?.nik || '-'}</span>)</span>
                            <span>Dusun: <strong className="text-slate-300">{req.autoData?.dusun || '-'}</strong></span>
                          </>
                        )}
                        <span>Diajukan: {new Date(req.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>

                      {/* Dokumen persyaratan yang dilampirkan */}
                      {req.confirmedRequirements && req.confirmedRequirements.length > 0 && (
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-slate-500 font-medium">Persyaratan:</span>
                          {req.confirmedRequirements.map((cr, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                              <Check className="w-3 h-3 text-emerald-400" />
                              {cr}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <button
                        onClick={() => setPreviewingRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-400" />
                        Preview Draft
                      </button>

                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Telaah & Verifikasi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSETUJUAN KEPALA DESA */}
        {activeSubTab === 'persetujuan' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-3">
              <FileSignature className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-purple-200">Antrean Persetujuan Kepala Desa (Level 3)</h4>
                <p className="text-slate-300 leading-relaxed">
                  Daftar permohonan surat resmi yang berkasnya telah diverifikasi oleh aparatur dan saat ini menunggu persetujuan (otorisasi) dari Kepala Desa Beliti Jaya sebelum nomor surat definitif dialokasikan.
                </p>
              </div>
            </div>

            {approvalQueueRequests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-200">Tidak Ada Antrean Persetujuan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Semua permohonan Level 3 telah diproses atau belum ada surat baru yang masuk ke tahap persetujuan Kepala Desa.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {approvalQueueRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-purple-900/40 hover:border-purple-700/60 rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-100">{req.letterTypeName}</span>
                        {getStatusBadge(req.status)}
                        {getWorkflowBadge(req.workflowLevel)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
                        {req.isSuratDinas ? (
                          <>
                            <span>Perihal: <strong className="text-slate-200">{req.suratDinasData?.perihal || '-'}</strong></span>
                            <span>Tujuan: <strong className="text-slate-300">{req.suratDinasData?.tujuanSurat || '-'}</strong></span>
                          </>
                        ) : (
                          <>
                            <span>Pemohon: <strong className="text-slate-200">{req.autoData?.nama || '-'}</strong> (NIK: <span className="font-mono">{req.autoData?.nik || '-'}</span>)</span>
                            <span>Dusun: <strong className="text-slate-300">{req.autoData?.dusun || '-'}</strong></span>
                          </>
                        )}
                        <span>Diajukan: {new Date(req.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <button
                        onClick={() => setPreviewingRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-400" />
                        Preview
                      </button>

                      {(req.status === 'SIAP_DITERBITKAN' || req.status === 'DISETUJUI') ? (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleIssueLetter(req.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Terbitkan Surat
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Tinjau & Setujui
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BUKU ARSIP SURAT RESMI */}
        {activeSubTab === 'arsip' && (
          <div className="space-y-4">
            {/* Filter & Search Bar Arsip */}
            <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveSearchQuery}
                  onChange={e => setArchiveSearchQuery(e.target.value)}
                  placeholder="Cari no surat, no reg, nama pemohon, dusun..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={archiveStatusFilter}
                  onChange={e => setArchiveStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="ISSUED">Sah / Terbit Aktif</option>
                  <option value="REVOKED">Dicabut / Batal</option>
                </select>

                {onOpenBukuArsip && (
                  <button
                    onClick={onOpenBukuArsip}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-all cursor-pointer"
                    title="Buka tampilan Buku Arsip Penuh dengan paginasi dan filter tahun"
                  >
                    <span>Buku Arsip Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Arsip */}
            {filteredArchives.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Archive className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">Belum Ada Dokumen di Buku Arsip</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Dokumen surat yang sudah resmi diterbitkan akan tersimpan otomatis dan permanen di sini.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5">No. Reg</th>
                        <th className="py-3 px-3.5">Nomor Surat Resmi</th>
                        <th className="py-3 px-3.5">Jenis Surat</th>
                        <th className="py-3 px-3.5">Pemohon</th>
                        <th className="py-3 px-3.5">Tgl Terbit</th>
                        <th className="py-3 px-3.5">Penerbit</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredArchives.map(arc => (
                        <tr key={arc.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                            {arc.nomorRegistrasi}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-200 font-bold whitespace-nowrap">
                            {arc.nomorSurat}
                          </td>
                          <td className="py-3 px-3.5 text-slate-300 font-medium whitespace-nowrap">
                            {arc.letterTypeName}
                          </td>
                          <td className="py-3 px-3.5 text-slate-300">
                            <span className="font-semibold text-slate-200 block">{arc.pemohonNama}</span>
                            <span className="text-[11px] text-slate-500 font-mono">Dusun {arc.pemohonDusun}</span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                            {new Date(arc.tanggalTerbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                            <span className="text-xs text-slate-300 block">{arc.issuedBy || 'Pemerintah Desa'}</span>
                            <span className="text-[10px] text-slate-500">{arc.issuedByRole || 'Kepala Desa'}</span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {arc.status === 'ISSUED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Terbit Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                Dicabut
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setAutoPrintWorkspace(false);
                                  const req = StorageService.getLetterRequestById(arc.letterRequestId);
                                  if (req) setPreviewingRequest(req);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                                title="Buka Lembar Dokumen"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-400" />
                              </button>
                              <button
                                onClick={() => {
                                  setAutoPrintWorkspace(true);
                                  const req = StorageService.getLetterRequestById(arc.letterRequestId);
                                  if (req) setPreviewingRequest(req);
                                }}
                                className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 transition-all cursor-pointer"
                                title="Buka Preview & Cetak Lembar Surat A4"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                              <button
                                onClick={() => handleDownloadPdfForArchive(arc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                                title="Download PDF Dokumen Resmi"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => {
                                  setVerifyTargetToken(arc.verificationToken);
                                  setIsVerifyingOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                                title="Periksa Keabsahan QR Verifikasi"
                              >
                                <QrCode className="w-3.5 h-3.5 text-purple-400" />
                              </button>
                              {currentUser.role === 'admin' && arc.status !== 'REVOKED' && (
                                <button
                                  onClick={() => setRevokingArchive(arc)}
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
                                  title="Cabut Surat Resmi"
                                >
                                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── 6. MODAL RINCIAN & VERIFIKASI PENGAJUAN (Modal Kecil untuk Tindakan) ── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-950 border border-teal-600/40 flex items-center justify-center text-teal-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{selectedRequest.letterTypeName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>ID: {selectedRequest.id}</span>
                    <span>•</span>
                    {getWorkflowBadge(selectedRequest.workflowLevel)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setIsRejecting(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Status Bar */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Status Saat Ini:</span>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              {/* 1. Data Pemohon (Single Source of Truth) */}
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedRequest.isSuratDinas ? 'Data Sasaran Kedinasan' : 'Data Kependudukan Pemohon'}
                </h4>
                {selectedRequest.isSuratDinas ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <span className="text-slate-500">Tujuan Surat:</span>
                      <p className="font-bold text-slate-200 mt-0.5">{selectedRequest.suratDinasData?.tujuanSurat || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sifat Surat:</span>
                      <p className="font-semibold text-slate-200 mt-0.5">{selectedRequest.suratDinasData?.sifatSurat || 'Biasa'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Perihal:</span>
                      <p className="text-slate-200 font-medium mt-0.5">{selectedRequest.suratDinasData?.perihal || '-'}</p>
                    </div>
                    {selectedRequest.suratDinasData?.instansiTujuan && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Instansi / Alamat Tujuan:</span>
                        <p className="text-slate-300 mt-0.5">{selectedRequest.suratDinasData.instansiTujuan}{selectedRequest.suratDinasData.alamatTujuan ? `, ${selectedRequest.suratDinasData.alamatTujuan}` : ''}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <p className="font-bold text-slate-200 mt-0.5">{selectedRequest.autoData?.nama || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">NIK:</span>
                      <p className="font-mono font-bold text-slate-200 mt-0.5">{selectedRequest.autoData?.nik || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">No. KK:</span>
                      <p className="font-mono text-slate-300 mt-0.5">{selectedRequest.autoData?.noKk || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">TTL / JK:</span>
                      <p className="text-slate-300 mt-0.5">{selectedRequest.autoData?.tempatLahir || '-'}, {selectedRequest.autoData?.tanggalLahir || '-'} ({selectedRequest.autoData?.jenisKelamin || '-'})</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Alamat KTP:</span>
                      <p className="text-slate-300 mt-0.5">{selectedRequest.autoData?.alamat || '-'}, RT {selectedRequest.autoData?.rt || '-'}/RW {selectedRequest.autoData?.rw || '-'}, {selectedRequest.autoData?.dusun || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Rincian Isian Formulir */}
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Rincian Isian Formulir Surat
                </h4>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  {Object.entries(selectedRequest.formData).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1 border-b border-slate-850 last:border-0">
                      <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-slate-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Dokumen Persyaratan yang Dikonfirmasi */}
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Dokumen Fisik yang Dikonfirmasi Pemohon
                </h4>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  {selectedRequest.confirmedRequirements.map((cr, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{cr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Penolakan (Jika tombol Tolak ditekan) */}
              {isRejecting ? (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 space-y-3">
                  <div className="font-semibold text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Cantumkan Alasan Penolakan Permohonan Surat
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Dokumen fisik Kartu Keluarga yang dilampirkan belum diperbarui, mohon perbarui KK di kantor desa terlebih dahulu..."
                    className="w-full bg-slate-950 border border-rose-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={handleReject}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Konfirmasi Tolak
                    </button>
                  </div>
                </div>
              ) : (
                /* Form Catatan Petugas */
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">
                    Catatan Verifikasi Petugas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Contoh: Berkas fisik sudah dicocokkan dengan buku induk penduduk..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Footer Modal Action Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  onClick={() => setPreviewingRequest(selectedRequest)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  Lihat Preview Surat
                </button>
              </div>

              {(selectedRequest.status === 'SIAP_DITERBITKAN' || selectedRequest.status === 'DISETUJUI') && (
                <button
                  disabled={isProcessing}
                  onClick={() => handleIssueLetter(selectedRequest.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isProcessing ? 'Menerbitkan...' : 'Terbitkan Surat & Beri Nomor Resmi'}
                </button>
              )}

              {selectedRequest.status === 'TERBIT' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const iss = StorageService.getLetterIssuanceByRequestId(selectedRequest.id);
                      if (iss) {
                        const arc = archives.find(a => a.issuanceId === iss.id);
                        if (arc) handleDownloadPdfForArchive(arc);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Download PDF Resmi
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        const iss = StorageService.getLetterIssuanceByRequestId(selectedRequest.id);
                        if (iss) {
                          const arc = archives.find(a => a.issuanceId === iss.id);
                          if (arc && arc.status !== 'REVOKED') {
                            setRevokingArchive(arc);
                          }
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
                    >
                      Cabut Surat
                    </button>
                  )}
                </div>
              )}

              {selectedRequest.status !== 'DISETUJUI' && selectedRequest.status !== 'SIAP_DITERBITKAN' && selectedRequest.status !== 'TERBIT' && selectedRequest.status !== 'DITOLAK' && selectedRequest.status !== 'DIBATALKAN' && !isRejecting && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 cursor-pointer"
                  >
                    Tolak
                  </button>

                  {selectedRequest.workflowLevel === 'LEVEL_3_PERSETUJUAN' && selectedRequest.status === 'MENUNGGU_VERIFIKASI' ? (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleApproveOrVerify('MENUNGGU_PERSETUJUAN')}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md"
                    >
                      Verifikasi & Teruskan ke Kades
                    </button>
                  ) : selectedRequest.workflowLevel === 'LEVEL_3_PERSETUJUAN' && selectedRequest.status === 'MENUNGGU_PERSETUJUAN' ? (
                    currentUser.role === 'admin' ? (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleApproveOrVerify('SIAP_DITERBITKAN')}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
                      >
                        Setujui (Siap Diterbitkan)
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        Menunggu Persetujuan Kades (Admin)
                      </span>
                    )
                  ) : (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleApproveOrVerify('SIAP_DITERBITKAN')}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
                    >
                      Setujui (Siap Diterbitkan)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. WORKSPACE PREVIEW DOKUMEN SURAT (APARATUR) ── */}
      {previewingRequest && (
        <DocumentPreviewWorkspace
          letterRequest={previewingRequest}
          onBack={() => {
            setPreviewingRequest(null);
            setAutoPrintWorkspace(false);
          }}
          onClose={() => {
            setPreviewingRequest(null);
            setAutoPrintWorkspace(false);
          }}
          mode="aparatur"
          currentUser={currentUser}
          autoPrint={autoPrintWorkspace}
        />
      )}

      {/* ── 8. MODAL KONFIRMASI PENCABUTAN SURAT RESMI ── */}
      {revokingArchive && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
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
                Konfirmasi Cabut Surat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. MODAL VERIFIKASI QR KEABSAHAN SURAT PUBLIK ── */}
      <PublicLetterVerificationModal
        isOpen={isVerifyingOpen}
        onClose={() => {
          setIsVerifyingOpen(false);
          setVerifyTargetToken('');
        }}
        initialToken={verifyTargetToken}
      />

    </div>
  );
};
