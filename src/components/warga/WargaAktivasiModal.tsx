import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../../services/storageService';
import { 
  ShieldCheck, 
  IdCard, 
  FileText, 
  Calendar, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  KeyRound, 
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface WargaAktivasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nik: string) => void;
}

export const WargaAktivasiModal: React.FC<WargaAktivasiModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Step 1: Verifikasi Identitas (NIK, KK, Tanggal Lahir)
  // Step 2: Buat PIN 6 digit
  // Step 3: Selesai
  const [step, setStep] = useState<'verify' | 'pin' | 'success'>('verify');

  const [nik, setNik] = useState('');
  const [noKk, setNoKk] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [verifiedNama, setVerifiedNama] = useState('');
  const [verifiedDusun, setVerifiedDusun] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = () => {
    setStep('verify');
    setNik('');
    setNoKk('');
    setTanggalLahir('');
    setPin('');
    setConfirmPin('');
    setVerifiedNama('');
    setVerifiedDusun('');
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  // Step 1: Periksa Kecocokan Identitas
  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNik = nik.trim();
    const cleanKk = noKk.trim();
    const cleanTgl = tanggalLahir.trim();

    if (!cleanNik || cleanNik.length < 16) {
      setErrorMessage('Masukkan 16 digit Nomor Induk Kependudukan (NIK) yang valid.');
      return;
    }
    if (!cleanKk || cleanKk.length < 16) {
      setErrorMessage('Masukkan 16 digit Nomor Kartu Keluarga (KK) yang valid.');
      return;
    }
    if (!cleanTgl) {
      setErrorMessage('Pilih atau masukkan tanggal lahir Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Cari penduduk existing di database desa (Source of Truth)
      const residentMatch = StorageService.findPendudukByNik(cleanNik);
      if (!residentMatch) {
        setIsLoading(false);
        setErrorMessage('Data NIK tidak ditemukan dalam data penduduk desa.');
        return;
      }

      const { penduduk, keluarga } = residentMatch;

      // 2. Cocokkan No KK
      if ((keluarga.noKk || '').trim() !== cleanKk) {
        setIsLoading(false);
        setErrorMessage('Nomor KK tidak sesuai dengan data penduduk.');
        return;
      }

      // 3. Cocokkan Tanggal Lahir
      if ((penduduk.tanggalLahir || '').trim() !== cleanTgl) {
        setIsLoading(false);
        setErrorMessage('Tanggal lahir tidak sesuai dengan data penduduk.');
        return;
      }

      // 4. Periksa apakah akun warga sudah aktif
      const accounts = StorageService.getWargaAccounts();
      const existing = accounts.find(a => a.nik === cleanNik);
      if (existing && existing.status === 'active') {
        setIsLoading(false);
        setErrorMessage('Akun warga untuk NIK ini sudah aktif. Silakan masuk menggunakan PIN Anda.');
        return;
      }

      // Berhasil diverifikasi
      setVerifiedNama(penduduk.nama);
      setVerifiedDusun(`${keluarga.dusun}, RT ${keluarga.rt}/RW ${keluarga.rw}`);
      setIsLoading(false);
      setStep('pin');
    }, 450);
  };

  // Step 2: Simpan PIN dan Buat Akun
  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMessage('PIN harus terdiri dari tepat 6 digit angka.');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setErrorMessage('Konfirmasi PIN tidak cocok dengan PIN yang dibuat.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.activateWargaAccount({
        nik: nik.trim(),
        noKk: noKk.trim(),
        tanggalLahir: tanggalLahir.trim(),
        pin: cleanPin
      });

      setIsLoading(false);

      if (result.success) {
        setStep('success');
      } else {
        setErrorMessage(result.message);
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Aktivasi Akun Warga</h2>
              <p className="text-xs text-slate-400">Verifikasi data penduduk untuk akses Anjungan Mandiri</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/30">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === 'verify' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              1
            </div>
            <span className={`text-xs ${step === 'verify' ? 'font-medium text-emerald-300' : 'text-slate-400'}`}>
              Cek Identitas
            </span>
          </div>
          <div className="w-8 h-[1px] bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === 'pin' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </div>
            <span className={`text-xs ${step === 'pin' ? 'font-medium text-emerald-300' : 'text-slate-400'}`}>
              Buat PIN
            </span>
          </div>
          <div className="w-8 h-[1px] bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </div>
            <span className={`text-xs ${step === 'success' ? 'font-medium text-emerald-300' : 'text-slate-400'}`}>
              Selesai
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* STEP 1: FORM VERIFIKASI IDENTITAS */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyIdentity} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Masukkan identitas sesuai dengan Kartu Tanda Penduduk (KTP) dan Kartu Keluarga (KK) yang terdaftar di Desa Beliti Jaya.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-emerald-400" />
                  Nomor Induk Kependudukan (NIK)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 1631051508720001"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Nomor Kartu Keluarga (No. KK)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={noKk}
                  onChange={e => setNoKk(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 1631051204080001"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={e => setTanggalLahir(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Verifikasi Data</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: BUAT PIN */}
          {step === 'pin' && (
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">Identitas Ditemukan & Terverifikasi</span>
                </div>
                <p className="text-sm font-medium text-white">{verifiedNama}</p>
                <p className="text-xs text-emerald-300/80">{verifiedDusun}</p>
              </div>

              <p className="text-xs text-slate-400">
                Buat 6 digit PIN rahasia untuk masuk ke Anjungan Mandiri di masa mendatang. Jaga kerahasiaan PIN Anda.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    Buat PIN (6 Digit Angka)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 123456"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Konfirmasi PIN
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ulangi 6 digit PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aktifkan Akun</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SELESAI */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Aktivasi Akun Berhasil!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Akun Anjungan Mandiri Anda telah aktif. Anda sekarang dapat masuk menggunakan NIK dan 6 digit PIN yang baru saja dibuat.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const activatedNik = nik.trim();
                    handleCloseModal();
                    onSuccess(activatedNik);
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  <span>Masuk ke Anjungan Mandiri</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
