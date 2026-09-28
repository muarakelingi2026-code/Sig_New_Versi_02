import { LetterTemplate } from '../types';

export const DEFAULT_LETTER_TEMPLATES: LetterTemplate[] = [
  // 1. Surat Keterangan Domisili
  {
    id: 'tpl-sk-domisili-v1',
    letterTypeId: 'lt-sk-domisili',
    name: 'Template Standar Surat Keterangan Domisili',
    code: 'TPL_SK_DOMISILI_V1',
    description: 'Format baku Surat Keterangan Domisili Penduduk Desa Beliti Jaya sesuai standar administrasi persuratan desa.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{tempat_lahir}}',
      '{{tanggal_lahir}}',
      '{{jenis_kelamin}}',
      '{{agama}}',
      '{{status_perkawinan}}',
      '{{pekerjaan}}',
      '{{pendidikan}}',
      '{{alamat}}',
      '{{rt}}',
      '{{rw}}',
      '{{dusun}}',
      '{{nama_desa}}',
      '{{nama_kecamatan}}',
      '{{nama_kabupaten}}',
      '{{nama_provinsi}}',
      '{{keperluan}}',
      '{{lama_tinggal}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT KETERANGAN DOMISILI',
      codePrefix: '470',
      letterNumberFormat: '470 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan dengan sebenarnya bahwa:',
      bodyParagraphs: [
        'Nama tersebut di atas adalah benar-benar warga penduduk yang berdomisili dan bertempat tinggal tetap pada alamat Dusun {{dusun}}, RT {{rt}} / RW {{rw}}, Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas sejak {{lama_tinggal}}.',
        'Sepanjang pengetahuan kami dan catatan administrasi kependudukan desa, yang bersangkutan berkelakuan baik, tidak sedang menjalani hukuman pidana, serta aktif dalam kegiatan kemasyarakatan di lingkungan tempat tinggalnya.',
        'Surat Keterangan Domisili ini dibuat dan diberikan kepada yang bersangkutan atas permohonannya untuk keperluan: {{keperluan}}.'
      ],
      closing: 'Demikian Surat Keterangan Domisili ini dibuat dengan sebenarnya dengan mengingat sumpah jabatan untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Keperluan', variableKey: 'keperluan' },
        { label: 'Lama Berdomisili', variableKey: 'lama_tinggal' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 2. Surat Keterangan Usaha (SKU)
  {
    id: 'tpl-sk-usaha-v1',
    letterTypeId: 'lt-sk-usaha',
    name: 'Template Standar Surat Keterangan Usaha (SKU)',
    code: 'TPL_SK_USAHA_V1',
    description: 'Format baku Surat Keterangan Usaha mikro/kecil bagi warga untuk persyaratan kredit perbankan/legalitas.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{tempat_lahir}}',
      '{{tanggal_lahir}}',
      '{{jenis_kelamin}}',
      '{{pekerjaan}}',
      '{{alamat}}',
      '{{rt}}',
      '{{rw}}',
      '{{dusun}}',
      '{{nama_usaha}}',
      '{{bidang_usaha}}',
      '{{alamat_usaha}}',
      '{{lama_usaha}}',
      '{{keperluan}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT KETERANGAN USAHA',
      codePrefix: '503',
      letterNumberFormat: '503 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan dengan sebenarnya bahwa:',
      bodyParagraphs: [
        'Nama tersebut di atas adalah benar-benar warga penduduk yang bertempat tinggal di wilayah Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas.',
        'Berdasarkan data dan peninjauan di lapangan, yang bersangkutan benar memiliki dan mengelola kegiatan usaha mandiri yang masih aktif beroperasi sampai saat ini dengan rincian kegiatan usaha sebagai berikut:',
        'Surat Keterangan Usaha (SKU) ini diberikan kepada yang bersangkutan untuk melengkapi persyaratan administratif permohonan bantuan modal, kredit perbankan, atau keperluan legalitas: {{keperluan}}.'
      ],
      closing: 'Demikian Surat Keterangan Usaha ini diterbitkan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya oleh instansi atau lembaga perbankan yang bersangkutan.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Nama Usaha', variableKey: 'nama_usaha' },
        { label: 'Bidang / Klasifikasi Usaha', variableKey: 'bidang_usaha' },
        { label: 'Lokasi / Alamat Usaha', variableKey: 'alamat_usaha' },
        { label: 'Lama Usaha Berjalan', variableKey: 'lama_usaha' },
        { label: 'Keperluan Dokumen', variableKey: 'keperluan' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 3. Surat Keterangan Tidak Mampu (SKTM)
  {
    id: 'tpl-sk-tidak-mampu-v1',
    letterTypeId: 'lt-sk-tidak-mampu',
    name: 'Template Standar Surat Keterangan Tidak Mampu (SKTM)',
    code: 'TPL_SK_TIDAK_MAMPU_V1',
    description: 'Format baku SKTM untuk keringanan biaya sekolah, beasiswa perguruan tinggi (KIP-K), dan rumah sakit.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{tempat_lahir}}',
      '{{tanggal_lahir}}',
      '{{jenis_kelamin}}',
      '{{pekerjaan}}',
      '{{alamat}}',
      '{{peruntukan}}',
      '{{nama_penerima_manfaat}}',
      '{{penghasilan_keluarga}}',
      '{{jumlah_tanggungan}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT KETERANGAN TIDAK MAMPU',
      codePrefix: '401',
      letterNumberFormat: '401 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan dengan sebenarnya bahwa:',
      bodyParagraphs: [
        'Nama tersebut di atas adalah benar-benar warga penduduk Desa Beliti Jaya yang terdaftar dalam data kependudukan kami.',
        'Setelah diadakan penelitian administratif dan pengecekan keadaan sosial ekonomi keluarga yang bersangkutan, benar bahwa keluarga pemohon tergolong dalam keluarga Kurang Mampu / Pra-Sejahtera dengan rata-rata penghasilan per bulan berkisar {{penghasilan_keluarga}} serta menanggung beban keluarga sebanyak {{jumlah_tanggungan}} jiwa.',
        'Surat Keterangan ini dikeluarkan secara resmi untuk peruntukan: {{peruntukan}}, khususnya atas nama yang bersangkutan atau tanggungan keluarga atas nama: {{nama_penerima_manfaat}}.'
      ],
      closing: 'Demikian Surat Keterangan Tidak Mampu (SKTM) ini dibuat dengan sebenarnya agar dapat dipergunakan sebagai bahan pertimbangan oleh pihak sekolah, universitas, dinas sosial, atau instansi layanan kesehatan terkait.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Peruntukan Dokumen', variableKey: 'peruntukan' },
        { label: 'Nama Penerima Manfaat', variableKey: 'nama_penerima_manfaat' },
        { label: 'Estimasi Penghasilan', variableKey: 'penghasilan_keluarga' },
        { label: 'Jumlah Tanggungan', variableKey: 'jumlah_tanggungan', suffix: ' Jiwa' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 4. Surat Pengantar Umum
  {
    id: 'tpl-sk-pengantar-v1',
    letterTypeId: 'lt-sk-pengantar',
    name: 'Template Standar Surat Pengantar Umum Desa',
    code: 'TPL_SK_PENGANTAR_V1',
    description: 'Format baku Surat Pengantar Resmi Pemerintah Desa ke instansi Kecamatan, Kepolisian, atau Dinas.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{tempat_lahir}}',
      '{{tanggal_lahir}}',
      '{{jenis_kelamin}}',
      '{{pekerjaan}}',
      '{{alamat}}',
      '{{instansi_tujuan}}',
      '{{keperluan}}',
      '{{keterangan_tambahan}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT PENGANTAR',
      codePrefix: '470',
      letterNumberFormat: '470 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan bahwa:',
      bodyParagraphs: [
        'Nama yang bersangkutan adalah warga penduduk Desa Beliti Jaya yang berkelakuan baik dan tercatat sah dalam basis data kependudukan desa.',
        'Pemerintah Desa Beliti Jaya dengan ini memberikan Surat Pengantar kepada yang bersangkutan untuk menghadap atau berurusan kepada pihak: {{instansi_tujuan}}.',
        'Adapun maksud dan perihal pengantar ini adalah dalam rangka pengurusan permohonan / administrasi: {{keperluan}}.'
      ],
      closing: 'Demikian Surat Pengantar ini kami berikan kepada yang bersangkutan untuk dapat dipergunakan sebagaimana mestinya dan mohon kepada pihak yang dituju untuk dapat memberikan bantuan serta pelayanan sesuai prosedur hukum dan ketentuan yang berlaku.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Instansi / Tujuan', variableKey: 'instansi_tujuan' },
        { label: 'Perihal / Keperluan', variableKey: 'keperluan' },
        { label: 'Keterangan Tambahan', variableKey: 'keterangan_tambahan' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 5. Surat Keterangan Belum Menikah
  {
    id: 'tpl-sk-belum-menikah-v1',
    letterTypeId: 'lt-sk-belum-menikah',
    name: 'Template Standar Surat Keterangan Belum Menikah',
    code: 'TPL_SK_BELUM_MENIKAH_V1',
    description: 'Format baku Surat Keterangan Belum Pernah Menikah untuk pendaftaran CPNS, TNI/Polri, KPR, dan kedinasan.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{tempat_lahir}}',
      '{{tanggal_lahir}}',
      '{{jenis_kelamin}}',
      '{{agama}}',
      '{{status_perkawinan}}',
      '{{pekerjaan}}',
      '{{alamat}}',
      '{{keperluan}}',
      '{{keterangan}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT KETERANGAN BELUM MENIKAH',
      codePrefix: '474.2',
      letterNumberFormat: '474.2 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan dengan sebenarnya bahwa:',
      bodyParagraphs: [
        'Nama tersebut di atas adalah benar-benar warga penduduk Desa Beliti Jaya yang bertempat tinggal menetap pada alamat tersebut di atas.',
        'Berdasarkan data register kependudukan desa dan penelusuran sampai dengan tanggal dikeluarkannya surat keterangan ini, yang bersangkutan benar berstatus BELUM PERNAH KAWIN / MENIKAH (Jejaka / Perawan), baik secara hukum negara, hukum adat, maupun menurut ketentuan syariat agama.',
        'Surat Keterangan Belum Menikah ini diberikan kepada pemohon untuk melengkapi berkas administrasi: {{keperluan}}.'
      ],
      closing: 'Demikian Surat Keterangan Belum Menikah ini dibuat dengan sebenarnya dan penuh rasa tanggung jawab agar dapat dipergunakan sebagaimana mestinya oleh instansi atau lembaga penerima.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Keperluan', variableKey: 'keperluan' },
        { label: 'Keterangan Tambahan', variableKey: 'keterangan' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 6. Surat Keterangan Pengantar Kehilangan
  {
    id: 'tpl-sk-kehilangan-v1',
    letterTypeId: 'lt-sk-kehilangan',
    name: 'Template Standar Pengantar Laporan Kehilangan',
    code: 'TPL_SK_KEHILANGAN_V1',
    description: 'Format pengantar ke Polsek Muara Kelingi untuk pengurusan Surat Keterangan Tanda Lapor Kehilangan (SKTLK).',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{tempat_lahir}}',
      '{{tanggal_lahir}}',
      '{{jenis_kelamin}}',
      '{{pekerjaan}}',
      '{{alamat}}',
      '{{dokumen_hilang}}',
      '{{tgl_kehilangan}}',
      '{{lokasi_kehilangan}}',
      '{{keperluan}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT PENGANTAR LAPORAN KEHILANGAN',
      codePrefix: '300',
      letterNumberFormat: '300 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan bahwa:',
      bodyParagraphs: [
        'Nama yang bersangkutan adalah benar warga masyarakat Desa Beliti Jaya yang datang melapor ke Balai Kantor Desa Beliti Jaya perihal terjadinya peristiwa kehilangan surat berharga / barang miliknya.',
        'Berdasarkan pengakuan dan laporan warga tersebut, telah terjadi kehilangan dokumen/barang berharga berupa: {{dokumen_hilang}}, yang diperkirakan tercecer atau hilang pada tanggal {{tgl_kehilangan}} di sekitar wilayah / lokasi: {{lokasi_kehilangan}}.',
        'Surat pengantar ini diterbitkan secara resmi sebagai pengantar ke Kepolisian Sektor (Polsek) Muara Kelingi guna penerbitan Laporan Polisi / Surat Keterangan Tanda Lapor Kehilangan (SKTLK) dalam rangka pengurusan: {{keperluan}}.'
      ],
      closing: 'Demikian Surat Pengantar Laporan Kehilangan ini dibuat agar dapat dipergunakan sebagaimana mestinya oleh pihak Kepolisian Sektor Muara Kelingi.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Barang / Dokumen Hilang', variableKey: 'dokumen_hilang' },
        { label: 'Tanggal Perkiraan Hilang', variableKey: 'tgl_kehilangan' },
        { label: 'Lokasi Hilang', variableKey: 'lokasi_kehilangan' },
        { label: 'Keperluan / Tujuan', variableKey: 'keperluan' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 7. Surat Keterangan Kelahiran
  {
    id: 'tpl-sk-kelahiran-v1',
    letterTypeId: 'lt-sk-kelahiran',
    name: 'Template Standar Surat Keterangan Kelahiran',
    code: 'TPL_SK_KELAHIRAN_V1',
    description: 'Format baku Surat Keterangan Kelahiran anak di desa sebagai dasar penerbitan Akta Kelahiran Disdukcapil.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{alamat}}',
      '{{nama_anak}}',
      '{{jenis_kelamin_anak}}',
      '{{tempat_lahir_anak}}',
      '{{tanggal_lahir_anak}}',
      '{{pukul_lahir_anak}}',
      '{{kelahiran_ke}}',
      '{{penolong_kelahiran}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT KETERANGAN KELAHIRAN',
      codePrefix: '472.11',
      letterNumberFormat: '472.11 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan bahwa pada hari yang telah dicatatkan:',
      bodyParagraphs: [
        'Menerangkan bahwa orang tua pelapor (Kepala Keluarga / Ibu) yang terdaftar sah dalam kependudukan Desa Beliti Jaya beralamat di {{alamat}}, telah melahirkan seorang anak dengan identitas sebagai berikut:',
        'Kelahiran tersebut dibantu oleh tenaga medis / penolong persalinan: {{penolong_kelahiran}}.',
        'Surat Keterangan Kelahiran ini dibuat dan disahkan oleh Pemerintah Desa Beliti Jaya sebagai salah satu persyaratan mutlak untuk pengurusan Akta Kelahiran dan penambahan anggota keluarga pada Kartu Keluarga (KK) di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Musi Rawas.'
      ],
      closing: 'Demikian Surat Keterangan Kelahiran ini dibuat dengan sebenarnya dan disahkan oleh Kepala Desa Beliti Jaya untuk dapat dipergunakan sebagaimana mestinya.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Nama Lengkap Anak', variableKey: 'nama_anak' },
        { label: 'Jenis Kelamin Anak', variableKey: 'jenis_kelamin_anak' },
        { label: 'Tempat, Tanggal Lahir', variableKey: 'ttl_anak' },
        { label: 'Waktu / Pukul Lahir', variableKey: 'pukul_lahir_anak' },
        { label: 'Kelahiran Anak ke-', variableKey: 'kelahiran_ke' },
        { label: 'Penolong Kelahiran', variableKey: 'penolong_kelahiran' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 8. Surat Keterangan Kematian
  {
    id: 'tpl-sk-kematian-v1',
    letterTypeId: 'lt-sk-kematian',
    name: 'Template Standar Surat Keterangan Kematian',
    code: 'TPL_SK_KEMATIAN_V1',
    description: 'Format baku Surat Keterangan Kematian warga desa untuk penerbitan Akta Kematian Disdukcapil dan santunan.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{nama_penduduk}}',
      '{{nik}}',
      '{{no_kk}}',
      '{{alamat}}',
      '{{nama_jenazah}}',
      '{{nik_jenazah}}',
      '{{tanggal_meninggal}}',
      '{{tempat_meninggal}}',
      '{{penyebab_meninggal}}',
      '{{hubungan_pelapor}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT KETERANGAN KEMATIAN',
      codePrefix: '472.12',
      letterNumberFormat: '472.12 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, menerangkan bahwa telah meninggal dunia:',
      bodyParagraphs: [
        'Berdasarkan laporan resmi dari pihak keluarga atas nama {{nama_penduduk}} (NIK: {{nik}}) yang bertindak selaku {{hubungan_pelapor}}, bahwa benar nama yang tercantum di atas adalah warga Desa Beliti Jaya yang telah berpulang / wafat dengan rincian data kematian sebagai berikut:',
        'Almarhum / Almarhumah meninggal dunia karena sebab: {{penyebab_meninggal}} dan telah dikebumikan sesuai ketentuan adat dan syariat.',
        'Surat Keterangan Kematian ini diterbitkan sebagai bukti otentik Pemerintah Desa untuk keperluan pengurusan Akta Kematian di Disdukcapil Kabupaten Musi Rawas, permohonan klaim asuransi / taspen, peralihan hak waris, serta penyesuaian susunan Kartu Keluarga.'
      ],
      closing: 'Demikian Surat Keterangan Kematian ini dibuat dengan sebenarnya dan mengingat sumpah jabatan untuk dipergunakan sebagaimana mestinya.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Nama Jenazah (Almarhum/ah)', variableKey: 'nama_jenazah' },
        { label: 'NIK Almarhum / Almarhumah', variableKey: 'nik_jenazah' },
        { label: 'Tanggal Kematian', variableKey: 'tanggal_meninggal' },
        { label: 'Tempat Kematian', variableKey: 'tempat_meninggal' },
        { label: 'Penyebab Kematian', variableKey: 'penyebab_meninggal' },
        { label: 'Hubungan Pelapor', variableKey: 'hubungan_pelapor' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE SURAT DINAS PEMERINTAH DESA (STAGE 7.2B.4B)
  // ══════════════════════════════════════════════════════════════════════════

  // 9. Surat Undangan Dinas (005) - Level 2 Verifikasi
  {
    id: 'tpl-dinas-undangan-v1',
    letterTypeId: 'lt-dinas-undangan',
    name: 'Template Standar Surat Undangan Dinas',
    code: 'TPL_DINAS_UNDANGAN_V1',
    description: 'Format resmi naskah dinas Surat Undangan Pemerintah Desa Beliti Jaya.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{sifat_surat}}',
      '{{lampiran}}',
      '{{perihal}}',
      '{{tujuan_surat}}',
      '{{instansi_tujuan}}',
      '{{alamat_tujuan}}',
      '{{acara}}',
      '{{hari_tanggal}}',
      '{{waktu}}',
      '{{tempat}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT UNDANGAN',
      codePrefix: '005',
      letterNumberFormat: '005 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Sehubungan dengan agenda kegiatan dan koordinasi Pemerintah Desa Beliti Jaya, bersama ini kami mengharapkan kehadiran Bapak/Ibu/Saudara/i pada pertemuan yang akan diselenggarakan pada:',
      bodyParagraphs: [
        'Mengingat pentingnya agenda pembahasan rapat tersebut di atas, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.',
        'Demikian surat undangan ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.'
      ],
      closing: 'Demikian surat undangan ini kami sampaikan, atas kehadiran dan kerja samanya yang baik diucapkan terima kasih.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Acara', variableKey: 'acara' },
        { label: 'Hari / Tanggal', variableKey: 'hari_tanggal' },
        { label: 'Waktu Pelaksanaan', variableKey: 'waktu' },
        { label: 'Tempat / Lokasi', variableKey: 'tempat' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 10. Surat Tugas Dinas (090) - Level 2 Verifikasi
  {
    id: 'tpl-dinas-tugas-v1',
    letterTypeId: 'lt-dinas-tugas',
    name: 'Template Standar Surat Perintah Tugas Dinas',
    code: 'TPL_DINAS_TUGAS_V1',
    description: 'Format resmi naskah dinas Surat Perintah Tugas aparatur Pemerintah Desa Beliti Jaya.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{sifat_surat}}',
      '{{lampiran}}',
      '{{perihal}}',
      '{{tujuan_surat}}',
      '{{instansi_tujuan}}',
      '{{alamat_tujuan}}',
      '{{nama_petugas}}',
      '{{jabatan_petugas}}',
      '{{tujuan_tugas}}',
      '{{lokasi_tugas}}',
      '{{jangka_waktu}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT PERINTAH TUGAS',
      codePrefix: '090',
      letterNumberFormat: '090 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, memberikan perintah penugasan kedinasan kepada aparatur/petugas berikut:',
      bodyParagraphs: [
        'Demikian Surat Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan dengan penuh rasa tanggung jawab dan setelah selesai melaksanakan tugas agar segera menyampaikan laporan tertulis kepada Kepala Desa Beliti Jaya.'
      ],
      closing: 'Demikian Surat Perintah Tugas ini dibuat untuk dapat dilaksanakan dengan penuh dedikasi dan tanggung jawab.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Nama Petugas', variableKey: 'nama_petugas' },
        { label: 'Jabatan Petugas', variableKey: 'jabatan_petugas' },
        { label: 'Maksud & Uraian Tugas', variableKey: 'tujuan_tugas' },
        { label: 'Tempat / Lokasi', variableKey: 'lokasi_tugas' },
        { label: 'Jangka Waktu', variableKey: 'jangka_waktu' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 11. Surat Edaran/Pemberitahuan (100) - Level 2 Verifikasi
  {
    id: 'tpl-dinas-edaran-v1',
    letterTypeId: 'lt-dinas-edaran',
    name: 'Template Standar Surat Edaran Dinas',
    code: 'TPL_DINAS_EDARAN_V1',
    description: 'Format resmi naskah dinas Surat Edaran / Pemberitahuan Pemerintah Desa Beliti Jaya.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{sifat_surat}}',
      '{{lampiran}}',
      '{{perihal}}',
      '{{tujuan_surat}}',
      '{{instansi_tujuan}}',
      '{{alamat_tujuan}}',
      '{{hal_pemberitahuan}}',
      '{{sasaran_penerima}}',
      '{{ringkasan_instruksi}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT EDARAN',
      codePrefix: '100',
      letterNumberFormat: '100 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Dalam rangka menjaga ketertiban umum, kebersihan lingkungan, serta kelancaran pelayanan masyarakat di wilayah Desa Beliti Jaya, disampaikan hal-hal pokok sebagai berikut:',
      bodyParagraphs: [
        'Sehubungan dengan pokok edaran tersebut di atas, Pemerintah Desa Beliti Jaya menghimbau dan menginstruksikan kepada seluruh pihak sasaran penerima edaran agar mempedomani dan melaksanakan ketentuan ini secara seksama dengan penuh tanggung jawab demi ketertiban bersama.'
      ],
      closing: 'Demikian Surat Edaran ini disampaikan untuk diketahui, dipedomani, dan dilaksanakan sebagaimana mestinya.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Pokok Pemberitahuan', variableKey: 'hal_pemberitahuan' },
        { label: 'Sasaran Penerima', variableKey: 'sasaran_penerima' },
        { label: 'Poin Pokok Instruksi', variableKey: 'ringkasan_instruksi' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  },

  // 12. Surat Rekomendasi Kedinasan (800) - Level 3 Persetujuan Kepala Desa
  {
    id: 'tpl-dinas-rekomendasi-v1',
    letterTypeId: 'lt-dinas-rekomendasi',
    name: 'Template Standar Surat Rekomendasi Kedinasan',
    code: 'TPL_DINAS_REKOMENDASI_V1',
    description: 'Format resmi Surat Rekomendasi Kedinasan Kepala Desa Beliti Jaya.',
    version: 1,
    status: 'ACTIVE',
    variables: [
      '{{nomor_surat}}',
      '{{sifat_surat}}',
      '{{lampiran}}',
      '{{perihal}}',
      '{{tujuan_surat}}',
      '{{instansi_tujuan}}',
      '{{alamat_tujuan}}',
      '{{pihak_direkomendasikan}}',
      '{{maksud_rekomendasi}}',
      '{{dasar_pertimbangan}}',
      '{{tanggal_surat}}',
      '{{nama_kepala_desa}}',
      '{{nip_kepala_desa}}'
    ],
    content: {
      title: 'SURAT REKOMENDASI',
      codePrefix: '800',
      letterNumberFormat: '800 / {{nomor_surat}} / 2008 / {{bulan_romawi}} / {{tahun_surat}}',
      opening: 'Yang bertanda tangan di bawah ini, Kepala Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, dengan ini memberikan Rekomendasi Kedinasan kepada:',
      bodyParagraphs: [
        'Berdasarkan hasil verifikasi berkas dan telaah administratif yang telah dilakukan, Pemerintah Desa Beliti Jaya menyatakan tidak berkeberatan dan mendukung sepenuhnya usulan permohonan dimaksud sesuai ketentuan perundang-undangan yang berlaku.'
      ],
      closing: 'Demikian Surat Rekomendasi ini dibuat dengan sebenarnya dan mengingat sumpah jabatan untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.',
      signatoryRole: 'Kepala Desa Beliti Jaya',
      signatoryName: '{{nama_kepala_desa}}',
      signatoryNip: '{{nip_kepala_desa}}',
      customDisplayFields: [
        { label: 'Pihak yang Direkomendasikan', variableKey: 'pihak_direkomendasikan' },
        { label: 'Maksud / Keperluan', variableKey: 'maksud_rekomendasi' },
        { label: 'Dasar Pertimbangan', variableKey: 'dasar_pertimbangan' }
      ]
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sistem Admin Desa Beliti Jaya',
    updatedBy: 'Sistem Admin Desa Beliti Jaya'
  }
];
