import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keluarga, Penduduk, User, RolePermissions, DesaProfile } from '../types';
import { DEFAULT_VILLAGE_LOGO } from '../data/mockData';
import { generateFamilyProfilePDF, generateResidentProfilePDF } from '../utils/pdfExport';
import { 
  ArrowLeft,
  Users, 
  HeartHandshake, 
  Home, 
  MapPin, 
  Edit3, 
  Trash2, 
  Printer, 
  Calendar, 
  GraduationCap, 
  Briefcase, 
  Coins, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Copy,
  Maximize2,
  ShieldCheck,
  Check,
  LayoutGrid,
  Table2,
  Eye,
  IdCard,
  Search,
  Bell,
  Camera,
  Layers,
  Droplets,
  Zap,
  Phone,
  Sparkles,
  ShieldAlert,
  Building,
  X,
  FileText,
  BarChart3,
  Settings,
  MoreVertical,
  Heart,
  Crown,
  User as UserIcon,
  Wallet
} from 'lucide-react';

interface FamilyDetailViewProps {
  keluarga: Keluarga;
  onBack: () => void;
  onEdit: (keluarga: Keluarga) => void;
  onDelete: (keluarga: Keluarga) => void;
  currentUser: User;
  permissions?: RolePermissions;
  isReadOnly?: boolean;
  isKioskMode?: boolean;
  onNavigate?: (tab: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village') => void;
  onOpenNotifications?: () => void;
  notificationsCount?: number;
  keluargaList?: Keluarga[];
  onSelectAnotherKeluarga?: (kel: Keluarga) => void;
  desaProfile?: DesaProfile;
}

export const FamilyDetailView: React.FC<FamilyDetailViewProps> = ({
  keluarga,
  onBack,
  onEdit,
  onDelete,
  currentUser,
  permissions,
  isReadOnly = false,
  isKioskMode = false,
  onNavigate,
  onOpenNotifications,
  notificationsCount = 0,
  keluargaList = [],
  onSelectAnotherKeluarga,
  desaProfile
}) => {
  // Navigation & view states
  const [activeTab, setActiveTab] = useState<'biodata' | 'bansos' | 'rumah'>('biodata');
  const [memberViewMode, setMemberViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedMember, setSelectedMember] = useState<Penduduk | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<{ url: string; title: string } | null>(null);
  
  // Interactive copy feedbacks
  const [copiedKk, setCopiedKk] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedNik, setCopiedNik] = useState<string | null>(null);

  const [openMemberMenuNik, setOpenMemberMenuNik] = useState<string | null>(null);

  // Scroll to top on mount or keluarga change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [keluarga?.id]);

