import { LetterNumberingConfig } from '../types';

export const DEFAULT_LETTER_NUMBERING_CONFIG: LetterNumberingConfig = {
  format: '{{kode_klasifikasi}} / {{nomor_urut}} / {{kode_desa}} / {{bulan_romawi}} / {{tahun}}',
  kodeDesa: '2008', // Kode registrasi Desa Beliti Jaya pada arsip Kecamatan Muara Kelingi
  paddingDigits: 4, // 4 digit: 0001, 0002, dst.
  resetTahunan: true,
  tahunBerjalan: 2026,
  counterByYear: {
    '2026': 0
  },
  classifications: {
    SK_DOMISILI: '470',
    SK_USAHA: '503',
    SK_TIDAK_MAMPU: '401',
    SK_PENGANTAR: '470',
    SK_BELUM_MENIKAH: '474.2',
    SK_KEHILANGAN: '300',
    SK_KELAHIRAN: '472.11',
    SK_KEMATIAN: '472.12',
    // Klasifikasi Surat Dinas (Tahap 7.2B.1)
    DINAS_UNDANGAN: '005',
    DINAS_TUGAS: '090',
    DINAS_EDARAN: '100',
    DINAS_REKOMENDASI: '800'
  }
};
