import React, { useState, useMemo } from 'react';
import { WargaDataChangeRequest, WargaDataChangeStatus, WargaSession, Keluarga, Penduduk } from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  User, 
  Filter, 
  Trash2, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface WargaRiwayatPerubahanProps {
  currentWarga: WargaSession;
  keluarga: Keluarga;
  onOpenFormLapor: () => void;
}

export const WargaRiwayatPerubahan: React.FC<WargaRiwayatPerubahanProps> = ({
  currentWarga,
  keluarga,
  onOpenFormLapor
}) => {
  const [statusFilter, setStatusFilter] = useState<'semua' | WargaDataChangeStatus>('semua');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ambil data request dari storage
  const requests = useMemo(() => {
    const all = StorageService.getWargaDataChangeRequests();
    // Ambil request yang diajukan oleh akun warga ini atau terkait anggota keluarganya dalam KK yang sama
    const validMemberIds = keluarga.anggotaKeluarga.map(m => m.id);
    return all.filter(r => 
      r.wargaAccountId === currentWarga.wargaAccountId ||
      r.pendudukId === currentWarga.pendudukId ||
      validMemberIds.includes(r.pendudukId)
    );
  }, [currentWarga, keluarga, refreshKey]);

  // Filter berdasarkan status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'semua') return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

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

  const handleCancelRequest = (requestId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pengajuan perubahan data ini?')) {
      return;
    }
    const result = StorageService.cancelDataChangeRequest(requestId, currentWarga);
    if (result.success) {
      setRefreshKey(k => k + 1);
    } else {
      alert(result.message);
    }
  };

  const renderStatusBadge = (status: WargaDataChangeStatus) => {
    switch (status) {
      case 'menunggu':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'diverifikasi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sedang Diverifikasi</span>
          </span>
        );
      case 'disetujui':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui & Diperbarui</span>
          </span>
        );
      case 'ditolak':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak Petugas</span>
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header Riwayat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Riwayat Perubahan Data
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau status verifikasi dan tindak lanjut laporan perubahan data kependudukan keluarga Anda
          </p>
        </div>

        <button
          onClick={onOpenFormLapor}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Perubahan Baru</span>
        </button>
      </div>

      {/* Filter Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('semua')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
            statusFilter === 'semua'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Semua Pengajuan ({requests.length})
        </button>
        <button
          onClick={() => setStatusFilter('menunggu')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
            statusFilter === 'menunggu'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Menunggu ({requests.filter(r => r.status === 'menunggu').length})
        </button>
        <button
          onClick={() => setStatusFilter('diverifikasi')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
            statusFilter === 'diverifikasi'
              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Diverifikasi ({requests.filter(r => r.status === 'diverifikasi').length})
        </button>
        <button
          onClick={() => setStatusFilter('disetujui')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
            statusFilter === 'disetujui'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Disetujui ({requests.filter(r => r.status === 'disetujui').length})
        </button>
        <button
          onClick={() => setStatusFilter('ditolak')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
            statusFilter === 'ditolak'
              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Ditolak ({requests.filter(r => r.status === 'ditolak').length})
        </button>
      </div>

      {/* List Permohonan */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Belum Ada Pengajuan Perubahan Data</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter === 'semua' 
              ? 'Anda belum pernah mengajukan koreksi atau pembaruan data kependudukan.'
              : `Tidak ada laporan dengan status "${statusFilter}".`}
          </p>
          <button
            onClick={onOpenFormLapor}
            className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Buat Laporan Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const isExpanded = expandedId === req.id;

            return (
              <div 
                key={req.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{req.namaPenduduk}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          NIK: {req.nik}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Diajukan pada: {formatDateTime(req.submittedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderStatusBadge(req.status)}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Ringkasan Perubahan (Before -> After) */}
                <div className="space-y-2 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Bidang Data yang Dikoreksi ({req.changes.length}):
                  </div>

                  <div className="space-y-1.5">
                    {req.changes.map((change, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-semibold text-emerald-400 w-36 truncate">{change.label}:</span>
                        <span className="line-through text-slate-500 text-[11px]">{change.oldValue}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="font-bold text-white bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40 text-[11px]">
                          {change.newValue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail Expanded */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Alasan Pengajuan Warga:</span>
                        <p className="text-slate-200 mt-0.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          {req.alasan}
                        </p>
                      </div>

                      {req.lampiranBukti && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">Dokumen / Bukti Pendukung:</span>
                          <p className="text-slate-200 mt-0.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            {req.lampiranBukti}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Catatan Tindak Lanjut Petugas */}
                    {(req.reviewedBy || req.catatanOperator) && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Ditinjau oleh: <strong className="text-slate-200">{req.reviewedBy || 'Aparatur Desa'}</strong></span>
                          {req.reviewedAt && <span>{formatDateTime(req.reviewedAt)}</span>}
                        </div>
                        {req.catatanOperator && (
                          <div className="text-xs text-amber-300 font-medium pt-1">
                            Catatan Petugas: "{req.catatanOperator}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tombol Batalkan jika masih menunggu */}
                    {req.status === 'menunggu' && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Batalkan Pengajuan Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
