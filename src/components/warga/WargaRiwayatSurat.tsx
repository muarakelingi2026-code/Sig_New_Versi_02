import React, { useState, useMemo } from 'react';
import { 
  LetterRequest, 
  LetterRequestStatus, 
  WargaSession,
  WorkflowLevel
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
  ArrowRight, 
  Building2, 
  User, 
  Calendar, 
  FileCheck,
  Info,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Download,
  Printer,
  QrCode
} from 'lucide-react';

interface WargaRiwayatSuratProps {
  currentWarga: WargaSession;
  onNavigateToCreate: (letterTypeId?: string) => void;
}

export const WargaRiwayatSurat: React.FC<WargaRiwayatSuratProps> = ({
  currentWarga,
  onNavigateToCreate
}) => {
  const [requests, setRequests] = useState<LetterRequest[]>(() => 
    StorageService.getLetterRequestsByWarga(currentWarga.wargaAccountId)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
  const [previewingRequest, setPreviewingRequest] = useState<LetterRequest | null>(null);
  const [autoPrintWorkspace, setAutoPrintWorkspace] = useState(false);
  const [isVerifyingOpen, setIsVerifyingOpen] = useState(false);
  const [verifyTargetToken, setVerifyTargetToken] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const refreshRequests = () => {
    const updated = StorageService.getLetterRequestsByWarga(currentWarga.wargaAccountId);
    setRequests(updated);
    if (selectedRequest) {
      const found = updated.find(r => r.id === selectedRequest.id);
      setSelectedRequest(found || null);
    }
  };

  const handleDownloadPdfDirect = async (req: LetterRequest) => {
    const issuance = StorageService.getLetterIssuanceByRequestId(req.id);
    if (!issuance) {
      setActionMessage({ text: 'Dokumen penerbitan belum tersedia untuk pengajuan ini.', type: 'error' });
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }

    try {
      await exportOfficialLetterPdf({
        letterRequest: req,
        issuance,
        saveFile: true
      });
      StorageService.logLetterAudit({
        actorType: 'warga',
        actorId: currentWarga.wargaAccountId,
        actorName: currentWarga.nama,
        letterRequestId: req.id,
        letterTypeCode: req.letterTypeCode,
        action: 'LETTER_DOWNLOADED',
        notes: `Dokumen PDF nomor ${issuance.nomorSurat} diunduh dari riwayat surat.`,
        issuanceId: issuance.id
      });
      setActionMessage({ text: `File PDF ${issuance.nomorSurat} berhasil diunduh.`, type: 'success' });
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Gagal mengunduh file PDF.', type: 'error' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleIssueNow = async (req: LetterRequest) => {
    const res = await LetterIssuanceService.issueLetter({
      letterRequestId: req.id,
      actor: {
        id: currentWarga.wargaAccountId,
        name: currentWarga.nama,
        role: 'WARGA_MANDIRI'
      }
    });

    if (res.success && res.issuance) {
      setActionMessage({
        text: `Surat resmi berhasil diterbitkan dengan nomor ${res.issuance.nomorSurat}!`,
        type: 'success'
      });
      refreshRequests();
      const updatedReq = StorageService.getLetterRequestById(req.id);
      if (updatedReq) {
        setPreviewingRequest(updatedReq);
      }
    } else {
      setActionMessage({
        text: res.error || 'Gagal menerbitkan surat.',
        type: 'error'
      });
    }
    setTimeout(() => setActionMessage(null), 4500);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchSearch = 
        req.letterTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.letterTypeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const handleCancelRequest = (req: LetterRequest) => {
    if (!window.confirm(`Batalkan pengajuan ${req.letterTypeName}? Tindakan ini tidak dapat diurungkan.`)) {
      return;
    }

    setIsCancelling(true);
    const result = StorageService.cancelLetterRequest(req.id, currentWarga);
    setIsCancelling(false);

    if (result.success) {
      setActionMessage({ text: 'Pengajuan surat berhasil dibatalkan.', type: 'success' });
      refreshRequests();
    } else {
      setActionMessage({ text: result.error || 'Gagal membatalkan pengajuan.', type: 'error' });
    }

    setTimeout(() => setActionMessage(null), 4000);
  };

  const getStatusBadge = (status: LetterRequestStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Draft
          </span>
        );
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Menunggu Persetujuan Kades
          </span>
        );
      case 'DISETUJUI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Disetujui
          </span>
        );
      case 'SIAP_DITERBITKAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <FileCheck className="w-3.5 h-3.5 text-teal-400" />
            Siap Diterbitkan
          </span>
        );
      case 'TERBIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
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
            Dibatalkan
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            Level 1 • Instan
          </span>
        );
      case 'LEVEL_2_VERIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60">
            Level 2 • Verifikasi Operator
          </span>
        );
      case 'LEVEL_3_PERSETUJUAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60">
            Level 3 • Persetujuan Kades
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-fadeIn ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Control Bar: Search & Status Filter */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari jenis surat atau kode..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="TERBIT">Terbit Resmi</option>
            <option value="SIAP_DITERBITKAN">Siap Diterbitkan</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="DIVERIFIKASI">Diverifikasi</option>
            <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DITOLAK">Ditolak</option>
            <option value="DIBATALKAN">Dibatalkan</option>
          </select>

          <button
            onClick={() => {
              setVerifyTargetToken('');
              setIsVerifyingOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shrink-0 cursor-pointer"
            title="Verifikasi Surat Resmi Berdasarkan Token / QR"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            Cek Validitas QR
          </button>

          <button
            onClick={() => onNavigateToCreate()}
            className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Ajukan Surat Baru
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">Belum Ada Pengajuan Surat</h4>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' 
              ? 'Tidak ada pengajuan surat yang sesuai dengan kriteria pencarian atau filter status.' 
              : 'Anda belum memiliki riwayat permohonan surat administrasi desa. Ajukan surat baru secara mandiri.'}
          </p>
          <button
            onClick={() => onNavigateToCreate()}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600/90 hover:bg-emerald-600 text-white transition-all"
          >
            Mulai Pengajuan Surat
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base text-slate-100">{req.letterTypeName}</span>
                  {getStatusBadge(req.status)}
                  {getWorkflowBadge(req.workflowLevel)}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Diajukan: {new Date(req.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pemohon: {req.autoData?.nama || '-'} (NIK: {req.autoData?.nik || '-'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>No. Surat: <strong className="text-slate-300 font-normal">{req.nomorSurat || 'Belum diterbitkan'}</strong></span>
                  </div>
                </div>

                {req.status === 'DITOLAK' && req.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Catatan Penolakan: </span>
                      <span>{req.rejectionReason}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {req.status === 'TERBIT' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => {
                        setAutoPrintWorkspace(false);
                        setPreviewingRequest(req);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Lihat Surat
                    </button>
                    <button
                      onClick={() => {
                        setAutoPrintWorkspace(false);
                        setPreviewingRequest(req);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all cursor-pointer"
                      title="Buka Preview & Cetak Surat Mandiri (A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Surat
                    </button>
                    <button
                      onClick={() => handleDownloadPdfDirect(req)}
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
                      title="Verifikasi Keaslian QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-400" />
                      QR
                    </button>
                  </div>
                )}

                {req.status === 'SIAP_DITERBITKAN' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleIssueNow(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terbitkan Surat
                    </button>
                    <button
                      onClick={() => setPreviewingRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/40 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      Preview
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedRequest(req)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  Rincian
                </button>

                {(req.status === 'DRAFT' || req.status === 'MENUNGGU_VERIFIKASI') && (
                  <button
                    disabled={isCancelling}
                    onClick={() => handleCancelRequest(req)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 transition-all"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{selectedRequest.letterTypeName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">ID: {selectedRequest.id}</span>
                    <span className="text-xs text-slate-600">•</span>
                    {getWorkflowBadge(selectedRequest.workflowLevel)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-6 text-sm">
              {/* Status Section */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Status Pengajuan Saat Ini:</div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                  <div className="text-xs text-slate-400">Nomor Registrasi Surat:</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    {selectedRequest.nomorSurat || 'Belum diterbitkan (Tahap Verifikasi)'}
                  </div>
                </div>
              </div>

              {/* Data Pemohon (Snapshot Administrasi Kependudukan) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Data Pemohon (Sesuai Kependudukan Desa)
                  </h4>
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Read-Only</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedRequest.autoData?.nama || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">NIK:</span>
                    <p className="font-mono font-semibold text-slate-200 mt-0.5">{selectedRequest.autoData?.nik || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nomor KK:</span>
                    <p className="font-mono text-slate-300 mt-0.5">{selectedRequest.autoData?.noKk || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
                    <p className="text-slate-300 mt-0.5">{selectedRequest.autoData?.tempatLahir || '-'}, {selectedRequest.autoData?.tanggalLahir || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Jenis Kelamin / Agama:</span>
                    <p className="text-slate-300 mt-0.5">{selectedRequest.autoData?.jenisKelamin || '-'} / {selectedRequest.autoData?.agama || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Pekerjaan:</span>
                    <p className="text-slate-300 mt-0.5">{selectedRequest.autoData?.pekerjaan || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Alamat Domisili:</span>
                    <p className="text-slate-300 mt-0.5">{selectedRequest.autoData?.alamat || '-'} (RT {selectedRequest.autoData?.rt || '-'}/RW {selectedRequest.autoData?.rw || '-'}, {selectedRequest.autoData?.dusun || '-'})</p>
                  </div>
                </div>
              </div>

              {/* Data Isian Tambahan Surat */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  Data Isian Formulir Pengajuan
                </h4>

                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2 text-xs">
                  {Object.entries(selectedRequest.formData).length === 0 ? (
                    <p className="text-slate-500 italic">Tidak ada data isian formulir tambahan.</p>
                  ) : (
                    Object.entries(selectedRequest.formData).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-850 last:border-0">
                        <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-medium text-slate-200 sm:text-right">{String(value)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Persyaratan yang Dikonfirmasi */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Konfirmasi Dokumen Fisik
                </h4>

                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 text-xs">
                  {selectedRequest.confirmedRequirements.length === 0 ? (
                    <p className="text-slate-500 italic">Tidak ada checklist berkas fisik khusus.</p>
                  ) : (
                    selectedRequest.confirmedRequirements.map((reqItem, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{reqItem}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Catatan Verifikator & Riwayat Proses */}
              {(selectedRequest.reviewedBy || selectedRequest.rejectionReason || selectedRequest.notes) && (
                <div className="p-4 rounded-2xl bg-slate-850/60 border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    Informasi Catatan Petugas Balai Desa
                  </div>
                  {selectedRequest.reviewedBy && (
                    <p className="text-slate-400">
                      Petugas Pemeriksa: <strong className="text-slate-200">{selectedRequest.reviewedBy}</strong> pada {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString('id-ID') : '-'}
                    </p>
                  )}
                  {selectedRequest.rejectionReason && (
                    <p className="text-rose-300 bg-rose-950/50 p-2.5 rounded-xl border border-rose-800/50">
                      <strong>Alasan Penolakan: </strong>{selectedRequest.rejectionReason}
                    </p>
                  )}
                  {selectedRequest.notes && (
                    <p className="text-slate-300">
                      <strong>Catatan Petugas: </strong>{selectedRequest.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Pemerintah Desa Beliti Jaya
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedRequest.status === 'TERBIT' ? (
                  <>
                    <button
                      onClick={() => {
                        const reqToPreview = selectedRequest;
                        setSelectedRequest(null);
                        setAutoPrintWorkspace(false);
                        setPreviewingRequest(reqToPreview);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Buka Lembar Surat Resmi
                    </button>
                    <button
                      onClick={() => {
                        const reqToPreview = selectedRequest;
                        setSelectedRequest(null);
                        setAutoPrintWorkspace(false);
                        setPreviewingRequest(reqToPreview);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Buka Preview & Cetak Surat Mandiri (A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Surat
                    </button>
                    <button
                      onClick={() => handleDownloadPdfDirect(selectedRequest)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        const iss = StorageService.getLetterIssuanceByRequestId(selectedRequest.id);
                        if (iss) {
                          setVerifyTargetToken(iss.verificationToken);
                          setIsVerifyingOpen(true);
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-400" />
                      QR
                    </button>
                  </>
                ) : selectedRequest.status === 'SIAP_DITERBITKAN' ? (
                  <>
                    <button
                      onClick={() => {
                        const target = selectedRequest;
                        setSelectedRequest(null);
                        handleIssueNow(target);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terbitkan Surat Sekarang
                    </button>
                    <button
                      onClick={() => {
                        const reqToPreview = selectedRequest;
                        setSelectedRequest(null);
                        setPreviewingRequest(reqToPreview);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 border border-teal-500/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Lihat Preview Dokumen
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const reqToPreview = selectedRequest;
                      setSelectedRequest(null);
                      setPreviewingRequest(reqToPreview);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600/90 hover:bg-teal-500 text-white border border-teal-500/40 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Lihat Preview Dokumen
                  </button>
                )}

                {(selectedRequest.status === 'DRAFT' || selectedRequest.status === 'MENUNGGU_VERIFIKASI') && (
                  <button
                    disabled={isCancelling}
                    onClick={() => {
                      handleCancelRequest(selectedRequest);
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/60 transition-all cursor-pointer"
                  >
                    Batalkan Pengajuan
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Preview & Dokumen Resmi (Tahap 5 & 6) */}
      {previewingRequest && (
        <DocumentPreviewWorkspace
          letterRequest={previewingRequest}
          onBack={() => {
            setPreviewingRequest(null);
            setAutoPrintWorkspace(false);
            refreshRequests();
          }}
          onClose={() => {
            setPreviewingRequest(null);
            setAutoPrintWorkspace(false);
            refreshRequests();
          }}
          mode="warga"
          currentWarga={currentWarga}
          autoPrint={autoPrintWorkspace}
        />
      )}

      {/* Modal Verifikasi QR Publik */}
      {isVerifyingOpen && (
        <PublicLetterVerificationModal
          isOpen={isVerifyingOpen}
          onClose={() => setIsVerifyingOpen(false)}
          initialToken={verifyTargetToken}
        />
      )}
    </div>
  );
};
