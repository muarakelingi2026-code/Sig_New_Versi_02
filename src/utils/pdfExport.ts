import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Keluarga, Penduduk, DesaProfile, AsetDesa, LetterRequest, LetterIssuance, LetterTemplate } from '../types';
import { StorageService } from '../services/storageService';
import { getRasterizedLogo } from './imageUtils';
import { resolveLetterVariables } from './letterVariableResolver';

/**
 * Helper to format currency
 */
export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Helper to format date into Indonesian standard
 */
export const formatIndonesianDate = (dateStr?: string | Date): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Helper to calculate age
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/**
 * Draw Official Government Kop Surat Header with Village Logo
 * Returns the bottom Y position of the double-line divider
 */
export const drawOfficialKopSurat = async (
  doc: jsPDF,
  orientation: 'portrait' | 'landscape' = 'portrait',
  customProfile?: DesaProfile
): Promise<number> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const centerX = pageWidth / 2;
  const leftMargin = 14;
  const rightMargin = pageWidth - 14;

  // Render Official Village Logo on the left of Kop Surat
  if (profile.logoDesa) {
    try {
      const rasterLogo = await getRasterizedLogo(profile.logoDesa);
      if (rasterLogo) {
        if (orientation === 'landscape') {
          doc.addImage(rasterLogo, 'PNG', 16, 8.5, 22, 25);
        } else {
          doc.addImage(rasterLogo, 'PNG', 14, 9, 20, 24);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat logo desa pada kop surat:', err);
    }
  }

  if (orientation === 'landscape') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`PEMERINTAH KABUPATEN ${profile.kabupaten.toUpperCase()}`, centerX, 13, { align: 'center' });

    doc.setFontSize(11.5);
    doc.text(`KECAMATAN ${profile.kecamatan.toUpperCase()}`, centerX, 18.5, { align: 'center' });

    doc.setFontSize(15);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`DESA ${profile.namaDesa.toUpperCase()}`, centerX, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Alamat: ${profile.alamatKantor}`, centerX, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Layanan SIG Kependudukan & Bantuan Sosial (DTKS) • Kode Pos: ${profile.kodePos} • Telp: ${profile.teleponDesa || '-'}`, centerX, 34, { align: 'center' });

    // Official Kop Double Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(leftMargin, 36.5, rightMargin, 36.5);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, 37.5, rightMargin, 37.5);

    return 37.5;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`PEMERINTAH KABUPATEN ${profile.kabupaten.toUpperCase()}`, centerX, 13.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.text(`KECAMATAN ${profile.kecamatan.toUpperCase()}`, centerX, 18.5, { align: 'center' });

    doc.setFontSize(13.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`PEMERINTAH DESA ${profile.namaDesa.toUpperCase()}`, centerX, 24.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Alamat: ${profile.alamatKantor}`, centerX, 29.5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Layanan SIG Kependudukan & DTKS Online • Kode Pos: ${profile.kodePos} • Telp/Email: ${profile.teleponDesa || profile.emailDesa}`, centerX, 33.5, { align: 'center' });

    // Official Kop Double Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(leftMargin, 36.5, rightMargin, 36.5);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, 37.5, rightMargin, 37.5);

    return 37.5;
  }
};

/**
 * 1. Export Complete Family (Kartu Keluarga) Profile to PDF
 */
