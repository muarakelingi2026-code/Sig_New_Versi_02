import { LetterType } from '../types';

/**
 * MASTER KONFIGURASI JENIS SURAT DINAS PEMERINTAH DESA (STAGE 7.2B.1)
 * Memuat master resmi surat dinas kedinasan aparatur dengan klasifikasi dan workflow terpisah:
 * - DINAS_UNDANGAN (005) -> LEVEL_2_VERIFIKASI
 * - DINAS_TUGAS (090) -> LEVEL_2_VERIFIKASI
 * - DINAS_EDARAN (100) -> LEVEL_2_VERIFIKASI
 * - DINAS_REKOMENDASI (800) -> LEVEL_3_PERSETUJUAN
 */
export const DEFAULT_OFFICIAL_LETTER_TYPES: LetterType[] = [
  {
    id: 'lt-dinas-undangan',
    code: 'DINAS_UNDANGAN',
    name: 'Surat Undangan Dinas',
    description: 'Surat resmi kedinasan pemerintah desa untuk mengundang instansi pemerintah, lembaga kemasyarakatan, perangkat desa, atau pihak eksternal/internal dalam pertemuan, rapat koordinasi, atau kegiatan kedinasan.',
    icon: 'Mail',
    category: 'dinas',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan & Registrasi)',
    active: true,
    classificationCode: '005',
    requirements: [
      'Agenda, Pokok Bahasan & Jadwal Pelaksanaan Acara',
      'Daftar Pihak / Instansi Sasaran yang Dituju'
    ],
    requiredFields: [
      {
        name: 'acara',
        label: 'Nama / Tajuk Acara atau Rapat',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Rapat Koordinasi Penataan Batas Wilayah & Tata Ruang Desa',
        helpText: 'Nama resmi agenda kegiatan yang diselenggarakan oleh Pemerintah Desa.'
      },
      {
        name: 'hariTanggal',
        label: 'Hari / Tanggal Acara',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Senin, 12 Oktober 2026',
        helpText: 'Hari dan tanggal pelaksanaan pertemuan/kegiatan.'
      },
      {
        name: 'waktu',
        label: 'Waktu Pelaksanaan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: 09.00 WIB s/d Selesai',
        helpText: 'Waktu mulai sampai dengan selesai acara.'
      },
      {
        name: 'tempat',
        label: 'Tempat / Lokasi Acara',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Balai Pertemuan Kantor Desa Beliti Jaya',
        helpText: 'Lokasi spesifik ruang pertemuan atau balai desa.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-dinas-tugas',
    code: 'DINAS_TUGAS',
    name: 'Surat Tugas',
    description: 'Surat perintah dan penugasan kedinasan dari Kepala Desa kepada aparatur desa, anggota BPD, tim pelaksana teknis, atau staf untuk melaksanakan penugasan kedinasan tertentu.',
    icon: 'Briefcase',
    category: 'dinas',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan & Verifikasi)',
    active: true,
    classificationCode: '090',
    requirements: [
      'Identitas Aparatur / Personil Pelaksana Tugas Kedinasan',
      'Dasar Hukum / Surat Rujukan atau Undangan Pelaksanaan Tugas'
    ],
    requiredFields: [
      {
        name: 'namaPetugas',
        label: 'Nama Aparatur / Petugas yang Ditugaskan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: AHMAD FAUZI, S.AP / Tim Pelaksana Kegiatan',
        helpText: 'Nama lengkap personil atau delegasi aparatur yang menerima penugasan.'
      },
      {
        name: 'jabatanPetugas',
        label: 'Jabatan Aparatur / Petugas',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Kasi Pemerintahan Desa Beliti Jaya',
        helpText: 'Jabatan kedinasan pelaksana tugas.'
      },
      {
        name: 'tujuanTugas',
        label: 'Maksud & Uraian Tugas',
        type: 'textarea',
        required: true,
        placeholder: 'Contoh: Menghadiri Rapat Koordinasi Sinkronisasi Data Kemiskinan Ekstrem di Kantor Camat Muara Kelingi',
        helpText: 'Uraian detail tugas kedinasan yang diamanatkan.'
      },
      {
        name: 'lokasiTugas',
        label: 'Tempat / Lokasi Pelaksanaan Tugas',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Aula Kantor Kecamatan Muara Kelingi / Bappeda Kab. Musi Rawas',
        helpText: 'Lokasi atau instansi tempat pelaksanaan penugasan.'
      },
      {
        name: 'jangkaWaktu',
        label: 'Waktu / Jangka Waktu Pelaksanaan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: 1 (satu) hari kerja pada tanggal 15 Oktober 2026',
        helpText: 'Lama masa berlaku surat penugasan.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-dinas-edaran',
    code: 'DINAS_EDARAN',
    name: 'Surat Edaran/Pemberitahuan',
    description: 'Surat edaran atau pengumuman kedinasan resmi Pemerintah Desa Beliti Jaya kepada masyarakat, Ketua RT/Kadus, instansi rekanan, atau pelaku usaha mengenai kebijakan, himbauan, atau penertiban.',
    icon: 'Megaphone',
    category: 'dinas',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan & Pengesahan)',
    active: true,
    classificationCode: '100',
    requirements: [
      'Muatan Pokok Kebijakan / Himbauan Kedinasan',
      'Target Sasaran Penerima Edaran'
    ],
    requiredFields: [
      {
        name: 'halPemberitahuan',
        label: 'Pokok Pemberitahuan / Himbauan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Himbauan Pelaksanaan Gotong Royong Kebersihan Saluran Irigasi Lingkungan Dusun',
        helpText: 'Pokok bahasan utama surat edaran kedinasan.'
      },
      {
        name: 'sasaranPenerima',
        label: 'Sasaran Penerima Edaran',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Seluruh Ketua RT 01 s/d RT 06, Tokoh Masyarakat, dan Warga se-Desa Beliti Jaya',
        helpText: 'Pihak-pihak sasaran yang menerima edaran.'
      },
      {
        name: 'ringkasanInstruksi',
        label: 'Poin Pokok Instruksi / Himbauan',
        type: 'textarea',
        required: true,
        placeholder: 'Contoh: 1. Melaksanakan pembersihan parit di depan pekarangan masing-masing; 2. Menjaga ketertiban umum...',
        helpText: 'Rincian pesan atau arahan yang disampaikan Pemerintah Desa.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-dinas-rekomendasi',
    code: 'DINAS_REKOMENDASI',
    name: 'Surat Rekomendasi Kedinasan',
    description: 'Surat pertimbangan atau rekomendasi resmi yang diterbitkan Kepala Desa Beliti Jaya untuk kepentingan usulan program kedinasan, bantuan pemerintah daerah/pusat, atau perizinan instansi sektoral.',
    icon: 'FileCheck',
    category: 'dinas',
    workflowLevel: 'LEVEL_3_PERSETUJUAN',
    estimatedTime: '2 Hari Kerja (Verifikasi Sekdes & Persetujuan Kepala Desa)',
    active: true,
    classificationCode: '800',
    requirements: [
      'Surat Permohonan / Usulan Rekomendasi Kedinasan yang Masuk',
      'Telaah Administratif / Kelayakan oleh Sekretariat Desa',
      'Persetujuan Langsung dari Kepala Desa Beliti Jaya'
    ],
    requiredFields: [
      {
        name: 'pihakDirekomendasikan',
        label: 'Pihak / Lembaga / Personil yang Direkomendasikan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Kelompok Tani "Karya Mandiri" Dusun II Beliti Jaya',
        helpText: 'Pihak penerima rekomendasi kedinasan.'
      },
      {
        name: 'maksudRekomendasi',
        label: 'Maksud / Keperluan Rekomendasi Kedinasan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Usulan Permohonan Bantuan Sumur Bor Pertanian ke Dinas Pertanian Kab. Musi Rawas',
        helpText: 'Tujuan spesifik peruntukan rekomendasi resmi.'
      },
      {
        name: 'dasarPertimbangan',
        label: 'Dasar / Pertimbangan Pemberian Rekomendasi',
        type: 'textarea',
        required: true,
        placeholder: 'Contoh: Bahwa kelompok pemohon merupakan kelembagaan petani aktif dan terdaftar secara sah pada SIMLUHTAN.',
        helpText: 'Dasar pertimbangan objektif Kepala Desa dalam memberikan rekomendasi.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];