  // Keyboard shortcut (Escape) to close expanded photo or member view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedPhoto) {
          setExpandedPhoto(null);
        } else if (selectedMember) {
          setSelectedMember(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPhoto, selectedMember]);

  // Permission calculations
  const isOperator = currentUser.role === 'operator';
  const isOperatorAset = currentUser.role === 'operator_aset';
  const isRestricted = isOperator && (permissions?.operatorOnlyAddKK ?? true);
  const allowEdit = !isReadOnly && !isKioskMode && !isOperatorAset && (!isRestricted || (permissions?.allowOperatorEditKK ?? false));
  const allowDelete = !isReadOnly && !isKioskMode && !isOperatorAset && (!isRestricted || (permissions?.allowOperatorDeleteKK ?? false));
  const allowExport = !isKioskMode && !isOperatorAset && (!isRestricted || (permissions?.allowOperatorExport ?? false));

  // Helper formats
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const totalPenghasilanKeluarga = useMemo(() => {
    return keluarga.anggotaKeluarga.reduce((acc, m) => acc + (m.penghasilanBulanan || 0), 0);
  }, [keluarga.anggotaKeluarga]);

  const handleCopyKk = () => {
    navigator.clipboard.writeText(keluarga.noKk);
    setCopiedKk(true);
    setTimeout(() => setCopiedKk(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(keluarga.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyCoords = () => {
    const text = `${keluarga.koordinat.lat}, ${keluarga.koordinat.lng}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleCopyNik = (nik: string) => {
    navigator.clipboard.writeText(nik);
    setCopiedNik(nik);
    setTimeout(() => setCopiedNik(null), 2000);
  };

  const getDesilBadge = (status: string) => {
    if (status.includes('Desil 1')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          Desil 1 • Sangat Miskin
        </span>
      );
    }
    if (status.includes('Desil 2')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Desil 2 • Miskin
        </span>
      );
    }
    if (status.includes('Desil 3')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Desil 3 • Rentan Miskin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Non-DTKS • Mampu
      </span>
    );
  };

  // Nav tabs list
  const tabs = [
    { id: 'biodata' as const, label: `Biodata Anggota (${keluarga.anggotaKeluarga.length})`, icon: Users },
    { id: 'bansos' as const, label: 'Bantuan Sosial & DTKS', icon: HeartHandshake },
    { id: 'rumah' as const, label: 'Kondisi Fisik Hunian', icon: Home }
  ];

  return (
    <div 
      id="family-detail-fullpage"
      className="min-h-screen bg-[#040e1b] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-teal-500 selection:text-white"
    >
      {/* ========================================================
          MOBILE STICKY TOPBAR (Clean, Sleek & Responsive for Mobile)
          ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-[#061426]/95 backdrop-blur-md border-b border-slate-800/90 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Kembali</span>
          </button>
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 shrink-0 overflow-hidden">
              <img 
                src={desaProfile?.logoDesa || DEFAULT_VILLAGE_LOGO} 
                alt="Logo Desa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Rincian Data Keluarga</div>
              <div className="text-[10px] text-teal-400 truncate font-mono">{keluarga.namaKepalaKeluarga}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions on Mobile */}
        <div className="flex items-center gap-1.5 shrink-0">
          {allowExport && (
            <button
              type="button"
              onClick={() => generateFamilyProfilePDF(keluarga)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Cetak Profil PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=-2.971973,103.152321&destination=${keluarga.koordinat.lat},${keluarga.koordinat.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 transition-colors cursor-pointer shadow-xs active:scale-95"
            title="Rute Google Maps"
          >
            <MapPin className="w-4 h-4" />
          </a>
          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(keluarga)}
              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Edit Data Keluarga"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================
          1. COMPACT LEFT SIDEBAR (SIG Desa - Action Panel for Desktop)
          ======================================================== */}
      <aside 
        id="family-detail-sidebar"
        className="hidden md:flex md:w-64 bg-[#061426] border-r border-slate-800/80 flex-col justify-between py-5 px-4 shrink-0 z-30 md:min-h-screen md:sticky md:top-0 md:h-screen overflow-y-auto"
      >
        {/* Top: SIG Desa Brand & Logo Instansi Resmi */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 p-1 flex items-center justify-center shadow-lg shadow-black/50 shrink-0 overflow-hidden ring-1 ring-emerald-500/30 group">
              <img 
                src={desaProfile?.logoDesa || DEFAULT_VILLAGE_LOGO} 
                alt="Logo Resmi Desa Beliti Jaya" 
                className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <div className="min-w-0">
              <div className="text-base font-black text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  SIG Desa
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                Sistem Informasi<br />Geografis Desa
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80 mx-1" />

          {/* Action Menu (Aksi Utama dengan Gaya Pemerintahan Modern) */}
          <div className="space-y-3">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Menu Tindakan</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            </div>

            <nav className="space-y-2">
              {/* 1. Kembali */}
              <button
                type="button"
                id="sidebar-btn-back"
                onClick={onBack}
                className="w-full relative overflow-hidden flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800/90 hover:border-emerald-400 shadow-xs hover:shadow-lg hover:shadow-emerald-950/70 transition-all duration-300 ease-out cursor-pointer group active:scale-[0.98] hover:translate-x-1.5"
              >
                {/* Light Sweep Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                {/* Left Edge Indicator Bar */}
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-slate-700 group-hover:bg-emerald-200 group-hover:top-0 group-hover:bottom-0 transition-all duration-300" />
                
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 group-hover:text-white group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                  </div>
                  <span className="font-bold text-xs leading-none tracking-wide text-left">
                    Kembali
                  </span>
                </div>
                
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-white transition-all duration-200 shrink-0" />
              </button>

              {/* 2. Edit Data */}
              {allowEdit && (
                <button
                  type="button"
                  id="sidebar-btn-edit"
                  onClick={() => onEdit(keluarga)}
                  className="w-full relative overflow-hidden flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800/90 hover:border-emerald-400 shadow-xs hover:shadow-lg hover:shadow-emerald-950/70 transition-all duration-300 ease-out text-xs font-semibold cursor-pointer group active:scale-[0.98] hover:translate-x-1.5"
                >
                  {/* Light Sweep Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  {/* Left Edge Indicator Bar */}
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-slate-700 group-hover:bg-emerald-200 group-hover:top-0 group-hover:bottom-0 transition-all duration-300" />

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 group-hover:text-white group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs">
                      <Edit3 className="w-4 h-4 group-hover:rotate-[-8deg] group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <span className="font-bold text-xs leading-none tracking-wide text-left">
                      Edit Data
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-white transition-all duration-200 shrink-0" />
                </button>
              )}

              {/* 3. Rute Google Maps */}
              <a
                id="sidebar-btn-gmaps"
                href={`https://www.google.com/maps/dir/?api=1&origin=-2.971973,103.152321&destination=${keluarga.koordinat.lat},${keluarga.koordinat.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full relative overflow-hidden flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#09182B] hover:bg-emerald-600 text-slate-200 hover:text-white border border-blue-500/30 hover:border-emerald-400 shadow-xs hover:shadow-lg hover:shadow-emerald-950/70 transition-all duration-300 ease-out text-xs font-semibold cursor-pointer group active:scale-[0.98] hover:translate-x-1.5"
              >
                {/* Light Sweep Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                {/* Left Edge Indicator Bar */}
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 group-hover:bg-emerald-200 group-hover:top-0 group-hover:bottom-0 transition-all duration-300" />

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 group-hover:text-white group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs">
                    <MapPin className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  </div>
                  <span className="font-bold text-xs leading-none tracking-wide text-left">
                    Rute Google Maps
                  </span>
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:text-white opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
              </a>

              {/* 4. Cetak Profil PDF */}
              {allowExport && (
                <button
                  type="button"
                  id="sidebar-btn-print"
                  onClick={() => generateFamilyProfilePDF(keluarga)}
                  className="w-full relative overflow-hidden flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-800/90 hover:border-emerald-400 shadow-xs hover:shadow-lg hover:shadow-emerald-950/70 transition-all duration-300 ease-out text-xs font-semibold cursor-pointer group active:scale-[0.98] hover:translate-x-1.5"
                >
                  {/* Light Sweep Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  {/* Left Edge Indicator Bar */}
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-slate-700 group-hover:bg-emerald-200 group-hover:top-0 group-hover:bottom-0 transition-all duration-300" />

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 group-hover:text-white group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs">
                      <Printer className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <span className="font-bold text-xs leading-none tracking-wide text-left">
                      Cetak Profil PDF
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-teal-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-white transition-all duration-200 shrink-0" />
                </button>
              )}

              {/* 5. Hapus Data */}
              {allowDelete && (
                <button
                  type="button"
                  id="sidebar-btn-delete"
                  onClick={() => onDelete(keluarga)}
                  className="w-full relative overflow-hidden flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-emerald-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-emerald-400 shadow-xs hover:shadow-lg hover:shadow-emerald-950/70 transition-all duration-300 ease-out text-xs font-semibold cursor-pointer group active:scale-[0.98] hover:translate-x-1.5"
                >
                  {/* Light Sweep Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  {/* Left Edge Indicator Bar */}
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-rose-700 group-hover:bg-emerald-200 group-hover:top-0 group-hover:bottom-0 transition-all duration-300" />

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 group-hover:text-white group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs">
                      <Trash2 className="w-4 h-4 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <span className="font-bold text-xs leading-none tracking-wide text-left">
                      {currentUser.role === 'admin' ? 'Hapus Data' : 'Ajukan Hapus Data'}
                    </span>
                  </div>

                  <Trash2 className="w-3.5 h-3.5 text-rose-400 opacity-40 group-hover:opacity-100 group-hover:scale-110 group-hover:text-white transition-all duration-200 shrink-0" />
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Bottom Banner Card in Sidebar */}
        <div className="hidden md:block mt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1A2F] to-[#071322] border border-teal-500/20 p-3.5 shadow-md">
            {/* Subtle GIS contour line SVG */}
            <svg 
              className="absolute -right-4 -bottom-4 w-28 h-28 text-teal-500/10 pointer-events-none" 
              viewBox="0 0 100 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.2"
            >
              <circle cx="50" cy="50" r="45" />
              <circle cx="50" cy="50" r="32" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="18" />
              <path d="M 10 50 Q 50 10 90 50 T 10 50" />
            </svg>
            <div className="relative z-10 space-y-1">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white leading-tight">
                Membangun Desa<br />Bersama Data
              </div>
              <p className="text-[10px] text-slate-400 leading-snug pt-0.5">
                Data yang akurat,<br />pelayanan yang lebih baik
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT AREA (SCROLLABLE PAGE BODY)
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        
        {/* ---------------- PAGE BODY CONTAINER ---------------- */}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 pb-12 relative">
          
          {/* Subtle Background Contour Waves (Smart Village / GIS aesthetic) */}
          <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-20 overflow-hidden">
            <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-teal-500">
              <path d="M 0 100 Q 150 50 250 150 T 400 200" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 50 150 Q 200 100 300 220 T 450 280" stroke="currentColor" strokeWidth="1.2" />
              <path d="M 0 220 Q 180 180 280 300 T 420 380" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* 3. PAGE HEADER: Title & Visual Identifier */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3.5 relative z-10"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/35 text-teal-400 flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Rincian Data Keluarga
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Informasi lengkap keluarga dan anggota dalam satu data
              </p>
            </div>
          </motion.div>

          {/* 4. FAMILY HERO CARD (Large Horizontal Card) */}
          <motion.div 
            id="family-hero-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-gradient-to-br from-[#0B1728] via-[#0E1D31] to-[#0B1728] rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl overflow-hidden z-10"
          >
            {/* Ambient top accent border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Zone: Foto Rumah + Family Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
                {/* Foto Rumah Container */}
                <div 
                  className="relative w-full sm:w-52 h-48 sm:h-36 rounded-2xl overflow-hidden shrink-0 border border-slate-700/80 shadow-md group cursor-pointer bg-slate-950"
                  onClick={() => setExpandedPhoto({
                    url: keluarga.fotoRumah,
                    title: `Foto Dokumentasi Fisik Rumah: ${keluarga.namaKepalaKeluarga} (No. KK: ${keluarga.noKk})`
                  })}
                  title="Klik untuk melihat foto rumah resolusi tinggi"
                >
                  <img
                    src={keluarga.fotoRumah}
                    alt="Foto Rumah"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-xs text-[10px] font-bold text-slate-200 py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-white/10 shadow-xs">
                    <Camera className="w-3 h-3 text-teal-400" />
                    <span>Foto Rumah</span>
                  </div>
                </div>

                {/* Family Identity Text */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5" />
                    <span>Keluarga</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {keluarga.namaKepalaKeluarga}
                  </h2>

                  {/* No. KK with Copy Button */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleCopyKk}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Klik untuk menyalin Nomor Kartu Keluarga"
                    >
                      <span className="text-slate-400 font-sans">No. KK :</span>
                      <span className="font-bold text-teal-300">{keluarga.noKk}</span>
                      {copiedKk ? (
                        <span className="text-[10px] text-teal-400 font-sans font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Tersalin!
                        </span>
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Alamat & Dusun */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">
                      {keluarga.alamat}, RT {keluarga.rt || '01'}, RW {keluarga.rw || '01'}, Dusun {keluarga.dusun}
                    </span>
                  </div>

                  {/* Kepala Keluarga Subtitle */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Kepala Keluarga: <span className="text-slate-200 font-semibold">{keluarga.namaKepalaKeluarga}</span></span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {getDesilBadge(keluarga.statusKesejahteraan)}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      (keluarga.statusPenduduk || 'Tetap') === 'Sementara'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {(keluarga.statusPenduduk || 'Tetap') === 'Sementara' ? '⏳ Penduduk Sementara' : '✓ Penduduk Tetap'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      keluarga.penerimaBansos 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    }`}>
                      {keluarga.penerimaBansos ? 'Penerima Bansos' : 'Mandiri'}
                    </span>
                    {keluarga.statusVerifikasi === 'pending_approval' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Menunggu Verifikasi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Zone: 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-[#06111F]/70 p-3 sm:p-4 rounded-2xl border border-slate-800 shrink-0">
                {/* 1. Jumlah Anggota */}
                <div className="px-2 sm:px-3 py-1 text-center border-r border-slate-800 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center mb-1 shadow-inner">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-sm sm:text-xl font-black text-white truncate">
                    {keluarga.anggotaKeluarga.length} Jiwa
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 truncate">
                    Jumlah Anggota
                  </div>
                </div>

                {/* 2. Penghasilan */}
                <div className="px-2 sm:px-3 py-1 text-center border-r border-slate-800 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center mb-1 shadow-inner">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-300 font-mono truncate">
                    {totalPenghasilanKeluarga > 0 ? formatRupiah(totalPenghasilanKeluarga) : 'Rp 0'}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 truncate">
                    Penghasilan
                  </div>
                </div>

                {/* 3. Bansos / BLN */}
                <div className="px-2 sm:px-3 py-1 text-center min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 mx-auto flex items-center justify-center mb-1 shadow-inner">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-teal-300 font-mono truncate">
                    {keluarga.totalNominalBantuanBulanan > 0 ? formatRupiah(keluarga.totalNominalBantuanBulanan) : 'Rp 0'}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 truncate">
                    Bansos / BLN
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* 5. TAB NAVIGATION (Segmented Control Bar with Animated Sliding Pill) */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto scrollbar-none relative">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-family-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedMember(null); // Return to list view
                  }}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFamilyDetailTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 shadow-md shadow-teal-950/60 border border-teal-400/40"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* 6. TAB CONTENTS (Smooth Tab Switching) */}
          <AnimatePresence mode="wait">
            {activeTab === 'biodata' && (
              <motion.div
                key="tab-biodata"
                initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
              
              {/* If user clicked to view a single member in full dossier mode */}
              {selectedMember ? (
                /* IN-PAGE CITIZEN DETAILED DOSSIER */
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#0B1728] rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-6"
                >
                  {/* Dossier Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Kembali ke Daftar Anggota"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                          Biodata Lengkap Anggota
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {selectedMember.nama}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {allowExport && (
                        <button
                          type="button"
                          onClick={() => generateResidentProfilePDF(selectedMember, keluarga)}
                          className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer border border-teal-400/30"
                          title="Cetak Profil Biodata Resmi PDF"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Cetak Biodata PDF</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
                      >
                        Tutup Rincian
                      </button>
                    </div>
                  </div>

                  {/* Profile Dossier Body */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Photo & Key Identifiers */}
                    <div className="bg-[#06111F] p-5 rounded-2xl border border-slate-800 text-center space-y-4">
                      <div 
                        className="relative w-32 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 shadow-lg cursor-pointer group"
                        onClick={() => setExpandedPhoto({
                          url: selectedMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
                          title: `Foto Profil: ${selectedMember.nama} (${selectedMember.statusKeluarga})`
                        })}
                      >
                        <img
                          src={selectedMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                          alt={selectedMember.nama}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-base font-bold text-white">{selectedMember.nama}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          NIK: {selectedMember.nik}
                        </div>
                        <div className="pt-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            selectedMember.statusKeluarga === 'Kepala Keluarga'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {selectedMember.statusKeluarga}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                        <div>Status Kehidupan: <strong className={selectedMember.statusKematian === 'Meninggal' ? 'text-rose-400' : 'text-emerald-400'}>{selectedMember.statusKematian || 'Hidup'}</strong></div>
                        <div>Jenis Kelamin: <strong className="text-slate-200">{selectedMember.jenisKelamin}</strong></div>
                        <div>Usia: <strong className="text-slate-200">{calculateAge(selectedMember.tanggalLahir)} Tahun</strong></div>
                      </div>
                    </div>

                    {/* Middle: Identitas Pribadi & Pendidikan/Pekerjaan */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-[#06111F] p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                          <Calendar className="w-4 h-4 text-teal-400" />
                          <span>Identitas Pribadi & Kelahiran</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Tempat, Tanggal Lahir:</span>
                            <span className="font-semibold text-white">
                              {selectedMember.tempatLahir || 'Beliti Jaya'}, {selectedMember.tanggalLahir || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Agama:</span>
                            <span className="font-semibold text-white">{selectedMember.agama}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Status Perkawinan:</span>
                            <span className="font-semibold text-white">{selectedMember.statusPerkawinan}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Hubungan Keluarga:</span>
                            <span className="font-semibold text-white">{selectedMember.statusKeluarga}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#06111F] p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                          <Briefcase className="w-4 h-4 text-teal-400" />
                          <span>Pendidikan & Pekerjaan</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Pendidikan Terakhir:</span>
                            <span className="font-semibold text-white">{selectedMember.pendidikan}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Pekerjaan:</span>
                            <span className="font-semibold text-white">{selectedMember.pekerjaan}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Penghasilan Bulanan:</span>
                            <span className="font-semibold text-emerald-400 font-mono">
                              {selectedMember.penghasilanBulanan ? formatRupiah(selectedMember.penghasilanBulanan) : 'Rp 0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Jaminan Sosial & Kontak */}
                      <div className="bg-[#06111F] p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                          <HeartHandshake className="w-4 h-4 text-rose-400" />
                          <span>Jaminan Sosial & Kontak</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Bantuan Pribadi:</span>
                            {selectedMember.bantuanPribadi && selectedMember.bantuanPribadi.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {selectedMember.bantuanPribadi.map((b, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Tidak terdaftar bantuan individu khusus</span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Kontak WhatsApp / No. HP:</span>
                            {selectedMember.nomorTelepon ? (
                              <a
                                href={`https://wa.me/${selectedMember.nomorTelepon.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:underline font-mono inline-flex items-center gap-1.5 mt-1"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{selectedMember.nomorTelepon}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Belum tercatat</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* REGULAR LIST OF MEMBERS (Grid or Table) */
                <>
                  {/* Section Title & View Switcher Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-400" />
                        <span>Daftar Anggota Keluarga ({keluarga.anggotaKeluarga.length} Jiwa)</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Data seluruh anggota keluarga yang terdaftar dalam KK ini.
                      </p>
                    </div>

                    {/* View Mode Toggle: Grid vs Table with Smooth Sliding Pill */}
                    <div className="flex items-center bg-[#0B1728] p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto relative">
                      <button
                        type="button"
                        id="btn-switch-grid-view"
                        onClick={() => setMemberViewMode('grid')}
                        className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                          memberViewMode === 'grid'
                            ? 'text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {memberViewMode === 'grid' && (
                          <motion.div
                            layoutId="familyMemberViewModePill"
                            className="absolute inset-0 rounded-lg bg-teal-600 shadow-md border border-teal-400/40"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Tampilan Grid</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        id="btn-switch-table-view"
                        onClick={() => setMemberViewMode('table')}
                        className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                          memberViewMode === 'table'
                            ? 'text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {memberViewMode === 'table' && (
                          <motion.div
                            layoutId="familyMemberViewModePill"
                            className="absolute inset-0 rounded-lg bg-teal-600 shadow-md border border-teal-400/40"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <Table2 className="w-3.5 h-3.5" />
                          <span>Tampilan Tabel</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* GRID OR TABLE VIEW SWITCHER WRAPPER */}
                  <AnimatePresence mode="wait">
                    {memberViewMode === 'grid' ? (
                      <motion.div 
                        key="member-grid-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {keluarga.anggotaKeluarga.map((member, idx) => {
                            const isKepala = member.nik === keluarga.nikKepala || member.statusKeluarga === 'Kepala Keluarga';
                            const isIstri = member.statusKeluarga === 'Istri';
                            const isAnak = member.statusKeluarga === 'Anak';
                            const isMenuOpen = openMemberMenuNik === member.nik;

                            return (
                              <motion.div
                                key={member.id || idx}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.2) }}
                                whileHover={{ y: -3 }}
                                onClick={() => setSelectedMember(member)}
                                className={`group relative rounded-3xl p-5 border transition-all duration-300 ease-out cursor-pointer overflow-hidden shadow-xl ${
                                  isKepala
                                    ? 'border-l-4 border-l-emerald-400 bg-gradient-to-br from-[#0C1F33] via-[#0B1A2C] to-[#081423] border-t-slate-800 border-r-slate-800 border-b-slate-800 hover:border-emerald-500/50'
                                  : isIstri
                                    ? 'border-l-4 border-l-blue-400 bg-gradient-to-br from-[#0B1B30] via-[#0A182B] to-[#081423] border-t-slate-800 border-r-slate-800 border-b-slate-800 hover:border-blue-500/50'
                                    : isAnak
                                      ? 'border-l-4 border-l-cyan-400 bg-gradient-to-br from-[#0A1B2D] via-[#091728] to-[#081322] border-t-slate-800 border-r-slate-800 border-b-slate-800 hover:border-cyan-500/50'
                                      : 'border-l-4 border-l-slate-500 bg-[#0B1728] border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {/* Radial glow on hover */}
                              <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                              {/* Top row: Role Badge & Three Dots Menu */}
                              <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                    isKepala
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                                      : isIstri
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                                        : isAnak
                                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                                          : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}>
                                    {isKepala && <Crown className="w-3.5 h-3.5 text-emerald-300" />}
                                    {isIstri && <UserIcon className="w-3.5 h-3.5 text-blue-300" />}
                                    {isAnak && <UserIcon className="w-3.5 h-3.5 text-cyan-300" />}
                                    {!isKepala && !isIstri && !isAnak && <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                                    <span>{member.statusKeluarga}</span>
                                  </span>

                                  {isKepala && (
                                    <span className="text-[11px] font-semibold text-emerald-400/90 hidden sm:inline-flex items-center gap-1">
                                      ⭐ Penanggung Jawab
                                    </span>
                                  )}
                                </div>

                                {/* Three Dots Action Menu */}
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenMemberMenuNik(isMenuOpen ? null : member.nik)}
                                    className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    title="Menu Aksi Anggota"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#071322] border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-40 text-xs space-y-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMemberMenuNik(null);
                                          setSelectedMember(member);
                                        }}
                                        className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                                      >
                                        <Eye className="w-4 h-4 text-teal-400" />
                                        <span>Lihat Detail Lengkap</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMemberMenuNik(null);
                                          handleCopyNik(member.nik);
                                        }}
                                        className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                                      >
                                        <Copy className="w-4 h-4 text-blue-400" />
                                        <span>Salin NIK</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMemberMenuNik(null);
                                          generateResidentProfilePDF(member, keluarga);
                                        }}
                                        className="w-full text-left px-3 py-2 text-emerald-300 hover:bg-emerald-500/15 rounded-xl flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-800/80 pt-1.5"
                                      >
                                        <Printer className="w-4 h-4 text-emerald-400" />
                                        <span>Cetak Biodata PDF</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Middle row: Avatar (100–110px) + Identity Details */}
                              <div className="flex items-start gap-4 relative z-10">
                                {/* Photo Container: 100-110px as requested */}
                                <div
                                  className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-700/80 shadow-md group-hover:border-teal-400/80 group-hover:ring-2 group-hover:ring-teal-400/25 transition-all duration-300 bg-slate-950"
                                  title="Klik untuk rincian anggota"
                                >
                                  <img
                                    src={member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                                    alt={member.nama}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-teal-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-teal-200" />
                                  </div>
                                </div>

                                {/* Details */}
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <h4 
                                    className="text-base sm:text-lg font-bold text-white tracking-tight truncate group-hover:text-teal-300 transition-colors duration-200"
                                  >
                                    {member.nama}
                                  </h4>

                                  {/* NIK with inline copy button */}
                                  <div 
                                    className="flex items-center gap-1.5 text-xs sm:text-[13px] text-slate-300 font-mono"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-slate-400 font-sans text-xs">NIK :</span>
                                    <span className="font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">{member.nik}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyNik(member.nik);
                                      }}
                                      className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
                                      title="Salin NIK"
                                    >
                                      {copiedNik === member.nik ? (
                                        <Check className="w-3.5 h-3.5 text-teal-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Demographics: JK | Usia | Status Kawin */}
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5 font-medium">
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <UserIcon className="w-3 h-3 text-slate-400" />
                                      {member.jenisKelamin}
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      {calculateAge(member.tanggalLahir)} Tahun ({member.tanggalLahir || '-'})
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <Heart className="w-3 h-3 text-rose-400" />
                                      {member.statusPerkawinan}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Thin divider */}
                              <div className="border-t border-slate-800/80 group-hover:border-slate-700/60 my-4 transition-colors" />

                              {/* Bottom 3-column stats */}
                              <div className="grid grid-cols-3 gap-2 text-xs relative z-10">
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                    Pendidikan
                                  </span>
                                  <span className="font-medium text-slate-200 truncate block mt-0.5 text-xs sm:text-[13px]">
                                    {member.pendidikan || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                    Pekerjaan
                                  </span>
                                  <span className="font-medium text-slate-200 truncate block mt-0.5 text-xs sm:text-[13px]">
                                    {member.pekerjaan || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                                    Status
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-xs sm:text-[13px] mt-0.5">
                                    {member.statusKematian === 'Meninggal' ? (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                        Meninggal
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Aktif
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}

                        {/* Decorative GIS Art in Grid (Matches Reference Image) */}
                        {keluarga.anggotaKeluarga.length % 2 !== 0 && (
                          <div className="hidden lg:flex flex-col items-center justify-center rounded-3xl p-6 border border-dashed border-slate-800/80 bg-gradient-to-br from-[#061426]/50 via-[#071629]/40 to-[#051120]/50 relative overflow-hidden text-center group">
                            {/* Glowing teal background ring */}
                            <div className="absolute inset-0 bg-radial from-teal-500/10 via-transparent to-transparent opacity-60" />
                            
                            <div className="relative z-10 flex flex-col items-center">
                              {/* 3D Roof / House & GIS Pin Vector */}
                              <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shadow-lg shadow-teal-950/60">
                                  <MapPin className="w-8 h-8 text-teal-400 animate-bounce" />
                                </div>
                                <div className="absolute -inset-2 bg-teal-500/20 rounded-2xl blur-lg -z-10" />
                              </div>

                              <div className="text-sm font-bold text-white tracking-tight">
                                Terverifikasi Geospasial Desa
                              </div>
                              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                                Titik koordinat hunian ({keluarga.koordinat.lat}, {keluarga.koordinat.lng}) terhubung dengan sistem pemetaan GIS SIPDesa.
                              </p>

                              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Presisi Akurasi Tinggi (≤ 5m)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    /* TABLE VIEW (Official Kartu Keluarga Format) */
                    <motion.div
                      key="member-table-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-[#0B1728] rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                              <th className="py-3.5 px-3.5">No</th>
                              <th className="py-3.5 px-3.5">Nama Lengkap</th>
                              <th className="py-3.5 px-3.5">NIK</th>
                              <th className="py-3.5 px-3.5">JK</th>
                              <th className="py-3.5 px-3.5">Tempat Lahir</th>
                              <th className="py-3.5 px-3.5">Tgl Lahir</th>
                              <th className="py-3.5 px-3.5">Agama</th>
                              <th className="py-3.5 px-3.5">Pendidikan</th>
                              <th className="py-3.5 px-3.5">Pekerjaan</th>
                              <th className="py-3.5 px-3.5">Hubungan</th>
                              <th className="py-3.5 px-3.5">Status</th>
                              <th className="py-3.5 px-3.5 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {keluarga.anggotaKeluarga.map((member, i) => (
                              <tr 
                                key={member.id || i} 
                                onClick={() => setSelectedMember(member)}
                                className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <td className="py-3.5 px-3.5 text-slate-400 font-mono">{i + 1}</td>
                                <td className="py-3.5 px-3.5 font-semibold text-white whitespace-nowrap">
                                  {member.nama}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono text-teal-300 whitespace-nowrap font-medium">
                                  {member.nik}
                                </td>
                                <td className="py-3.5 px-3.5 whitespace-nowrap">
                                  {member.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap">
                                  {member.tempatLahir || 'Beliti Jaya'}
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-300 font-mono whitespace-nowrap">
                                  {member.tanggalLahir || '-'}
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap">
                                  {member.agama}
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap">
                                  {member.pendidikan}
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap">
                                  {member.pekerjaan}
                                </td>
                                <td className="py-3.5 px-3.5 whitespace-nowrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    member.statusKeluarga === 'Kepala Keluarga' 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}>
                                    {member.statusKeluarga}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3.5 whitespace-nowrap font-semibold">
                                  {member.statusKematian === 'Meninggal' ? (
                                    <span className="text-rose-400 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                      Meninggal
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      Aktif
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMember(member)}
                                    className="px-3 py-1.5 bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Detail</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

          </motion.div>
        )}

        {/* ========================================================
            TAB 2: BANTUAN SOSIAL & DTKS
            ======================================================== */}
        {activeTab === 'bansos' && (
          <motion.div
            key="tab-bansos"
            initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
              {/* Bansos Status Overview Card */}
              <div className="bg-[#0B1728] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Status Kepesertaan DTKS & Bantuan Sosial</h3>
                      <p className="text-xs text-slate-400">Data terintegrasi SIKS-NG Kementerian Sosial RI & APBDes Beliti Jaya</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getDesilBadge(keluarga.statusKesejahteraan)}
                  </div>
                </div>

                {/* 3 Overview Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-bold">Status DTKS</div>
                    <div className="text-base font-bold text-white mt-1">
                      {keluarga.statusKesejahteraan}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Basis Data Terpadu Kemensos</div>
                  </div>

                  <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-bold">Penerima Bantuan</div>
                    <div className="text-base font-bold text-teal-400 mt-1">
                      {keluarga.penerimaBansos ? 'Ya, Terdaftar Penerima' : 'Tidak (Keluarga Mandiri)'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Program Perlindungan Sosial</div>
                  </div>

                  <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-bold">Nominal Bansos / Bulan</div>
                    <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                      {keluarga.totalNominalBantuanBulanan > 0 ? formatRupiah(keluarga.totalNominalBantuanBulanan) : 'Rp 0'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Total Akumulasi Bulanan</div>
                  </div>
                </div>

                {/* Daftar Program Bansos Terdaftar */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Program Bantuan yang Diterima
                  </h4>

                  {keluarga.daftarBansos && keluarga.daftarBansos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {keluarga.daftarBansos.map((program, idx) => (
                        <div key={idx} className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{program}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Status: Aktif Penyaluran</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#06111F] p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                      Keluarga ini tidak terdaftar dalam program bantuan sosial aktif (Keluarga Mandiri / Non-DTKS).
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB 3: KONDISI FISIK HUNIAN
              ======================================================== */}
          {activeTab === 'rumah' && (
            <motion.div
              key="tab-rumah"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="bg-[#0B1728] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Kondisi Fisik & Sarana Prasarana Hunian</h3>
                      <p className="text-xs text-slate-400">Verifikasi lapangan kondisi bangunan, sanitasi, dan utilitas rumah</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    Koordinat: {keluarga.koordinat.lat}, {keluarga.koordinat.lng}
                  </div>
                </div>

                {/* 2-Column: Photo Preview + Physical Specs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Photo Documentation */}
                  <div className="space-y-2">
                    <div 
                      className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video sm:aspect-square group cursor-pointer"
                      onClick={() => setExpandedPhoto({
                        url: keluarga.fotoRumah,
                        title: `Dokumentasi Fisik Rumah: ${keluarga.namaKepalaKeluarga}`
                      })}
                    >
                      <img
                        src={keluarga.fotoRumah}
                        alt="Foto Rumah"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-[11px] text-center text-slate-400">
                      Dokumentasi tampak depan bangunan tempat tinggal
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Tipe Bangunan</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.tipeBangunan || 'Permanen'}
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Status Kepemilikan</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.statusKepemilikan || 'Milik Sendiri'}
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Luas Bangunan</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.luasBangunanM2 || 72} m²
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Sumber Air Minum</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.sumberAirMinum || 'Sumur Bor'}
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Daya Listrik PLN</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.dayaListrik || '900 VA (Subsidi)'}
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Kondisi Dinding</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.kondisiDinding || 'Tembok Bata'}
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Kondisi Lantai</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.kondisiLantai || 'Keramik'}
                      </span>
                    </div>

                    <div className="bg-[#06111F] p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Fasilitas Jamban / Sanitasi</span>
                      <span className="text-sm font-bold text-white block">
                        {keluarga.kondisiRumah?.fasilitasJamban || 'Milik Sendiri (Leher Angsa)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Geospasial Verification & Metadata Footer */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center gap-3 flex-wrap text-xs text-slate-400">
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1728] border border-slate-800 text-xs font-mono hover:text-white transition-colors cursor-pointer shadow-xs active:scale-95"
            title="Salin ID Dokumen Keluarga"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span>ID Data : <strong className="text-slate-200">{keluarga.id}</strong></span>
            {copiedId ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
          </button>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <button
            type="button"
            onClick={handleCopyCoords}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1728] border border-slate-800 text-xs font-mono hover:text-white transition-colors cursor-pointer shadow-xs active:scale-95"
            title="Salin Titik Geografis GIS"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-slate-300 font-sans">Terverifikasi Titik GIS:</span>
            <span className="text-teal-300 font-bold">{keluarga.koordinat.lat}, {keluarga.koordinat.lng}</span>
            {copiedCoords ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
          </button>
        </div>

      </main>

      {/* High-Resolution Photo Lightbox Preview */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setExpandedPhoto(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-4xl w-full bg-[#0B1728] border border-slate-700 rounded-3xl overflow-hidden p-4 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-sm font-bold text-white truncate">{expandedPhoto.title}</div>
                <button
                  type="button"
                  onClick={() => setExpandedPhoto(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center bg-black/60 rounded-2xl max-h-[75vh] overflow-hidden p-2">
                <img
                  src={expandedPhoto.url}
                  alt={expandedPhoto.title}
                  className="max-h-[70vh] w-auto object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};