export const generateFamilyProfilePDF = async (keluarga: Keluarga, customProfile?: DesaProfile): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  await drawOfficialKopSurat(doc, 'portrait', profile);

  // Title Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PROFIL BIODATA KELUARGA & STATUS KESEJAHTERAAN SOSIAL', 105, 46, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Registrasi GIS: REG-KK/${keluarga.noKk}/2026`, 105, 50.5, { align: 'center' });

  // Box for Main KK Info
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, 54, 182, 38, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('IDENTITAS KARTU KELUARGA (KK)', 18, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Column 1
  doc.text(`Nomor Kartu Keluarga`, 18, 66);
  doc.text(`:  ${keluarga.noKk}`, 58, 66);
  
  doc.text(`Nama Kepala Keluarga`, 18, 71);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${keluarga.namaKepalaKeluarga}`, 58, 71);
  doc.setFont('helvetica', 'normal');

  doc.text(`NIK Kepala Keluarga`, 18, 76);
  doc.text(`:  ${keluarga.nikKepala}`, 58, 76);

  doc.text(`Alamat Domisili`, 18, 81);
  doc.text(`:  ${keluarga.alamat}, ${keluarga.dusun} (RT ${keluarga.rt})`, 58, 81);

  doc.text(`Koordinat Spasial GIS`, 18, 86);
  doc.text(`:  Lat: ${keluarga.koordinat.lat.toFixed(5)}, Lng: ${keluarga.koordinat.lng.toFixed(5)}`, 58, 86);

  // Column 2
  const col2X = 118;
  doc.text(`Jumlah Anggota`, col2X, 66);
  doc.text(`:  ${keluarga.anggotaKeluarga.length} Jiwa`, col2X + 32, 66);

  doc.text(`Status Kesejahteraan`, col2X, 71);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${keluarga.statusKesejahteraan}`, col2X + 32, 71);
  doc.setFont('helvetica', 'normal');

  doc.text(`Penerima Bansos`, col2X, 76);
  doc.text(`:  ${keluarga.penerimaBansos ? 'YA (Penerima Aktif)' : 'TIDAK (Non-Bansos)'}`, col2X + 32, 76);

  doc.text(`Program Bantuan`, col2X, 81);
  doc.text(`:  ${keluarga.daftarBansos.length > 0 ? keluarga.daftarBansos.join(', ') : '-'}`, col2X + 32, 81);

  doc.text(`Nominal Bantuan/Bln`, col2X, 86);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`:  ${keluarga.totalNominalBantuanBulanan > 0 ? formatRupiah(keluarga.totalNominalBantuanBulanan) : 'Rp 0'}`, col2X + 32, 86);

  // Table of Family Members
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR ANGGOTA KELUARGA TERCATAT', 14, 98);

  const memberRows = keluarga.anggotaKeluarga.map((m, idx) => [
    idx + 1,
    m.nama,
    m.nik,
    m.statusKeluarga,
    m.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
    `${calculateAge(m.tanggalLahir)} Th`,
    m.pendidikan,
    m.pekerjaan,
    m.penghasilanBulanan > 0 ? formatRupiah(m.penghasilanBulanan) : '-',
    m.bantuanPribadi && m.bantuanPribadi.length > 0 ? m.bantuanPribadi.join(', ') : (m.disabilitas || '-'),
    m.statusKematian
  ]);

  autoTable(doc, {
    startY: 101,
    head: [[
      'No',
      'Nama Anggota',
      'NIK',
      'SHDK',
      'JK',
      'Usia',
      'Pendidikan',
      'Pekerjaan',
      'Penghasilan',
      'Bantuan/Khusus',
      'Status'
    ]],
    body: memberRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // Emerald-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 32 },
      2: { fontStyle: 'normal', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 7 },
      5: { halign: 'center', cellWidth: 11 },
      6: { cellWidth: 18 },
      7: { cellWidth: 20 },
      8: { halign: 'right', cellWidth: 19 },
      9: { cellWidth: 16 },
      10: { halign: 'center', cellWidth: 10 }
    },
    margin: { left: 14, right: 14 }
  });

  // Building & Sanitation Section
  // @ts-ignore
  let currentY = (doc as any).lastAutoTable?.finalY + 6 || 170;

  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('SPESIFIKASI FISIK RUMAH & SANITASI LINGKUNGAN', 14, currentY);

  const houseData = [
    [
      'Tipe Bangunan', `: ${keluarga.kondisiRumah.tipeBangunan}`,
      'Sumber Air Minum', `: ${keluarga.kondisiRumah.sumberAirMinum}`
    ],
    [
      'Luas Bangunan', `: ${keluarga.kondisiRumah.luasBangunanM2} m²`,
      'Daya Listrik', `: ${keluarga.kondisiRumah.dayaListrik}`
    ],
    [
      'Status Kepemilikan', `: ${keluarga.kondisiRumah.statusKepemilikan}`,
      'Fasilitas Jamban', `: ${keluarga.kondisiRumah.fasilitasJamban}`
    ],
    [
      'Material Lantai', `: ${keluarga.kondisiRumah.kondisiLantai}`,
      'Material Dinding', `: ${keluarga.kondisiRumah.kondisiDinding}`
    ]
  ];

  autoTable(doc, {
    startY: currentY + 2,
    body: houseData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 1.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // Signature Section
  // @ts-ignore
  let signatureY = (doc as any).lastAutoTable?.finalY + 10 || 225;

  if (signatureY > 240) {
    doc.addPage();
    signatureY = 25;
  }

  const currentDate = formatIndonesianDate();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Sign: Kepala Keluarga
  doc.text('Menyatakan Sebenarnya,', 25, signatureY);
  doc.text('Kepala Keluarga', 25, signatureY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${keluarga.namaKepalaKeluarga} )`, 25, signatureY + 24);

  // Right Sign: Kepala Desa
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 135, signatureY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 135, signatureY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 135, signatureY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 135, signatureY + 28);

  // Footer Note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen resmi ini dicetak dari Sistem Informasi GIS & DTKS Desa ${profile.namaDesa} pada ${new Date().toLocaleString('id-ID')}`, 14, 288);

  // Download PDF
  doc.save(`Profil_KK_${keluarga.noKk}_${keluarga.namaKepalaKeluarga.replace(/\s+/g, '_')}.pdf`);
};

/**
 * 2. Export Individual Resident (Biodata Penduduk Perorangan) to PDF
 */
