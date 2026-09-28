import React from 'react';
import { AparaturLayananSuratView, LayananSuratSubTab } from './AparaturLayananSuratView';
import { User, RolePermissions, DesaProfile } from '../../types';
import { StorageService } from '../../services/storageService';

export interface AparaturSuratModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser: User;
  permissions?: RolePermissions;
  onDataChanged?: () => void;
  initialTab?: 'masuk' | 'verifikasi' | 'persetujuan' | 'arsip';
  onOpenBuatSuratWarga?: () => void;
  onOpenBukuArsip?: () => void;
  desaProfile?: DesaProfile;
}

/**
 * @deprecated Telah diubah menjadi Full-Page view melalui AparaturLayananSuratView.
 * Komponen ini dipertahankan sebagai wrapper kompatibilitas.
 */
export const AparaturSuratModal: React.FC<AparaturSuratModalProps> = ({
  isOpen = true,
  onClose,
  currentUser,
  permissions,
  onDataChanged,
  initialTab = 'masuk',
  onOpenBuatSuratWarga,
  onOpenBukuArsip,
  desaProfile
}) => {
  if (!isOpen) return null;
  const currentDesa = desaProfile || StorageService.getDesaProfile();
  return (
    <AparaturLayananSuratView
      currentUser={currentUser}
      permissions={permissions}
      desaProfile={currentDesa}
      onBack={onClose}
      initialTab={initialTab}
      onOpenBuatSuratWarga={onOpenBuatSuratWarga}
      onOpenBukuArsip={onOpenBukuArsip}
      onDataChanged={onDataChanged}
    />
  );
};
