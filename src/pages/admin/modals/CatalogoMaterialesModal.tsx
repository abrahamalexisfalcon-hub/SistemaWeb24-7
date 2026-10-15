import React from 'react';
import { GestionMaterialesModal } from '../../../components/admin/GestionMaterialesModal';

interface CatalogoMaterialesModalProps {
  isOpen: boolean;
  onClose: () => void;
  especialidadPreseleccionada?: string;
}

export const CatalogoMaterialesModal: React.FC<CatalogoMaterialesModalProps> = (props) => {
  return <GestionMaterialesModal {...props} />;
};
