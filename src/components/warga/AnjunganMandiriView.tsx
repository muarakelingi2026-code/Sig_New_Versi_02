import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WargaSession, DesaProfile, Penduduk, Keluarga, WargaAccount } from '../../types';
import { StorageService } from '../../services/storageService';
import { DEFAULT_VILLAGE_LOGO } from '../../data/mockData';
import { WargaAktivasiModal } from './WargaAktivasiModal';
import { WargaDataSaya } from './WargaDataSaya';
import { WargaProfil } from './WargaProfil';
import { WargaKeluargaSaya } from './WargaKeluargaSaya';
import { WargaFormLaporPerubahan } from './WargaFormLaporPerubahan';
import { WargaRiwayatPerubahan } from './WargaRiwayatPerubahan';
import { WargaLayananSurat } from './WargaLayananSurat';
import { 
  Building2, 
  IdCard, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  UserCheck, 
  LogOut, 
  Home, 
  FileText, 
  Users, 
  Clock, 
  Send, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles, 
  X, 
  Eye, 
  EyeOff, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  FileEdit,
  PlusCircle
} from 'lucide-react';

interface AnjunganMandiriViewProps {
  isOpen: boolean;
  onClose: () => void;
  desaProfile?: DesaProfile;
  onWargaLoginChange?: (session: WargaSession | null) => void;
}

