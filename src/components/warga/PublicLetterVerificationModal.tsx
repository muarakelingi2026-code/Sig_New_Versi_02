import React, { useState, useEffect } from 'react';
import { LetterIssuanceService } from '../../services/letterIssuanceService';
import { LetterIssuance } from '../../types';
import { 
  ShieldCheck, 
  XCircle, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  QrCode, 
  Hash, 
  Clock, 
  X,
  ExternalLink,
  Lock
} from 'lucide-react';

interface PublicLetterVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
}

export const PublicLetterVerificationModal: React.FC<PublicLetterVerificationModalProps> = ({
  isOpen,
  onClose,
  initialToken = ''
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'VALID' | 'REVOKED' | 'NOT_FOUND';
    issuance?: LetterIssuance;
    pemohonNama?: string;
    maskedNik?: string;
    verifiedAt: string;
  } | null>(null);

  useEffect(() => {
    if (initialToken && initialToken.trim() !== '') {
      setTokenInput(initialToken);
      performVerification(initialToken);
    } else {
      setVerificationResult(null);
    }
  }, [initialToken, isOpen]);

  if (!isOpen) return null;

  const performVerification = (tokenToVerify: string) => {
    const res = LetterIssuanceService.verifyLetter(tokenToVerify);
    setVerificationResult(res);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    performVerification(tokenInput);
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Verifikasi Keabsahan Surat Resmi</h3>
              <p className="text-xs text-slate-400">Portal Publik Validasi Dokumen Desa Beliti Jaya</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Pencarian Token / Nomor Registrasi */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/60">
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Masukkan Kode Token QR, Nomor Registrasi, atau Nomor Surat:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Contoh: vtok_... / REG-2026-0001 / 470/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0 cursor-pointer"
              >
                Verifikasi
              </button>
            </div>
          </form>
        </div>

        {/* Konten Hasil Verifikasi */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {verificationResult === null ? (
            <div className="py-10 text-center space-y-2">
              <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">Masukkan token verifikasi atau pindai QR Code pada lembar fisik surat.</p>
            </div>
          ) : verificationResult.status === 'VALID' && verificationResult.issuance ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Badge Sukses */}
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">DOKUMEN RESMI TERVERIFIKASI</h4>
                  <p className="text-xs text-emerald-400/90 mt-0.5">
                    Surat ini terdaftar sah dalam Buku Register Arsip Pemerintah Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas.
                  </p>
                </div>
              </div>

              {/* Rincian Surat */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Jenis Dokumen:</span>
                  <span className="font-bold text-slate-100">{verificationResult.issuance.letterTypeName}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Nomor Surat Resmi:</span>
                  <span className="font-mono font-bold text-emerald-400">{verificationResult.issuance.nomorSurat}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Nomor Registrasi:</span>
                  <span className="font-mono text-slate-200">{verificationResult.issuance.nomorRegistrasi}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Tanggal Terbit:</span>
                  <span className="text-slate-200">
                    {new Date(verificationResult.issuance.issuedAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} WIB
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Nama Pemohon:</span>
                  <span className="font-bold text-slate-200">{verificationResult.pemohonNama}</span>
                </div>

                {/* Masked NIK untuk Privasi */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-500" />
                    NIK Pemohon:
                  </span>
                  <span className="font-mono text-slate-300">{verificationResult.maskedNik} (Disamarkan)</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Pejabat Pengesah:</span>
                  <span className="font-bold text-slate-200">
                    {verificationResult.issuance.signatoryName} ({verificationResult.issuance.signatoryRole})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Penerbit:</span>
                  <span className="text-slate-300">
                    {verificationResult.issuance.issuedBy}
                  </span>
                </div>
              </div>

              {/* Hash Kriptografis Dokumen */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-500 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Sidik Kriptografis Dokumen (SHA-256):
                </div>
                <div className="font-mono text-slate-400 break-all bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  {verificationResult.issuance.documentHash}
                </div>
              </div>
            </div>
          ) : verificationResult.status === 'REVOKED' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-300">SURAT INI TELAH DICABUT / TIDAK BERLAKU</h4>
                  <p className="text-xs text-rose-400/90 mt-0.5">
                    Surat dengan nomor {verificationResult.issuance?.nomorSurat} telah dicabut secara resmi oleh Pemerintah Desa Beliti Jaya dan tidak memiliki kekuatan hukum lagi.
                  </p>
                  {verificationResult.issuance?.revocationReason && (
                    <div className="mt-2 p-2.5 rounded-lg bg-rose-900/30 border border-rose-700/40 text-rose-200 text-xs">
                      <strong>Alasan Pencabutan: </strong>{verificationResult.issuance.revocationReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-center space-y-3 animate-fadeIn">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-amber-300">DOKUMEN TIDAK TERDAFTAR</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Token atau nomor surat yang dimasukkan tidak ditemukan pada database arsip resmi Desa Beliti Jaya. Pastikan kode yang dimasukkan sudah benar atau waspadai pemalsuan dokumen.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>Pemerintah Desa Beliti Jaya, Kec. Muara Kelingi</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
