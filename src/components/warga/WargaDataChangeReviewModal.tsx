import React, { useState, useMemo } from 'react';
import { 
  WargaDataChangeRequest, 
  WargaDataChangeStatus, 
  User, 
  RolePermissions, 
  Penduduk, 
  Keluarga 
} from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Filter, 
  X, 
  FileText, 
  User as UserIcon, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Check, 
  MessageSquare,
  ChevronRight,
  Database
} from 'lucide-react';

interface WargaDataChangeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  permissions: RolePermissions;
  onDataApplied?: () => void; // Trigger refresh to GIS map & master family list
}

export const WargaDataChangeReviewModal: React.FC<WargaDataChangeReviewModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  permissions,
  onDataApplied
}) => {
  const [statusFilter, setStatusFilter] = useState<'semua' | WargaDataChangeStatus>('menunggu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ambil semua permohonan dari StorageService
  const allRequests = useMemo(() => {
    return StorageService.getWargaDataChangeRequests();
  }, [refreshKey]);

  // Filter & Search
  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      // 1. Status Filter
      if (statusFilter !== 'semua' && req.status !== statusFilter) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = req.namaPenduduk.toLowerCase().includes(q);
        const matchNik = req.nik.toLowerCase().includes(q);
        const matchKk = req.noKk.toLowerCase().includes(q);
        const matchReason = req.alasan.toLowerCase().includes(q);
        return matchName || matchNik || matchKk || matchReason;
      }
      return true;
    });
  }, [allRequests, statusFilter, searchQuery]);

  // Request yang sedang aktif dipilih
  const activeRequest = useMemo(() => {
    if (!selectedRequestId && filteredRequests.length > 0) {
      return filteredRequests[0];
    }
    return allRequests.find(r => r.id === selectedRequestId) || filteredRequests[0] || null;
  }, [allRequests, filteredRequests, selectedRequestId]);

  // Hitung jumlah counter status
  const counts = useMemo(() => {
    return {
      all: allRequests.length,
      menunggu: allRequests.filter(r => r.status === 'menunggu').length,
      diverifikasi: allRequests.filter(r => r.status === 'diverifikasi').length,
      disetujui: allRequests.filter(r => r.status === 'disetujui').length,
      ditolak: allRequests.filter(r => r.status === 'ditolak').length
    };
  }, [allRequests]);

  if (!isOpen) return null;

  // Format tanggal ISO
  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  // Action: Tandai Sedang Diverifikasi
  const handleMarkReviewing = (reqId: string) => {
    const res = StorageService.reviewDataChangeRequest(reqId, currentUser, operatorNotes);
    if (res.success) {
      showToast('Status pengajuan diperbarui menjadi "Sedang Diverifikasi".');
      setRefreshKey(k => k + 1);
      setOperatorNotes('');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Action: Setujui & Terapkan ke Master
  const handleApprove = (reqId: string) => {
    if (!window.confirm('Setujui pengajuan ini dan terapkan perubahan data langsung ke database kependudukan master desa?')) {
      return;
    }

    const res = StorageService.approveDataChangeRequest(reqId, currentUser, operatorNotes);
    if (res.success) {
      showToast(res.message);
      setRefreshKey(k => k + 1);
      setOperatorNotes('');
      if (onDataApplied) onDataApplied();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Action: Tolak Pengajuan
  const handleRejectSubmit = () => {
    if (!activeRequest) return;
    if (!rejectReason.trim()) {
      showToast('Alasan penolakan wajib diisi agar warga memahami penyebab ditolaknya laporan.', 'error');
      return;
    }

    const res = StorageService.rejectDataChangeRequest(activeRequest.id, currentUser, rejectReason.trim());
    if (res.success) {
      showToast('Pengajuan perubahan data telah ditolak.');
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setRefreshKey(k => k + 1);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl text-slate-100 flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' 
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Verifikasi Perubahan Data Kependudukan Warga
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {counts.menunggu} Perlu Ditinjau
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pemeriksaan dan persetujuan pemutakhiran data master kependudukan oleh aparatur desa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Workspace: Master Detail (Left List, Right Review View) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Kolom Kiri: Filter & Daftar Pengajuan */}
          <div className="w-full md:w-96 border-r border-slate-800 flex flex-col bg-slate-900/50">
            {/* Search & Filter Bar */}
            <div className="p-4 space-y-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari Nama, NIK, No. KK..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white outline-none transition-colors"
                />
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  onClick={() => setStatusFilter('menunggu')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                    statusFilter === 'menunggu'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Menunggu ({counts.menunggu})
                </button>
                <button
                  onClick={() => setStatusFilter('diverifikasi')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                    statusFilter === 'diverifikasi'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Diverifikasi ({counts.diverifikasi})
                </button>
                <button
                  onClick={() => setStatusFilter('disetujui')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                    statusFilter === 'disetujui'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Disetujui ({counts.disetujui})
                </button>
                <button
                  onClick={() => setStatusFilter('semua')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                    statusFilter === 'semua'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua ({counts.all})
                </button>
              </div>
            </div>

            {/* List Pengajuan */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Tidak ada pengajuan dengan filter ini.
                </div>
              ) : (
                filteredRequests.map(req => {
                  const isSelected = activeRequest?.id === req.id;

                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white truncate">
                          {req.namaPenduduk}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          req.status === 'menunggu' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : req.status === 'diverifikasi'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : req.status === 'disetujui'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        NIK: {req.nik} • KK: {req.noKk}
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>{req.changes.length} bidang diubah</span>
                        <span>{formatDateTime(req.submittedAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Detail & Aksi Verifikasi */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/40">
            {activeRequest ? (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header Detail Request */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                      <UserIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{activeRequest.namaPenduduk}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeRequest.status === 'menunggu' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : activeRequest.status === 'diverifikasi'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : activeRequest.status === 'disetujui'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          Status: {activeRequest.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        NIK: <span className="text-slate-200">{activeRequest.nik}</span> • No. KK: <span className="text-slate-200">{activeRequest.noKk}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Diajukan melalui Anjungan Mandiri pada: {formatDateTime(activeRequest.submittedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABEL PERBANDINGAN: BEFORE vs AFTER */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Komparasi Perubahan Data (Data Lama vs Data Baru)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {activeRequest.changes.map((change, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                      >
                        <div className="md:col-span-3 font-semibold text-emerald-400">
                          {change.label}
                        </div>

                        {/* Data Lama */}
                        <div className="md:col-span-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Sebelumnya (Lama):</span>
                          <span className="text-slate-300 line-through">{change.oldValue}</span>
                        </div>

                        <div className="hidden md:flex md:col-span-1 items-center justify-center text-slate-500">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Data Baru yang Diajukan */}
                        <div className="md:col-span-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 block uppercase font-bold">Diajukan (Baru):</span>
                          <span className="text-emerald-200 font-bold">{change.newValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alasan & Catatan Warga */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Alasan Pengajuan Warga
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {activeRequest.alasan}
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Dokumen / Keterangan Bukti
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {activeRequest.lampiranBukti || <span className="text-slate-500 italic">Tidak ada keterangan dokumen lampiran</span>}
                    </p>
                  </div>
                </div>

                {/* Riwayat Peninjauan Sebelumnya */}
                {(activeRequest.reviewedBy || activeRequest.catatanOperator) && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Petugas Pemeriksa: <strong className="text-white">{activeRequest.reviewedBy}</strong></span>
                      {activeRequest.reviewedAt && <span>{formatDateTime(activeRequest.reviewedAt)}</span>}
                    </div>
                    {activeRequest.catatanOperator && (
                      <p className="text-amber-300 pt-1">
                        Catatan Petugas: "{activeRequest.catatanOperator}"
                      </p>
                    )}
                  </div>
                )}

                {/* Catatan Tindak Lanjut Operator saat ini */}
                {activeRequest.status !== 'disetujui' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Catatan Petugas untuk Warga (Opsional jika disetujui / Wajib jika ditolak)
                    </label>
                    <textarea
                      rows={2}
                      value={operatorNotes}
                      onChange={e => setOperatorNotes(e.target.value)}
                      placeholder="Masukkan catatan verifikasi atau arahan bagi warga..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                )}

                {/* BARIS AKSI VERIFIKATOR */}
                {activeRequest.status !== 'disetujui' && (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    {activeRequest.status === 'menunggu' && (
                      <button
                        onClick={() => handleMarkReviewing(activeRequest.id)}
                        className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Tandai Sedang Diverifikasi</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsRejectDialogOpen(true)}
                      className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak Pengajuan</span>
                    </button>

                    <button
                      onClick={() => handleApprove(activeRequest.id)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui & Terapkan ke Master Penduduk</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Pilih pengajuan dari daftar di sebelah kiri untuk melihat detail verifikasi.
              </div>
            )}
          </div>
        </div>

        {/* Modal Dialog Alasan Penolakan */}
        {isRejectDialogOpen && activeRequest && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Tolak Pengajuan Perubahan Data</h4>
                </div>
                <button
                  onClick={() => setIsRejectDialogOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Mohon cantumkan alasan penolakan secara jelas agar warga {activeRequest.namaPenduduk} mengetahui dokumen atau kelengkapan yang perlu diperbaiki.
              </p>

              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-2">
                  Alasan Penolakan Wajib Diisi *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Contoh: Dokumen bukti Akta Kelahiran asli belum dilampirkan, silakan bawa fotokopi ke loket pelayanan..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectDialogOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