export const generateResidentProfilePDF = async (penduduk: Penduduk, keluarga?: Keluarga, customProfile?: DesaProfile): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  await drawOfficialKopSurat(doc, 'portrait', profile);

  // Title Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT BIODATA KEPENDUDUKAN PERORANGAN', 105, 46, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Registrasi: REG-PEND/${penduduk.nik}/2026`, 105, 50.5, { align: 'center' });

  // Photo Box Frame (Placeholder Pas Foto 3x4 cm)
  const photoX = 158;
  const photoY = 56;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.rect(photoX, photoY, 32, 42, 'FD');
  
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PAS FOTO', photoX + 16, photoY + 19, { align: 'center' });
  doc.text('3 x 4 cm', photoX + 16, photoY + 24, { align: 'center' });

  // Biodata Table Grid
  const age = calculateAge(penduduk.tanggalLahir);
  const dusunInfo = keluarga ? `${keluarga.alamat}, ${keluarga.dusun} (RT ${keluarga.rt})` : 'Desa Beliti Jaya, Kec. Muara Kelingi';

  const residentTable = [
    ['1.', 'Nomor Induk Kependudukan (NIK)', `:  ${penduduk.nik}`],
    ['2.', 'Nomor Kartu Keluarga (No KK)', `:  ${penduduk.noKk}`],
    ['3.', 'Nama Lengkap', `:  ${penduduk.nama.toUpperCase()}`],
    ['4.', 'Tempat, Tanggal Lahir', `:  ${penduduk.tempatLahir}, ${formatIndonesianDate(penduduk.tanggalLahir)} (${age} Tahun)`],
    ['5.', 'Jenis Kelamin', `:  ${penduduk.jenisKelamin}`],
    ['6.', 'Agama', `:  ${penduduk.agama || 'Islam'}`],
    ['7.', 'Status Hubungan Keluarga (SHDK)', `:  ${penduduk.statusKeluarga}`],
    ['8.', 'Status Perkawinan', `:  ${penduduk.statusPerkawinan || (age > 20 ? 'Kawin' : 'Belum Kawin')}`],
    ['9.', 'Pendidikan Terakhir', `:  ${penduduk.pendidikan}`],
    ['10.', 'Pekerjaan Utama', `:  ${penduduk.pekerjaan}`],
    ['11.', 'Penghasilan Bulanan', `:  ${penduduk.penghasilanBulanan > 0 ? formatRupiah(penduduk.penghasilanBulanan) : 'Tidak Berpenghasilan / Nol'}`],
    ['12.', 'Alamat Lengkap Domisili', `:  ${dusunInfo}`],
    ['13.', 'Desa / Kelurahan', `:  Beliti Jaya`],
    ['14.', 'Kecamatan', `:  Muara Kelingi`],
    ['15.', 'Kabupaten / Provinsi', `:  Musi Rawas / Sumatera Selatan`],
    ['16.', 'Bantuan Pribadi / Sosial', `:  ${penduduk.bantuanPribadi && penduduk.bantuanPribadi.length > 0 ? penduduk.bantuanPribadi.join(', ') : 'Tidak Ada'}`],
    ['17.', 'Penyandang Disabilitas / Khusus', `:  ${penduduk.disabilitas || 'Tidak Ada (Normal)'}`],
    ['18.', 'Status Keberadaan / Vital', `:  ${penduduk.statusKematian}`]
  ];

  autoTable(doc, {
    startY: 55,
    body: residentTable,
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 1.8
    },
    columnStyles: {
      0: { cellWidth: 7, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 58, fontStyle: 'bold' },
      2: { cellWidth: 80 }
    },
    margin: { left: 14, right: 50 }
  });

  // Summary box / Welfare note
  // @ts-ignore
  const nextY = (doc as any).lastAutoTable?.finalY + 6 || 185;

  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(14, nextY, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('CATATAN VERIFIKASI & LEGALITAS SISTEM DESA:', 18, nextY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Data kependudukan di atas telah diverifikasi secara spasial melalui basis data SAKEP & DTKS Desa Beliti Jaya,',
    18, nextY + 11
  );
  doc.text(
    'dan dapat dipergunakan sebagai rujukan resmi pengurusan administrasi kependudukan, program bansos, dan layanan publik.',
    18, nextY + 16
  );

  // Signatures
  const signatureY = nextY + 29;
  const currentDate = formatIndonesianDate();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Resident Signature
  doc.text('Pemilik Biodata,', 25, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${penduduk.nama.toUpperCase()} )`, 25, signatureY + 22);

  // Kepala Desa Signature
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 135, signatureY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 135, signatureY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 135, signatureY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 135, signatureY + 26);

  // Security authenticity stamp line
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen Biodata Resmi terenkripsi • Dicetak oleh Sistem GIS Desa ${profile.namaDesa} pada ${new Date().toLocaleString('id-ID')}`, 14, 288);

  // Save PDF
  doc.save(`Biodata_Penduduk_${penduduk.nik}_${penduduk.nama.replace(/\s+/g, '_')}.pdf`);
};

/**
 * 4. Export Official Village Asset Inventory Sheet (Lembar KIB Aset Desa) to PDF
 */
export const generateAssetProfilePDF = async (aset: AsetDesa, customProfile?: DesaProfile): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const kopY = await drawOfficialKopSurat(doc, 'portrait', profile);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR DOKUMEN INVENTARIS BARANG (KIB) & SPASIAL ASET DESA', 105, kopY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kode Registrasi KIB: ${aset.kodeRegister} • Format Sesuai Permendagri No. 1 Tahun 2016`, 105, kopY + 12.5, { align: 'center' });

  // Specification Table
  autoTable(doc, {
    startY: kopY + 17,
    head: [
      [{ content: 'PARAMETER INVENTARIS ASET', styles: { halign: 'left', fillColor: [15, 23, 42] } },
       { content: 'RINCIAN DATA & SPESIFIKASI TEKNIS', styles: { halign: 'left', fillColor: [15, 23, 42] } }]
    ],
    body: [
      ['Nama Aset Desa', aset.namaAset],
      ['Kode Register (KIB)', aset.kodeRegister],
      ['Kategori Sifat Aset', aset.kategori === 'pembangunan' ? 'Aset Pembangunan Fisik (Infrastruktur / Sarpras)' : 'Aset Non-Pembangunan'],
      ['Sub-Kategori / Klasifikasi', aset.subKategori || '-'],
      ['Nilai Perolehan Aset', formatRupiah(aset.nilaiPerolehan)],
      ['Tahun Pengadaan', `${aset.tahunPengadaan}`],
      ['Sumber Pembiayaan / Dana', aset.sumberDana || 'APBDes'],
      ['Kondisi Fisik Terkini', aset.kondisi || 'Baik'],
      ['Dimensi Fisik / Volume', aset.luasAtauVolume || '-'],
      ['Status Pemanfaatan', aset.statusPemanfaatan || 'Digunakan untuk Pelayanan'],
      ['Penanggung Jawab / Pengelola', aset.penanggungJawab || 'Pemerintah Desa'],
      ['Wilayah Lokasi Dusun', `${aset.dusun}, Desa Beliti Jaya`],
      ['Titik Koordinat Geospasial (GPS)', `Lat: ${aset.koordinat.lat.toFixed(6)}, Lng: ${aset.koordinat.lng.toFixed(6)}`],
      ['Deskripsi & Catatan Lapangan', aset.keterangan || 'Tercatat sah dalam Buku Inventaris Desa Beliti Jaya']
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65, textColor: [30, 41, 59] },
      1: { cellWidth: 117, textColor: [51, 65, 85] }
    }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || 160;

  // Validation Note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('LEGALITAS & VALIDASI SISTEM INFORMASI GEOGRAFIS DESA:', 14, finalTableY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Aset ini terverifikasi secara spasial dan terdaftar dalam Buku Inventaris Desa Beliti Jaya berpedoman pada',
    14, finalTableY + 12
  );
  doc.text(
    'Permendagri Republik Indonesia Nomor 1 Tahun 2016 tentang Pengelolaan Aset Desa.',
    14, finalTableY + 15.5
  );

  // Signature Section
  const signY = finalTableY + 26;
  const currentDate = formatIndonesianDate();

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Signature: Petugas Pengelola Aset
  doc.text('Petugas Pengelola Aset / Kaur,', 25, signY);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${aset.penanggungJawab || 'Pengelola Aset Desa'} )`, 25, signY + 20);

  // Right Signature: Kepala Desa
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 135, signY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 135, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 135, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 135, signY + 24);

  // Footer stamp
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak melalui SIG Desa Beliti Jaya pada ${new Date().toLocaleString('id-ID')} • Lembar KIB Resmi`, 14, 288);

  doc.save(`Lembar_KIB_${aset.kodeRegister.replace(/[^a-zA-Z0-9]/g, '_')}_${aset.namaAset.replace(/\s+/g, '_')}.pdf`);
};

