import React from 'react';
import { FamilyFormView } from './FamilyFormView';
import { Keluarga, User } from '../types';

export interface FamilyFormModalProps {
  initialData?: Keluarga | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (keluargaData: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'>) => void;
  currentUser: User;
  onPickCoordinateOnMap: (draftState?: any) => void;
  pickedCoords?: { lat: number; lng: number } | null;
}

/**
 * Re-export wrapper for backward compatibility.
 * The form is now designed as a full in-page view directly inside the web page.
 */
export const FamilyFormModal: React.FC<FamilyFormModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onSave,
  currentUser,
  onPickCoordinateOnMap,
  pickedCoords
}) => {
  if (!isOpen) return null;

  return (
    <FamilyFormView
      initialData={initialData}
      onClose={onClose}
      onSave={onSave}
      currentUser={currentUser}
      onPickCoordinateOnMap={onPickCoordinateOnMap}
      pickedCoords={pickedCoords}
    />
  );
};

export default FamilyFormModal;
