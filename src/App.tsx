import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keluarga, Penduduk, User, FilterOptions, VerificationNotification, DesaProfile, RolePermissions, AsetDesa } from './types';
import { StorageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { MapLeaflet } from './components/MapLeaflet';
import { FilterPanel } from './components/FilterPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DataManagementTable } from './components/DataManagementTable';
import { FamilyDetailView } from './components/FamilyDetailView';
import { FamilyFormView } from './components/FamilyFormView';
import { VerificationQueueModal } from './components/VerificationQueueModal';
import { ExportReportModal } from './components/ExportReportModal';
import { VillageProfileModal } from './components/VillageProfileModal';
import { VillageInfoModal } from './components/VillageInfoModal';
import { VillageAssetModal } from './components/VillageAssetModal';
import { AssetPasswordModal } from './components/AssetPasswordModal';
import { AssetDetailView } from './components/AssetDetailView';
import { UserSettingsModal } from './components/UserSettingsModal';
import { UserInfoModal } from './components/UserInfoModal';
import { AuthLogModal } from './components/AuthLogModal';
import { KioskView } from './components/KioskView';
import { AnjunganMandiriView } from './components/warga/AnjunganMandiriView';
import { WargaDataChangeReviewModal } from './components/warga/WargaDataChangeReviewModal';
import { AparaturPersuratanDashboardView } from './components/warga/AparaturPersuratanDashboardView';
import { AparaturLayananSuratView, LayananSuratSubTab } from './components/warga/AparaturLayananSuratView';
import { AparaturBuatSuratWarga } from './components/warga/AparaturBuatSuratWarga';
import { AparaturBuatSuratDinas } from './components/warga/AparaturBuatSuratDinas';
import { BukuArsipSuratView } from './components/warga/BukuArsipSuratView';
import { AparaturTemplateSuratView } from './components/warga/AparaturTemplateSuratView';
import { AparaturPenomoranSuratView } from './components/warga/AparaturPenomoranSuratView';
import { PublicLetterVerificationModal } from './components/warga/PublicLetterVerificationModal';
import { AuthLogEntry, WargaSession } from './types';
import { CheckCircle2, AlertTriangle, Info, Sparkles, MapPin, Database, ShieldCheck, Plus, Settings, Building2, BookOpen } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village' | 'surat-dashboard' | 'surat-warga' | 'surat-arsip' | 'surat-layanan' | 'surat-dinas' | 'surat-template' | 'surat-numbering'>('map');
  const [previousTabBeforeArsip, setPreviousTabBeforeArsip] = useState<string>('surat-dashboard');
  const [previousTabBeforeSuratLayanan, setPreviousTabBeforeSuratLayanan] = useState<string>('surat-dashboard');
  const [previousTabBeforeDinas, setPreviousTabBeforeDinas] = useState<string>('surat-dashboard');
  const [previousTabBeforeTemplate, setPreviousTabBeforeTemplate] = useState<string>('surat-dashboard');
  const [previousTabBeforeNumbering, setPreviousTabBeforeNumbering] = useState<string>('surat-dashboard');
  const [arsipInitialFilter, setArsipInitialFilter] = useState<'ALL' | 'WARGA' | 'DINAS'>('ALL');

  // Sesi Anjungan Mandiri Warga (Terpisah dari aparatur desa)
  const [currentWarga, setCurrentWarga] = useState<WargaSession | null>(() => StorageService.getCurrentWarga());
  const [isAnjunganOpen, setIsAnjunganOpen] = useState(false);
  const [isDataChangeReviewOpen, setIsDataChangeReviewOpen] = useState(false);
  const [layananSuratInitialSubTab, setLayananSuratInitialSubTab] = useState<LayananSuratSubTab>('masuk');

  // Core Data
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>(() => StorageService.getKeluargaList());
  const [notifications, setNotifications] = useState<VerificationNotification[]>(() => StorageService.getNotifications());
  const [desaProfile, setDesaProfile] = useState<DesaProfile>(() => StorageService.getDesaProfile());
  const [asetList, setAsetList] = useState<AsetDesa[]>(() => StorageService.getAsetDesa());

  // Counter pengajuan perubahan data kependudukan warga yang menunggu verifikasi
  const pendingDataChangeCount = useMemo(() => {
    return StorageService.getWargaDataChangeRequests().filter(r => r.status === 'menunggu').length;
  }, [keluargaList, isDataChangeReviewOpen, isAnjunganOpen]);

  // Counter permohonan surat masuk warga yang menunggu verifikasi / approval
  const pendingLetterRequestCount = useMemo(() => {
    return StorageService.getLetterRequests().filter(r => r.status === 'MENUNGGU_VERIFIKASI' || r.status === 'DIVERIFIKASI').length;
  }, [isAnjunganOpen, activeTab]);

  // RBAC Permissions and User Management
  const [permissions, setPermissions] = useState<RolePermissions>(() => StorageService.getRolePermissions());
  const [userList, setUserList] = useState<User[]>(() => StorageService.getUsers());
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [isAuthLogsOpen, setIsAuthLogsOpen] = useState(false);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [authLogs, setAuthLogs] = useState<AuthLogEntry[]>(() => StorageService.getAuthLogs());

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetModalInitialTab, setAssetModalInitialTab] = useState<'all' | 'pembangunan' | 'non_pembangunan'>('all');
  const [assetModalTargetAsetId, setAssetModalTargetAsetId] = useState<string | null>(null);
  const [selectedAssetOnMap, setSelectedAssetOnMap] = useState<AsetDesa | null>(null);

  // Otorisasi Kata Sandi Akses Buku Inventaris Desa
  const [isAssetPasswordModalOpen, setIsAssetPasswordModalOpen] = useState(false);
  const [pendingAssetCategory, setPendingAssetCategory] = useState<'all' | 'pembangunan' | 'non_pembangunan'>('all');
  const [pendingAssetTargetId, setPendingAssetTargetId] = useState<string | null>(null);

  const handleOpenAssetModal = (category: 'all' | 'pembangunan' | 'non_pembangunan' = 'all', targetAsetId?: string) => {
    // Apabila otorisasi kata sandi Buku Inventaris aktif, minta verifikasi password Admin / Operator Aset
    if (permissions?.requirePasswordForBukuInventaris !== false) {
      setPendingAssetCategory(category);
      setPendingAssetTargetId(targetAsetId || null);
      setIsAssetPasswordModalOpen(true);
    } else {
      setAssetModalInitialTab(category);
      setAssetModalTargetAsetId(targetAsetId || null);
      setViewingAssetDetail(null);
      setIsAssetModalOpen(false);
      setActiveTab('inventory');
    }
  };

  const handleAssetPasswordSuccess = () => {
    setIsAssetPasswordModalOpen(false);
    setAssetModalInitialTab(pendingAssetCategory);
    setAssetModalTargetAsetId(pendingAssetTargetId);
    setViewingAssetDetail(null);
    setIsAssetModalOpen(false);
    setActiveTab('inventory');
    showToast('Otorisasi berhasil. Membuka Buku Inventaris Desa.', 'success');
  };

  const handleSaveAset = (
    asetData: Omit<AsetDesa, 'id' | 'createdAt' | 'updatedAt'> | AsetDesa,
    editingId?: string
  ) => {
    const idToUpdate = editingId || ('id' in asetData && asetData.id ? asetData.id : undefined);

    if (idToUpdate) {
      const updated = StorageService.updateAsetDesa(idToUpdate, asetData);
      if (updated) {
        setAsetList(prev => prev.map(a => a.id === idToUpdate ? updated : a));
        if (selectedAssetOnMap?.id === idToUpdate) {
          setSelectedAssetOnMap(updated);
        }
        showToast(`Aset "${updated.namaAset}" berhasil diperbarui`, 'success');
        return;
      }
    }

    // Penambahan aset baru ke buku inventaris
    const newAset = StorageService.addAsetDesa(
      asetData as Omit<AsetDesa, 'id' | 'createdAt' | 'updatedAt'>
    );
    setAsetList(prev => [newAset, ...prev]);
    showToast(`Aset "${newAset.namaAset}" berhasil ditambahkan ke buku inventaris`, 'success');
  };

  const handleDeleteAset = (id: string) => {
    StorageService.deleteAsetDesa(id);
    setAsetList(prev => prev.filter(a => a.id !== id));
    showToast('Aset berhasil dihapus dari inventaris desa', 'info');
  };

  // Modals & UI States
  const [selectedKeluarga, setSelectedKeluarga] = useState<Keluarga | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<Keluarga | null>(null);
  const [familyFormDraft, setFamilyFormDraft] = useState<any | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [villageInitialTab, setVillageInitialTab] = useState<'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText'>('profil');
  const [isVillageInfoOpen, setIsVillageInfoOpen] = useState(false);
  const [villageInfoInitialTab, setVillageInfoInitialTab] = useState<'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText'>('profil');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Portal Verifikasi Publik Dokumen Surat
  const [isPublicVerifyOpen, setIsPublicVerifyOpen] = useState(false);
  const [publicVerifyToken, setPublicVerifyToken] = useState<string>('');

  // Handle URL verification parameter (e.g. ?verify=vtok_...) saat pemindaian QR
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const verifyParam = params.get('verify');
      if (verifyParam) {
        setPublicVerifyToken(verifyParam);
        setIsPublicVerifyOpen(true);
      }
    }
  }, []);

  const handleOpenVillageInfo = (tab: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText' = 'profil') => {
    setVillageInitialTab(tab);
    setVillageInfoInitialTab(tab);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setActiveTab('village');
  };

  // Coordinate Picking on Map
  const [isPickingCoordinates, setIsPickingCoordinates] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    dusun: 'semua',
    statusBansos: 'semua',
    jenisBansos: 'semua',
    statusKesejahteraan: 'semua',
    jenisKelamin: 'semua',
    statusKematian: 'semua',
    statusPerkawinan: 'semua',
    pendidikan: 'semua',
    minPenghasilan: 0,
    maxPenghasilan: 0
  });

  // Fitur Pencarian Aset Desa & Penduduk pada Peta (Search-Pan-Pulse-Click)
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [focusedAsetId, setFocusedAsetId] = useState<string | null>(null);
  const [focusedKeluargaId, setFocusedKeluargaId] = useState<string | null>(null);

  // Halaman Rincian Data Aset Desa Penuh (Tanpa Modal, dibuka langsung di web)
  const [viewingAssetDetail, setViewingAssetDetail] = useState<AsetDesa | null>(null);
  const [assetDetailSource, setAssetDetailSource] = useState<'map' | 'inventory'>('map');

  // Sinkronisasi data rincian aset dengan data inventaris terbaru
  const activeViewingAsset = useMemo(() => {
    if (!viewingAssetDetail) return null;
    return (asetList || []).find(a => a.id === viewingAssetDetail.id) || viewingAssetDetail;
  }, [viewingAssetDetail, asetList]);

  const handleBackFromAssetDetail = () => {
    if (viewingAssetDetail && assetDetailSource === 'map') {
      setFocusedAsetId(viewingAssetDetail.id);
      setSelectedAssetOnMap(viewingAssetDetail);
    }
    setViewingAssetDetail(null);
    setActiveTab(assetDetailSource === 'inventory' ? 'inventory' : 'map');
  };

  // Scroll to top on opening family detail view
  useEffect(() => {
    if (selectedKeluarga) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedKeluarga?.id]);

  // Calculate filtered data
  const { keluarga: filteredKeluarga, matchedPenduduk } = StorageService.filterKeluarga(keluargaList, filters);
  const allPenduduk = useMemo(() => {
    return (keluargaList || []).flatMap(k => k.anggotaKeluarga || []);
  }, [keluargaList]);

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth Log Activity Recorder
  const logAuthActivity = (action: 'LOGIN' | 'LOGOUT', user: User, notes?: string) => {
    StorageService.addAuthLog({
      userId: user.id,
      userName: user.name,
      userUsername: user.username,
      userRole: user.role,
      userJabatan: user.jabatan,
      userAvatar: user.avatar,
      action,
      device: 'Desktop / Browser GIS Beliti Jaya',
      ipAddress: '192.168.1.104 (Lokal Kantor Desa)',
      notes: notes || (action === 'LOGIN' ? 'Berhasil login ke sistem SIG Desa' : 'Keluar dari sesi sistem (Logout)')
    });
    setAuthLogs(StorageService.getAuthLogs());
  };

  // Switch Role between Admin and Operator
  const handleSwitchRole = () => {
    const users = StorageService.getUsers();
    if (!currentUser) return;
    const nextUser = currentUser.role === 'admin' 
      ? (users.find(u => u.role === 'operator') || users[1]) 
      : (users.find(u => u.role === 'admin') || users[0]);
    
    logAuthActivity('LOGOUT', currentUser, `Beralih peran dari @${currentUser.username}`);
    logAuthActivity('LOGIN', nextUser, `Beralih masuk ke peran @${nextUser.username}`);

    StorageService.setCurrentUser(nextUser);
    setCurrentUser(nextUser);
    showToast(`Beralih ke akun ${nextUser.name} (${nextUser.role.toUpperCase()})`, 'info');

    if (nextUser.role === 'operator_aset' && (activeTab === 'crud' || activeTab === 'export' || activeTab === 'village' || activeTab === 'surat-dashboard' || activeTab === 'surat-warga' || activeTab === 'surat-dinas' || activeTab === 'surat-arsip' || activeTab === 'surat-layanan')) {
      setActiveTab('inventory');
    } else if (nextUser.role === 'operator' && permissions.operatorOnlyAddKK && activeTab === 'analytics') {
      setActiveTab('map');
    }
  };

  const handleSwitchUser = (targetUser: User) => {
    if (currentUser && currentUser.id !== targetUser.id) {
      logAuthActivity('LOGOUT', currentUser, `Beralih akun ke @${targetUser.username}`);
      logAuthActivity('LOGIN', targetUser, `Beralih masuk sebagai @${targetUser.username}`);
    }
    StorageService.setCurrentUser(targetUser);
    setCurrentUser(targetUser);
    showToast(`Beralih ke akun ${targetUser.name} (${targetUser.role.toUpperCase()})`, 'info');
    if (targetUser.role === 'operator_aset' && (activeTab === 'crud' || activeTab === 'export' || activeTab === 'village' || activeTab === 'surat-dashboard' || activeTab === 'surat-warga' || activeTab === 'surat-dinas' || activeTab === 'surat-arsip' || activeTab === 'surat-layanan')) {
      setActiveTab('inventory');
    } else if (targetUser.role === 'operator' && permissions.operatorOnlyAddKK && activeTab === 'analytics') {
      setActiveTab('map');
    }
  };

  // Pastikan operator_aset dan operator langsung dialihkan jika berada di tab yang tidak diizinkan
  useEffect(() => {
    if (currentUser?.role === 'operator_aset' && (activeTab === 'crud' || activeTab === 'export' || activeTab === 'village' || activeTab === 'surat-dashboard' || activeTab === 'surat-warga' || activeTab === 'surat-dinas' || activeTab === 'surat-arsip' || activeTab === 'surat-layanan')) {
      setActiveTab('inventory');
    }
    if (currentUser?.role === 'operator' && activeTab === 'village') {
      setActiveTab('map');
    }
    if (currentUser?.role === 'operator' && isKioskOpen) {
      setIsKioskOpen(false);
    }
  }, [currentUser?.role, activeTab, isKioskOpen]);

  const handleOpenPersuratanDashboard = () => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Layanan Persuratan.', 'warning');
      return;
    }
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-dashboard');
  };

  const handleOpenBuatSuratWarga = () => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses menu Persuratan.', 'warning');
      return;
    }
    setPreviousTabBeforeArsip(activeTab === 'surat-warga' ? 'surat-dashboard' : activeTab);
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-warga');
  };

  const handleOpenBuatSuratDinas = () => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Surat Dinas.', 'warning');
      return;
    }
    setPreviousTabBeforeDinas(activeTab === 'surat-dinas' ? 'surat-dashboard' : activeTab);
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-dinas');
  };

  const handleOpenBukuArsipSurat = (archiveType: 'ALL' | 'WARGA' | 'DINAS' = 'ALL') => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Buku Arsip.', 'warning');
      return;
    }
    setPreviousTabBeforeArsip(activeTab === 'surat-arsip' ? 'surat-dashboard' : activeTab);
    setArsipInitialFilter(archiveType);
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-arsip');
  };

  const handleOpenLayananSurat = (subTab: LayananSuratSubTab = 'masuk') => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Layanan Persuratan.', 'warning');
      return;
    }
    if (subTab === 'arsip') {
      handleOpenBukuArsipSurat('ALL');
      return;
    }
    setPreviousTabBeforeSuratLayanan(activeTab === 'surat-layanan' ? 'surat-dashboard' : activeTab);
    setLayananSuratInitialSubTab(subTab);
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-layanan');
  };

  const handleOpenTemplateSurat = () => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengelola template surat.', 'warning');
      return;
    }
    setPreviousTabBeforeTemplate(activeTab === 'surat-template' ? 'surat-dashboard' : activeTab);
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-template');
  };

  const handleOpenPenomoranSurat = () => {
    if (currentUser?.role === 'operator_aset') {
      showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengelola penomoran surat.', 'warning');
      return;
    }
    setPreviousTabBeforeNumbering(activeTab === 'surat-numbering' ? 'surat-dashboard' : activeTab);
    setSelectedKeluarga(null);
    setViewingAssetDetail(null);
    setSelectedAssetOnMap(null);
    setIsFormOpen(false);
    setActiveTab('surat-numbering');
  };

  const handleSavePermissions = (newPermissions: RolePermissions) => {
    setPermissions(newPermissions);
    StorageService.saveRolePermissions(newPermissions);
    showToast('Hak akses role pengguna berhasil diperbarui!');
  };

  const handleSaveUsers = (newUsers: User[]) => {
    setUserList(newUsers);
    StorageService.saveUsers(newUsers);
    if (currentUser) {
      const updatedCurrent = newUsers.find(u => u.id === currentUser.id);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        StorageService.setCurrentUser(updatedCurrent);
      }
    }
    showToast('Daftar pengguna & akun sistem berhasil diperbarui!');
  };

  const handleLogout = () => {
    if (currentUser) {
      logAuthActivity('LOGOUT', currentUser, `Pengguna @${currentUser.username} (${currentUser.name}) mengakhiri sesi login`);
    }
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    showToast('Anda telah keluar dari sistem GIS Desa.', 'info');
  };

  // Add / Edit Family Handler
  const handleSaveFamily = (formData: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'>) => {
    if (!currentUser) return;

    if (editingKeluarga) {
      const { updated, notification } = StorageService.updateKeluarga(editingKeluarga.id, formData, currentUser);
      setKeluargaList(StorageService.getKeluargaList());
      if (notification) {
        setNotifications(StorageService.getNotifications());
        showToast('Perubahan data diajukan dan dikirim ke Admin untuk verifikasi.', 'warning');
      } else {
        showToast(`Data KK ${updated.namaKepalaKeluarga} berhasil diperbarui.`);
      }
      setSelectedKeluarga(updated);
    } else {
      const { keluarga: newKeluarga, notification } = StorageService.addKeluarga(formData, currentUser);
      setKeluargaList(StorageService.getKeluargaList());
      if (notification) {
        setNotifications(StorageService.getNotifications());
        showToast('Data KK Baru berhasil didaftarkan dan menunggu verifikasi Admin.', 'warning');
      } else {
        showToast(`Data KK Baru atas nama ${newKeluarga.namaKepalaKeluarga} berhasil ditambahkan!`);
      }
      setSelectedKeluarga(newKeluarga);
    }

    setIsFormOpen(false);
    setEditingKeluarga(null);
    setFamilyFormDraft(null);
    setIsPickingCoordinates(false);
    setPickedCoords(null);
  };

  // Save Village Profile Handler
  const handleSaveDesaProfile = (updatedProfile: DesaProfile) => {
    StorageService.saveDesaProfile(updatedProfile, currentUser);
    setDesaProfile(updatedProfile);
    showToast(`Data Profil Desa, Kepala Desa (${updatedProfile.kepalaDesa.nama}), dan ${updatedProfile.perangkatLainnya.length} Perangkat Desa berhasil disimpan!`);
  };

  // Delete Family Handler
  const handleDeleteFamily = (keluarga: Keluarga) => {
    if (!currentUser) return;

    const confirmMsg = currentUser.role === 'admin'
      ? `Apakah Anda yakin ingin menghapus data KK ${keluarga.namaKepalaKeluarga}?`
      : `Ajukan permohonan penghapusan KK ${keluarga.namaKepalaKeluarga} ke Admin?`;

    if (window.confirm(confirmMsg)) {
      const { notification } = StorageService.deleteKeluarga(keluarga.id, currentUser);
      setKeluargaList(StorageService.getKeluargaList());
      if (notification) {
        setNotifications(StorageService.getNotifications());
        showToast('Pengajuan hapus data telah dikirim ke Admin.', 'warning');
      } else {
        showToast(`Data KK ${keluarga.namaKepalaKeluarga} berhasil dihapus.`);
      }
      setSelectedKeluarga(null);
    }
  };

  // Admin Notification Approval Handlers
  const handleApproveNotification = (notifId: string, notes?: string) => {
    if (!currentUser) return;
    StorageService.resolveNotification(notifId, 'approved', currentUser.name, notes);
    setNotifications(StorageService.getNotifications());
    setKeluargaList(StorageService.getKeluargaList());
    showToast('Perubahan data operator telah disetujui (Approved).', 'success');
  };

  const handleRejectNotification = (notifId: string, notes?: string) => {
    if (!currentUser) return;
    StorageService.resolveNotification(notifId, 'rejected', currentUser.name, notes);
    setNotifications(StorageService.getNotifications());
    setKeluargaList(StorageService.getKeluargaList());
    showToast('Pengajuan perubahan data operator ditolak.', 'info');
  };

  // Trigger Coordinate Picker on Map
  const handleStartCoordinatePicker = (draftState?: any) => {
    if (draftState) {
      setFamilyFormDraft(draftState);
    }
    setIsPickingCoordinates(true);
    setIsFormOpen(false);
    setActiveTab('map');
    showToast('Mode Pilih Titik Aktif: Klik pada peta wilayah Desa Beliti Jaya untuk memilih lokasi rumah.', 'info');
  };

  const handleCoordinatePicked = (coords: { lat: number; lng: number }) => {
    setPickedCoords(coords);
    setIsPickingCoordinates(false);
    setIsFormOpen(true);
    showToast(`Koordinat dipilih: ${coords.lat}, ${coords.lng}`, 'success');
  };

  // Reset demo data
  const handleResetData = () => {
    if (window.confirm('Reset data GIS kembali ke kondisi awal Desa Beliti Jaya?')) {
      StorageService.resetToDefault();
      setKeluargaList(StorageService.getKeluargaList());
      setNotifications(StorageService.getNotifications());
      setAsetList(StorageService.getAsetDesa());
      showToast('Data berhasil direset ke setelan awal.', 'info');
    }
  };

  if (!currentUser) {
    if (isAnjunganOpen || currentWarga) {
      return (
        <AnjunganMandiriView
          isOpen={true}
          onClose={() => setIsAnjunganOpen(false)}
          desaProfile={desaProfile}
          onWargaLoginChange={session => setCurrentWarga(session)}
        />
      );
    }

    return (
      <LoginModal
        onLoginSuccess={user => {
          setCurrentUser(user);
          logAuthActivity('LOGIN', user, `Masuk ke akun ${user.name} (${user.role === 'admin' ? 'Administrator GIS' : 'Operator Desa'})`);
          showToast(`Selamat datang, ${user.name} (${user.role.toUpperCase()})`);
        }}
        desaProfile={desaProfile}
        onOpenAnjungan={() => setIsAnjunganOpen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      {!selectedKeluarga && !isAnjunganOpen && (
        <Navbar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={tab => {
            // Reset selected asset state and in-page form to prevent lingering state when navigating between tabs
            setSelectedAssetOnMap(null);
            setIsFormOpen(false);
            setEditingKeluarga(null);
            setFamilyFormDraft(null);

            if (tab === 'crud') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses menu Data Kependudukan.', 'warning');
                return;
              }
              setActiveTab('crud');
            } else if (tab === 'export') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Cetak dan Enkripsi.', 'warning');
                return;
              }
              if (currentUser.role === 'operator' && permissions.operatorOnlyAddKK && !permissions.allowOperatorExport) {
                showToast('Akses Dibatasi: Akun Operator hanya diizinkan mengakses Tombol (Tambah data KK & Titik Baru).', 'warning');
                return;
              }
              setActiveTab('export');
            } else if (tab === 'settings') {
              if (currentUser.role !== 'admin') {
                showToast('Akses Dibatasi: Menu Setting User hanya untuk Administrator.', 'warning');
                return;
              }
              setIsUserSettingsOpen(true);
            } else if (tab === 'village') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Data Desa.', 'warning');
                return;
              }
              if (currentUser.role === 'operator' && permissions.operatorOnlyAddKK && !permissions.allowOperatorVillageProfile) {
                showToast('Akses Dibatasi: Profil Wilayah & Perangkat Desa hanya dapat dikelola oleh Administrator.', 'warning');
                return;
              }
              setViewingAssetDetail(null);
              setSelectedAssetOnMap(null);
              setActiveTab('village');
            } else if (tab === 'analytics') {
              if (currentUser.role === 'operator' && permissions.operatorOnlyAddKK && !permissions.allowOperatorAnalytics) {
                showToast('Akses Dibatasi: Dashboard Analitik hanya dapat diakses oleh Administrator.', 'warning');
                return;
              }
              setViewingAssetDetail(null);
              setActiveTab(tab);
            } else if (tab === 'surat-warga') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses menu Persuratan.', 'warning');
                return;
              }
              setViewingAssetDetail(null);
              setActiveTab('surat-warga');
            } else if (tab === 'surat-dinas') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Surat Dinas.', 'warning');
                return;
              }
              setPreviousTabBeforeDinas(activeTab === 'surat-dinas' ? 'surat-layanan' : activeTab);
              setViewingAssetDetail(null);
              setActiveTab('surat-dinas');
            } else if (tab === 'surat-arsip') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Buku Arsip Persuratan.', 'warning');
                return;
              }
              setPreviousTabBeforeArsip(activeTab === 'surat-arsip' ? 'surat-warga' : activeTab);
              setViewingAssetDetail(null);
              setActiveTab('surat-arsip');
            } else if (tab === 'surat-layanan') {
              if (currentUser.role === 'operator_aset') {
                showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Layanan Persuratan.', 'warning');
                return;
              }
              setPreviousTabBeforeSuratLayanan(activeTab === 'surat-layanan' ? previousTabBeforeSuratLayanan : activeTab);
              setViewingAssetDetail(null);
              setActiveTab('surat-layanan');
            } else {
              setViewingAssetDetail(null);
              setActiveTab(tab);
            }
          }}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuthLogs={() => setIsAuthLogsOpen(true)}
          authLogsCount={authLogs.length}
          onOpenKiosk={() => {
            if (currentUser.role === 'operator') {
              showToast('Akses Dibatasi: Operator KK tidak diperbolehkan mengakses Mode KIOSK.', 'warning');
              return;
            }
            setIsKioskOpen(true);
          }}
          onOpenAnjungan={() => setIsAnjunganOpen(true)}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          onResetData={handleResetData}
          onOpenVillageProfile={() => {
            if (currentUser.role === 'operator_aset') {
              showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Data Desa.', 'warning');
              return;
            }
            if (currentUser.role === 'operator') {
              showToast('Akses Dibatasi: Operator KK tidak diperbolehkan mengakses Data Desa.', 'warning');
              return;
            }
            setActiveTab('village');
          }}
          desaProfile={desaProfile}
          permissions={permissions}
          onOpenUserSettings={() => {
            if (currentUser.role !== 'admin') {
              showToast('Akses Dibatasi: Menu Setting User & RBAC hanya dapat diakses oleh Administrator.', 'warning');
              return;
            }
            setIsUserSettingsOpen(true);
          }}
          onOpenUserProfile={() => setIsUserInfoOpen(true)}
          onOpenAssetModal={handleOpenAssetModal}
          onOpenVillageInfo={handleOpenVillageInfo}
          onOpenDataChangeReview={() => {
            if (currentUser.role !== 'admin' && currentUser.role !== 'operator') {
              showToast('Akses Dibatasi: Verifikasi Perubahan Data hanya dapat diakses oleh Administrator & Operator Kependudukan.', 'warning');
              return;
            }
            setIsDataChangeReviewOpen(true);
          }}
          pendingDataChangeCount={pendingDataChangeCount}
          onOpenPersuratanDashboard={handleOpenPersuratanDashboard}
          onOpenAparaturSurat={(tab: LayananSuratSubTab = 'masuk') => {
            if (currentUser.role !== 'admin' && currentUser.role !== 'operator') {
              showToast('Akses Dibatasi: Layanan Persuratan & Buku Arsip hanya dapat diakses oleh Administrator & Operator Kependudukan.', 'warning');
              return;
            }
            handleOpenLayananSurat(tab);
          }}
          onOpenBukuArsipSurat={() => handleOpenBukuArsipSurat('ALL')}
          onOpenBuatSuratWarga={handleOpenBuatSuratWarga}
          onOpenBuatSuratDinas={handleOpenBuatSuratDinas}
          onOpenTemplateSurat={handleOpenTemplateSurat}
          onOpenPenomoranSurat={handleOpenPenomoranSurat}
          pendingLetterRequestCount={pendingLetterRequestCount}
          keluargaList={keluargaList}
          asetList={asetList}
          onSelectSearchedKeluarga={(kel) => {
            setSelectedKeluarga(kel);
            setFocusedKeluargaId(kel.id);
          }}
          onSelectSearchedAsset={(aset) => {
            setActiveTab('map');
            setViewingAssetDetail(null);
            setSelectedAssetOnMap(null);
            setAssetSearchQuery(aset.namaAset);
            setFocusedAsetId(null);
            setTimeout(() => {
              setFocusedAsetId(aset.id);
            }, 50);
          }}
        />
      )}

      {/* 3. Toast Alert Notification */}
      {toastMessage && (
        <div
          id="toast-notification-banner"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs sm:text-sm font-medium transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
              : 'bg-blue-950/95 border-blue-500/50 text-blue-200'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 4. Main Body Content View */}
      <AnimatePresence mode="wait">
        {selectedKeluarga ? (
          <motion.div
            key={`family-detail-${selectedKeluarga.id}`}
            initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-1"
          >
            <FamilyDetailView
              keluarga={selectedKeluarga}
              desaProfile={desaProfile}
              onBack={() => setSelectedKeluarga(null)}
              onEdit={kel => {
                setEditingKeluarga(kel);
                setSelectedKeluarga(null);
                setIsFormOpen(true);
              }}
              onDelete={handleDeleteFamily}
              currentUser={currentUser}
              permissions={permissions}
              onNavigate={(tab) => {
                setSelectedKeluarga(null);
                setActiveTab(tab);
              }}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              notificationsCount={notifications.filter(n => n.status === 'pending').length}
              keluargaList={keluargaList}
              onSelectAnotherKeluarga={(kel) => setSelectedKeluarga(kel)}
            />
          </motion.div>
        ) : currentUser ? (
          <motion.main
            key="main-app-content"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-5"
          >
            <AnimatePresence mode="wait">
              {activeViewingAsset ? (
              <motion.div
                key="viewing-asset"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <AssetDetailView
                  aset={activeViewingAsset}
                  onBack={handleBackFromAssetDetail}
                  backLabel={assetDetailSource === 'inventory' ? 'Kembali ke Buku Inventaris' : 'Kembali ke Peta'}
                  onOpenBukuInventaris={() => {
                    const cat = activeViewingAsset.kategori || 'all';
                    const id = activeViewingAsset.id;
                    setViewingAssetDetail(null);
                    handleOpenAssetModal(cat, id);
                  }}
                  onEditAset={
                    (currentUser.role === 'admin' || currentUser.role === 'operator_aset')
                      ? (asetToEdit) => {
                          setViewingAssetDetail(null);
                          handleOpenAssetModal(asetToEdit.kategori || 'all', asetToEdit.id);
                        }
                      : undefined
                  }
                  desaProfile={desaProfile}
                  currentUser={currentUser}
                />
              </motion.div>
            ) : isFormOpen ? (
              <motion.div
                key="family-form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <FamilyFormView
                  initialData={editingKeluarga}
                  initialDraft={familyFormDraft}
                  onClose={() => {
                    setIsFormOpen(false);
                    setEditingKeluarga(null);
                    setFamilyFormDraft(null);
                    setIsPickingCoordinates(false);
                    setPickedCoords(null);
                  }}
                  onSave={handleSaveFamily}
                  currentUser={currentUser}
                  onPickCoordinateOnMap={(draft) => handleStartCoordinatePicker(draft)}
                  pickedCoords={pickedCoords}
                  backLabel={activeTab === 'crud' ? 'Kembali ke Data Kependudukan' : 'Kembali ke Peta GIS'}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full space-y-5"
                onAnimationComplete={() => {
                  if (activeTab === 'map') {
                    window.dispatchEvent(new Event('resize'));
                  }
                }}
              >
                {/* Operator Notice Banner: Only Add KK & Titik Baru */}
                {currentUser.role === 'operator' && permissions.operatorOnlyAddKK && (
                  <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Mode Operator Terbatas Aktif</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                            Hak Akses Terfokus
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Sesuai konfigurasi sistem, akun Operator difokuskan untuk mengakses tombol <strong>(Tambah data KK & Titik Baru)</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id="btn-operator-banner-add-kk"
                        onClick={() => {
                          setEditingKeluarga(null);
                          setPickedCoords(null);
                          setIsFormOpen(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-emerald-400/40"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Data KK & Titik Baru</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Operator Aset Notice Banner: Fokus Aset & Inventaris Desa */}
                {currentUser.role === 'operator_aset' && (
                  <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/70 border border-purple-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Mode Operator Aset Desa Aktif</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                            Khusus Aset & Inventaris
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Akun Operator Aset difokuskan pada pengelolaan <strong>Buku Inventaris & Peta Aset Desa</strong> (Akses menu Data Kependudukan, Cetak/Enkripsi, dan Data Desa dinonaktifkan).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id="btn-operator-aset-open-inventory"
                        onClick={() => handleOpenAssetModal('all')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-purple-400/40"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Buka Buku Inventaris Desa</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 1: PETA INTERAKTIF & FILTER */}
                {activeTab === 'map' && (
                  <div className="space-y-4">
                    {/* Filter Panel dengan Fitur Pencarian Penduduk & Fitur Pencarian Aset Desa (z-30 agar modal/dropdown pencarian aset tidak tertutup oleh peta) */}
                    <div className="relative z-30">
                      <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        totalKeluarga={keluargaList.length}
                        filteredKeluargaCount={filteredKeluarga.length}
                        totalPenduduk={allPenduduk.length}
                        filteredPendudukCount={matchedPenduduk.length}
                        currentUser={currentUser}
                        asetList={asetList}
                        assetSearchQuery={assetSearchQuery}
                        setAssetSearchQuery={setAssetSearchQuery}
                        focusedAsetId={focusedAsetId}
                        setFocusedAsetId={setFocusedAsetId}
                        onSelectSearchedAsset={aset => {
                          setAssetSearchQuery(aset.namaAset);
                          setViewingAssetDetail(null);
                          setSelectedAssetOnMap(null);
                          setActiveTab('map');
                          setFocusedAsetId(null);
                          setTimeout(() => {
                            setFocusedAsetId(aset.id);
                          }, 50);
                        }}
                        keluargaList={keluargaList}
                        focusedKeluargaId={focusedKeluargaId}
                        setFocusedKeluargaId={setFocusedKeluargaId}
                        onSelectSearchedKeluarga={kel => {
                          setFilters(prev => ({ ...prev, searchQuery: kel.namaKepalaKeluarga }));
                          setFocusedKeluargaId(kel.id);
                        }}
                      />
                    </div>

                    {/* Leaflet Interactive GIS Map (z-10 agar selalu berada di bawah popover/dropdown pencarian aset) */}
                    <div className="relative z-10">
                      <MapLeaflet
                        keluargaList={filteredKeluarga}
                        onSelectKeluarga={kel => setSelectedKeluarga(kel)}
                        selectedKeluargaId={selectedKeluarga?.id}
                        isPickingCoordinates={isPickingCoordinates}
                        onCoordinatePicked={handleCoordinatePicked}
                        currentUser={currentUser}
                        onOpenVillageProfile={() => {
                          if (currentUser.role === 'operator_aset') {
                            showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Data Desa.', 'warning');
                            return;
                          }
                          if (currentUser.role === 'operator') {
                            showToast('Akses Dibatasi: Operator KK tidak diperbolehkan mengakses Data Desa.', 'warning');
                            return;
                          }
                          setActiveTab('village');
                        }}
                        onOpenVillageInfo={tab => {
                          if (currentUser.role === 'operator_aset') {
                            showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Data Desa.', 'warning');
                            return;
                          }
                          if (currentUser.role === 'operator') {
                            showToast('Akses Dibatasi: Operator KK tidak diperbolehkan mengakses Data Desa.', 'warning');
                            return;
                          }
                          handleOpenVillageInfo(tab);
                        }}
                        onOpenOfficialsModal={() => {
                          if (currentUser.role === 'operator_aset') {
                            showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Data Desa.', 'warning');
                            return;
                          }
                          if (currentUser.role === 'operator') {
                            showToast('Akses Dibatasi: Operator KK tidak diperbolehkan mengakses Data Desa.', 'warning');
                            return;
                          }
                          handleOpenVillageInfo('pimpinan');
                        }}
                        permissions={permissions}
                        asetList={asetList}
                        onOpenAssetModal={handleOpenAssetModal}
                        selectedAsetId={selectedAssetOnMap?.id}
                        onSelectAset={aset => {
                          setSelectedAssetOnMap(aset);
                          if (aset) {
                            setAssetDetailSource('map');
                            setViewingAssetDetail(aset);
                          }
                        }}
                        assetSearchQuery={assetSearchQuery}
                        setAssetSearchQuery={setAssetSearchQuery}
                        focusedAsetId={focusedAsetId}
                        setFocusedAsetId={setFocusedAsetId}
                        residentSearchQuery={filters.searchQuery}
                        setResidentSearchQuery={q => setFilters(prev => ({ ...prev, searchQuery: q }))}
                        focusedKeluargaId={focusedKeluargaId}
                        setFocusedKeluargaId={setFocusedKeluargaId}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: DASHBOARD ANALITIK */}
                {activeTab === 'analytics' && (
                  <AnalyticsDashboard
                    keluargaList={keluargaList}
                    pendudukList={allPenduduk}
                    asetList={asetList}
                    onOpenAssetModal={handleOpenAssetModal}
                    onSelectAset={(aset) => {
                      setSelectedAssetOnMap(aset);
                      setAssetDetailSource('inventory');
                      setViewingAssetDetail(aset);
                    }}
                  />
                )}

                {/* TAB 3: MANAJEMEN DATA CRUD */}
                {activeTab === 'crud' && currentUser.role !== 'operator_aset' && (
                  <DataManagementTable
                    keluargaList={keluargaList}
                    pendudukList={allPenduduk}
                    onSelectKeluarga={kel => setSelectedKeluarga(kel)}
                    onAddNewKeluarga={() => {
                      setEditingKeluarga(null);
                      setPickedCoords(null);
                      setIsFormOpen(true);
                    }}
                    onEditKeluarga={kel => {
                      setEditingKeluarga(kel);
                      setIsFormOpen(true);
                    }}
                    onDeleteKeluarga={handleDeleteFamily}
                    currentUser={currentUser}
                    permissions={permissions}
                    onOpenAnalytics={() => {
                      if (currentUser.role === 'operator' && permissions.operatorOnlyAddKK && !permissions.allowOperatorAnalytics) {
                        showToast('Akses Dibatasi: Dashboard Analitik hanya dapat diakses oleh Administrator.', 'warning');
                        return;
                      }
                      setActiveTab('analytics');
                    }}
                  />
                )}

                {/* TAB 4: BUKU INVENTARIS DESA (Tampil Penuh Satu Halaman Penuh Resmi Tanpa Modal) */}
                {activeTab === 'inventory' && (
                  <VillageAssetModal
                    isFullPage
                    isOpen={true}
                    onClose={() => setActiveTab('map')}
                    onBackToMap={() => setActiveTab('map')}
                    asetList={asetList}
                    onSaveAset={handleSaveAset}
                    onDeleteAset={handleDeleteAset}
                    currentUser={currentUser || userList[0]}
                    initialKategori={assetModalInitialTab}
                    targetAsetId={assetModalTargetAsetId}
                    desaProfile={desaProfile}
                    onFocusOnMap={(aset: AsetDesa) => {
                      setViewingAssetDetail(null);
                      setSelectedAssetOnMap(null);
                      setAssetSearchQuery(aset.namaAset);
                      setFocusedAsetId(null);
                      setTimeout(() => {
                        setFocusedAsetId(aset.id);
                      }, 50);
                      setActiveTab('map');
                    }}
                    onOpenAssetDetail={(aset: AsetDesa) => {
                      setAssetDetailSource('inventory');
                      setViewingAssetDetail(aset);
                    }}
                  />
                )}

                {/* TAB 5: CETAK & ENKRIPSI (Tampil Langsung pada Halaman Web Tanpa Modal) */}
                {activeTab === 'export' && currentUser.role !== 'operator_aset' && (
                  <ExportReportModal
                    keluargaList={keluargaList}
                    pendudukList={allPenduduk}
                    currentUser={currentUser || { id: '', username: '', name: '', role: 'operator', jabatan: '', avatar: '' }}
                    desaProfile={desaProfile}
                    onUpdateLogo={(newLogo: string) => {
                      const updated = { ...desaProfile, logoDesa: newLogo };
                      handleSaveDesaProfile(updated);
                    }}
                    onOpenVillageProfile={() => {
                      if (currentUser.role === 'operator_aset') {
                        showToast('Akses Dibatasi: Operator Aset tidak diperbolehkan mengakses Data Desa.', 'warning');
                        return;
                      }
                      if (currentUser.role === 'operator') {
                        showToast('Akses Dibatasi: Operator KK tidak diperbolehkan mengakses Data Desa.', 'warning');
                        return;
                      }
                      setActiveTab('village');
                    }}
                    onBackToMap={() => setActiveTab('map')}
                  />
                )}

                {/* TAB 6: DATA DESA (Tampil Langsung pada Halaman Web Tanpa Modal, Seperti Form Kependudukan) */}
                {activeTab === 'village' && (
                  currentUser.role === 'operator_aset' || (currentUser.role === 'operator' && permissions.operatorOnlyAddKK && !permissions.allowOperatorVillageProfile) ? (
                    <div id="village-restricted-banner" className="p-12 bg-slate-900/90 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl max-w-3xl mx-auto my-8">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-white">Akses Dibatasi: Menu Data Desa</h3>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                          Data Desa dan Profil Pemerintahan Desa Beliti Jaya hanya dapat dikelola oleh Administrator Sistem.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('map')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Kembali ke Peta
                      </button>
                    </div>
                  ) : (
                    <VillageProfileModal
                      isFullPage
                      isOpen={true}
                      desaProfile={desaProfile}
                      onSaveProfile={handleSaveDesaProfile}
                      currentUser={currentUser}
                      onBackToMap={() => setActiveTab('map')}
                      initialTab={villageInitialTab}
                    />
                  )
                )}

                {/* TAB PERSURATAN UTAMA: DASHBOARD PERSURATAN APARATUR (STAGE 7.2C) */}
                {activeTab === 'surat-dashboard' && currentUser.role !== 'operator_aset' && (
                  <AparaturPersuratanDashboardView
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    onBackToMap={() => setActiveTab('map')}
                    onOpenBuatSuratWarga={handleOpenBuatSuratWarga}
                    onOpenBuatSuratDinas={handleOpenBuatSuratDinas}
                    onOpenLayananSurat={handleOpenLayananSurat}
                    onOpenBukuArsip={handleOpenBukuArsipSurat}
                    onOpenTemplateSurat={handleOpenTemplateSurat}
                    onOpenPenomoranSurat={handleOpenPenomoranSurat}
                    onDataChanged={() => {
                      setKeluargaList(StorageService.getKeluargaList());
                    }}
                  />
                )}

                {/* TAB 7: BUAT SURAT UNTUK WARGA (STAGE 7.1) */}
                {activeTab === 'surat-warga' && (
                  <AparaturBuatSuratWarga
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    onBackToDashboard={() => setActiveTab(currentUser.role === 'operator_aset' ? 'map' : 'surat-dashboard')}
                    onOpenArsip={() => {
                      setPreviousTabBeforeArsip('surat-warga');
                      handleOpenBukuArsipSurat('WARGA');
                    }}
                    onDataChanged={() => {
                      setKeluargaList(StorageService.getKeluargaList());
                    }}
                  />
                )}

                {/* TAB 8: BUKU ARSIP SURAT (FULL-PAGE) */}
                {activeTab === 'surat-arsip' && currentUser.role !== 'operator_aset' && (
                  <BukuArsipSuratView
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    initialArchiveType={arsipInitialFilter}
                    onBack={() => setActiveTab((previousTabBeforeArsip as any) || 'surat-dashboard')}
                    onOpenBuatSurat={() => {
                      setPreviousTabBeforeArsip('surat-arsip');
                      setActiveTab('surat-warga');
                    }}
                    onOpenLayananSuratMasuk={() => {
                      setPreviousTabBeforeSuratLayanan('surat-arsip');
                      setLayananSuratInitialSubTab('masuk');
                      setActiveTab('surat-layanan');
                    }}
                    onDataChanged={() => {
                      setKeluargaList(StorageService.getKeluargaList());
                    }}
                  />
                )}

                {/* TAB 9: LAYANAN & VERIFIKASI SURAT (FULL-PAGE WORKSPACE) */}
                {activeTab === 'surat-layanan' && currentUser.role !== 'operator_aset' && (
                  <AparaturLayananSuratView
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    initialTab={layananSuratInitialSubTab}
                    onBack={() => setActiveTab((previousTabBeforeSuratLayanan as any) || 'surat-dashboard')}
                    onOpenBuatSuratWarga={handleOpenBuatSuratWarga}
                    onOpenBuatSuratDinas={handleOpenBuatSuratDinas}
                    onOpenBukuArsip={() => {
                      setPreviousTabBeforeArsip('surat-layanan');
                      handleOpenBukuArsipSurat('ALL');
                    }}
                    onDataChanged={() => {
                      setKeluargaList(StorageService.getKeluargaList());
                    }}
                  />
                )}

                {/* TAB 10: BUAT SURAT DINAS (STAGE 7.2B.3 - FULL-PAGE WORKSPACE) */}
                {activeTab === 'surat-dinas' && (
                  <AparaturBuatSuratDinas
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    onBack={() => setActiveTab(currentUser.role === 'operator_aset' ? 'map' : ((previousTabBeforeDinas as any) || 'surat-dashboard'))}
                    onOpenArsip={() => {
                      setPreviousTabBeforeArsip('surat-dinas');
                      handleOpenBukuArsipSurat('DINAS');
                    }}
                    onOpenLayananSurat={() => {
                      setPreviousTabBeforeSuratLayanan('surat-dinas');
                      setLayananSuratInitialSubTab('masuk');
                      setActiveTab('surat-layanan');
                    }}
                    onDataChanged={() => {
                      setKeluargaList(StorageService.getKeluargaList());
                    }}
                  />
                )}

                {/* TAB 11: TEMPLATE SURAT (STAGE 7.2D.2 - FULL-PAGE WORKSPACE) */}
                {activeTab === 'surat-template' && currentUser.role !== 'operator_aset' && (
                  <AparaturTemplateSuratView
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    onBack={() => setActiveTab((previousTabBeforeTemplate as any) || 'surat-dashboard')}
                    onOpenDashboard={() => setActiveTab('surat-dashboard')}
                    onOpenPenomoran={handleOpenPenomoranSurat}
                  />
                )}

                {/* TAB 12: PENGATURAN PENOMORAN SURAT (STAGE 7.2E.2 - FULL-PAGE WORKSPACE) */}
                {activeTab === 'surat-numbering' && currentUser.role !== 'operator_aset' && (
                  <AparaturPenomoranSuratView
                    currentUser={currentUser}
                    permissions={permissions}
                    desaProfile={desaProfile}
                    onBack={() => setActiveTab((previousTabBeforeNumbering as any) || 'surat-dashboard')}
                    onOpenDashboard={() => setActiveTab('surat-dashboard')}
                    onOpenTemplates={handleOpenTemplateSurat}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      ) : null}
      </AnimatePresence>

      {/* Modals & Dialogs */}
      {/* Modal Informasi Data Desa (Mode View / Baca Saja: Khusus Kiosk / Informasi Cepat) */}
      <VillageInfoModal
        isOpen={isVillageInfoOpen && currentUser?.role !== 'operator_aset' && currentUser?.role !== 'operator'}
        onClose={() => setIsVillageInfoOpen(false)}
        desaProfile={desaProfile}
        initialTab={villageInfoInitialTab}
      />

      {/* Notifications & Admin Verification Queue Modal */}
      <VerificationQueueModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onApprove={handleApproveNotification}
        onReject={handleRejectNotification}
        currentUser={currentUser || { id: '', username: '', name: '', role: 'operator', jabatan: '', avatar: '' }}
      />

      {/* User Management & RBAC Permissions Settings Modal */}
      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        currentUser={currentUser || { id: '', username: '', name: '', role: 'operator', jabatan: '', avatar: '' }}
        users={userList}
        onSaveUsers={handleSaveUsers}
        permissions={permissions}
        onSavePermissions={handleSavePermissions}
        onSwitchUser={handleSwitchUser}
        onAddNewKeluarga={() => {
          setIsUserSettingsOpen(false);
          setEditingKeluarga(null);
          setPickedCoords(null);
          setIsFormOpen(true);
        }}
      />

      {/* User Information & Profile Modal (Data Informasi User & Tombol Logout) */}
      {currentUser && (
        <UserInfoModal
          isOpen={isUserInfoOpen}
          onClose={() => setIsUserInfoOpen(false)}
          currentUser={currentUser}
          desaProfile={desaProfile}
          permissions={permissions}
          onLogout={() => {
            setIsUserInfoOpen(false);
            handleLogout();
          }}
          onOpenUserSettings={() => {
            setIsUserInfoOpen(false);
            if (currentUser.role !== 'admin') {
              showToast('Akses Dibatasi: Menu Setting User & RBAC hanya dapat diakses oleh Administrator.', 'warning');
              return;
            }
            setIsUserSettingsOpen(true);
          }}
          onOpenAuthLogs={() => {
            setIsUserInfoOpen(false);
            setIsAuthLogsOpen(true);
          }}
        />
      )}

      {/* Auth Activity Logs Modal (Catatan Riwayat Login & Logout) */}
      <AuthLogModal
        isOpen={isAuthLogsOpen}
        onClose={() => setIsAuthLogsOpen(false)}
        logs={authLogs}
        onClearLogs={() => {
          StorageService.clearAuthLogs();
          setAuthLogs([]);
          showToast('Seluruh riwayat log autentikasi berhasil dibersihkan.', 'info');
        }}
        onDeleteLog={(id) => {
          const updated = StorageService.deleteAuthLog(id);
          setAuthLogs(updated);
          showToast('Rekaman log berhasil dihapus.', 'info');
        }}
        currentUser={currentUser || userList[0]}
      />

      {/* KIOSK Fullscreen Display Mode (Monitor Besar Balai Desa) */}
      <KioskView
        isOpen={isKioskOpen && currentUser?.role !== 'operator'}
        onClose={() => setIsKioskOpen(false)}
        keluargaList={filteredKeluarga}
        pendudukList={allPenduduk}
        currentUser={currentUser || userList[0]}
        desaProfile={desaProfile}
        permissions={permissions}
        onOpenVillageInfo={handleOpenVillageInfo}
      />

      {/* Portal Anjungan Mandiri Warga */}
      <AnjunganMandiriView
        isOpen={isAnjunganOpen}
        onClose={() => setIsAnjunganOpen(false)}
        desaProfile={desaProfile}
        onWargaLoginChange={session => setCurrentWarga(session)}
      />

      {/* Modal Verifikasi Perubahan Data Kependudukan Warga (Aparatur Operator / Admin) */}
      {currentUser && (
        <WargaDataChangeReviewModal
          isOpen={isDataChangeReviewOpen}
          onClose={() => setIsDataChangeReviewOpen(false)}
          currentUser={currentUser}
          permissions={permissions}
          onDataApplied={() => {
            setKeluargaList(StorageService.getKeluargaList());
            showToast('Data master kependudukan telah berhasil diperbarui dan disinkronisasi.', 'success');
          }}
        />
      )}

      {/* Modal Otorisasi Sandi untuk Membuka Buku Inventaris Desa */}
      <AssetPasswordModal
        isOpen={isAssetPasswordModalOpen}
        onClose={() => setIsAssetPasswordModalOpen(false)}
        onSuccess={handleAssetPasswordSuccess}
        currentUser={currentUser}
        users={userList}
      />

      {/* Modal Verifikasi Dokumen Surat Resmi Publik (QR / Token / Registrasi) */}
      <PublicLetterVerificationModal
        isOpen={isPublicVerifyOpen}
        onClose={() => {
          setIsPublicVerifyOpen(false);
          setPublicVerifyToken('');
        }}
        initialToken={publicVerifyToken}
      />

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800 text-slate-500 text-xs py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pemerintah Desa Beliti Jaya, Kec. Muara Kelingi, Kab. Musi Rawas, Sumatera Selatan</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <button
              onClick={() => {
                setPublicVerifyToken('');
                setIsPublicVerifyOpen(true);
              }}
              className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verifikasi Keabsahan Surat (QR)</span>
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Layanan SIG Kependudukan & Anjungan Mandiri</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