export const AnjunganMandiriView: React.FC<AnjunganMandiriViewProps> = ({
  isOpen,
  onClose,
  desaProfile,
  onWargaLoginChange
}) => {
  const activeProfile = desaProfile || StorageService.getDesaProfile();
  const namaDesa = activeProfile?.namaDesa || 'Beliti Jaya';
  const kecamatan = activeProfile?.kecamatan || 'Muara Kelingi';
  const kabupaten = activeProfile?.kabupaten || 'Musi Rawas';
  const logoDesa = activeProfile?.logoDesa || DEFAULT_VILLAGE_LOGO;

  // Sesi warga yang sedang aktif (Terpisah dari aparatur desa)
  const [currentWarga, setCurrentWarga] = useState<WargaSession | null>(() => StorageService.getCurrentWarga());

  // Form Login Warga State
  const [nikInput, setNikInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Aktivasi Akun Warga
  const [isAktivasiOpen, setIsAktivasiOpen] = useState(false);

  // Tab Navigasi Anjungan Mandiri (Setelah Login)
  const [activeTab, setActiveTab] = useState<
    'beranda' | 'data_saya' | 'keluarga_saya' | 'layanan_surat' | 'buat_surat' | 'riwayat_surat' | 'lapor_perubahan' | 'riwayat_perubahan' | 'profil'
  >('beranda');
  const [suratSubTab, setSuratSubTab] = useState<'create' | 'history'>('create');

  // State target penduduk saat pindah ke form pelaporan
  const [targetPerubahanPendudukId, setTargetPerubahanPendudukId] = useState<string | undefined>(undefined);

  // Realtime clock (WIB)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sinkronisasi sesi dengan parent/storage
  useEffect(() => {
    const session = StorageService.getCurrentWarga();
    setCurrentWarga(session);
  }, [isOpen]);

  // Ambil data Penduduk Source of Truth dari database existing berdasarkan pendudukId di session
  const residentData = useMemo(() => {
    if (!currentWarga) return null;
    return StorageService.getPendudukById(currentWarga.pendudukId);
  }, [currentWarga]);

  // Ambil metadata akun warga
  const currentAccount = useMemo(() => {
    if (!currentWarga) return null;
    const accounts = StorageService.getWargaAccounts();
    return accounts.find(a => a.id === currentWarga.wargaAccountId) || null;
  }, [currentWarga]);

  // Submit Login Warga
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccessMsg(null);

    const cleanNik = nikInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanNik || cleanNik.length < 16) {
      setLoginError('Masukkan 16 digit NIK Anda.');
      return;
    }

    if (!cleanPin || cleanPin.length < 6) {
      setLoginError('Masukkan 6 digit PIN Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.loginWarga(cleanNik, cleanPin);
      setIsLoading(false);

      if (result.success && result.session) {
        setCurrentWarga(result.session);
        onWargaLoginChange?.(result.session);
        setActiveTab('beranda');
        setNikInput('');
        setPinInput('');
      } else {
        setLoginError(result.message);
      }
    }, 400);
  };

  // Logout Warga (TIDAK menghapus currentUser aparatur)
  const handleLogoutWarga = () => {
    StorageService.logoutWarga();
    setCurrentWarga(null);
    onWargaLoginChange?.(null);
    setActiveTab('beranda');
    setLoginSuccessMsg('Anda telah keluar dari sesi Anjungan Mandiri. Terima kasih.');
  };

  // Callback setelah aktivasi berhasil dari modal
  const handleAktivasiSuccess = (activatedNik: string) => {
    setNikInput(activatedNik);
    setPinInput('');
    setIsAktivasiOpen(false);
    setLoginSuccessMsg(`Aktivasi berhasil untuk NIK ${activatedNik}. Silakan masukkan PIN untuk masuk.`);
  };

  // Bantuan Pengujian Cepat untuk Warga Demo Existing
  const fillDemoCredentials = (targetNik: string) => {
    setNikInput(targetNik);
    setPinInput('123456');
    setLoginError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ── TOP NAV / BANNER ANJUNGAN MANDIRI ── */}
      <header className="bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 p-1 flex items-center justify-center flex-shrink-0">
            <img src={logoDesa} alt="Logo Desa" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Portal Anjungan Mandiri Warga
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Offline Local Server
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
              Pemerintah Desa {namaDesa}
            </h1>
            <p className="text-[11px] text-slate-400">
              Kec. {kecamatan}, Kab. {kabupaten}
            </p>
          </div>
        </div>

        {/* Indikator Waktu Realtime & Tombol Tutup Portal */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-mono font-semibold text-slate-200">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
            <span className="text-[10px] text-slate-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {currentWarga && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                {currentWarga.nama.charAt(0)}
              </div>
              <div className="text-left text-xs leading-tight">
                <p className="font-semibold text-white max-w-[120px] truncate">{currentWarga.nama}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {currentWarga.nik.slice(0, 6)}...{currentWarga.nik.slice(-4)}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Kembali ke Portal SIG Desa"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Tutup Anjungan</span>
          </button>
        </div>
      </header>

      {/* ── KONDISI 1: BELUM LOGIN (HALAMAN LOGIN & AKTIVASI WARGA) ── */}
      {!currentWarga ? (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-slate-900/50 to-slate-950">
          <div className="w-full max-w-md space-y-6">
            {/* Header Login */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <IdCard className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Anjungan Mandiri</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Layanan administrasi kependudukan dan persuratan mandiri bagi seluruh warga Desa {namaDesa}.
              </p>
            </div>

            {/* Notifikasi / Pesan Sukses / Pesan Error */}
            {loginSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>{loginSuccessMsg}</span>
              </motion.div>
            )}

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </motion.div>
            )}

            {/* Kartu Form Login NIK + PIN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-emerald-400" />
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nikInput}
                    onChange={e => setNikInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan 16 digit NIK KTP Anda"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      PIN Keamanan (6 Digit)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPin ? 'Sembunyikan' : 'Lihat'}</span>
                    </button>
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer text-sm"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Masuk ke Anjungan Mandiri</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Opsi Aktivasi Akun Warga */}
              <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Belum memiliki PIN atau belum mengaktifkan akun?
                </p>
                <button
                  type="button"
                  onClick={() => setIsAktivasiOpen(true)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold rounded-xl text-xs border border-emerald-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aktivasi Akun Warga Baru</span>
                </button>
              </div>
            </div>

            {/* Petunjuk Bantuan Warga & Akun Uji Coba Cepat */}
            <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-400">
                <HelpCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <p className="leading-relaxed">
                  Lupa PIN atau mengalami kendala identitas? Silakan hubungi petugas loket kantor Desa {namaDesa} dengan membawa KTP dan Kartu Keluarga asli.
                </p>
              </div>

              {/* Quick Fill untuk Pengujian Cepat Warga Database Existing */}
              <div className="pt-2 border-t border-slate-800/50">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Uji Coba Cepat Data Warga (Database Existing):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('1631051508720001')}
                    className="p-1.5 bg-slate-800/60 hover:bg-slate-800 text-left rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>H. Rustam Effendi</span>
                    <span className="text-[10px] text-emerald-400 font-mono">163105...0001</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('1631054903760002')}
                    className="p-1.5 bg-slate-800/60 hover:bg-slate-800 text-left rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>Hj. Maryati</span>
                    <span className="text-[10px] text-emerald-400 font-mono">163105...0002</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ── KONDISI 2: SUDAH LOGIN (PORTAL WORKSPACE ANJUNGAN MANDIRI) ── */
        <div className="flex-1 flex flex-col md:flex-row bg-slate-950">
          {/* Sidebar Navigasi Anjungan Mandiri (Modern Civic Service) */}
          <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800/80 p-4 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Profil Mini Warga */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {residentData?.penduduk.nama.charAt(0) || 'W'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{residentData?.penduduk.nama}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      NIK {residentData?.penduduk.nik.slice(0, 6)}...{residentData?.penduduk.nik.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Wilayah</span>
                  <span className="text-slate-200 font-medium">{residentData?.keluarga.dusun || 'Desa Beliti Jaya'}</span>
                </div>
              </div>

              {/* Menu Navigasi (Sesuai Spesifikasi Tahap 3) */}
              <nav className="space-y-1 text-xs">
                <button
                  onClick={() => setActiveTab('beranda')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'beranda'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Beranda</span>
                </button>

                <button
                  onClick={() => setActiveTab('data_saya')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'data_saya'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <IdCard className="w-4 h-4" />
                  <span>Data Saya</span>
                </button>

                <button
                  onClick={() => setActiveTab('keluarga_saya')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'keluarga_saya'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Keluarga Saya</span>
                </button>

                {/* Menu Layanan Surat dengan Submenu Buat Surat & Riwayat Surat */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSuratSubTab('create');
                      setActiveTab('layanan_surat');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                      activeTab === 'layanan_surat' || activeTab === 'buat_surat' || activeTab === 'riwayat_surat'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4" />
                      <span>Layanan Surat</span>
                    </div>
                  </button>

                  <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setSuratSubTab('create');
                        setActiveTab('layanan_surat');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        (activeTab === 'layanan_surat' || activeTab === 'buat_surat') && suratSubTab === 'create'
                          ? 'bg-emerald-700/80 text-emerald-100 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Buat Surat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuratSubTab('history');
                        setActiveTab('layanan_surat');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        (activeTab === 'layanan_surat' || activeTab === 'riwayat_surat') && suratSubTab === 'history'
                          ? 'bg-emerald-700/80 text-emerald-100 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Riwayat Surat</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTargetPerubahanPendudukId(undefined);
                    setActiveTab('lapor_perubahan');
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'lapor_perubahan'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileEdit className="w-4 h-4" />
                  <span>Laporkan Perubahan Data</span>
                </button>

                <button
                  onClick={() => setActiveTab('riwayat_perubahan')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'riwayat_perubahan'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Riwayat Perubahan Data</span>
                </button>

                <button
                  onClick={() => setActiveTab('profil')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'profil'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Profil / Akun</span>
                </button>
              </nav>
            </div>

            {/* Tombol Keluar (Logout Sesi Warga) */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={handleLogoutWarga}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Anjungan</span>
              </button>
            </div>
          </aside>

          {/* Konten Halaman Aktif Anjungan */}
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            {/* TAB 1: BERANDA */}
            {activeTab === 'beranda' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                {/* Banner Selamat Datang */}
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8">
                  <div className="max-w-2xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pelayanan Administrasi Mandiri Desa</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Selamat Datang, {residentData?.penduduk.nama}!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Melalui Anjungan Mandiri ini, Anda dapat memeriksa keakuratan data kependudukan resmi Anda dan mempersiapkan pengajuan berbagai surat keterangan desa secara cepat tanpa antrean panjang.
                    </p>
                  </div>
                </div>

                {/* Kartu Akses Cepat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div
                    onClick={() => setActiveTab('data_saya')}
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IdCard className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Data Saya
                    </h3>
                    <p className="text-xs text-slate-400">
                      Lihat identitas lengkap KTP dan data domisili kependudukan Anda.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('keluarga_saya')}
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      Keluarga Saya
                    </h3>
                    <p className="text-xs text-slate-400">
                      Periksa seluruh anggota dalam satu Kartu Keluarga (KK).
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setSuratSubTab('create');
                      setActiveTab('layanan_surat');
                    }}
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Buat Surat
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Buat Surat
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ajukan permohonan surat administrasi desa secara mandiri.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setTargetPerubahanPendudukId(undefined);
                      setActiveTab('lapor_perubahan');
                    }}
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileEdit className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      Lapor Perubahan
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ajukan koreksi atau pembaruan biodata secara resmi ke desa.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('riwayat_perubahan')}
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <History className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Riwayat Pengajuan
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pantau status verifikasi dan tindak lanjut laporan perubahan.
                    </p>
                  </div>
                </div>

                {/* Ringkasan Identitas Cepat */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Ringkasan Identitas Terverifikasi</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">NIK</span>
                      <span className="font-mono text-emerald-400 font-semibold">{residentData?.penduduk.nik}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Nomor Kartu Keluarga</span>
                      <span className="font-mono text-slate-200 font-semibold">{residentData?.keluarga.noKk}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Status Hubungan</span>
                      <span className="text-white font-semibold">{residentData?.penduduk.statusKeluarga}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Wilayah Dusun</span>
                      <span className="text-emerald-300 font-semibold">{residentData?.keluarga.dusun}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DATA SAYA */}
            {activeTab === 'data_saya' && residentData && (
              <WargaDataSaya
                penduduk={residentData.penduduk}
                keluarga={residentData.keluarga}
                desaProfile={activeProfile}
                onOpenLaporPerubahan={() => {
                  setTargetPerubahanPendudukId(residentData.penduduk.id);
                  setActiveTab('lapor_perubahan');
                }}
              />
            )}

            {/* TAB 3: KELUARGA SAYA */}
            {activeTab === 'keluarga_saya' && residentData && currentWarga && (
              <WargaKeluargaSaya
                currentWarga={currentWarga}
                penduduk={residentData.penduduk}
                keluarga={residentData.keluarga}
                desaProfile={activeProfile}
                onOpenLaporPerubahan={(targetId) => {
                  setTargetPerubahanPendudukId(targetId || residentData.penduduk.id);
                  setActiveTab('lapor_perubahan');
                }}
              />
            )}

            {/* TAB 4: LAYANAN SURAT MANDIRI */}
            {(activeTab === 'layanan_surat' || activeTab === 'buat_surat' || activeTab === 'riwayat_surat') && residentData && currentWarga && (
              <WargaLayananSurat
                currentWarga={currentWarga}
                desaProfile={activeProfile}
                initialSubTab={activeTab === 'riwayat_surat' ? 'history' : suratSubTab}
                onSubTabChange={(tab) => {
                  setSuratSubTab(tab);
                  if (activeTab === 'buat_surat' && tab === 'history') {
                    setActiveTab('layanan_surat');
                  } else if (activeTab === 'riwayat_surat' && tab === 'create') {
                    setActiveTab('layanan_surat');
                  }
                }}
                onNavigateToDataChange={() => {
                  setTargetPerubahanPendudukId(residentData.penduduk.id);
                  setActiveTab('lapor_perubahan');
                }}
              />
            )}

            {/* TAB 5: LAPORKAN PERUBAHAN DATA */}
            {activeTab === 'lapor_perubahan' && residentData && currentWarga && (
              <WargaFormLaporPerubahan
                currentWarga={currentWarga}
                penduduk={residentData.penduduk}
                keluarga={residentData.keluarga}
                initialTargetPendudukId={targetPerubahanPendudukId}
                onSuccess={(reqId) => {
                  setActiveTab('riwayat_perubahan');
                }}
                onCancel={() => setActiveTab('beranda')}
              />
            )}

            {/* TAB 5: RIWAYAT PERUBAHAN DATA */}
            {activeTab === 'riwayat_perubahan' && residentData && currentWarga && (
              <WargaRiwayatPerubahan
                currentWarga={currentWarga}
                keluarga={residentData.keluarga}
                onOpenFormLapor={() => {
                  setTargetPerubahanPendudukId(residentData.penduduk.id);
                  setActiveTab('lapor_perubahan');
                }}
              />
            )}

            {/* TAB 6: PROFIL / AKUN */}
            {activeTab === 'profil' && residentData && (
              <WargaProfil
                penduduk={residentData.penduduk}
                account={currentAccount}
                onLogout={handleLogoutWarga}
              />
            )}
          </main>
        </div>
      )}

      {/* Modal Aktivasi Akun Warga Baru */}
      <WargaAktivasiModal
        isOpen={isAktivasiOpen}
        onClose={() => setIsAktivasiOpen(false)}
        onSuccess={handleAktivasiSuccess}
      />
    </div>
  );
};
