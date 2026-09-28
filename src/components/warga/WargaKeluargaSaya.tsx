import React, { useState } from 'react';
import { Penduduk, Keluarga, DesaProfile, WargaSession } from '../../types';
import { 
  Users, 
  IdCard, 
  MapPin, 
  UserCheck, 
  Heart, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  ShieldCheck, 
  User, 
  FileEdit, 
  X, 
  Info,
  ChevronRight,
  Eye
} from 'lucide-react';

interface WargaKeluargaSayaProps {
  currentWarga: WargaSession;
  penduduk: Penduduk;
  keluarga: Keluarga;
  desaProfile?: DesaProfile;
  onOpenLaporPerubahan?: (targetPendudukId?: string, defaultField?: string) => void;
}

export const WargaKeluargaSaya: React.FC<WargaKeluargaSayaProps> = ({
  currentWarga,
  penduduk,
  keluarga,
  desaProfile,
  onOpenLaporPerubahan
}) => {
  const [selectedMember, setSelectedMember] = useState<Penduduk | null>(null);

  const namaDesa = desaProfile?.namaDesa || 'Beliti Jaya';
  const kecamatan = desaProfile?.kecamatan || 'Muara Kelingi';
  const kabupaten = desaProfile?.kabupaten || 'Musi Rawas';

  // Format tanggal lahir
  const formatTanggal = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const day = parseInt(parts[2], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const year = parts[0];
        return `${day} ${months[monthIndex]} ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Hitung usia
  const getUsia = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const birth = new Date(dateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} Tahun`;
    } catch {
      return '-';
    }
  };

  const anggotaList = keluarga.anggotaKeluarga || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Ringkasan Kartu Keluarga Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Kartu Keluarga Resmi Desa {namaDesa}</span>
            </div>
            
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                {keluarga.noKk}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                (Nomor Kartu Keluarga)
              </span>
            </div>

            <p className="text-sm text-slate-300">
              Kepala Keluarga: <span className="font-bold text-white">{keluarga.namaKepalaKeluarga}</span>
            </p>
          </div>

          {/* Badge Statistik Ringkas */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 self-start md:self-auto backdrop-blur-sm">
            <div className="text-center px-3 border-r border-slate-700/80">
              <div className="text-2xl font-black text-emerald-400">{anggotaList.length}</div>
              <div className="text-[11px] font-semibold text-slate-400">Total Anggota</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xs font-bold text-slate-200">{keluarga.dusun}</div>
              <div className="text-[11px] text-slate-400">RT {keluarga.rt} / RW {keluarga.rw}</div>
            </div>
          </div>
        </div>

        {/* Info Alamat & Domisili Terpadu */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{keluarga.alamat}, {keluarga.dusun}, Desa {namaDesa}, Kec. {kecamatan}, Kab. {kabupaten}</span>
          </div>
          {keluarga.statusKesejahteraan && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300 font-medium">{keluarga.statusKesejahteraan}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Daftar Anggota Keluarga */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Daftar Anggota Keluarga</h3>
            <p className="text-xs text-slate-400">Seluruh anggota kependudukan yang terdaftar pada Kartu Keluarga ini</p>
          </div>

          {onOpenLaporPerubahan && (
            <button
              onClick={() => onOpenLaporPerubahan()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Koreksi Data Keluarga</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anggotaList.map((member) => {
            const isMe = member.id === currentWarga.pendudukId;
            const isKepala = member.statusKeluarga === 'Kepala Keluarga' || member.nik === keluarga.nikKepala;

            return (
              <div 
                key={member.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isMe 
                    ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/20' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isMe 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {member.foto ? (
                          <img src={member.foto} alt={member.nama} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white truncate">{member.nama}</h4>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-2xs">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-emerald-400 mt-0.5">
                          NIK: {member.nik}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold tracking-wide border shrink-0 ${
                      isKepala
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {member.statusKeluarga}
                    </span>
                  </div>

                  {/* Ringkasan Data Anggota */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 my-2 border-y border-slate-800/80 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10.5px]">Jenis Kelamin</span>
                      <span className="font-medium text-slate-200">{member.jenisKelamin}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10.5px]">Usia / Tanggal Lahir</span>
                      <span className="font-medium text-slate-200">{getUsia(member.tanggalLahir)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10.5px]">Pekerjaan</span>
                      <span className="font-medium text-slate-200 truncate block">{member.pekerjaan || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10.5px]">Status Penduduk</span>
                      <span className="font-medium text-emerald-400">{member.statusPenduduk || 'Tetap'}</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Anggota */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Detail Info</span>
                  </button>

                  {onOpenLaporPerubahan && (
                    <button
                      onClick={() => onOpenLaporPerubahan(member.id)}
                      className="py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Laporkan koreksi untuk anggota keluarga ini"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Koreksi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Modal Detail Ringkas Anggota (Prinsip Minimum Necessary Data) */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Detail Anggota Keluarga</h3>
                  <p className="text-xs text-slate-400">Informasi resmi kependudukan</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profil Singkat */}
            <div className="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0 border border-slate-700">
                {selectedMember.foto ? (
                  <img src={selectedMember.foto} alt={selectedMember.nama} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-white truncate">{selectedMember.nama}</h4>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">NIK: {selectedMember.nik}</div>
                <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedMember.statusKeluarga}
                </div>
              </div>
            </div>

            {/* Atribut Lengkap */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Tempat, Tanggal Lahir</span>
                <span className="text-white font-medium text-right">
                  {selectedMember.tempatLahir}, {formatTanggal(selectedMember.tanggalLahir)} ({getUsia(selectedMember.tanggalLahir)})
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Jenis Kelamin</span>
                <span className="text-white text-right">{selectedMember.jenisKelamin}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Agama</span>
                <span className="text-white text-right">{selectedMember.agama}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Status Perkawinan</span>
                <span className="text-white text-right">{selectedMember.statusPerkawinan}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Pendidikan Terakhir</span>
                <span className="text-white text-right">{selectedMember.pendidikan}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Pekerjaan</span>
                <span className="text-white text-right">{selectedMember.pekerjaan}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Status Penduduk</span>
                <span className="text-emerald-400 font-semibold text-right">{selectedMember.statusPenduduk || 'Tetap'}</span>
              </div>
            </div>

            {/* Tombol Tindakan */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {onOpenLaporPerubahan && (
                <button
                  onClick={() => {
                    const targetId = selectedMember.id;
                    setSelectedMember(null);
                    onOpenLaporPerubahan(targetId);
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Koreksi Data Ini</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