/**
 * 5. Export Entire Village Asset Inventory Register (Buku Inventaris Aset Desa KIB A-F) to PDF
 */
export const generateInventoryRegisterPDF = async (
  asetList: AsetDesa[],
  customProfile?: DesaProfile,
  kategoriFilter: string = 'all',
  filterInfo?: {
    search?: string;
    dusun?: string;
    kondisi?: string;
    sumberDana?: string;
  }
): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const kopY = await drawOfficialKopSurat(doc, 'landscape', profile);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN BUKU INVENTARIS KEKAYAAN & ASET DESA (REGISTER KIB A s.d. KIB F)', 148.5, kopY + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  const filterParts: string[] = [];
  if (kategoriFilter === 'pembangunan') {
    filterParts.push('Klasifikasi: Aset Pembangunan Fisik');
  } else if (kategoriFilter === 'non_pembangunan') {
    filterParts.push('Klasifikasi: Aset Non-Pembangunan');
  } else {
    filterParts.push('Klasifikasi: Semua Kategori Aset');
  }

  if (filterInfo?.dusun && filterInfo.dusun !== 'all') {
    filterParts.push(`Wilayah: ${filterInfo.dusun}`);
  }
  if (filterInfo?.kondisi && filterInfo.kondisi !== 'all') {
    filterParts.push(`Kondisi: ${filterInfo.kondisi}`);
  }
  if (filterInfo?.sumberDana && filterInfo.sumberDana !== 'all') {
    filterParts.push(`Sumber Dana: ${filterInfo.sumberDana}`);
  }
  if (filterInfo?.search && filterInfo.search.trim()) {
    filterParts.push(`Pencarian: "${filterInfo.search.trim()}"`);
  }

  const filterLabel = filterParts.join(' • ');
  doc.text(`${filterLabel} • Berpedoman pada Permendagri No. 1 Tahun 2016`, 148.5, kopY + 11.5, { align: 'center' });

  // Compute stats
  const totalNilai = asetList.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

  // Table Data
  const tableRows = asetList.length > 0 
    ? asetList.map((item, idx) => [
        idx + 1,
        item.kodeRegister,
        `${item.namaAset}\n${item.subKategori || '-'}`,
        item.kategori === 'pembangunan' ? 'Pembangunan' : 'Non-Pembangunan',
        item.dusun,
        item.tahunPengadaan,
        formatRupiah(item.nilaiPerolehan),
        item.sumberDana || 'APBDes',
        item.kondisi,
        item.penanggungJawab || '-'
      ])
    : [[{ content: 'Tidak ditemukan data aset desa yang sesuai dengan kriteria filter saat ini.', colSpan: 10, styles: { halign: 'center', textColor: [100, 116, 139], fontStyle: 'italic' } } as any]];

  autoTable(doc, {
    startY: kopY + 16,
    head: [
      [
        { content: 'No', styles: { halign: 'center' } },
        { content: 'Kode Register (KIB)', styles: { halign: 'left' } },
        { content: 'Nama Aset & Spesifikasi', styles: { halign: 'left' } },
        { content: 'Kategori', styles: { halign: 'center' } },
        { content: 'Lokasi Dusun', styles: { halign: 'left' } },
        { content: 'Tahun', styles: { halign: 'center' } },
        { content: 'Nilai Perolehan (Rp)', styles: { halign: 'right' } },
        { content: 'Sumber Dana', styles: { halign: 'left' } },
        { content: 'Kondisi', styles: { halign: 'center' } },
        { content: 'Penanggung Jawab', styles: { halign: 'left' } }
      ]
    ],
    body: tableRows,
    foot: [
      [
        { content: 'TOTAL KEKAYAAN ASET TERCATAT', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: formatRupiah(totalNilai), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        { content: `${asetList.length} Unit Aset`, colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } }
      ]
    ],
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { cellWidth: 58 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 22 },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 26 },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 30 }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const pageHeight = 210;

  // If table is too close to bottom, add new page for signature
  let signY = finalY + 12;
  if (signY + 35 > pageHeight) {
    doc.addPage();
    signY = 25;
  }

  const currentDate = formatIndonesianDate();

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Signature: Petugas Pengelola Aset
  doc.text('Mengetahui / Diverifikasi oleh,', 30, signY);
  doc.text('Petugas Pengelola Aset / Kaur Umum,', 30, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('( Kaur Tata Usaha & Umum )', 30, signY + 22);

  // Right Signature: Kepala Desa
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 215, signY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 215, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 215, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 215, signY + 26);

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak melalui SIG Desa ${profile.namaDesa} pada ${new Date().toLocaleString('id-ID')} • Register Buku Inventaris Resmi`, 14, 202);

  doc.save(`Laporan_Inventaris_Aset_${profile.namaDesa.replace(/\s+/g, '_')}_${kategoriFilter}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * ── GENERATOR PDF RESMI SURAT MENYURAT DESA (TAHAP 6) ──
 * Menghasilkan Dokumen PDF Final Standar A4 Resmi Pemerintahan Desa
 * Lengkap dengan Kop Dinas, Nomor Registrasi Resmi, QR Verifikasi, dan TTE/Cap
 */
