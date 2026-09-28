import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { 
  LetterRequest, 
  LetterTemplate, 
  DesaProfile, 
  User, 
  WargaSession,
  LetterIssuance 
} from '../../types';
import { StorageService } from '../../services/storageService';
import { LetterIssuanceService } from '../../services/letterIssuanceService';
import { 
  resolveLetterVariables, 
  validateLetterForPreview,
  ResolvedLetterDocument 
} from '../../utils/letterVariableResolver';
import { exportOfficialLetterPdf } from '../../utils/pdfExport';
import { PublicLetterVerificationModal } from './PublicLetterVerificationModal';
import { 
  ArrowLeft, 
  X,
  FileText, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Info,
  Calendar,
  Lock,
  Download,
  CheckCircle2,
  QrCode
} from 'lucide-react';

interface DocumentPreviewWorkspaceProps {
  letterRequest: LetterRequest;
  onClose?: () => void;
  onBack?: () => void;
  mode: 'warga' | 'aparatur';
  currentWarga?: WargaSession | null;
  currentUser?: User | null;
  autoPrint?: boolean;
  templateOverride?: LetterTemplate;
  isTemplatePreview?: boolean;
  customProfile?: DesaProfile;
}

export const DocumentPreviewWorkspace: React.FC<DocumentPreviewWorkspaceProps> = ({
  letterRequest,
  onClose,
  onBack,
  mode,
  currentWarga,
  currentUser,
  autoPrint = false,
  templateOverride,
  isTemplatePreview = false,
  customProfile
}) => {
  const [currentRequest, setCurrentRequest] = useState<LetterRequest>(letterRequest);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isVerifyingOpen, setIsVerifyingOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Navigasi keluar yang aman: kembali ke context sebelumnya tanpa mengubah session atau logout
  const handleExit = () => {
    document.body.classList.remove('document-preview-active');
    if (onBack) {
      onBack();
      return;
    }
    if (onClose) {
      onClose();
      return;
    }
  };

  // Keyboard shortcut: Escape untuk kembali
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isVerifyingOpen) {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVerifyingOpen, onBack, onClose]);

  useEffect(() => {
    setCurrentRequest(letterRequest);
  }, [letterRequest]);

  // Pasang kelas dokumen aktif pada body untuk isolasi cetak media print
  useEffect(() => {
    document.body.classList.add('document-preview-active');
    return () => {
      document.body.classList.remove('document-preview-active');
    };
  }, []);

  const desaProfile = useMemo<DesaProfile>(() => {
    return customProfile || StorageService.getDesaProfile();
  }, [customProfile, letterRequest.id, isTemplatePreview]);

  // Ambil record LetterIssuance jika sudah terbit (Stage 7.2F.4: Archive snapshot -> Issuance snapshot -> Legacy fallback)
  const issuance = useMemo<LetterIssuance | undefined>(() => {
    // Mode pratinjau template tidak boleh mengambil snapshot dokumen historis
    if (isTemplatePreview) return undefined;

    // Cari archive terkait terlebih dahulu jika dokumen tersimpan di buku arsip
    const archive = StorageService.getLetterArchives().find(
      a => a.letterRequestId === currentRequest.id || 
           a.letterRequestId === letterRequest.id || 
           (currentRequest.nomorSurat && a.nomorSurat === currentRequest.nomorSurat)
    );

    // Cari issuance terkait dari storage
    const fromId = StorageService.getLetterIssuanceByRequestId(currentRequest.id) ||
      StorageService.getLetterIssuanceByRequestId(letterRequest.id) ||
      (archive?.issuanceId ? StorageService.getLetterIssuanceById(archive.issuanceId) : undefined) ||
      (currentRequest.nomorSurat ? StorageService.getLetterIssuances().find(i => i.nomorSurat === currentRequest.nomorSurat) : undefined);

    if (fromId) {
      // Prioritas 1: Jika archive memiliki snapshot penandatangan, gunakan snapshot archive
      // Prioritas 2: Gunakan snapshot dari LetterIssuance
      return {
        ...fromId,
        signatoryName: archive?.signatoryNameSnapshot || fromId.signatoryName,
        signatoryRole: archive?.signatoryRoleSnapshot || fromId.signatoryRole,
        signatoryNip: archive?.signatoryNipSnapshot !== undefined ? archive.signatoryNipSnapshot : fromId.signatoryNip
      };
    }

    // Jika issuance tidak ditemukan di storage, namun ada record archive:
    if (archive) {
      // Prioritas 1: Snapshot dari archive
      // Prioritas 4: Resolver historis / fallback aman tanpa meregenerasi data baru
      return {
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
        wargaAccountId: currentRequest.wargaAccountId,
        pendudukId: currentRequest.pendudukId,
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
    }

    return undefined;
  }, [currentRequest.id, currentRequest.status, currentRequest.nomorSurat, letterRequest.id, letterRequest.status, isTemplatePreview]);

  const isLetterIssued = 
    !isTemplatePreview &&
    (currentRequest.status === 'TERBIT' || 
     letterRequest.status === 'TERBIT' ||
     Boolean(issuance && (issuance.status === 'ISSUED' || issuance.status === 'REVOKED')));

  const isPublished = Boolean(isLetterIssued);

  // Hak cetak surat: Jika surat berstatus TERBIT, baik warga pemilik surat maupun aparatur berhak mencetak
  const isWargaOwner = mode === 'warga' 
    ? (!currentWarga || !currentRequest.pendudukId || currentWarga.pendudukId === currentRequest.pendudukId || currentWarga.wargaAccountId === currentRequest.wargaAccountId || currentWarga.nik === currentRequest.autoData?.nik)
    : true;

  const canPrint = Boolean((isLetterIssued && isWargaOwner) || isTemplatePreview);

  // Ambil template dokumen: Utamakan template historis yang tercatat pada dokumen terbit (issuance / request)
  const template = useMemo<LetterTemplate | undefined>(() => {
    if (templateOverride) return templateOverride;

    const targetTemplateId = issuance?.templateId || currentRequest.templateId;
    const targetTemplateVersion = issuance?.templateVersion || currentRequest.templateVersion;

    if (targetTemplateId) {
      const found = StorageService.getLetterTemplateById(targetTemplateId, targetTemplateVersion);
      if (found) return found;
    }

    // Jika dokumen sudah terbit namun templateId tidak cocok, cari versi yang sesuai untuk jenis surat ini
    if (isLetterIssued && targetTemplateVersion) {
      const allTemplates = StorageService.getLetterTemplates();
      const matchVersion = allTemplates.find(
        t => t.letterTypeId === currentRequest.letterTypeId && t.version === targetTemplateVersion
      );
      if (matchVersion) return matchVersion;
    }

    // Fallback untuk pengajuan baru yang belum terbit: template aktif saat ini
    return StorageService.getActiveLetterTemplateByType(currentRequest.letterTypeId);
  }, [currentRequest, issuance, isLetterIssued, templateOverride]);

  // Validasi Hak Akses & Kelayakan Dokumen (Stage 7.2D.1.1: Mendukung template inactive pada dokumen terbit)
  const validation = useMemo(() => {
    return validateLetterForPreview({
      template,
      letterRequest: currentRequest,
      actorRole: mode,
      wargaAccountId: currentWarga?.wargaAccountId,
      pendudukId: currentWarga?.pendudukId,
      isIssued: isLetterIssued,
      isTemplatePreview
    });
  }, [template, currentRequest, mode, currentWarga, isLetterIssued, isTemplatePreview]);

  // Resolusi Variabel Dokumen (Stage 7.2F.1: Immutability Dokumen Terbit dengan Snapshot LetterIssuance)
  const resolvedDoc = useMemo<ResolvedLetterDocument | null>(() => {
    if (!validation.valid || !template) return null;
    return resolveLetterVariables(template, currentRequest, desaProfile, issuance);
  }, [validation.valid, template, currentRequest, desaProfile, issuance]);

  const handleIssueNowFromWorkspace = async () => {
    setIsIssuing(true);
    const actor = mode === 'aparatur' && currentUser ? {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    } : {
      id: currentWarga?.wargaAccountId || 'warga',
      name: currentWarga?.nama || 'Warga Mandiri',
      role: 'WARGA_MANDIRI'
    };

    const res = await LetterIssuanceService.issueLetter({
      letterRequestId: currentRequest.id,
      actor
    });

    setIsIssuing(false);

    if (res.success && res.issuance) {
      const refreshed = StorageService.getLetterRequestById(currentRequest.id);
      if (refreshed) {
        setCurrentRequest(refreshed);
      }
      setActionNotice(`Surat resmi berhasil diterbitkan dengan Nomor: ${res.issuance.nomorSurat}!`);
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      setActionNotice(res.error || 'Gagal menerbitkan surat.');
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Generate QR Code jika dokumen sudah terbit
  useEffect(() => {
    const url = issuance?.verificationUrl || 
      (issuance?.verificationToken ? LetterIssuanceService.generateVerificationUrl(issuance.verificationToken) : '');

    if (isPublished && url) {
      QRCode.toDataURL(url, {
        width: 256,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(urlData => setQrCodeDataUrl(urlData))
        .catch(err => console.warn('Gagal render QR Code:', err));
    }
  }, [isPublished, issuance?.verificationUrl, issuance?.verificationToken]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 140));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 75));
  const handleResetZoom = () => setZoomLevel(100);

  // Download PDF Resmi
  const handleDownloadPdf = async () => {
    if (!issuance) return;
    setIsDownloading(true);
    try {
      await exportOfficialLetterPdf({
        letterRequest,
        issuance,
        customTemplate: template,
        customProfile: desaProfile,
        saveFile: true
      });

      StorageService.logLetterAudit({
        actorType: mode === 'warga' ? 'warga' : 'aparatur',
        actorId: currentWarga?.wargaAccountId || currentUser?.id || 'unknown',
        actorName: currentWarga?.nama || currentUser?.name || 'Pengguna',
        letterRequestId: letterRequest.id,
        letterTypeCode: letterRequest.letterTypeCode,
        action: 'LETTER_DOWNLOADED',
        notes: `Dokumen PDF resmi nomor ${issuance.nomorSurat} berhasil diunduh.`,
        issuanceId: issuance.id
      });

      setActionNotice('Dokumen PDF resmi berhasil diunduh.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Gagal unduh PDF:', err);
      setActionNotice('Terjadi kesalahan saat menghasilkan file PDF.');
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setIsDownloading(false);
    }
  };

  // Cetak Dokumen via window.print()
  const handlePrint = () => {
    if (!canPrint) return;

    if (issuance) {
      StorageService.logLetterAudit({
        actorType: mode === 'warga' ? 'warga' : 'aparatur',
        actorId: currentWarga?.wargaAccountId || currentUser?.id || 'unknown',
        actorName: currentWarga?.nama || currentUser?.name || 'Pengguna',
        letterRequestId: letterRequest.id,
        letterTypeCode: letterRequest.letterTypeCode,
        action: 'LETTER_PRINTED',
        notes: `Pencetakan dokumen surat nomor ${issuance.nomorSurat} dilakukan.`,
        issuanceId: issuance.id
      });
    }

    // Panggil dialog cetak browser
    window.print();
  };

  // Efek cetak otomatis jika autoPrint diminta (misal dari tombol Cetak Surat di Riwayat)
  useEffect(() => {
    if (autoPrint && canPrint && resolvedDoc) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, canPrint, resolvedDoc]);

  // Jika validasi gagal (misal hak akses tidak sah atau data belum lengkap)
  if (!validation.valid || !resolvedDoc) {
    const errorContent = (
      <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-600/40 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Pratinjau Tidak Dapat Dibuka</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {validation.error || 'Terjadi ketidaksesuaian data pengajuan atau template persuratan desa.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleExit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              Kembali ke Menu Surat
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof document === 'undefined') return errorContent;
    return createPortal(errorContent, document.body);
  }

  const workspaceContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col overflow-hidden animate-fadeIn select-text print-workspace-modal">
      {/* ── TOP ACTION BAR (Modern Civic Service Workspace) ── */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-0 shrink-0 z-30 print-hide">
        {/* Baris Utama Desktop & Header Mobile */}
        <div className="sm:h-16 flex items-center justify-between gap-3">
          {/* SISI KIRI: Tombol KEMBALI Utama */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 hover:text-white border border-slate-600/80 hover:border-slate-500 shadow-md transition-all shrink-0 cursor-pointer"
              title="Kembali ke halaman sebelumnya (Esc)"
            >
              <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400 shrink-0" />
              <span>KEMBALI</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md">
                  {isTemplatePreview 
                    ? `Pratinjau Template: ${resolvedDoc.title}`
                    : isPublished 
                      ? resolvedDoc.title 
                      : `Preview Surat: ${resolvedDoc.title}`}
                </h2>
                {isTemplatePreview ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 shrink-0">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>PRATINJAU TEMPLATE</span>
                  </span>
                ) : isPublished ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="hidden xs:inline">Terbit Resmi</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 shrink-0">
                    <span className="hidden xs:inline">Draf Preview</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden xs:block">
                {isTemplatePreview ? (
                  <>Kode: <span className="font-mono text-indigo-300">{template?.code || '-'}</span> • Versi: <span className="font-mono text-slate-200">v{resolvedDoc.templateVersion}</span> • Status: <span className={`font-semibold ${template?.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>{template?.status || 'ACTIVE'}</span></>
                ) : isPublished && issuance ? (
                  <>Nomor: <span className="font-mono text-emerald-400 font-semibold">{issuance.nomorSurat}</span> • Reg: <span className="font-mono text-slate-300">{issuance.nomorRegistrasi}</span></>
                ) : (
                  <>ID: <span className="font-mono text-slate-300">{letterRequest.id}</span> • Versi Template: <span className="font-mono text-slate-400">v{resolvedDoc.templateVersion}</span></>
                )}
              </p>
            </div>
          </div>

          {/* SISI KANAN (Desktop Controls) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Zoom controls */}
            <div className="hidden lg:flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 gap-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                title="Perkecil"
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom (100%)"
                className="px-2 py-1 text-xs font-mono font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 140}
                title="Perbesar"
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TOMBOL TERBITKAN SURAT RESMI (JIKA STATUS SUDAH SIAP ATAU INSTAN) */}
            {!isTemplatePreview && !isPublished && (currentRequest.status === 'SIAP_DITERBITKAN' || currentRequest.status === 'DISETUJUI' || (mode === 'warga' && currentRequest.workflowLevel === 'LEVEL_1_INSTAN')) && (
              <button
                disabled={isIssuing}
                onClick={handleIssueNowFromWorkspace}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
                title="Terbitkan Dokumen Resmi dan Alokasikan Nomor Surat"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isIssuing ? 'Menerbitkan...' : mode === 'aparatur' ? 'Terbitkan Surat' : 'Terbitkan Sekarang'}
              </button>
            )}

            {/* Verifikasi QR */}
            {isPublished && issuance && (
              <button
                onClick={() => setIsVerifyingOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                title="Periksa Keabsahan QR Verifikasi"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                Verifikasi QR
              </button>
            )}

            {/* AKSI CETAK DOKUMEN RESMI (window.print) */}
            <button
              disabled={!canPrint}
              onClick={handlePrint}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                canPrint
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-900/30 border border-blue-500/50'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
              }`}
              title={
                canPrint
                  ? "Cetak Lembar Surat ke Printer A4 (Print Preview)"
                  : !isLetterIssued
                    ? "Surat belum diterbitkan secara resmi"
                    : "Hanya pemilik surat atau aparatur yang berhak mencetak dokumen ini"
              }
            >
              <Printer className="w-3.5 h-3.5 text-blue-200" />
              CETAK
            </button>

            {/* AKSI DOWNLOAD PDF RESMI (exportOfficialLetterPdf) */}
            {isPublished && issuance && (
              <button
                disabled={isDownloading}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
                title="Unduh File PDF Dokumen Resmi"
              >
                <Download className="w-3.5 h-3.5" />
                {isDownloading ? 'Menyiapkan...' : 'DOWNLOAD PDF'}
              </button>
            )}

            {/* TOMBOL TUTUP PREVIEW */}
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Tutup Preview Surat"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>TUTUP</span>
            </button>
          </div>

          {/* Tombol Tutup Cepat di Mobile Top Bar */}
          <div className="sm:hidden flex items-center gap-1">
            <button
              onClick={handleExit}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Tutup Preview"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Baris Mobile Khusus (sm:hidden): Action Bar CETAK & DOWNLOAD PDF */}
        <div className="sm:hidden flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 mt-1">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              disabled={!canPrint}
              onClick={handlePrint}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                canPrint
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer border border-blue-500/50'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              CETAK
            </button>

            {isPublished && issuance && (
              <button
                disabled={isDownloading}
                onClick={handleDownloadPdf}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
            )}
          </div>

          {!isPublished && (currentRequest.status === 'SIAP_DITERBITKAN' || currentRequest.status === 'DISETUJUI' || (mode === 'warga' && currentRequest.workflowLevel === 'LEVEL_1_INSTAN')) && (
            <button
              disabled={isIssuing}
              onClick={handleIssueNowFromWorkspace}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white cursor-pointer"
            >
              Terbitkan
            </button>
          )}
        </div>
      </header>

      {/* ── BANNER INFORMASI STATUS DOKUMEN ── */}
      <div className={`px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0 print-hide ${
        isPublished 
          ? 'bg-emerald-950/80 border-b border-emerald-800/60 text-emerald-200' 
          : 'bg-amber-950/70 border-b border-amber-800/60 text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5 mx-auto max-w-4xl text-center sm:text-left">
          {isPublished ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:block" />
              <span>
                <strong>SURAT RESMI TERBIT:</strong> Dokumen ini sah dan terdaftar pada Buku Arsip Desa Beliti Jaya dengan nomor resmi <strong className="font-mono text-white">{issuance?.nomorSurat}</strong>. Dilengkapi QR Verifikasi keabsahan publik.
              </span>
            </>
          ) : (
            <>
              <Info className="w-4 h-4 text-amber-400 shrink-0 hidden sm:block" />
              <span>
                <strong>DRAF PRATINJAU DOKUMEN:</strong> Nomor registrasi definitif, tanda tangan, dan cap resmi belum diterbitkan. Dokumen ini masih dalam tahap peninjauan.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Notifikasi Aksi */}
      {actionNotice && (
        <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4 text-center font-medium print-hide animate-fadeIn">
          {actionNotice}
        </div>
      )}

      {/* ── WORKSPACE SCROLL AREA (Lembar Dokumen A4 Putih) ── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/90 custom-scrollbar print-workspace-modal">
        <div 
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out print-hide-transform"
        >
          {/* LEMBAR KERTAS SURAT (A4 Standard Styling) */}
          <div className="relative w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-10 sm:p-14 font-serif text-[13.5px] leading-relaxed border border-slate-300 flex flex-col justify-between print-document-sheet">
            
            {/* Watermark Diagonal Draf Preview (HANYA DITAMPILKAN JIKA BELUM TERBIT) */}
            {!isPublished && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
                <span className="text-slate-900/[0.045] font-sans font-black text-6xl tracking-widest uppercase rotate-[-35deg] select-none text-center">
                  DRAF PREVIEW<br />BELUM DITERBITKAN
                </span>
              </div>
            )}

            <div>
              {/* ── KOP SURAT RESMI PEMERINTAH DESA (Official Kop) ── */}
              <div className="flex items-center gap-5 border-b-[3px] border-double border-slate-900 pb-3 mb-6 relative">
                {/* Logo Desa */}
                <div className="w-20 h-22 shrink-0 flex items-center justify-center">
                  {desaProfile.logoDesa ? (
                    <img 
                      src={desaProfile.logoDesa} 
                      alt="Logo Desa Beliti Jaya" 
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-slate-400 flex items-center justify-center text-slate-500">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Teks Identitas Pemerintah */}
                <div className="flex-1 text-center font-sans tracking-wide">
                  <h3 className="text-[13px] font-bold uppercase text-slate-800 leading-tight">
                    PEMERINTAH KABUPATEN {desaProfile.kabupaten.toUpperCase()}
                  </h3>
                  <h2 className="text-[14.5px] font-bold uppercase text-slate-900 leading-tight">
                    KECAMATAN {desaProfile.kecamatan.toUpperCase()}
                  </h2>
                  <h1 className="text-[18px] font-extrabold uppercase text-emerald-800 leading-tight tracking-wider">
                    PEMERINTAH DESA {desaProfile.namaDesa.toUpperCase()}
                  </h1>
                  <p className="text-[11px] font-normal text-slate-600 mt-0.5 leading-snug">
                    {desaProfile.alamatKantor} • Kode Pos: {desaProfile.kodePos}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                    Email: {desaProfile.emailDesa || '-'} • Telepon: {desaProfile.teleponDesa || '-'}
                  </p>
                </div>
              </div>

              {/* ── KONTEN UTAMA DOKUMEN: PERCABANGAN SURAT DINAS VS SURAT WARGA ── */}
              {resolvedDoc.isSuratDinas ? (
                /* ══════════════════════════════════════════════════════════════════
                   TATA NASKAH SURAT DINAS PEMERINTAH DESA (STAGE 7.2B.4B)
                   ══════════════════════════════════════════════════════════════════ */
                <div>
                  {currentRequest.letterTypeCode === 'DINAS_UNDANGAN' && (
                    <div>
                      {/* Header Surat Undangan Dinas */}
                      <div className="flex justify-between items-start my-4 text-[13px] font-sans">
                        {/* Kiri: Nomor, Sifat, Lampiran, Perihal */}
                        <div className="space-y-1 w-7/12">
                          <div className="flex">
                            <span className="w-24 shrink-0 text-slate-700">Nomor</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-mono font-bold text-slate-900">
                              {isPublished && issuance ? issuance.nomorSurat : resolvedDoc.fullNomorSurat}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-24 shrink-0 text-slate-700">Sifat</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 text-slate-900">{resolvedDoc.suratDinasData?.sifatSurat || 'Biasa'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 shrink-0 text-slate-700">Lampiran</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 text-slate-900">{resolvedDoc.suratDinasData?.lampiran || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 shrink-0 text-slate-700">Perihal</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-bold text-slate-900 underline">{resolvedDoc.suratDinasData?.perihal || '-'}</span>
                          </div>
                        </div>

                        {/* Kanan: Tempat/Tanggal & Tujuan Surat */}
                        <div className="w-5/12 text-left pl-6 space-y-3">
                          <div className="text-slate-800">
                            {resolvedDoc.datePlace}
                          </div>
                          <div className="space-y-0.5 text-slate-800 leading-snug">
                            <p>Kepada Yth.</p>
                            <p className="font-bold text-slate-950">{resolvedDoc.suratDinasData?.tujuanSurat}</p>
                            {resolvedDoc.suratDinasData?.instansiTujuan && (
                              <p className="text-slate-800">{resolvedDoc.suratDinasData.instansiTujuan}</p>
                            )}
                            <p className="pt-1">di -</p>
                            <p className="pl-4 italic">{resolvedDoc.suratDinasData?.alamatTujuan || 'Tempat'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Paragraf Pembuka */}
                      <div className="text-justify indent-8 text-[13.5px] mt-6 mb-4 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.opening}
                      </div>

                      {/* Rincian Agenda Undangan */}
                      <div className="my-4 pl-8 sm:pl-12 space-y-1.5 font-sans text-[13px]">
                        {resolvedDoc.dinasDetails?.map((item, idx) => (
                          <div key={idx} className="flex">
                            <span className="w-44 shrink-0 text-slate-700">{item.label}</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Isi Khusus / Uraian Tambahan */}
                      {resolvedDoc.suratDinasData?.isiSurat && (
                        <div className="text-justify indent-8 text-[13.5px] my-3 text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                          {resolvedDoc.suratDinasData.isiSurat}
                        </div>
                      )}

                      {/* Body Paragraphs dari Template */}
                      <div className="space-y-2.5 my-4 font-sans text-[13.5px] text-justify leading-relaxed text-slate-800">
                        {resolvedDoc.bodyParagraphs.map((par, idx) => (
                          <p key={idx} className="indent-8">{par}</p>
                        ))}
                      </div>

                      {/* Kalimat Penutup */}
                      <div className="text-justify indent-8 text-[13.5px] mt-4 mb-8 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.closing}
                      </div>
                    </div>
                  )}

                  {currentRequest.letterTypeCode === 'DINAS_TUGAS' && (
                    <div>
                      {/* Judul & Nomor Surat Tugas */}
                      <div className="text-center my-5">
                        <h2 className="text-[16px] font-bold uppercase tracking-wider underline decoration-1 underline-offset-4 text-slate-950 font-sans">
                          {resolvedDoc.title}
                        </h2>
                        <p className="text-[13px] font-sans font-medium text-slate-700 mt-1">
                          Nomor : <span className="font-mono font-semibold text-slate-900">
                            {isPublished && issuance ? issuance.nomorSurat : resolvedDoc.fullNomorSurat}
                          </span>
                        </p>
                      </div>

                      {/* Dasar / Pembuka */}
                      <div className="text-justify indent-8 text-[13.5px] mb-4 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.opening}
                      </div>

                      {/* MEMERINTAHKAN */}
                      <div className="text-center my-3 font-bold font-sans text-[13px] tracking-widest text-slate-900">
                        MEMERINTAHKAN:
                      </div>

                      {/* Kepada & Rincian Tugas */}
                      <div className="my-3 pl-4 sm:pl-8 space-y-2 font-sans text-[13px]">
                        <div className="font-bold text-slate-900">Kepada:</div>
                        <div className="pl-4 space-y-1">
                          <div className="flex">
                            <span className="w-52 shrink-0 text-slate-700">Nama Petugas</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{resolvedDoc.variableMap.nama_petugas || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-52 shrink-0 text-slate-700">Jabatan</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{resolvedDoc.variableMap.jabatan_petugas || '-'}</span>
                          </div>
                        </div>

                        <div className="font-bold text-slate-900 pt-2">Untuk:</div>
                        <div className="pl-4 space-y-1">
                          <div className="flex">
                            <span className="w-52 shrink-0 text-slate-700">1. Maksud & Uraian Tugas</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{resolvedDoc.variableMap.tujuan_tugas || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-52 shrink-0 text-slate-700">2. Tempat / Lokasi</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{resolvedDoc.variableMap.lokasi_tugas || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-52 shrink-0 text-slate-700">3. Jangka Waktu</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{resolvedDoc.variableMap.jangka_waktu || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Isi Tambahan jika ada */}
                      {resolvedDoc.suratDinasData?.isiSurat && (
                        <div className="text-justify indent-8 text-[13.5px] my-3 text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                          {resolvedDoc.suratDinasData.isiSurat}
                        </div>
                      )}

                      {/* Body Paragraphs dari Template */}
                      <div className="space-y-2.5 my-4 font-sans text-[13.5px] text-justify leading-relaxed text-slate-800">
                        {resolvedDoc.bodyParagraphs.map((par, idx) => (
                          <p key={idx} className="indent-8">{par}</p>
                        ))}
                      </div>

                      {/* Kalimat Penutup */}
                      <div className="text-justify indent-8 text-[13.5px] mt-4 mb-8 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.closing}
                      </div>
                    </div>
                  )}

                  {currentRequest.letterTypeCode === 'DINAS_EDARAN' && (
                    <div>
                      {/* Judul, Nomor & Tentang */}
                      <div className="text-center my-5 space-y-1">
                        <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-950 font-sans">
                          {resolvedDoc.title}
                        </h2>
                        <p className="text-[13px] font-sans font-medium text-slate-700">
                          Nomor : <span className="font-mono font-semibold text-slate-900">
                            {isPublished && issuance ? issuance.nomorSurat : resolvedDoc.fullNomorSurat}
                          </span>
                        </p>
                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-800 pt-1">
                          TENTANG
                        </p>
                        <p className="text-[13.5px] font-bold uppercase text-slate-950 max-w-lg mx-auto underline">
                          {resolvedDoc.suratDinasData?.perihal || resolvedDoc.variableMap.hal_pemberitahuan || '-'}
                        </p>
                      </div>

                      {/* Sasaran Penerima Edaran */}
                      <div className="my-4 text-[13px] font-sans text-slate-800 pl-4">
                        <p>Kepada Yth:</p>
                        <p className="font-bold text-slate-950 pl-2">
                          {resolvedDoc.suratDinasData?.tujuanSurat || resolvedDoc.variableMap.sasaran_penerima || 'Seluruh Warga Masyarakat Desa Beliti Jaya'}
                        </p>
                        <p className="pl-2 pt-0.5">di - Tempat</p>
                      </div>

                      {/* Paragraf Pembuka */}
                      <div className="text-justify indent-8 text-[13.5px] mb-4 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.opening}
                      </div>

                      {/* Rincian Pokok Edaran */}
                      <div className="my-4 pl-4 sm:pl-8 space-y-1.5 font-sans text-[13px]">
                        {resolvedDoc.dinasDetails?.map((item, idx) => (
                          <div key={idx} className="flex">
                            <span className="w-52 shrink-0 text-slate-700 font-medium">{item.label}</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Isi Surat / Penjelasan Khusus jika ada */}
                      {resolvedDoc.suratDinasData?.isiSurat && (
                        <div className="text-justify indent-8 text-[13.5px] my-3 text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                          {resolvedDoc.suratDinasData.isiSurat}
                        </div>
                      )}

                      {/* Body Paragraphs dari Template */}
                      <div className="space-y-2.5 my-4 font-sans text-[13.5px] text-justify leading-relaxed text-slate-800">
                        {resolvedDoc.bodyParagraphs.map((par, idx) => (
                          <p key={idx} className="indent-8">{par}</p>
                        ))}
                      </div>

                      {/* Kalimat Penutup */}
                      <div className="text-justify indent-8 text-[13.5px] mt-4 mb-8 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.closing}
                      </div>
                    </div>
                  )}

                  {currentRequest.letterTypeCode === 'DINAS_REKOMENDASI' && (
                    <div>
                      {/* Judul & Nomor Rekomendasi */}
                      <div className="text-center my-5">
                        <h2 className="text-[16px] font-bold uppercase tracking-wider underline decoration-1 underline-offset-4 text-slate-950 font-sans">
                          {resolvedDoc.title}
                        </h2>
                        <p className="text-[13px] font-sans font-medium text-slate-700 mt-1">
                          Nomor : <span className="font-mono font-semibold text-slate-900">
                            {isPublished && issuance ? issuance.nomorSurat : resolvedDoc.fullNomorSurat}
                          </span>
                        </p>
                      </div>

                      {/* Paragraf Pembuka */}
                      <div className="text-justify indent-8 text-[13.5px] mb-4 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.opening}
                      </div>

                      {/* Rincian Rekomendasi */}
                      <div className="my-4 pl-4 sm:pl-8 space-y-1.5 font-sans text-[13px]">
                        {resolvedDoc.dinasDetails?.map((item, idx) => (
                          <div key={idx} className="flex">
                            <span className="w-56 shrink-0 text-slate-700 font-medium">{item.label}</span>
                            <span className="w-4 shrink-0 text-center">:</span>
                            <span className="flex-1 font-semibold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Isi Tambahan jika ada */}
                      {resolvedDoc.suratDinasData?.isiSurat && (
                        <div className="text-justify indent-8 text-[13.5px] my-3 text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                          {resolvedDoc.suratDinasData.isiSurat}
                        </div>
                      )}

                      {/* Body Paragraphs dari Template */}
                      <div className="space-y-2.5 my-4 font-sans text-[13.5px] text-justify leading-relaxed text-slate-800">
                        {resolvedDoc.bodyParagraphs.map((par, idx) => (
                          <p key={idx} className="indent-8">{par}</p>
                        ))}
                      </div>

                      {/* Kalimat Penutup */}
                      <div className="text-justify indent-8 text-[13.5px] mt-4 mb-8 text-slate-800 leading-relaxed font-sans">
                        {resolvedDoc.closing}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ══════════════════════════════════════════════════════════════════
                   TATA NASKAH SURAT KETERANGAN WARGA EXISTING
                   ══════════════════════════════════════════════════════════════════ */
                <div>
                  {/* ── JUDUL SURAT & NOMOR SURAT ── */}
                  <div className="text-center my-5">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider underline decoration-1 underline-offset-4 text-slate-950 font-sans">
                      {resolvedDoc.title}
                    </h2>
                    <p className="text-[13px] font-sans font-medium text-slate-700 mt-1">
                      Nomor : <span className="font-mono font-semibold text-slate-900">
                        {isPublished && issuance ? issuance.nomorSurat : resolvedDoc.fullNomorSurat}
                      </span>
                    </p>
                  </div>

                  {/* ── KALIMAT PEMBUKA ── */}
                  <div className="text-justify indent-8 text-[13.5px] mb-4 text-slate-800 leading-relaxed font-sans">
                    {resolvedDoc.opening}
                  </div>

                  {/* ── DATA PEMOHON (SNAPSHOT KEPENDUDUKAN) ── */}
                  <div className="my-3 pl-4 sm:pl-6 space-y-1 font-sans text-[13px]">
                    {resolvedDoc.pemohonData.map((item, idx) => (
                      <div key={idx} className="flex">
                        <span className="w-56 shrink-0 text-slate-700">{item.label}</span>
                        <span className="w-4 shrink-0 text-center">:</span>
                        <span className="flex-1 font-semibold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── RINCIAN ISIAN TAMBAHAN KHUSUS SURAT (JIKA ADA) ── */}
                  {resolvedDoc.customDisplayFields && resolvedDoc.customDisplayFields.length > 0 && (
                    <div className="my-4 p-3.5 bg-slate-50 rounded border border-slate-200 font-sans text-[12.5px] space-y-1">
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 pb-1 border-b border-slate-200">
                        Rincian Keterangan Dokumen / Keperluan:
                      </div>
                      {resolvedDoc.customDisplayFields.map((field, idx) => (
                        <div key={idx} className="flex">
                          <span className="w-52 shrink-0 text-slate-600 font-medium">{field.label}</span>
                          <span className="w-4 shrink-0 text-center">:</span>
                          <span className="flex-1 font-semibold text-slate-900">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── PARAGRAF ISI KHUSUS (TEMPLATE BODY) ── */}
                  <div className="space-y-2.5 my-4 font-sans text-[13.5px] text-justify leading-relaxed text-slate-800">
                    {resolvedDoc.bodyParagraphs.map((par, idx) => (
                      <p key={idx} className="indent-8">
                        {par}
                      </p>
                    ))}
                  </div>

                  {/* ── KALIMAT PENUTUP ── */}
                  <div className="text-justify indent-8 text-[13.5px] mt-4 mb-8 text-slate-800 leading-relaxed font-sans">
                    {resolvedDoc.closing}
                  </div>
                </div>
              )}
            </div>

            {/* ── BLOK TANDA TANGAN & QR CODE VERIFIKASI RESMI ── */}
            <div className="mt-6 pt-4 font-sans flex items-end justify-between gap-6">
              {/* QR Code Verifikasi Publik */}
              <div className="flex flex-col items-center text-center">
                {isPublished && qrCodeDataUrl ? (
                  <div className="space-y-1.5">
                    <div className="p-1.5 bg-white border border-slate-300 rounded shadow-sm inline-block">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Verifikasi Surat Resmi" 
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      PINDAI VERIFIKASI
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      Reg: {issuance?.nomorRegistrasi}
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-400">
                    <QrCode className="w-8 h-8 text-slate-300 mb-1" />
                    <span>QR Verifikasi Pasca Terbit</span>
                  </div>
                )}
              </div>

              {/* Tanda Tangan Kepala Desa */}
              <div className="w-72 text-center text-[13px]">
                <p className="text-slate-800">{resolvedDoc.datePlace}</p>
                <p className="font-bold text-slate-900 mt-1 uppercase tracking-wide">
                  {resolvedDoc.signatoryRole}
                </p>

                {/* Ruang Tanda Tangan Administratif Manual & Cap Resmi Desa */}
                <div className="h-20 my-1 flex items-center justify-center relative">
                  {!isPublished && (
                    <div className="border border-dashed border-amber-300 bg-amber-50/60 rounded px-3 py-1 text-[10px] text-amber-800 font-mono print-hide">
                      [ Ruang Tanda Tangan & Cap Resmi ]
                    </div>
                  )}
                </div>

                {/* Nama Pejabat */}
                <p className="font-bold text-slate-950 uppercase tracking-wide underline underline-offset-2">
                  {resolvedDoc.signatoryName || '( ........................................ )'}
                </p>
                {resolvedDoc.signatoryNip && resolvedDoc.signatoryNip !== '-' && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    NIP. {resolvedDoc.signatoryNip}
                  </p>
                )}
              </div>
            </div>

            {/* ── TEMBUSAN SURAT DINAS (JIKA ADA) ── */}
            {resolvedDoc.isSuratDinas && resolvedDoc.suratDinasData?.tembusan && resolvedDoc.suratDinasData.tembusan.length > 0 && (
              <div className="mt-4 pt-2 text-[12px] font-sans text-slate-800">
                <p className="font-bold underline">Tembusan disampaikan kepada Yth:</p>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 pl-1">
                  {resolvedDoc.suratDinasData.tembusan.map((item, idx) => (
                    <li key={idx} className="text-slate-700">{item}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── CATATAN KAKI DOKUMEN SISTEM ── */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9.5px] font-sans text-slate-400">
              <div>
                SIG Desa Beliti Jaya • Sistem Informasi Geografis Kependudukan & Layanan Mandiri
              </div>
              <div className="font-mono">
                {isPublished && issuance ? (
                  <>ID: {issuance.id} • Diterbitkan sah pada {new Date(issuance.issuedAt).toLocaleDateString('id-ID')}</>
                ) : (
                  <>ID: {letterRequest.id} • Draf Pratinjau Sistem</>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Verifikasi QR Publik */}
      {isVerifyingOpen && issuance && (
        <PublicLetterVerificationModal
          isOpen={isVerifyingOpen}
          onClose={() => setIsVerifyingOpen(false)}
          initialToken={issuance.verificationToken}
        />
      )}
    </div>
  );

  if (typeof document === 'undefined') {
    return workspaceContent;
  }

  return createPortal(workspaceContent, document.body);
};
