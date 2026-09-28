import React, { useState, useMemo } from 'react';
import { 
  Penduduk, 
  Keluarga, 
  WargaSession, 
  WargaFieldChange, 
  JenisKelamin, 
  StatusPerkawinan, 
  StatusHubunganKeluarga, 
  JenjangPendidikan, 
  DusunWilayah 
} from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  FileEdit, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  FileText, 
  HelpCircle, 
  Clock, 
  ShieldAlert, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface WargaFormLaporPerubahanProps {
  currentWarga: WargaSession;
  penduduk: Penduduk;
  keluarga: Keluarga;
  initialTargetPendudukId?: string;
  onSuccess: (requestId: string) => void;
  onCancel?: () => void;
}

interface FieldDefinition {
  id: string;
  label: string;
  category: 'identitas' | 'kependudukan' | 'kontak' | 'domisili';
  type: 'text' | 'select' | 'date';
  options?: string[];
  getCurrentValue: (p: Penduduk, k: Keluarga) => string;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    id: 'nama',
    label: 'Nama Lengkap',
    category: 'identitas',
    type: 'text',
    getCurrentValue: p => p.nama || ''
  },
  {
    id: 'tempatLahir',
    label: 'Tempat Lahir',
    category: 'identitas',
    type: 'text',
    getCurrentValue: p => p.tempatLahir || ''
  },
  {
    id: 'tanggalLahir',
    label: 'Tanggal Lahir',
    category: 'identitas',
    type: 'date',
    getCurrentValue: p => p.tanggalLahir || ''
  },
  {
    id: 'jenisKelamin',
    label: 'Jenis Kelamin',
    category: 'identitas',
    type: 'select',
    options: ['Laki-Laki', 'Perempuan'],
    getCurrentValue: p => p.jenisKelamin || ''
  },
  {
    id: 'agama',
    label: 'Agama',
    category: 'identitas',
    type: 'select',
    options: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'],
    getCurrentValue: p => p.agama || ''
  },
  {
    id: 'statusPerkawinan',
    label: 'Status Perkawinan',
    category: 'kependudukan',
    type: 'select',
    options: ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'],
    getCurrentValue: p => p.statusPerkawinan || ''
  },
  {
    id: 'statusKeluarga',
    label: 'Kedudukan dalam Keluarga',
    category: 'kependudukan',
    type: 'select',
    options: ['Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Famili Lain'],
    getCurrentValue: p => p.statusKeluarga || ''
  },
  {
    id: 'pendidikan',
    label: 'Pendidikan Terakhir',
    category: 'kependudukan',
    type: 'select',
    options: ['Tidak/Belum Sekolah', 'SD', 'SMP', 'SMA', 'Diploma (D1-D3)', 'S1/Kuliah', 'S2/S3'],
    getCurrentValue: p => p.pendidikan || ''
  },
  {
    id: 'pekerjaan',
    label: 'Pekerjaan',
    category: 'kependudukan',
    type: 'text',
    getCurrentValue: p => p.pekerjaan || ''
  },
  {
    id: 'nomorTelepon',
    label: 'Nomor Telepon / WhatsApp',
    category: 'kontak',
    type: 'text',
    getCurrentValue: p => p.nomorTelepon || ''
  },
  {
    id: 'alamat',
    label: 'Alamat Tempat Tinggal',
    category: 'domisili',
    type: 'text',
    getCurrentValue: (p, k) => k.alamat || ''
  },
  {
    id: 'rt',
    label: 'Rukun Tetangga (RT)',
    category: 'domisili',
    type: 'text',
    getCurrentValue: (p, k) => k.rt || ''
  },
  {
    id: 'rw',
    label: 'Rukun Warga (RW)',
    category: 'domisili',
    type: 'text',
    getCurrentValue: (p, k) => k.rw || ''
  },
  {
    id: 'dusun',
    label: 'Dusun Wilayah',
    category: 'domisili',
    type: 'select',
    options: ['Dusun I', 'Dusun II', 'Dusun III', 'Dusun IV'],
    getCurrentValue: (p, k) => k.dusun || ''
  }
];

