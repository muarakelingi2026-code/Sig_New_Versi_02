import { LetterType } from '../types';

export const DEFAULT_LETTER_TYPES: LetterType[] = [
  {
    id: 'lt-sk-domisili',
    code: 'SK_DOMISILI',
    name: 'Surat Keterangan Domisili',
    description: 'Surat keterangan resmi yang menerangkan bahwa warga berdomisili/bertempat tinggal di wilayah Desa Beliti Jaya.',
    icon: 'Home',
    category: 'kependudukan',
    workflowLevel: 'LEVEL_1_INSTAN',
    estimatedTime: 'Instan (Validasi Sistem)',
    active: true,
    requirements: [
      'KTP-el Asli / KTP Sementara yang masih berlaku',
      'Kartu Keluarga (KK) Desa Beliti Jaya'
    ],
    requiredFields: [
      {
        name: 'keperluan',
        label: 'Keperluan Pembuatan Surat',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Melamar pekerjaan, registrasi perbankan, pendaftaran BPJS',
        helpText: 'Sebutkan tujuan atau instansi yang memerlukan surat keterangan domisili ini.'
      },
      {
        name: 'lamaTinggal',
        label: 'Lama Berdomisili',
        type: 'text',
        required: false,
        placeholder: 'Contoh: Sejak lahir / 5 tahun (sejak 2019)',
        helpText: 'Estimasi kurun waktu warga bertempat tinggal pada alamat saat ini.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-usaha',
    code: 'SK_USAHA',
    name: 'Surat Keterangan Usaha (SKU)',
    description: 'Menerangkan bahwa warga benar memiliki dan menjalankan kegiatan usaha aktif di wilayah Desa Beliti Jaya.',
    icon: 'Briefcase',
    category: 'usaha',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan Operator)',
    active: true,
    requirements: [
      'KTP-el Pemilik Usaha',
      'Kartu Keluarga (KK)',
      'Dokumentasi / Foto fisik tempat usaha atau kegiatan dagang'
    ],
    requiredFields: [
      {
        name: 'namaUsaha',
        label: 'Nama Usaha / Toko / Badan Usaha',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Toko Sembako Berkah Jaya / Bengkel Beliti Motor',
        helpText: 'Nama usaha yang terpasang pada papan nama atau dikenal masyarakat.'
      },
      {
        name: 'bidangUsaha',
        label: 'Bidang / Jenis Kegiatan Usaha',
        type: 'select',
        required: true,
        options: [
          'Perdagangan Sembako / Kelontong',
          'Pertanian / Perkebunan Kelapa Sawit & Karet',
          'Peternakan / Perikanan',
          'Warung Kuliner / Makanan & Minuman',
          'Bengkel & Reparasi Kendaraan',
          'Jasa Konstruksi / Pertukangan',
          'Kerajinan & Industri Rumah Tangga',
          'Lainnya'
        ],
        helpText: 'Pilih klasifikasi jenis usaha yang dijalankan.'
      },
      {
        name: 'alamatUsaha',
        label: 'Lokasi / Alamat Tempat Usaha',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Jl. Poros Dusun II Beliti Jaya RT 03',
        helpText: 'Alamat spesifik tempat operasional kegiatan usaha di desa.'
      },
      {
        name: 'lamaUsaha',
        label: 'Lama Usaha Berjalan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: 3 Tahun (sejak 2021)',
        helpText: 'Durasi waktu usaha telah beroperasi.'
      },
      {
        name: 'keperluan',
        label: 'Keperluan Surat Keterangan Usaha',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Persyaratan pengajuan KUR Bank BRI / BNI / Mandiri, legalitas usaha',
        helpText: 'Tujuan penggunaan dokumen legalitas usaha ini.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-tidak-mampu',
    code: 'SK_TIDAK_MAMPU',
    name: 'Surat Keterangan Tidak Mampu (SKTM)',
    description: 'Menerangkan kondisi sosial ekonomi keluarga untuk keperluan beasiswa, keringanan biaya pendidikan, dan rumah sakit.',
    icon: 'HeartHandshake',
    category: 'sosial',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan Operator)',
    active: true,
    requirements: [
      'KTP Pemohon / Kepala Keluarga',
      'Kartu Keluarga (KK)',
      'Kartu KIS/BPJS atau KIP (jika memiliki)'
    ],
    requiredFields: [
      {
        name: 'peruntukan',
        label: 'Tujuan / Peruntukan SKTM',
        type: 'select',
        required: true,
        options: [
          'Keringanan Biaya Sekolah / Uang Kuliah Tunggal (UKT)',
          'Pendaftaran Beasiswa KIP Kuliah / Bidikmisi',
          'Keringanan Biaya Berobat / Rawat Inap Rumah Sakit',
          'Pengajuan Bantuan Sosial Pemerintah',
          'Permohonan Bantuan Hukum / Prodeo',
          'Lainnya'
        ],
        helpText: 'Pilih peruntukan resmi dokumen SKTM yang diajukan.'
      },
      {
        name: 'namaPenerimaManfaat',
        label: 'Nama Anak / Siswa / Pasien yang Bersangkutan',
        type: 'text',
        required: true,
        placeholder: 'Nama lengkap yang akan tercantum sebagai penerima bantuan/manfaat',
        helpText: 'Jika untuk beasiswa anak, tulis nama lengkap anak sesuai KK/Ijazah.'
      },
      {
        name: 'penghasilanKeluarga',
        label: 'Estimasi Rata-rata Penghasilan Keluarga per Bulan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Rp 800.000,- s/d Rp 1.200.000,- / bulan',
        helpText: 'Kondisi ekonomi riil keluarga.'
      },
      {
        name: 'jumlahTanggungan',
        label: 'Jumlah Tanggungan Keluarga (Jiwa)',
        type: 'number',
        required: true,
        placeholder: 'Contoh: 4',
        helpText: 'Jumlah anggota keluarga yang masih menjadi beban tanggungan.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-pengantar',
    code: 'SK_PENGANTAR',
    name: 'Surat Pengantar Umum',
    description: 'Surat pengantar resmi dari Pemerintah Desa Beliti Jaya ke Kecamatan, Kepolisian, Dinas Kependudukan, atau instansi lain.',
    icon: 'Send',
    category: 'umum',
    workflowLevel: 'LEVEL_1_INSTAN',
    estimatedTime: 'Instan (Validasi Sistem)',
    active: true,
    requirements: [
      'KTP-el Pemohon',
      'Kartu Keluarga (KK)'
    ],
    requiredFields: [
      {
        name: 'instansiTujuan',
        label: 'Instansi / Kantor Tujuan Pengantar',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Kantor Camat Muara Kelingi / Polsek Muara Kelingi / Disdukcapil Musi Rawas',
        helpText: 'Sebutkan instansi tujuan pengantar.'
      },
      {
        name: 'keperluan',
        label: 'Perihal / Keperluan Pengantar',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Rekam KTP-el / Permohonan SKCK / Pengesahan Berkas',
        helpText: 'Tujuan jelas yang akan dituliskan pada surat pengantar.'
      },
      {
        name: 'keteranganTambahan',
        label: 'Keterangan Tambahan',
        type: 'textarea',
        required: false,
        placeholder: 'Catatan penting lainnya bila ada...'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-belum-menikah',
    code: 'SK_BELUM_MENIKAH',
    name: 'Surat Keterangan Belum Menikah',
    description: 'Menerangkan bahwa warga yang bersangkutan secara hukum dan adat belum pernah melangsungkan ikatan perkawinan.',
    icon: 'UserCheck',
    category: 'kependudukan',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan Operator)',
    active: true,
    requirements: [
      'KTP-el Pemohon Asli',
      'Kartu Keluarga (KK)',
      'Surat Pernyataan Belum Pernah Menikah bermaterai (diserahkan saat pengambilan)'
    ],
    requiredFields: [
      {
        name: 'keperluan',
        label: 'Keperluan Surat',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Pendaftaran CPNS, Seleksi TNI/POLRI, Pengajuan KPR Rumah, Lamaran Pekerjaan',
        helpText: 'Sebutkan instansi atau perusahaan yang meminta surat ini.'
      },
      {
        name: 'keterangan',
        label: 'Keterangan Khusus',
        type: 'text',
        required: false,
        placeholder: 'Contoh: Berstatus jejaka/perawan sampai dengan tanggal pengajuan'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-kehilangan',
    code: 'SK_KEHILANGAN',
    name: 'Surat Keterangan Pengantar Kehilangan',
    description: 'Surat pengantar ke Polsek Muara Kelingi untuk pengurusan pelaporan kehilangan dokumen berharga atau barang.',
    icon: 'AlertCircle',
    category: 'umum',
    workflowLevel: 'LEVEL_2_VERIFIKASI',
    estimatedTime: '1 Hari Kerja (Pemeriksaan Operator)',
    active: true,
    requirements: [
      'KTP-el Pemohon',
      'Kartu Keluarga (KK)',
      'Salinan / Fotokopi dokumen yang hilang (jika masih memiliki)'
    ],
    requiredFields: [
      {
        name: 'dokumenHilang',
        label: 'Nama Barang / Dokumen yang Hilang',
        type: 'text',
        required: true,
        placeholder: 'Contoh: KTP Asli / Ijazah SMA Negeri / STNK Sepeda Motor / Buku Tabungan BRI',
        helpText: 'Sebutkan secara spesifik jenis barang/dokumen beserta nomor dokumen jika hafal.'
      },
      {
        name: 'tglKehilangan',
        label: 'Perkiraan Tanggal Kehilangan',
        type: 'date',
        required: true,
        helpText: 'Kapan barang/dokumen diperkirakan tercecer atau hilang.'
      },
      {
        name: 'lokasiKehilangan',
        label: 'Perkiraan Lokasi Kehilangan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Di perjalanan Dusun I menuju Pasar Muara Kelingi',
        helpText: 'Lokasi perkiraan saat dokumen hilang.'
      },
      {
        name: 'keperluan',
        label: 'Tujuan Surat',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Pengantar pelaporan kehilangan ke Polsek Muara Kelingi untuk penerbitan duplikat',
        helpText: 'Tujuan pelaporan dokumen.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-kelahiran',
    code: 'SK_KELAHIRAN',
    name: 'Surat Keterangan Kelahiran',
    description: 'Pencatatan resmi peristiwa kelahiran anak di wilayah desa untuk pengantar pembuatan Akta Kelahiran Disdukcapil.',
    icon: 'Baby',
    category: 'kependudukan',
    workflowLevel: 'LEVEL_3_PERSETUJUAN',
    estimatedTime: '1 - 2 Hari Kerja (Persetujuan Kepala Desa)',
    active: true,
    requirements: [
      'Surat Keterangan Kelahiran dari Bidan / Rumah Sakit / Puskesmas',
      'Kartu Keluarga (KK) Orang Tua',
      'KTP-el Ayah dan Ibu',
      'Buku Nikah / Akta Perkawinan Orang Tua'
    ],
    requiredFields: [
      {
        name: 'namaAnak',
        label: 'Nama Lengkap Bayi / Anak',
        type: 'text',
        required: true,
        placeholder: 'Nama lengkap bayi yang baru dilahirkan',
        helpText: 'Tulis nama lengkap dengan ejaan yang benar.'
      },
      {
        name: 'jenisKelaminAnak',
        label: 'Jenis Kelamin Anak',
        type: 'select',
        required: true,
        options: ['Laki-laki', 'Perempuan'],
        helpText: 'Jenis kelamin bayi.'
      },
      {
        name: 'tempatLahirAnak',
        label: 'Kota / Desa Tempat Dilahirkan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Beliti Jaya / Lubuklinggau',
        helpText: 'Nama tempat atau kota saat kelahiran.'
      },
      {
        name: 'tanggalLahirAnak',
        label: 'Tanggal Kelahiran',
        type: 'date',
        required: true,
        helpText: 'Tanggal lahir sesuai surat bidan/RS.'
      },
      {
        name: 'pukulLahirAnak',
        label: 'Pukul / Waktu Kelahiran',
        type: 'text',
        required: true,
        placeholder: 'Contoh: 07:45 WIB',
        helpText: 'Jam kelahiran bayi.'
      },
      {
        name: 'kelahiranKe',
        label: 'Anak ke-',
        type: 'number',
        required: true,
        placeholder: 'Contoh: 2',
        helpText: 'Urutan kelahiran anak dalam keluarga.'
      },
      {
        name: 'penolongKelahiran',
        label: 'Penolong Kelahiran',
        type: 'select',
        required: true,
        options: ['Bidan Desa', 'Dokter Kandungan', 'Puskesmas', 'Lainnya'],
        helpText: 'Tenaga medis penolong persalinan.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'lt-sk-kematian',
    code: 'SK_KEMATIAN',
    name: 'Surat Keterangan Kematian',
    description: 'Pencatatan resmi peristiwa kematian warga di desa sebagai dasar penerbitan Akta Kematian dan perubahan KK.',
    icon: 'FileSpreadsheet',
    category: 'kependudukan',
    workflowLevel: 'LEVEL_3_PERSETUJUAN',
    estimatedTime: '1 - 2 Hari Kerja (Persetujuan Kepala Desa)',
    active: true,
    requirements: [
      'KTP-el Almarhum/Almarhumah (asli)',
      'Kartu Keluarga (KK) Asli',
      'KTP-el Pelapor / Saksi Keluarga',
      'Surat Keterangan Medis dari Rumah Sakit/Puskesmas (jika ada)'
    ],
    requiredFields: [
      {
        name: 'namaJenazah',
        label: 'Nama Lengkap Almarhum / Almarhumah',
        type: 'text',
        required: true,
        placeholder: 'Nama lengkap almarhum sesuai KTP/KK',
        helpText: 'Nama jenazah yang dilaporkan.'
      },
      {
        name: 'nikJenazah',
        label: 'NIK Almarhum / Almarhumah',
        type: 'text',
        required: true,
        placeholder: '16 digit NIK almarhum',
        helpText: 'Nomor Induk Kependudukan almarhum.'
      },
      {
        name: 'tanggalMeninggal',
        label: 'Tanggal Kematian',
        type: 'date',
        required: true,
        helpText: 'Tanggal saat almarhum berpulang.'
      },
      {
        name: 'tempatMeninggal',
        label: 'Tempat Kematian',
        type: 'text',
        required: true,
        placeholder: 'Contoh: Kediaman Dusun I Beliti Jaya / RSUD Dr. Sobirin Lubuklinggau',
        helpText: 'Lokasi tempat almarhum meninggal dunia.'
      },
      {
        name: 'penyebabMeninggal',
        label: 'Penyebab Kematian',
        type: 'select',
        required: true,
        options: [
          'Sakit Biasa / Usia Lanjut',
          'Penyakit Akut / Menahun',
          'Kecelakaan Lalu Lintas / Kerja',
          'Lainnya'
        ],
        helpText: 'Keterangan penyebab kematian.'
      },
      {
        name: 'hubunganPelapor',
        label: 'Hubungan Pelapor dengan Almarhum',
        type: 'select',
        required: true,
        options: [
          'Suami / Istri',
          'Anak Kandung',
          'Orang Tua Kandung',
          'Saudara Kandung',
          'Keluarga Lainnya'
        ],
        helpText: 'Status hubungan keluarga pelapor.'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];
