import React, { useState } from 'react';
import { Penduduk, WargaAccount } from '../../types';
import { 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  Calendar, 
  Clock, 
  IdCard, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  X,
  Info
} from 'lucide-react';

interface WargaProfilProps {
  penduduk: Penduduk;
  account: WargaAccount | null;
  onLogout: () => void;
}

export const WargaProfil: React.FC<WargaProfilProps> = ({
  penduduk,
  account,
  onLogout
}) => {
  const [isUbahPinOpen, setIsUbahPinOpen] = useState(false);

  // Format ISO timestamp ke format ramah Indonesia
  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Kartu Status Akun Warga */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Status Akun Layanan Mandiri</h3>
            <p className="text-xs text-slate-400">Informasi kredensial dan riwayat akses Anjungan Mandiri Warga</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-emerald-400" />
              Nomor Induk Kependudukan (NIK)
            </span>
            <span className="font-mono text-white font-semibold">{penduduk.nik}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400">Nama Pemilik Akun</span>
            <span className="text-white font-medium">{penduduk.nama}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400">Status Akun Warga</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {account?.status === 'active' ? 'Aktif Terverifikasi' : 'Aktif'}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Tanggal Aktivasi Akun
            </span>
            <span className="text-slate-200">{formatDateTime(account?.createdAt)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Sesi Masuk Terakhir
            </span>
            <span className="text-slate-200">{formatDateTime(account?.lastLoginAt || account?.createdAt)}</span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-400">Metode Keamanan</span>
            <span className="text-slate-300 font-mono">Enkripsi Salted SHA-256 (PIN 6 Digit)</span>
          </div>
        </div>
      </div>

      {/* Pengaturan Keamanan & Aksi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white mb-4">Aksi Akun & Keamanan</h4>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-white">Ganti PIN 6 Digit</p>
                <p className="text-[11px] text-slate-400">Perbarui kode PIN pengaman akses anjungan mandiri Anda</p>
              </div>
            </div>
            <button
              onClick={() => setIsUbahPinOpen(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Ubah PIN
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-rose-400" />
              <div>
                <p className="text-xs font-semibold text-white">Keluar dari Anjungan Mandiri</p>
                <p className="text-[11px] text-slate-400">Akhiri sesi warga saat selesai menggunakan anjungan</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
            >
              Keluar Sesi
            </button>
          </div>
        </div>
      </div>

      {/* Modal Placeholder Ubah PIN */}
      {isUbahPinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Ubah PIN Akses</h3>
              </div>
              <button
                onClick={() => setIsUbahPinOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Fitur penggantian PIN mandiri saat ini dapat diproses langsung di loket kantor desa dengan menunjukkan KTP asli, atau akan diaktifkan secara mandiri pada pembaruan tahap berikutnya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUbahPinOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