export const WargaFormLaporPerubahan: React.FC<WargaFormLaporPerubahanProps> = ({
  currentWarga,
  penduduk,
  keluarga,
  initialTargetPendudukId,
  onSuccess,
  onCancel
}) => {
  // Target anggota keluarga yang ingin dilaporkan
  const [targetPendudukId, setTargetPendudukId] = useState<string>(
    initialTargetPendudukId || currentWarga.pendudukId
  );

  // Field mana yang dipilih untuk diubah
  const [selectedFieldId, setSelectedFieldId] = useState<string>('nama');
  const [proposedValue, setProposedValue] = useState<string>('');
  
  // Daftar perubahan yang ditambahkan ke draf
  const [changesList, setChangesList] = useState<WargaFieldChange[]>([]);

  // Metadata pengajuan
  const [alasan, setAlasan] = useState<string>('');
  const [catatanWarga, setCatatanWarga] = useState<string>('');
  const [lampiranBukti, setLampiranBukti] = useState<string>('');

  // Status submission & error feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Cari objek target penduduk dari keluarga
  const targetPenduduk = useMemo(() => {
    return keluarga.anggotaKeluarga.find(m => m.id === targetPendudukId) || penduduk;
  }, [keluarga, targetPendudukId, penduduk]);

  // Current field definition
  const currentFieldDef = useMemo(() => {
    return FIELD_DEFINITIONS.find(f => f.id === selectedFieldId) || FIELD_DEFINITIONS[0];
  }, [selectedFieldId]);

  // Nilai saat ini dari field yang dipilih
  const currentValue = useMemo(() => {
    return currentFieldDef.getCurrentValue(targetPenduduk, keluarga);
  }, [currentFieldDef, targetPenduduk, keluarga]);

  // Handle tambah field ke daftar perubahan
  const handleAddChange = () => {
    setErrorMsg(null);
    const cleanProposed = proposedValue.trim();

    if (!cleanProposed) {
      setErrorMsg(`Nilai baru untuk bidang "${currentFieldDef.label}" tidak boleh kosong.`);
      return;
    }

    if (cleanProposed === currentValue) {
      setErrorMsg(`Nilai baru yang Anda masukkan sama persis dengan nilai data saat ini ("${currentValue}"). Silakan masukkan data baru yang berbeda.`);
      return;
    }

    // Tambah atau timpa jika sudah ada di list
    const existingIndex = changesList.findIndex(c => c.field === currentFieldDef.id);
    const newChangeItem: WargaFieldChange = {
      field: currentFieldDef.id,
      label: currentFieldDef.label,
      oldValue: currentValue || '(Kosong / Belum Ada)',
      newValue: cleanProposed
    };

    if (existingIndex >= 0) {
      const updated = [...changesList];
      updated[existingIndex] = newChangeItem;
      setChangesList(updated);
    } else {
      setChangesList([...changesList, newChangeItem]);
    }

    // Reset input proposed value
    setProposedValue('');
  };

  const handleRemoveChange = (fieldId: string) => {
    setChangesList(changesList.filter(c => c.field !== fieldId));
  };

  // Submit pengajuan resmi ke StorageService
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Jika belum ada di changesList tapi user sudah mengetik di form, otomatis tambahkan
    let finalChanges = [...changesList];
    if (finalChanges.length === 0 && proposedValue.trim()) {
      if (proposedValue.trim() !== currentValue) {
        finalChanges = [{
          field: currentFieldDef.id,
          label: currentFieldDef.label,
          oldValue: currentValue || '(Kosong / Belum Ada)',
          newValue: proposedValue.trim()
        }];
      }
    }

    if (finalChanges.length === 0) {
      setErrorMsg('Harap tambahkan setidaknya satu bidang data yang ingin dikoreksi atau diperbarui.');
      return;
    }

    if (!alasan.trim()) {
      setErrorMsg('Alasan atau keterangan perubahan data wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = StorageService.createDataChangeRequest({
        wargaAccountId: currentWarga.wargaAccountId,
        pendudukId: targetPenduduk.id,
        changes: finalChanges,
        alasan: alasan.trim(),
        catatanWarga: catatanWarga.trim() || undefined,
        lampiranBukti: lampiranBukti.trim() || undefined
      });

      if (!result.success || !result.request) {
        setErrorMsg(result.message);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(result.request!.id);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat mengirim pengajuan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileEdit className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Laporkan Perubahan Data
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Koreksi dan pembaruan data kependudukan resmi dengan verifikasi aparatur kantor desa
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Verifikasi Kantor Desa</span>
          </div>
        </div>
      </div>

      {isSuccess ? (
        <div className="p-8 bg-slate-900 border border-emerald-500/40 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Pengajuan Berhasil Terkirim!</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Laporan perubahan data kependudukan Anda telah tercatat dan masuk ke antrean verifikasi aparatur desa. Anda akan dialihkan ke Riwayat Pengajuan...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Peringatan Pengajuan:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* 1. Pilih Target Anggota Keluarga */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <User className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Pilih Anggota Keluarga yang Ingin Dikoreksi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {keluarga.anggotaKeluarga.map(m => {
                const isSelected = m.id === targetPendudukId;
                const isMe = m.id === currentWarga.pendudukId;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setTargetPendudukId(m.id);
                      setChangesList([]); // reset changes when changing target
                      setProposedValue('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500/30' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white truncate">{m.nama}</span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                          Anda
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 font-mono">
                      NIK: {m.nik}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-1">
                      {m.statusKeluarga}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pilih Data yang Ingin Diubah & Masukkan Nilai Baru */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Tentukan Data yang Ingin Diubah
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dropdown Pemilihan Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Pilih Bidang / Jenis Data
                </label>
                <select
                  value={selectedFieldId}
                  onChange={e => {
                    setSelectedFieldId(e.target.value);
                    setProposedValue('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none transition-colors"
                >
                  <optgroup label="Identitas Kependudukan">
                    {FIELD_DEFINITIONS.filter(f => f.category === 'identitas').map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Status Kependudukan">
                    {FIELD_DEFINITIONS.filter(f => f.category === 'kependudukan').map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kontak Warga">
                    {FIELD_DEFINITIONS.filter(f => f.category === 'kontak').map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Alamat & Domisili Keluarga">
                    {FIELD_DEFINITIONS.filter(f => f.category === 'domisili').map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Tampilan Nilai Saat Ini (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Nilai Data Saat Ini (Database Desa)
                </label>
                <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 font-medium min-h-[42px] flex items-center">
                  {currentValue || <span className="text-slate-600 italic">Belum tercatat / kosong</span>}
                </div>
              </div>
            </div>

            {/* Input Nilai Baru yang Diajukan */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-emerald-400 mb-2">
                Nilai Baru yang Diajukan *
              </label>

              {currentFieldDef.type === 'select' && currentFieldDef.options ? (
                <select
                  value={proposedValue}
                  onChange={e => setProposedValue(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white outline-none transition-colors"
                >
                  <option value="">-- Pilih Nilai Baru --</option>
                  {currentFieldDef.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : currentFieldDef.type === 'date' ? (
                <input
                  type="date"
                  value={proposedValue}
                  onChange={e => setProposedValue(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white outline-none transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={proposedValue}
                  onChange={e => setProposedValue(e.target.value)}
                  placeholder={`Masukkan ${currentFieldDef.label} yang benar`}
                  className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white outline-none transition-colors"
                />
              )}

              <div className="flex items-center justify-between gap-4 mt-3">
                <span className="text-[11px] text-slate-500">
                  Klik tombol di samping untuk menyimpan bidang data ini ke draf perubahan Anda.
                </span>

                <button
                  type="button"
                  onClick={handleAddChange}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tambahkan ke Draf</span>
                </button>
              </div>
            </div>

            {/* Daftar Bidang yang Akan Diubah (Preview Perubahan) */}
            {changesList.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Draf Perubahan Data yang Disiapkan ({changesList.length}):</span>
                </h4>

                <div className="space-y-2">
                  {changesList.map(item => (
                    <div 
                      key={item.field}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-emerald-400">{item.label}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="line-through text-slate-500">{item.oldValue}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-bold text-white bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            {item.newValue}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveChange(item.field)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Alasan & Bukti Pendukung */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Alasan & Keterangan Pendukung
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Alasan Pengajuan Koreksi / Perubahan *
              </label>
              <textarea
                rows={3}
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                placeholder="Contoh: Terjadi kesalahan penulisan nama pada KTP, ingin disesuaikan dengan Akta Kelahiran dan Ijazah asli..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Nomor / Keterangan Dokumen Bukti (Opsional)
                </label>
                <input
                  type="text"
                  value={lampiranBukti}
                  onChange={e => setLampiranBukti(e.target.value)}
                  placeholder="Contoh: Akta Kelahiran No. 1234/DISDUKCAPIL/2018"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Catatan Tambahan untuk Petugas (Opsional)
                </label>
                <input
                  type="text"
                  value={catatanWarga}
                  onChange={e => setCatatanWarga(e.target.value)}
                  placeholder="Contoh: Dokumen asli dapat kami tunjukkan ke kantor desa"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tombol Aksi Form */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Perubahan Data'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