export const exportOfficialLetterPdf = async (params: {
  letterRequest: LetterRequest;
  issuance: LetterIssuance;
  customTemplate?: LetterTemplate;
  customProfile?: DesaProfile;
  saveFile?: boolean;
}): Promise<jsPDF> => {
  const { letterRequest, issuance, customTemplate, customProfile, saveFile = true } = params;
  const profile = customProfile || StorageService.getDesaProfile();
  const targetTemplateId = issuance?.templateId || letterRequest.templateId;
  const targetTemplateVersion = issuance?.templateVersion || letterRequest.templateVersion;
  const template = customTemplate || 
    (targetTemplateId ? StorageService.getLetterTemplateById(targetTemplateId, targetTemplateVersion) : undefined) ||
    StorageService.getActiveLetterTemplateByType(letterRequest.letterTypeId);

  if (!template) {
    throw new Error('Template surat tidak ditemukan untuk pembuatan PDF');
  }

  const resolved = resolveLetterVariables(template, letterRequest, profile, issuance);

  // Inisialisasi Dokumen A4 Portrait (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const leftMargin = 18;
  const rightMargin = pageWidth - 18;
  const contentWidth = rightMargin - leftMargin; // 174 mm

  // 1. Gambar Kop Surat Resmi Pemerintah Desa
  const kopBottomY = await drawOfficialKopSurat(doc, 'portrait', profile);

  let currentY = kopBottomY + 7;

  if (letterRequest.isSuratDinas) {
    // ══════════════════════════════════════════════════════════════════════════
    // TATA NASKAH SURAT DINAS PEMERINTAH DESA (STAGE 7.2B.4B)
    // ══════════════════════════════════════════════════════════════════════════
    if (letterRequest.letterTypeCode === 'DINAS_UNDANGAN') {
      // 1. Tempat & Tanggal di Kanan Atas
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${profile.namaDesa}, ${formatIndonesianDate(issuance.issuedAt)}`, rightMargin, currentY, { align: 'right' });

      // 2. Kolom Kiri: Nomor, Sifat, Lampiran, Perihal
      const metaLeft = leftMargin;
      const metaLabelWidth = 22;
      const metaValX = metaLeft + metaLabelWidth + 3;

      const metaItems = [
        { label: 'Nomor', value: issuance.nomorSurat, bold: true },
        { label: 'Sifat', value: resolved.suratDinasData?.sifatSurat || 'Biasa', bold: false },
        { label: 'Lampiran', value: resolved.suratDinasData?.lampiran || '-', bold: false },
        { label: 'Perihal', value: resolved.suratDinasData?.perihal || '-', bold: true }
      ];

      let metaY = currentY;
      for (const m of metaItems) {
        doc.setFont('helvetica', 'normal');
        doc.text(m.label, metaLeft, metaY);
        doc.text(':', metaLeft + metaLabelWidth, metaY);
        doc.setFont('helvetica', m.bold ? 'bold' : 'normal');
        const splitVal = doc.splitTextToSize(m.value, 75);
        doc.text(splitVal, metaValX, metaY);
        metaY += Math.max(splitVal.length * 4.2, 4.8);
      }

      // 3. Kolom Kanan: Tujuan Surat (Kepada Yth)
      const destX = leftMargin + 105;
      let destY = currentY + 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Kepada Yth.', destX, destY);
      destY += 4.5;
      doc.setFont('helvetica', 'bold');
      const splitTujuan = doc.splitTextToSize(resolved.suratDinasData?.tujuanSurat || '-', rightMargin - destX);
      doc.text(splitTujuan, destX, destY);
      destY += splitTujuan.length * 4.2;

      if (resolved.suratDinasData?.instansiTujuan) {
        doc.setFont('helvetica', 'normal');
        const splitInstansi = doc.splitTextToSize(resolved.suratDinasData.instansiTujuan, rightMargin - destX);
        doc.text(splitInstansi, destX, destY);
        destY += splitInstansi.length * 4.2;
      }
      doc.setFont('helvetica', 'normal');
      doc.text('di -', destX, destY);
      destY += 4.2;
      doc.setFont('helvetica', 'italic');
      doc.text(resolved.suratDinasData?.alamatTujuan || 'Tempat', destX + 4, destY);

      currentY = Math.max(metaY, destY) + 6;

      // 4. Paragraf Pembuka
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const splitOpening = doc.splitTextToSize(`    ${resolved.opening}`, contentWidth);
      doc.text(splitOpening, leftMargin, currentY);
      currentY += splitOpening.length * 4.6 + 3.5;

      // 5. Rincian Agenda (Acara, Hari/Tgl, Waktu, Tempat)
      if (resolved.dinasDetails && resolved.dinasDetails.length > 0) {
        const detailLabelWidth = 38;
        const detailValX = leftMargin + 8 + detailLabelWidth + 3;
        for (const item of resolved.dinasDetails) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(item.label, leftMargin + 8, currentY);
          doc.text(':', leftMargin + 8 + detailLabelWidth, currentY);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const splitItem = doc.splitTextToSize(item.value, contentWidth - (detailLabelWidth + 12));
          doc.text(splitItem, detailValX, currentY);
          currentY += Math.max(splitItem.length * 4.2, 4.5);
        }
        currentY += 2;
      }

      // 6. Isi Khusus / Uraian Tambahan (jika ada)
      if (resolved.suratDinasData?.isiSurat) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const splitIsi = doc.splitTextToSize(`    ${resolved.suratDinasData.isiSurat}`, contentWidth);
        doc.text(splitIsi, leftMargin, currentY);
        currentY += splitIsi.length * 4.6 + 3;
      }

      // 7. Body Paragraphs
      for (const para of resolved.bodyParagraphs) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const splitPara = doc.splitTextToSize(`    ${para}`, contentWidth);
        doc.text(splitPara, leftMargin, currentY);
        currentY += splitPara.length * 4.6 + 2.5;
      }

      // 8. Kalimat Penutup
      const splitClosing = doc.splitTextToSize(`    ${resolved.closing}`, contentWidth);
      doc.text(splitClosing, leftMargin, currentY);
      currentY += splitClosing.length * 4.6 + 5;

    } else if (letterRequest.letterTypeCode === 'DINAS_TUGAS') {
      // Judul & Nomor Surat Tugas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(resolved.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

      const titleWidth = doc.getTextWidth(resolved.title.toUpperCase());
      doc.setLineWidth(0.35);
      doc.setDrawColor(15, 23, 42);
      doc.line((pageWidth - titleWidth) / 2, currentY + 1.2, (pageWidth + titleWidth) / 2, currentY + 1.2);

      currentY += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nomor : ${issuance.nomorSurat}`, pageWidth / 2, currentY, { align: 'center' });

      // Pembuka
      currentY += 7;
      const splitOpening = doc.splitTextToSize(`    ${resolved.opening}`, contentWidth);
      doc.text(splitOpening, leftMargin, currentY);
      currentY += splitOpening.length * 4.6 + 3;

      // MEMERINTAHKAN:
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('MEMERINTAHKAN:', pageWidth / 2, currentY, { align: 'center' });
      currentY += 5.5;

      // Kepada:
      doc.text('Kepada:', leftMargin + 4, currentY);
      currentY += 4.5;
      const tugasLabelWidth = 46;
      const tugasValX = leftMargin + 8 + tugasLabelWidth + 3;

      const petugasItems = [
        { label: 'Nama Petugas', value: resolved.variableMap.nama_petugas || '-' },
        { label: 'Jabatan', value: resolved.variableMap.jabatan_petugas || '-' }
      ];
      for (const p of petugasItems) {
        doc.setFont('helvetica', 'normal');
        doc.text(p.label, leftMargin + 8, currentY);
        doc.text(':', leftMargin + 8 + tugasLabelWidth, currentY);
        doc.setFont('helvetica', 'bold');
        doc.text(p.value, tugasValX, currentY);
        currentY += 4.5;
      }

      // Untuk:
      currentY += 1.5;
      doc.setFont('helvetica', 'bold');
      doc.text('Untuk:', leftMargin + 4, currentY);
      currentY += 4.5;

      const untukItems = [
        { label: '1. Maksud & Uraian Tugas', value: resolved.variableMap.tujuan_tugas || '-' },
        { label: '2. Tempat / Lokasi', value: resolved.variableMap.lokasi_tugas || '-' },
        { label: '3. Jangka Waktu', value: resolved.variableMap.jangka_waktu || '-' }
      ];
      for (const u of untukItems) {
        doc.setFont('helvetica', 'normal');
        doc.text(u.label, leftMargin + 8, currentY);
        doc.text(':', leftMargin + 8 + tugasLabelWidth, currentY);
        doc.setFont('helvetica', 'bold');
        const splitVal = doc.splitTextToSize(u.value, contentWidth - (tugasLabelWidth + 12));
        doc.text(splitVal, tugasValX, currentY);
        currentY += Math.max(splitVal.length * 4.2, 4.5);
      }

      // Isi Khusus jika ada
      if (resolved.suratDinasData?.isiSurat) {
        currentY += 2;
        doc.setFont('helvetica', 'normal');
        const splitIsi = doc.splitTextToSize(`    ${resolved.suratDinasData.isiSurat}`, contentWidth);
        doc.text(splitIsi, leftMargin, currentY);
        currentY += splitIsi.length * 4.6 + 3;
      }

      // Body Paragraphs
      currentY += 2;
      for (const para of resolved.bodyParagraphs) {
        doc.setFont('helvetica', 'normal');
        const splitPara = doc.splitTextToSize(`    ${para}`, contentWidth);
        doc.text(splitPara, leftMargin, currentY);
        currentY += splitPara.length * 4.6 + 2.5;
      }

      // Penutup
      const splitClosing = doc.splitTextToSize(`    ${resolved.closing}`, contentWidth);
      doc.text(splitClosing, leftMargin, currentY);
      currentY += splitClosing.length * 4.6 + 5;

    } else if (letterRequest.letterTypeCode === 'DINAS_EDARAN') {
      // Judul & Nomor & Tentang
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(resolved.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

      currentY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nomor : ${issuance.nomorSurat}`, pageWidth / 2, currentY, { align: 'center' });

      currentY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TENTANG', pageWidth / 2, currentY, { align: 'center' });

      currentY += 4.5;
      const perihalText = (resolved.suratDinasData?.perihal || resolved.variableMap.hal_pemberitahuan || '-').toUpperCase();
      const splitPerihal = doc.splitTextToSize(perihalText, contentWidth - 20);
      doc.text(splitPerihal, pageWidth / 2, currentY, { align: 'center' });
      currentY += splitPerihal.length * 4.5 + 4;

      // Sasaran Penerima
      doc.setFont('helvetica', 'normal');
      doc.text('Kepada Yth:', leftMargin + 4, currentY);
      currentY += 4.5;
      doc.setFont('helvetica', 'bold');
      const penerima = resolved.suratDinasData?.tujuanSurat || resolved.variableMap.sasaran_penerima || 'Seluruh Warga Masyarakat Desa Beliti Jaya';
      doc.text(penerima, leftMargin + 8, currentY);
      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('di - Tempat', leftMargin + 8, currentY);
      currentY += 6;

      // Pembuka
      const splitOpening = doc.splitTextToSize(`    ${resolved.opening}`, contentWidth);
      doc.text(splitOpening, leftMargin, currentY);
      currentY += splitOpening.length * 4.6 + 3;

      // Rincian Pokok Edaran
      if (resolved.dinasDetails && resolved.dinasDetails.length > 0) {
        const edaranLabelWidth = 48;
        const edaranValX = leftMargin + 8 + edaranLabelWidth + 3;
        for (const item of resolved.dinasDetails) {
          doc.setFont('helvetica', 'normal');
          doc.text(item.label, leftMargin + 8, currentY);
          doc.text(':', leftMargin + 8 + edaranLabelWidth, currentY);
          doc.setFont('helvetica', 'bold');
          const splitItem = doc.splitTextToSize(item.value, contentWidth - (edaranLabelWidth + 12));
          doc.text(splitItem, edaranValX, currentY);
          currentY += Math.max(splitItem.length * 4.2, 4.5);
        }
        currentY += 2;
      }

      // Isi Khusus jika ada
      if (resolved.suratDinasData?.isiSurat) {
        doc.setFont('helvetica', 'normal');
        const splitIsi = doc.splitTextToSize(`    ${resolved.suratDinasData.isiSurat}`, contentWidth);
        doc.text(splitIsi, leftMargin, currentY);
        currentY += splitIsi.length * 4.6 + 3;
      }

      // Body Paragraphs
      for (const para of resolved.bodyParagraphs) {
        doc.setFont('helvetica', 'normal');
        const splitPara = doc.splitTextToSize(`    ${para}`, contentWidth);
        doc.text(splitPara, leftMargin, currentY);
        currentY += splitPara.length * 4.6 + 2.5;
      }

      // Penutup
      const splitClosing = doc.splitTextToSize(`    ${resolved.closing}`, contentWidth);
      doc.text(splitClosing, leftMargin, currentY);
      currentY += splitClosing.length * 4.6 + 5;

    } else { // DINAS_REKOMENDASI (atau fallback surat dinas)
      // Judul & Nomor Rekomendasi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(resolved.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

      const titleWidth = doc.getTextWidth(resolved.title.toUpperCase());
      doc.setLineWidth(0.35);
      doc.setDrawColor(15, 23, 42);
      doc.line((pageWidth - titleWidth) / 2, currentY + 1.2, (pageWidth + titleWidth) / 2, currentY + 1.2);

      currentY += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nomor : ${issuance.nomorSurat}`, pageWidth / 2, currentY, { align: 'center' });

      // Pembuka
      currentY += 7;
      const splitOpening = doc.splitTextToSize(`    ${resolved.opening}`, contentWidth);
      doc.text(splitOpening, leftMargin, currentY);
      currentY += splitOpening.length * 4.6 + 3;

      // Rincian Rekomendasi
      if (resolved.dinasDetails && resolved.dinasDetails.length > 0) {
        const rekomLabelWidth = 52;
        const rekomValX = leftMargin + 8 + rekomLabelWidth + 3;
        for (const item of resolved.dinasDetails) {
          doc.setFont('helvetica', 'normal');
          doc.text(item.label, leftMargin + 8, currentY);
          doc.text(':', leftMargin + 8 + rekomLabelWidth, currentY);
          doc.setFont('helvetica', 'bold');
          const splitItem = doc.splitTextToSize(item.value, contentWidth - (rekomLabelWidth + 12));
          doc.text(splitItem, rekomValX, currentY);
          currentY += Math.max(splitItem.length * 4.2, 4.5);
        }
        currentY += 2;
      }

      // Isi Khusus jika ada
      if (resolved.suratDinasData?.isiSurat) {
        doc.setFont('helvetica', 'normal');
        const splitIsi = doc.splitTextToSize(`    ${resolved.suratDinasData.isiSurat}`, contentWidth);
        doc.text(splitIsi, leftMargin, currentY);
        currentY += splitIsi.length * 4.6 + 3;
      }

      // Body Paragraphs
      for (const para of resolved.bodyParagraphs) {
        doc.setFont('helvetica', 'normal');
        const splitPara = doc.splitTextToSize(`    ${para}`, contentWidth);
        doc.text(splitPara, leftMargin, currentY);
        currentY += splitPara.length * 4.6 + 2.5;
      }

      // Penutup
      const splitClosing = doc.splitTextToSize(`    ${resolved.closing}`, contentWidth);
      doc.text(splitClosing, leftMargin, currentY);
      currentY += splitClosing.length * 4.6 + 5;
    }
  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // ALUR SURAT WARGA EXISTING (UNTOUCHED)
    // ══════════════════════════════════════════════════════════════════════════
    // 2. Judul Dokumen Surat Resmi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(resolved.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

    // Garis Bawah Judul
    const titleWidth = doc.getTextWidth(resolved.title.toUpperCase());
    doc.setLineWidth(0.35);
    doc.setDrawColor(15, 23, 42);
    doc.line((pageWidth - titleWidth) / 2, currentY + 1.2, (pageWidth + titleWidth) / 2, currentY + 1.2);

    // 3. Nomor Surat Resmi
    currentY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Nomor : ${issuance.nomorSurat}`, pageWidth / 2, currentY, { align: 'center' });

    // 4. Paragraf Pembuka
    currentY += 8;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const splitOpening = doc.splitTextToSize(resolved.opening, contentWidth);
    doc.text(splitOpening, leftMargin, currentY);
    currentY += splitOpening.length * 4.6 + 3;

    // 5. Tabel Data Kependudukan Pemohon
    doc.setFontSize(9);
    const labelWidth = 52;
    const colonWidth = 4;
    const valX = leftMargin + labelWidth + colonWidth;
    const valMaxWidth = contentWidth - (labelWidth + colonWidth);

    for (const item of resolved.pemohonData) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, leftMargin + 4, currentY);
      doc.text(':', leftMargin + labelWidth, currentY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const splitVal = doc.splitTextToSize(item.value, valMaxWidth);
      doc.text(splitVal, valX, currentY);
      currentY += Math.max(splitVal.length * 4.2, 4.4);
    }

    // 6. Rincian Isian Khusus Surat (Jika ada)
    if (resolved.customDisplayFields && resolved.customDisplayFields.length > 0) {
      currentY += 2;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(leftMargin, currentY, contentWidth, (resolved.customDisplayFields.length * 5) + 6, 1.5, 1.5, 'FD');

      currentY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('RINCIAN KETERANGAN / DATA PERMOHONAN:', leftMargin + 4, currentY);
      currentY += 4.5;

      doc.setFontSize(8.5);
      for (const cf of resolved.customDisplayFields) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(cf.label, leftMargin + 4, currentY);
        doc.text(':', leftMargin + 48, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(cf.value, leftMargin + 53, currentY);
        currentY += 4.4;
      }
      currentY += 2;
    }

    // 7. Paragraf Isi Pokok Dokumen
    currentY += 3;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    for (const para of resolved.bodyParagraphs) {
      const splitPara = doc.splitTextToSize(`    ${para}`, contentWidth);
      doc.text(splitPara, leftMargin, currentY);
      currentY += splitPara.length * 4.6 + 2.5;
    }

    // 8. Paragraf Penutup
    const splitClosing = doc.splitTextToSize(`    ${resolved.closing}`, contentWidth);
    doc.text(splitClosing, leftMargin, currentY);
    currentY += splitClosing.length * 4.6 + 6;
  }

  // 9. Blok Tanda Tangan & QR Code Verifikasi
  const signY = Math.max(currentY, 222);

  // A. QR Code Verifikasi Publik di Sebelah Kiri Bawah
  try {
    const qrDataUrl = await QRCode.toDataURL(issuance.verificationUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    // Box QR
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(leftMargin, signY - 2, 28, 28, 1, 1, 'FD');
    doc.addImage(qrDataUrl, 'PNG', leftMargin + 1, signY - 1, 26, 26);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('PINDAI VERIFIKASI', leftMargin, signY + 29.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reg: ${issuance.nomorRegistrasi}`, leftMargin, signY + 33);
  } catch (err) {
    console.warn('Gagal men-generate gambar QR Code pada PDF:', err);
  }

  // B. Tanda Tangan Kepala Desa di Sebelah Kanan Bawah
  const signRightCenterX = pageWidth - 55;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile.namaDesa}, ${formatIndonesianDate(issuance.issuedAt)}`, signRightCenterX, signY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text(issuance.signatoryRole.toUpperCase(), signRightCenterX, signY + 4.5, { align: 'center' });

  // Ruang Tanda Tangan & Cap Stempel Resmi Administratif Desa
  // Desa Beliti Jaya belum menerapkan TTE tersertifikasi, menyediakan ruang administratif untuk tanda tangan & cap basah

  // Nama Pejabat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(issuance.signatoryName.toUpperCase(), signRightCenterX, signY + 24, { align: 'center' });
  const kadesWidth = doc.getTextWidth(issuance.signatoryName.toUpperCase());
  doc.line(signRightCenterX - (kadesWidth / 2), signY + 24.8, signRightCenterX + (kadesWidth / 2), signY + 24.8);

  if (issuance.signatoryNip && issuance.signatoryNip !== '-') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIP. ${issuance.signatoryNip}`, signRightCenterX, signY + 28.5, { align: 'center' });
  }

  // C. Tembusan Surat Dinas di Kiri Bawah (jika ada)
  if (letterRequest.isSuratDinas && resolved.suratDinasData?.tembusan && resolved.suratDinasData.tembusan.length > 0) {
    let tembusanY = signY + 36;
    if (tembusanY + 10 < 286) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Tembusan Yth:', leftMargin, tembusanY);
      tembusanY += 3.8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      resolved.suratDinasData.tembusan.forEach((t, idx) => {
        if (tembusanY < 285) {
          doc.text(`${idx + 1}. ${t}`, leftMargin + 2, tembusanY);
          tembusanY += 3.4;
        }
      });
    }
  }

  // 10. Catatan Kaki Legalitas Resmi
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Dokumen resmi diterbitkan melalui Anjungan Mandiri SIG Desa Beliti Jaya • Keaslian dokumen terverifikasi pada database arsip desa',
    pageWidth / 2,
    288,
    { align: 'center' }
  );

  if (saveFile) {
    doc.save(issuance.pdfFileName);
  }

  return doc;
};
