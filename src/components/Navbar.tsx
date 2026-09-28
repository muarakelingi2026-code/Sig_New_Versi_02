import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, VerificationNotification, DesaProfile, RolePermissions, AsetDesa, Keluarga } from '../types';
import { 
  Map, 
  BarChart3, 
  Database, 
  FileText, 
  Bell, 
  MapPin, 
  UserCog, 
  Lock, 
  ShieldCheck, 
  Settings, 
  History, 
  Tv, 
  Search, 
  Sun, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  Building2, 
  BookOpen, 
  Users, 
  Home, 
  LogOut, 
  Key, 
  Shield, 
  Layers, 
  Sparkles, 
  Command, 
  X,
  CreditCard,
  FileCheck,
  Award,
  Compass,
  CheckCircle2,
  IdCard,
  Archive,
  Inbox,
  Hash
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  activeTab: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village' | 'surat-warga' | 'surat-arsip' | 'surat-layanan' | 'surat-dinas' | 'surat-dashboard' | 'surat-template' | 'surat-numbering';
  setActiveTab: (tab: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village' | 'surat-warga' | 'surat-arsip' | 'surat-layanan' | 'surat-dinas' | 'surat-dashboard' | 'surat-template' | 'surat-numbering') => void;
  notifications: VerificationNotification[];
  onOpenNotifications: () => void;
  onOpenAuthLogs?: () => void;
  authLogsCount?: number;
  onOpenKiosk?: () => void;
  onOpenAnjungan?: () => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  onResetData?: () => void;
  onOpenVillageProfile?: () => void;
  desaProfile?: DesaProfile;
  permissions?: RolePermissions;
  onOpenUserSettings?: () => void;
  onOpenUserProfile?: () => void;
  onOpenAssetModal?: (category?: 'all' | 'pembangunan' | 'non_pembangunan') => void;
  onOpenVillageInfo?: (tab?: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText') => void;
  keluargaList?: Keluarga[];
  asetList?: AsetDesa[];
  onSelectSearchedKeluarga?: (kel: Keluarga) => void;
  onSelectSearchedAsset?: (aset: AsetDesa) => void;
  onOpenDataChangeReview?: () => void;
  pendingDataChangeCount?: number;
  onOpenPersuratanDashboard?: () => void;
  onOpenAparaturSurat?: (initialTab?: 'masuk' | 'verifikasi' | 'persetujuan' | 'arsip') => void;
  onOpenBuatSuratWarga?: () => void;
  onOpenBuatSuratDinas?: () => void;
  onOpenBukuArsipSurat?: () => void;
  onOpenTemplateSurat?: () => void;
  onOpenPenomoranSurat?: () => void;
  pendingLetterRequestCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  notifications,
  onOpenNotifications,
  onOpenAuthLogs,
  authLogsCount,
  onOpenKiosk,
  onOpenAnjungan,
  onLogout,
  onOpenVillageProfile,
  desaProfile,
  permissions,
  onOpenUserSettings,
  onOpenUserProfile,
  onOpenAssetModal,
  onOpenVillageInfo,
  keluargaList = [],
  asetList = [],
  onSelectSearchedKeluarga,
  onSelectSearchedAsset,
  onOpenDataChangeReview,
  pendingDataChangeCount = 0,
  onOpenPersuratanDashboard,
  onOpenAparaturSurat,
  onOpenBuatSuratWarga,
  onOpenBuatSuratDinas,
  onOpenBukuArsipSurat,
  onOpenTemplateSurat,
  onOpenPenomoranSurat,
  pendingLetterRequestCount = 0
}) => {
  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const isOperator = currentUser.role === 'operator';
  const isAdmin = currentUser.role === 'admin';
  const isOperatorAset = currentUser.role === 'operator_aset';
  const isRestrictedOperator = isOperator && (permissions?.operatorOnlyAddKK ?? true);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openDropdownMenu, setOpenDropdownMenu] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMenuMouseEnter = (menuKey: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpenDropdownMenu(menuKey);
  };

  const handleMenuMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdownMenu(null);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sig_navbar_compact') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCompact = () => {
    setIsCompact(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sig_navbar_compact', String(next));
      } catch (e) {
        // ignore
      }
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 400);
      return next;
    });
  };

  const activeTabMeta = useMemo(() => {
    switch (activeTab) {
      case 'map':
        return { label: 'Portal Peta GIS', icon: Map, color: 'text-emerald-400' };
      case 'analytics':
        return { label: 'Statistik & Analitik', icon: BarChart3, color: 'text-amber-400' };
      case 'crud':
        return { label: 'Data Kependudukan', icon: Users, color: 'text-blue-400' };
      case 'export':
        return { label: 'Cetak Laporan', icon: FileCheck, color: 'text-teal-400' };
      case 'settings':
        return { label: 'Pengaturan Sistem', icon: Settings, color: 'text-purple-400' };
      case 'village':
        return { label: 'Data Wilayah & Desa', icon: Building2, color: 'text-emerald-400' };
      case 'surat-dashboard':
        return { label: 'Dashboard Persuratan', icon: FileText, color: 'text-teal-400' };
      case 'surat-warga':
        return { label: 'Buat Surat untuk Warga', icon: FileText, color: 'text-teal-400' };
      case 'surat-dinas':
        return { label: 'Buat Surat Dinas', icon: Building2, color: 'text-teal-400' };
      case 'surat-arsip':
        return { label: 'Buku Arsip Surat', icon: Archive, color: 'text-emerald-400' };
      case 'surat-layanan':
        return { label: 'Layanan & Verifikasi Surat', icon: FileCheck, color: 'text-teal-400' };
      case 'surat-template':
        return { label: 'Template Surat', icon: FileText, color: 'text-teal-400' };
      case 'surat-numbering':
        return { label: 'Pengaturan Penomoran', icon: Hash, color: 'text-teal-400' };
      default:
        return { label: 'Portal Peta GIS', icon: Map, color: 'text-emerald-400' };
    }
  }, [activeTab]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setOpenDropdownMenu(null);
        setShowHelpModal(false);
        setShowLangMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) {
        setOpenDropdownMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Filter search results
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { families: [], assets: [] };

    const matchedFamilies = keluargaList.filter(k => 
      k.namaKepalaKeluarga.toLowerCase().includes(q) ||
      k.nomorKk.toLowerCase().includes(q) ||
      k.nikKepalaKeluarga.toLowerCase().includes(q) ||
      k.anggotaKeluarga.some(m => m.nama.toLowerCase().includes(q) || m.nik.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedAssets = asetList.filter(a =>
      a.namaAset.toLowerCase().includes(q) ||
      a.kodeAset.toLowerCase().includes(q) ||
      a.kategori.toLowerCase().includes(q) ||
      a.lokasiDusun.toLowerCase().includes(q)
    ).slice(0, 5);

    return { families: matchedFamilies, assets: matchedAssets };
  }, [searchQuery, keluargaList, asetList]);

  // Handle Tab Navigations
  const handleTabClick = (tabId: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village') => {
    setOpenDropdownMenu(null);
    if (tabId === 'inventory') {
      if (onOpenAssetModal) {
        onOpenAssetModal('all');
      } else {
        setActiveTab('inventory');
      }
      return;
    }
    if (tabId === 'crud') {
      if (isOperatorAset) {
        alert('Akses Dibatasi: Menu Data Kependudukan tidak dapat diakses oleh Operator Aset. Akun Operator Aset dikhususkan untuk pengelolaan Aset Desa & Buku Inventaris.');
        return;
      }
      setActiveTab('crud');
      return;
    }
    if (tabId === 'export') {
      if (isOperatorAset) {
        alert('Akses Dibatasi: Menu Cetak dan Enkripsi tidak dapat diakses oleh Operator Aset.');
        return;
      }
      if (isRestrictedOperator && !permissions?.allowOperatorExport) {
        alert('Akses Dibatasi: Menu Cetak dan Enkripsi dibatasi untuk Operator.');
        return;
      }
      setActiveTab('export');
      return;
    }
    if (tabId === 'village') {
      if (isOperatorAset) {
        alert('Akses Dibatasi: Menu Data Desa tidak dapat diakses oleh Operator Aset.');
        return;
      }
      if (isRestrictedOperator && !permissions?.allowOperatorVillageProfile) {
        alert('Akses Dibatasi: Menu Data Desa hanya dapat diakses oleh Administrator.');
        return;
      }
      setActiveTab('village');
      return;
    }
    if (tabId === 'settings') {
      if (!isAdmin) {
        alert('Akses Dibatasi: Menu Setting User & RBAC hanya dapat diakses oleh Administrator Sistem.');
        return;
      }
      if (onOpenUserSettings) {
        onOpenUserSettings();
      } else {
        setActiveTab('settings');
      }
      return;
    }
    if (tabId === 'analytics') {
      if (isRestrictedOperator && !permissions?.allowOperatorAnalytics) {
        alert('Akses Dibatasi: Dashboard Analitik hanya dapat diakses oleh Administrator.');
        return;
      }
      setActiveTab('analytics');
      return;
    }
    setActiveTab(tabId);
  };

  const renderUserProfileDropdown = () => (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      className="absolute right-0 top-full mt-2 w-68 sm:w-72 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/90 p-2 z-[999] text-xs divide-y divide-slate-800 text-slate-200 backdrop-blur-2xl ring-1 ring-white/10"
    >
      {/* Header Info User */}
      <div className="p-2.5 space-y-1">
        <div className="font-bold text-white text-sm">{currentUser.name}</div>
        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {currentUser.role === 'admin' 
              ? 'Administrator Sistem' 
              : currentUser.role === 'operator_aset'
              ? 'Operator Aset Desa'
              : 'Operator Data KK'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400">{currentUser.jabatan}</div>
      </div>

      {/* Menu Pilihan */}
      <div className="py-1.5 space-y-0.5">
        <button
          onClick={() => {
            setIsUserMenuOpen(false);
            if (onOpenUserProfile) onOpenUserProfile();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Lihat Profil Pengguna</span>
        </button>

        {isAdmin && onOpenUserSettings && (
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenUserSettings();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 flex items-center gap-2 transition-colors cursor-pointer font-medium"
          >
            <UserCog className="w-3.5 h-3.5 text-amber-400" />
            <span>Kelola Akses Pengguna (RBAC)</span>
          </button>
        )}

        {onOpenAuthLogs && (
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenAuthLogs();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Log Riwayat Login</span>
            </span>
            {authLogsCount && authLogsCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-blue-400 text-[10px] font-mono border border-slate-700">
                {authLogsCount}
              </span>
            ) : null}
          </button>
        )}

        {!isOperator && onOpenKiosk && (
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenKiosk();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition-colors cursor-pointer font-medium"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode KIOSK Layar Sentuh</span>
          </button>
        )}

        {onOpenDataChangeReview && (currentUser.role === 'admin' || currentUser.role === 'operator') && (
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenDataChangeReview();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verifikasi Perubahan Data</span>
            </span>
            {pendingDataChangeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 font-bold text-[10px]">
                {pendingDataChangeCount}
              </span>
            )}
          </button>
        )}

        {onOpenAparaturSurat && (currentUser.role === 'admin' || currentUser.role === 'operator') && (
          <>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                if (onOpenBuatSuratWarga) {
                  onOpenBuatSuratWarga();
                } else {
                  setActiveTab('surat-warga');
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-950/40 text-teal-300 hover:text-teal-200 flex items-center gap-2 transition-colors cursor-pointer font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Buat Surat untuk Warga</span>
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                onOpenAparaturSurat('masuk');
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5 text-teal-400" />
                <span>Layanan & Verifikasi Surat</span>
              </span>
              {pendingLetterRequestCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 font-bold text-[10px]">
                  {pendingLetterRequestCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                if (onOpenBukuArsipSurat) {
                  onOpenBukuArsipSurat();
                } else {
                  setActiveTab('surat-arsip');
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buku Arsip Surat</span>
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                if (onOpenTemplateSurat) {
                  onOpenTemplateSurat();
                } else {
                  setActiveTab('surat-template');
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Template Surat</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                Builder
              </span>
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                if (onOpenPenomoranSurat) {
                  onOpenPenomoranSurat();
                } else {
                  setActiveTab('surat-numbering');
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-teal-400" />
                <span>Pengaturan Penomoran</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                Baku
              </span>
            </button>
          </>
        )}

        {onOpenAnjungan && (
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenAnjungan();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition-colors cursor-pointer font-semibold border-t border-slate-800/60 mt-1 pt-2"
          >
            <IdCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portal Anjungan Mandiri Warga</span>
          </button>
        )}
      </div>

      {/* Logout */}
      <div className="pt-1.5">
        <button
          onClick={() => {
            setIsUserMenuOpen(false);
            if (onLogout) onLogout();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Keluar Sistem (Logout)</span>
        </button>
      </div>
    </motion.div>
  );

  return (
    <header id="main-header" className="sticky top-0 z-[100] px-2 sm:px-4 pt-2 sm:pt-3 pb-1.5 select-none font-sans bg-slate-950/80 backdrop-blur-md">
      
      {/* ========================================================
          WADAH TUNGGAL SATU KOTAK (SINGLE CARD CONTAINER)
          Menyatu dengan tema gelap slate & emerald SIG Desa
          Dapat menciut lebar dan tinggi secara mulus ala CoreTax DJP
          ======================================================== */}
      <motion.div 
        id="coretax-unified-header-box"
        layout
        transition={{ 
          layout: { 
            duration: 0.42,
            ease: [0.16, 1, 0.3, 1]
          }
        }}
        className={`mx-auto bg-slate-900/95 backdrop-blur-2xl rounded-2xl text-slate-100 relative z-30 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isCompact 
            ? 'max-w-xl sm:max-w-2xl lg:max-w-3xl border border-emerald-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_24px_rgba(16,185,129,0.16)] ring-1 ring-emerald-500/20' 
            : 'max-w-7xl border border-slate-800 shadow-2xl shadow-black/50 ring-1 ring-white/5'
        }`}
      >
        
        {/* ----------------------------------------------------
            BARIS ATAS: Logo Resmi, Brand SIG, Search, Utility, Profil
            ---------------------------------------------------- */}
        <motion.div 
          layout
          transition={{ layout: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } }}
          className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 relative z-40"
        >
          
          {/* SISI KIRI: Logo Instansi & Brand SIG CoreTax Style */}
          <motion.div 
            layout
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 sm:gap-3 shrink-0"
          >
            {/* Logo Instansi Lambang Musi Rawas / Desa Beliti Jaya */}
            <div 
              onClick={() => {
                if (!isOperator && !isOperatorAset && onOpenVillageProfile) {
                  onOpenVillageProfile();
                }
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              title="Pemerintah Kabupaten Musi Rawas • Desa Beliti Jaya"
            >
              {desaProfile?.logoDesa ? (
                <img
                  src={desaProfile.logoDesa}
                  alt={`Logo ${desaProfile.namaDesa}`}
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-1 flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5 text-white fill-current" />
                </div>
              )}

              {/* Logo SIG Beliti Jaya bergaya CoreTax Terpadu */}
              <div className="flex items-center">
                {/* Logo Kotak SIG Icon */}
                <div className="flex items-center gap-1 bg-blue-900/70 px-2 py-0.5 rounded-lg border border-blue-500/40 shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs"></span>
                  <span className="font-black tracking-tight text-xs text-blue-100">SIG</span>
                </div>

                {/* Divider Tegak */}
                <div className="h-6 w-px bg-slate-700 mx-2 sm:mx-2.5"></div>

                {/* Teks Logo Gaya CORETAX */}
                <div className="flex items-center text-sm sm:text-base font-extrabold tracking-tight">
                  <span className="text-white font-black">BELITI</span>
                  <div className="w-3.5 h-3.5 mx-1 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  </div>
                  <span className="text-emerald-400 font-black">JAYA</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BAGIAN TENGAH: Global Quick Search (Cari Layanan / Penduduk / Aset...) */}
          <motion.div 
            layout
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            ref={searchDropdownRef} 
            className={`mx-1 sm:mx-2 relative hidden sm:block ${
              isCompact ? 'flex-1 max-w-xs sm:max-w-sm' : 'flex-1 max-w-md lg:max-w-lg'
            }`}
          >
            <div 
              onClick={() => {
                setIsSearchOpen(true);
                searchInputRef.current?.focus();
              }}
              className="w-full flex items-center bg-slate-950/70 hover:bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 transition-all shadow-inner cursor-text group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari layanan, NIK, nama penduduk, aset desa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-200 mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0 ml-1.5 bg-slate-800/90 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 shadow-2xs">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </div>

            {/* Dropdown Hasil Pencarian Global Popover */}
            <AnimatePresence>
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs divide-y divide-slate-800 text-slate-200 backdrop-blur-xl"
                >
                  <div className="p-2.5 bg-slate-800/80 font-semibold text-slate-300 flex items-center justify-between text-[11px]">
                    <span>Hasil Pencarian Cepat</span>
                    <span className="font-mono text-slate-400 font-normal text-[10px]">
                      {searchResults.families.length + searchResults.assets.length} item ditemukan
                    </span>
                  </div>

                  {/* Bagian Penduduk */}
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Data Penduduk & Kepala Keluarga
                    </div>
                    {searchResults.families.length > 0 ? (
                      searchResults.families.map((fam) => (
                        <div
                          key={fam.id}
                          onClick={() => {
                            setActiveTab('map');
                            if (onSelectSearchedKeluarga) onSelectSearchedKeluarga(fam);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-2 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                              {fam.namaKepalaKeluarga}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              No. KK: {fam.nomorKk} • {fam.dusun}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/70 font-medium">
                            Lihat di Peta
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic px-2 py-1 text-[11px]">
                        Tidak ada data penduduk yang cocok.
                      </div>
                    )}
                  </div>

                  {/* Bagian Aset Desa */}
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-1 bg-slate-950/40">
                    <div className="text-[10px] font-bold text-purple-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Inventaris Aset Desa
                    </div>
                    {searchResults.assets.length > 0 ? (
                      searchResults.assets.map((aset) => (
                        <div
                          key={aset.id}
                          onClick={() => {
                            setActiveTab('map');
                            if (onSelectSearchedAsset) onSelectSearchedAsset(aset);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-2 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                              {aset.namaAset}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {aset.kategori} • {aset.lokasiDusun}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/70 font-medium">
                            Fokus Pin
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic px-2 py-1 text-[11px]">
                        Tidak ada aset desa yang cocok.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Indikator Modul Aktif Saat Mode Menciut (Floating Active Capsule ala CoreTax) */}
          <AnimatePresence>
            {isCompact && (
              <motion.button
                key="compact-active-module-pill"
                initial={{ opacity: 0, scale: 0.88, y: -4, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.88, y: -4, filter: 'blur(4px)' }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                onClick={toggleCompact}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-emerald-500/35 hover:border-emerald-400/80 text-xs font-semibold shadow-xs hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer group shrink-0 backdrop-blur-md active:scale-98"
                title="Klik untuk membuka / menampilkan menu navigasi lengkap"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <activeTabMeta.icon className={`w-3.5 h-3.5 ${activeTabMeta.color}`} />
                <span className="text-slate-200 font-bold group-hover:text-emerald-300 transition-colors truncate max-w-[140px]">
                  {activeTabMeta.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400/80 group-hover:translate-y-0.5 transition-transform duration-200" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* SISI KANAN: Mode Mini / Menciut vs Mode Lengkap (Ala CoreTax DJP) */}
          <motion.div 
            layout
            transition={{ layout: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } }}
            className="shrink-0 relative z-50"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCompact ? (
                /* ========================================================
                   MODE MINI / MENCIUT (PERSIS SESUAI GAMBAR USER & CORETAX)
                   ======================================================== */
                <motion.div
                  key="compact-mode-cluster"
                  initial={{ opacity: 0, scale: 0.92, x: 8, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.92, x: -8, filter: 'blur(3px)' }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 sm:gap-2.5"
                >
                  {/* Tombol Profil Ringkas (Hexagon/Avatar) */}
                  <div ref={userMenuRef} className="relative z-50">
                    <button
                      id="btn-compact-user-profile"
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs relative"
                      title={`Akun: ${currentUser.name} (${currentUser.role}) • Klik untuk menu profil`}
                    >
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-slate-600 flex items-center justify-center text-slate-300">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {pendingCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
                      )}
                    </button>

                    {/* Popover Menu Profil Pengguna */}
                    <AnimatePresence>
                      {isUserMenuOpen && renderUserProfileDropdown()}
                    </AnimatePresence>
                  </div>

                  {/* Tombol Dua Garis Horizontal (=) Ala CoreTax DJP untuk Buka/Ekspansi Menu */}
                  <motion.button
                    id="btn-toggle-expand-header"
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={toggleCompact}
                    className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 text-slate-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs hover:shadow-[0_0_16px_rgba(16,185,129,0.38)] group relative transition-all duration-200"
                    title="Buka / Tampilkan Menu Navigasi Lengkap"
                    aria-label="Buka Menu Navigasi"
                  >
                    <span className="w-4 h-0.5 bg-emerald-400 group-hover:bg-emerald-300 rounded-full transition-all duration-200 group-hover:w-4.5" />
                    <span className="w-3 h-0.5 bg-emerald-400 group-hover:bg-emerald-300 rounded-full transition-all duration-200 group-hover:w-4.5" />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </motion.button>
                </motion.div>
              ) : (
                /* ========================================================
                   MODE LENGKAP (FULL CORETAX HEADER DENGAN UTILITY LENGKAP)
                   ======================================================== */
                <motion.div
                  key="full-mode-cluster"
                  initial={{ opacity: 0, scale: 0.94, x: -8, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, x: 8, filter: 'blur(3px)' }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-1.5 sm:gap-2.5 shrink-0"
                >
                  {/* Tombol Panduan / Bantuan (?) */}
                  <button
                    id="btn-header-help"
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                    title="Bantuan & Panduan Sistem"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  {/* Mode Terang/Siang */}
                  <button
                    id="btn-header-theme"
                    type="button"
                    onClick={() => alert('Mode Tampilan Sistem: Tema Gelap Spasial SIG Pemerintahan')}
                    className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                    title="Mode Tampilan Sistem"
                  >
                    <Sun className="w-4 h-4" />
                  </button>

                  {/* Lonceng Notifikasi */}
                  <button
                    id="btn-header-notifications"
                    type="button"
                    onClick={onOpenNotifications}
                    className="relative w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                    title="Notifikasi Verifikasi & Perubahan Data"
                  >
                    <Bell className="w-4 h-4" />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900 animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Bahasa (🇮🇩 ID) */}
                  <div className="relative hidden sm:block">
                    <button
                      id="btn-header-lang"
                      type="button"
                      onClick={() => setShowLangMenu(!showLangMenu)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="Pilih Bahasa Sistem"
                    >
                      <span className="text-sm leading-none">🇮🇩</span>
                      <span>ID</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showLangMenu && (
                      <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1 text-xs">
                        <button
                          onClick={() => setShowLangMenu(false)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-300 font-semibold flex items-center gap-2 border border-emerald-800/50"
                        >
                          <span>🇮🇩</span> Bahasa Indonesia
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PILL PROFIL PENGGUNA RESMI (ID di atas, NAMA di bawah, Chevron) */}
                  <div ref={userMenuRef} className="relative z-50">
                    <button
                      id="btn-coretax-user-profile"
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group shadow-xs text-left"
                      title="Klik untuk membuka menu akun & profil pengguna"
                    >
                      {/* Avatar Icon */}
                      <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 overflow-hidden text-slate-300">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      {/* ID & Nama Pengguna */}
                      <div className="hidden sm:block min-w-0 pr-1">
                        <div className="text-[10px] text-slate-400 font-mono leading-none tracking-tight">
                          {currentUser.role === 'admin' 
                            ? '1808032508930001' 
                            : currentUser.role === 'operator_aset'
                            ? '1808032508930003'
                            : '1808032508930006'}
                        </div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate mt-0.5">
                          {currentUser.name.toUpperCase()}
                        </div>
                      </div>

                      {/* Dropdown Chevron */}
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Popover Menu Profil Pengguna */}
                    <AnimatePresence>
                      {isUserMenuOpen && renderUserProfileDropdown()}
                    </AnimatePresence>
                  </div>

                  {/* Tombol Fullscreen / Layar Penuh */}
                  <button
                    id="btn-header-fullscreen"
                    type="button"
                    onClick={toggleFullscreen}
                    className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs hidden sm:flex"
                    title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  {/* Tombol Menciutkan Menu Bar (Icon Dua Garis Ala CoreTax) */}
                  <motion.button
                    id="btn-header-collapse-toggle"
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={toggleCompact}
                    className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] relative transition-all duration-200"
                    aria-label="Ciutkan Menu Header"
                    title="Ciutkan Menu Header (Mode Ringkas)"
                  >
                    <span className="w-4 h-0.5 bg-slate-300 group-hover:bg-emerald-400 rounded-full transition-all duration-200 group-hover:w-4.5" />
                    <span className="w-4 h-0.5 bg-slate-300 group-hover:bg-emerald-400 rounded-full transition-all duration-200 group-hover:w-3" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ========================================================
            BARIS MENU HORIZONTAL (Dapat menciut secara otomatis/klik)
            Sesuai fitur CoreTax DJP: icon mini menciutkan menu
            ======================================================== */}
        <AnimatePresence initial={false}>
          {!isCompact && (
            <motion.div
              key="compactable-menu-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: 'auto', 
                opacity: 1,
                transition: {
                  height: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.05 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  opacity: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
                  height: { duration: 0.36, ease: [0.16, 1, 0.3, 1], delay: 0.04 }
                }
              }}
              className="relative z-20 overflow-visible"
            >
              {/* Garis Pembatas Gradien Modern */}
              <motion.div 
                initial={{ scaleX: 0.85, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0.85, opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="h-px bg-gradient-to-r from-transparent via-slate-700/80 to-transparent mx-3 sm:mx-5 origin-center"
              />

              {/* Deretan Menu Horizontal - Rata Tengah Simetris & Berimbang Profesional Modern */}
              <motion.div 
                initial={{ y: -10, opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ y: -8, opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                className="w-full overflow-visible flex justify-center py-1"
              >
                <div 
                  ref={navMenuRef} 
                  className="w-fit min-w-max md:min-w-0 md:w-full md:max-w-6xl mx-auto px-3 sm:px-6 py-1 sm:py-1.5 flex items-center justify-center flex-wrap gap-1.5 sm:gap-2.5 text-xs font-semibold overflow-visible relative z-20"
                >
          
          {/* 1. Portal Peta GIS */}
          <div 
            className="relative shrink-0"
            onMouseEnter={() => handleMenuMouseEnter('portal')}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              id="menu-nav-portal"
              type="button"
              onClick={() => handleTabClick('map')}
              onContextMenu={(e) => {
                e.preventDefault();
                setOpenDropdownMenu(openDropdownMenu === 'portal' ? null : 'portal');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Portal Peta Spasial GIS Interaktif"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-emerald-400">
                <Map className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>Portal Peta GIS</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'portal' ? null : 'portal');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Menu Portal Melayang */}
            <AnimatePresence>
              {openDropdownMenu === 'portal' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-56 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-1.5 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Peta GIS</div>
                  <button
                    onClick={() => {
                      handleTabClick('map');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Map className="w-3.5 h-3.5 text-blue-400" />
                    <span>Peta Spasial Utama</span>
                  </button>
                  <button
                    onClick={() => {
                      handleTabClick('map');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sebaran Dusun I - IV</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Dashboard Analitik */}
          <div 
            className="relative shrink-0"
            onMouseEnter={() => handleMenuMouseEnter('analytics')}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              id="menu-nav-analytics"
              type="button"
              onClick={() => handleTabClick('analytics')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Statistik Demografi & Grafik Bantuan Sosial"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-amber-400">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span>Statistik & Analitik</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'analytics' ? null : 'analytics');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Analitik Melayang */}
            <AnimatePresence>
              {openDropdownMenu === 'analytics' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-56 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-1.5 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Analitik</div>
                  <button
                    onClick={() => {
                      handleTabClick('analytics');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ringkasan Statistik</span>
                  </button>
                  <button
                    onClick={() => {
                      handleTabClick('analytics');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Grafik Bansos & Demografi</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Data Kependudukan */}
          <div 
            className="relative shrink-0"
            onMouseEnter={() => !isOperatorAset && handleMenuMouseEnter('crud')}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              id="menu-nav-crud"
              type="button"
              onClick={() => handleTabClick('crud')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'crud'
                  ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title={isOperatorAset ? 'Terkunci untuk Operator Aset' : 'Data Penduduk, KK, dan Bansos'}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-cyan-400">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span>Kependudukan</span>
              {isOperatorAset ? (
                <Lock className="w-3 h-3 text-rose-400" />
              ) : (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownMenu(openDropdownMenu === 'crud' ? null : 'crud');
                  }}
                  className="p-0.5 hover:bg-slate-700/60 rounded"
                >
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              )}
            </button>

            {/* Dropdown Kependudukan Melayang */}
            <AnimatePresence>
              {openDropdownMenu === 'crud' && !isOperatorAset && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-64 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-2 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-[''] space-y-0.5"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Kependudukan</div>
                  <button
                    onClick={() => {
                      handleTabClick('crud');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Daftar Kartu Keluarga (KK)</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenNotifications();
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Verifikasi Data Masuk</span>
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-700/60 font-bold text-[10px]">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  {onOpenDataChangeReview && (
                    <button
                      onClick={() => {
                        onOpenDataChangeReview();
                        setOpenDropdownMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verifikasi Perubahan Data Warga</span>
                      </span>
                      {pendingDataChangeCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 font-bold text-[10px]">
                          {pendingDataChangeCount}
                        </span>
                      )}
                    </button>
                  )}
                  {onOpenAparaturSurat && (
                    <>
                      <button
                        onClick={() => {
                          onOpenAparaturSurat('masuk');
                          setOpenDropdownMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>Layanan Surat Masuk</span>
                        </span>
                        {pendingLetterRequestCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 font-bold text-[10px]">
                            {pendingLetterRequestCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (onOpenBukuArsipSurat) {
                            onOpenBukuArsipSurat();
                          } else {
                            setActiveTab('surat-arsip');
                          }
                          setOpenDropdownMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buku Arsip Surat</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3B. Layanan Surat & Buku Arsip (Aparatur) */}
          {!isOperatorAset && (onOpenAparaturSurat || onOpenPersuratanDashboard) && (isAdmin || isOperator) && (
            <div 
              className="relative shrink-0"
              onMouseEnter={() => handleMenuMouseEnter('surat')}
              onMouseLeave={handleMenuMouseLeave}
            >
              <button
                id="menu-nav-surat"
                type="button"
                onClick={() => {
                  if (onOpenPersuratanDashboard) {
                    onOpenPersuratanDashboard();
                  } else if (onOpenAparaturSurat) {
                    onOpenAparaturSurat('masuk');
                  } else {
                    setActiveTab('surat-dashboard');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'surat-dashboard' || activeTab === 'surat-warga' || activeTab === 'surat-dinas' || activeTab === 'surat-arsip' || activeTab === 'surat-layanan' || activeTab === 'surat-template' || activeTab === 'surat-numbering'
                    ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
                }`}
                title="Dashboard Layanan Persuratan & Buku Arsip Surat Desa"
              >
                <div className="w-4 h-4 rounded flex items-center justify-center text-teal-400">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span>Layanan Surat</span>
                {pendingLetterRequestCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 font-bold text-[10px]">
                    {pendingLetterRequestCount}
                  </span>
                )}
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownMenu(openDropdownMenu === 'surat' ? null : 'surat');
                  }}
                  className="p-0.5 hover:bg-slate-700/60 rounded"
                >
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </button>

              {/* Dropdown Layanan Surat Melayang (Sesuai Konsep Stage 7.2C & 7.2D.2) */}
              <AnimatePresence>
                {openDropdownMenu === 'surat' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-full mt-2 w-72 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-2 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-[''] space-y-1"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Layanan Persuratan</div>

                    {/* 0. Dashboard Persuratan */}
                    <button
                      onClick={() => {
                        if (onOpenPersuratanDashboard) {
                          onOpenPersuratanDashboard();
                        } else {
                          setActiveTab('surat-dashboard');
                        }
                        setOpenDropdownMenu(null);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                        activeTab === 'surat-dashboard'
                          ? 'bg-teal-600 text-white font-bold border-teal-500 shadow-sm'
                          : 'bg-teal-950/40 hover:bg-teal-900/50 text-teal-200 border-teal-800/40 font-semibold'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <span>Dashboard Persuratan</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                        Utama
                      </span>
                    </button>

                    {/* 1. Pengajuan Masuk */}
                    <button
                      onClick={() => {
                        onOpenAparaturSurat?.('masuk');
                        setOpenDropdownMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Inbox className="w-4 h-4 text-teal-400" />
                        <span>Pengajuan Masuk</span>
                      </span>
                      {pendingLetterRequestCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 font-bold text-[10px]">
                          {pendingLetterRequestCount}
                        </span>
                      )}
                    </button>

                    {/* 2. Buat Surat (Hierarki Submenu) */}
                    <div className="pt-1.5 pb-1.5 border-t border-b border-slate-800/80 my-1 space-y-1">
                      <div className="px-2.5 py-0.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        <span>Buat Surat</span>
                      </div>

                      {/* Surat untuk Warga (AKTIF Stage 7.1) */}
                      <button
                        onClick={() => {
                          if (onOpenBuatSuratWarga) {
                            onOpenBuatSuratWarga();
                          } else {
                            setActiveTab('surat-warga');
                          }
                          setOpenDropdownMenu(null);
                        }}
                        className={`w-full text-left pl-5 pr-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                          activeTab === 'surat-warga'
                            ? 'bg-teal-600 text-white font-bold border-teal-500 shadow-sm'
                            : 'bg-teal-950/40 hover:bg-teal-900/50 text-teal-200 border-teal-800/40 font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-teal-300" />
                          <span>Surat untuk Warga</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                          Aktif
                        </span>
                      </button>

                      {/* Surat Dinas (AKTIF Stage 7.2B.3) */}
                      <button
                        onClick={() => {
                          if (onOpenBuatSuratDinas) {
                            onOpenBuatSuratDinas();
                          } else {
                            setActiveTab('surat-dinas');
                          }
                          setOpenDropdownMenu(null);
                        }}
                        className={`w-full text-left pl-5 pr-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                          activeTab === 'surat-dinas'
                            ? 'bg-teal-600 text-white font-bold border-teal-500 shadow-sm'
                            : 'bg-teal-950/40 hover:bg-teal-900/50 text-teal-200 border-teal-800/40 font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-teal-300" />
                          <span>Surat Dinas</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                          Aktif
                        </span>
                      </button>
                    </div>

                    {/* 3. Verifikasi */}
                    <button
                      onClick={() => {
                        onOpenAparaturSurat('verifikasi');
                        setOpenDropdownMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>Verifikasi</span>
                    </button>

                    {/* 4. Persetujuan */}
                    <button
                      onClick={() => {
                        onOpenAparaturSurat('persetujuan');
                        setOpenDropdownMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      <span>Persetujuan</span>
                    </button>

                    {/* 5. Buku Arsip Surat */}
                    <button
                      onClick={() => {
                        if (onOpenBukuArsipSurat) {
                          onOpenBukuArsipSurat();
                        } else {
                          setActiveTab('surat-arsip');
                        }
                        setOpenDropdownMenu(null);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800 pt-2 ${
                        activeTab === 'surat-arsip'
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Archive className="w-4 h-4 text-emerald-400" />
                      <span>Buku Arsip Surat</span>
                    </button>

                    {/* 6. PENGATURAN SURAT (STAGE 7.2D.2) */}
                    <div className="pt-2 pb-1 border-t border-slate-800/80 my-1 space-y-1">
                      <div className="px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Settings className="w-3 h-3 text-slate-400" />
                        <span>Pengaturan Surat</span>
                      </div>

                      {/* Template Surat (AKTIF) */}
                      <button
                        onClick={() => {
                          if (onOpenTemplateSurat) {
                            onOpenTemplateSurat();
                          } else {
                            setActiveTab('surat-template');
                          }
                          setOpenDropdownMenu(null);
                        }}
                        className={`w-full text-left pl-5 pr-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                          activeTab === 'surat-template'
                            ? 'bg-teal-600 text-white font-bold border-teal-500 shadow-sm'
                            : 'bg-teal-950/30 hover:bg-teal-900/50 text-teal-200 border-teal-800/30 font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-teal-300" />
                          <span>Template Surat</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                          Builder
                        </span>
                      </button>

                      {/* Penomoran (AKTIF STAGE 7.2E.2) */}
                      <button
                        onClick={() => {
                          if (onOpenPenomoranSurat) {
                            onOpenPenomoranSurat();
                          } else {
                            setActiveTab('surat-numbering');
                          }
                          setOpenDropdownMenu(null);
                        }}
                        className={`w-full text-left pl-5 pr-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                          activeTab === 'surat-numbering'
                            ? 'bg-teal-600 text-white font-bold border-teal-500 shadow-sm'
                            : 'bg-teal-950/30 hover:bg-teal-900/50 text-teal-200 border-teal-800/30 font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-teal-300" />
                          <span>Penomoran</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                          Baku
                        </span>
                      </button>

                      {/* Pejabat Penandatangan */}
                      <div
                        className="w-full text-left pl-5 pr-2.5 py-1.5 rounded-xl flex items-center justify-between text-slate-500 opacity-60 text-xs select-none"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          <span>Pejabat Penandatangan</span>
                        </span>
                        <span className="text-[9px] text-slate-500">Tersedia</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 4. Buku Inventaris */}
          <div 
            className="relative shrink-0"
            onMouseEnter={() => handleMenuMouseEnter('inventory')}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              id="menu-nav-aset"
              type="button"
              onClick={() => handleTabClick('inventory')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Buku Inventaris Aset Desa (Pembangunan & Non Pembangunan)"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-indigo-400">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span>Buku Inventaris</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'inventory' ? null : 'inventory');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Inventaris Melayang */}
            <AnimatePresence>
              {openDropdownMenu === 'inventory' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-64 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-1.5 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Inventaris</div>
                  <button
                    onClick={() => {
                      if (onOpenAssetModal) onOpenAssetModal('all');
                      else setActiveTab('inventory');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Semua Aset Desa</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenAssetModal) onOpenAssetModal('pembangunan');
                      else setActiveTab('inventory');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Aset Fisik & Pembangunan</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenAssetModal) onOpenAssetModal('non_pembangunan');
                      else setActiveTab('inventory');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>Aset Non-Pembangunan / Kantor</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. Cetak & Enkripsi */}
          <div 
            className="relative shrink-0"
            onMouseEnter={() => handleMenuMouseEnter('export')}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              id="menu-nav-export"
              type="button"
              onClick={() => handleTabClick('export')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'export'
                  ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Cetak Laporan PDF Resmi & Ekspor Excel"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-sky-400">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span>Cetak & Enkripsi</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'export' ? null : 'export');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Cetak & Enkripsi Melayang */}
            <AnimatePresence>
              {openDropdownMenu === 'export' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-60 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-1.5 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format Laporan</div>
                  <button
                    onClick={() => {
                      handleTabClick('export');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cetak Dokumen PDF Resmi</span>
                  </button>
                  <button
                    onClick={() => {
                      handleTabClick('export');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ekspor Data Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleTabClick('export');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Backup Enkripsi AES-256</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 6. Profil Desa */}
          <div 
            className="relative shrink-0"
            onMouseEnter={() => handleMenuMouseEnter('village')}
            onMouseLeave={handleMenuMouseLeave}
          >
            <button
              id="menu-nav-village"
              type="button"
              onClick={() => handleTabClick('village')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'village'
                  ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Data Wilayah, Kepala Desa, dan Perangkat Desa"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-teal-400">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span>Data Desa</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'village' ? null : 'village');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Data Desa Melayang */}
            <AnimatePresence>
              {openDropdownMenu === 'village' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-60 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] z-[250] p-1.5 text-xs text-slate-200 backdrop-blur-2xl before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informasi Pemerintahan</div>
                  <button
                    onClick={() => {
                      if (onOpenVillageInfo) onOpenVillageInfo('profil');
                      else handleTabClick('village');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Profil & Wilayah Desa</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenVillageInfo) onOpenVillageInfo('pimpinan');
                      else handleTabClick('village');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kepala Desa & Perangkat</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenVillageInfo) onOpenVillageInfo('struktur');
                      else handleTabClick('village');
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Struktur Organisasi</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Garis Aksen Bawah Bercahaya Halus (Modern Ambient Glow ala CoreTax HUD) */}
        <div
          className={`absolute -bottom-px left-6 right-6 h-[1px] pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isCompact
              ? 'bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent opacity-100 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
              : 'bg-gradient-to-r from-transparent via-slate-700/50 to-transparent opacity-50'
          }`}
        />

      </motion.div>

      {/* MODAL PANDUAN & BANTUAN SISTEM (?) */}
      <AnimatePresence>
        {showHelpModal && (
          <div 
            id="modal-help-overlay"
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl shadow-2xl p-6 text-slate-300 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-950/70 text-blue-400 border border-blue-800/60">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Panduan Navigasi Satu Pintu</h3>
                    <p className="text-xs text-slate-400">SIG Terpadu Desa Beliti Jaya (Format Terpadu)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-3 leading-relaxed text-slate-300">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Command className="w-3.5 h-3.5" />
                    <span>Pencarian Global Terpadu (Ctrl + K)</span>
                  </div>
                  <p className="text-slate-400">Ketik langsung nama warga, NIK kependudukan, Nomor KK, atau inventaris aset desa di kotak pencarian bagian atas.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Menu Navigasi Terpadu (Satu Kotak)</span>
                  </div>
                  <p className="text-slate-400">Header dan Menu telah dipadukan dalam satu wadah berbingkai elegan untuk akses cepat: Peta Spasial, Statistik Analitik, Data Kependudukan, Buku Inventaris, Cetak Laporan, dan Data Desa.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pill Akun Resmi Pengguna</span>
                  </div>
                  <p className="text-slate-400">Klik nama akun Anda di sebelah kanan atas untuk mengakses rincian profil, manajemen RBAC, riwayat login, atau keluar sistem.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Mengerti & Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </header>
  );
};
