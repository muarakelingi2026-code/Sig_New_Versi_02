import React, { useState, useEffect } from 'react';
import { WargaSession, DesaProfile } from '../../types';
import { WargaFormPengajuanSurat } from './WargaFormPengajuanSurat';
import { WargaRiwayatSurat } from './WargaRiwayatSurat';
import { 
  FileText, 
  History, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Building2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface WargaLayananSuratProps {
  currentWarga: WargaSession;
  desaProfile: DesaProfile;
  initialSubTab?: 'create' | 'history';
  onSubTabChange?: (tab: 'create' | 'history') => void;
  onNavigateToDataChange: () => void;
}

export const WargaLayananSurat: React.FC<WargaLayananSuratProps> = ({
  currentWarga,
  desaProfile,
  initialSubTab = 'create',
  onSubTabChange,
  onNavigateToDataChange
}) => {
  const [subTab, setSubTab] = useState<'create' | 'history'>(initialSubTab);
  const [selectedLetterTypeId, setSelectedLetterTypeId] = useState<string | undefined>(undefined);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Sinkronisasi perubahan initialSubTab dari parent component (AnjunganMandiriView)
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSwitchTab = (tab: 'create' | 'history') => {
    setSubTab(tab);
    onSubTabChange?.(tab);
  };

  const handleSuccessSubmission = (requestId: string) => {
    setSubmittedRequestId(requestId);
    handleSwitchTab('history');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-inner">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pemerintah Desa Beliti Jaya</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Layanan Surat Mandiri
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ajukan layanan administrasi desa secara mandiri. Data kependudukan Anda otomatis terhubung dari data resmi kependudukan desa.
            </p>
          </div>

          {/* Sub Navigation Buttons */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setSubmittedRequestId(null);
                setSelectedLetterTypeId(undefined);
                handleSwitchTab('create');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Buat Surat
            </button>

            <button
              type="button"
              onClick={() => {
                handleSwitchTab('history');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              Riwayat Surat
            </button>
          </div>
        </div>
      </div>

      {/* Submission Success Alert */}
      {submittedRequestId && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <strong className="block font-semibold text-emerald-100">Permohonan Surat Berhasil Dikirim!</strong>
              <span>
                Nomor permohonan Anda adalah <code className="font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">{submittedRequestId}</code>. Anda dapat memantau perkembangan verifikasi berkas pada daftar riwayat di bawah ini.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedRequestId(null)}
            className="text-xs text-emerald-400 hover:text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Workspace View */}
      {subTab === 'create' ? (
        <WargaFormPengajuanSurat
          currentWarga={currentWarga}
          initialLetterTypeId={selectedLetterTypeId}
          onSuccess={handleSuccessSubmission}
          onCancel={() => {
            setSelectedLetterTypeId(undefined);
            handleSwitchTab('history');
          }}
          onNavigateToDataChange={onNavigateToDataChange}
        />
      ) : (
        <WargaRiwayatSurat
          currentWarga={currentWarga}
          onNavigateToCreate={(typeId) => {
            setSelectedLetterTypeId(typeId);
            handleSwitchTab('create');
          }}
        />
      )}
    </div>
  );
};
