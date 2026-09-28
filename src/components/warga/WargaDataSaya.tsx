import React, { useState } from 'react';
import { Penduduk, Keluarga, DesaProfile } from '../../types';
import { 
  User, 
  IdCard, 
  Calendar, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Heart, 
  Phone, 
  Home, 
  AlertCircle, 
  ShieldCheck, 
  Send,
  X,
  CheckCircle2,
  FileEdit
} from 'lucide-react';

interface WargaDataSayaProps {
  penduduk: Penduduk;
  keluarga: Keluarga;
  desaProfile?: DesaProfile;
  onOpenLaporPerubahan?: () => void;
}

export const WargaDataSaya: React.FC<WargaDataSayaProps> = ({
  penduduk,
  keluarga,
  desaProfile,
  onOpenLaporPerubahan
}) => {
  const [isLaporModalOpen, setIsLaporModalOpen] = useState(false);
  const [laporPesan, setLaporPesan] = useState('');
  const [isLaporSubmitted, setIsLaporSubmitted] = useState(false);

  const namaDesa = desaProfile?.namaDesa || 'Beliti Jaya';
  const kecamatan = desaProfile?.kecamatan || 'Muara Kelingi';
  const kabupaten = desaProfile?.kabupaten || 'Musi Rawas';
  const provinsi = desaProfile?.provinsi || 'Sumatera Selatan';

  // Format tanggal lahir ke bahasa Indonesia
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

  const handleKirimLaporan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laporPesan.trim()) return;
    setIsLaporSubmitted(true);
    setTimeout(() => {
      setIsLaporSubmitted(false);
      setIsLaporModalOpen(false);
      setLaporPesan('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Halaman Data Saya */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden flex items-center justify-center text-emerald-400">
            {penduduk.foto ? (
              <img src={penduduk.foto} alt={penduduk.nama} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{penduduk.nama}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {penduduk.statusPenduduk || 'Penduduk Tetap'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              NIK: <span className="text-slate-200">{penduduk.nik}</span> • No. KK: <span className="text-slate-200">{keluarga.noKk}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onOpenLaporPerubahan) {
              onOpenLaporPerubahan();
            } else {
              setIsLaporModalOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
        >
          <FileEdit className="w-4 h-4" />
          <span>Laporkan Perubahan Data</span>
        </button>
      </div>

      {/* Grid Informasi Identitas & Alamat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: IDENTITAS PRIBADI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
            <IdCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identitas Kependudukan</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Nama Lengkap</span>
              <span className="font-semibold text-white text-right">{penduduk.nama}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Nomor Induk Kependudukan (NIK)</span>
              <span className="font-mono text-emerald-400 font-semibold text-right">{penduduk.nik}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Nomor Kartu Keluarga (KK)</span>
              <span className="font-mono text-slate-200 text-right">{keluarga.noKk}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Tempat, Tanggal Lahir</span>
              <span className="text-white text-right font-medium">
                {penduduk.tempatLahir}, {formatTanggal(penduduk.tanggalLahir)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Jenis Kelamin</span>
              <span className="text-white text-right">{penduduk.jenisKelamin}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Agama</span>
              <span className="text-white text-right">{penduduk.agama}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Status Perkawinan</span>
              <span className="text-white text-right">{penduduk.statusPerkawinan}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Kedudukan dalam Keluarga</span>
              <span className="text-emerald-300 font-medium text-right">{penduduk.statusKeluarga}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Pendidikan Terakhir</span>
              <span className="text-white text-right">{penduduk.pendidikan}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Pekerjaan</span>
              <span className="text-white text-right">{penduduk.pekerjaan}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Nomor Telepon</span>
              <span className="text-white text-right">{penduduk.nomorTelepon || '-'}</span>
            </div>
          </div>
        </div>

        {/* Kolom 2: ALAMAT & WILAYAH DOMISILI */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alamat & Domisili</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Alamat Rumah</span>
                <span className="font-semibold text-white text-right max-w-xs">{keluarga.alamat}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Rukun Tetangga (RT)</span>
                <span className="text-white text-right font-mono">RT {keluarga.rt}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Rukun Warga (RW)</span>
                <span className="text-white text-right font-mono">RW {keluarga.rw}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Dusun / Wilayah</span>
                <span className="text-emerald-400 font-semibold text-right">{keluarga.dusun}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Desa</span>
                <span className="text-white text-right">{namaDesa}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Kecamatan</span>
                <span className="text-white text-right">{kecamatan}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Kabupaten</span>
                <span className="text-white text-right">{kabupaten}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Provinsi</span>
                <span className="text-white text-right">{provinsi}</span>
              </div>
            </div>
          </div>

          {/* Informasi Keabsahan Data */}
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-emerald-300">Data Terintegrasi Master Kependudukan Desa</p>
              <p className="text-slate-400 leading-relaxed">
                Informasi di atas merupakan catatan resmi kependudukan Anda pada sistem Pemerintahan Desa Beliti Jaya. Untuk menjaga keabsahan hukum, perubahan data hanya dapat diproses melalui verifikasi operator desa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lapor Perubahan Data (Placeholder untuk Tahap berikutnya) */}
      {isLaporModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Laporkan Perubahan Data</h3>
              </div>
              <button
                onClick={() => setIsLaporModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLaporSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Laporan Berhasil Disimpan!</p>
                <p className="text-xs text-slate-400">
                  Pemberitahuan perubahan data Anda telah tercatat dan akan ditindaklanjuti oleh petugas loket kependudukan desa.
                </p>
              </div>
            ) : (
              <form onSubmit={handleKirimLaporan} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tuliskan data yang perlu diperbarui atau dikoreksi (misalnya perubahan pekerjaan, status perkawinan, atau perbaikan ejaan nama):
                </p>

                <textarea
                  rows={4}
                  value={laporPesan}
                  onChange={e => setLaporPesan(e.target.value)}
                  placeholder="Contoh: Pekerjaan saya saat ini adalah Wiraswasta, mohon perbarui data pekerjaan saya..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  required
                />

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Pastikan membawa dokumen pendukung (KTP asli / Kartu Keluarga) jika diperlukan verifikasi fisik di kantor desa.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLaporModalOpen(false)}
                    className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Laporan</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
