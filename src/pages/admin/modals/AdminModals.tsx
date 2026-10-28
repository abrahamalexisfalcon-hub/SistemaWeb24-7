import React from 'react';
import { HojaServicioModal } from '../../../components/HojaServicioModal';
import { OrdenDetalleModal } from './OrdenDetalleModal';
import { AnularOrdenModal } from './AnularOrdenModal';
import { ReaperturarOrdenModal } from './ReaperturarOrdenModal';
import { TecnicoFormModal } from './TecnicoFormModal';
import { EspecialidadesModal } from './EspecialidadesModal';
import { CuentasModal } from './CuentasModal';
import { CatalogoMaterialesModal } from './CatalogoMaterialesModal';
import { PerfilAdminModal } from './PerfilAdminModal';
import { AfiliadoFormModal } from './AfiliadoFormModal';

interface AdminModalsProps {
  d: any;
  user: any;
  onLogout: () => void;
}

export const AdminModals: React.FC<AdminModalsProps> = ({ d, user, onLogout }) => {
  return (
    <>
      <OrdenDetalleModal
        orden={d.ordenSeleccionada}
        onClose={() => d.setOrdenSeleccionada(null)}
        onVerHojaServicio={() => d.setMostrarHojaServicio(true)}
        onAnularOrden={() => {
          d.setErrorAnulacion(null);
          d.setModalAnularOrden(true);
        }}
        onReaperturarOrden={d.handleAbrirReaperturarOrden}
        onActualizarObservacion={d.handleActualizarObservacionCancelacion}
        onEditarAfiliado={d.handleEditarAfiliadoDeOrden}
      />

      <ReaperturarOrdenModal
        isOpen={d.modalReaperturarOrden}
        orden={d.ordenAReaperturar || d.ordenSeleccionada}
        tecnicos={d.tecnicos}
        onClose={() => {
          d.setModalReaperturarOrden(false);
          d.setOrdenAReaperturar(null);
        }}
        onConfirmar={d.handleConfirmarReapertura}
        reaperturando={d.reaperturando}
        error={d.errorReapertura}
      />

      <AnularOrdenModal
        isOpen={d.modalAnularOrden}
        orden={d.ordenSeleccionada}
        onClose={() => d.setModalAnularOrden(false)}
        onConfirmar={d.handleConfirmarAnulacion}
        anulando={d.anulando}
        error={d.errorAnulacion}
      />

      <TecnicoFormModal
        isOpen={d.modalNuevoTecnico}
        modo="crear"
        especialidades={d.especialidades}
        cargandoEspecialidades={d.cargandoEspecialidades}
        submitting={d.submitting}
        error={d.formError}
        onClose={() => d.setModalNuevoTecnico(false)}
        onCrear={d.handleCrearTecnico}
      />

      <TecnicoFormModal
        isOpen={d.modalEditarTecnico}
        modo="editar"
        tecnicoAEditar={d.tecnicoAEditar}
        especialidades={d.especialidades}
        cargandoEspecialidades={d.cargandoEspecialidades}
        submitting={d.submitting}
        error={d.formError}
        onClose={() => {
          d.setModalEditarTecnico(false);
          d.setTecnicoAEditar(null);
        }}
        onGuardarEdicion={d.handleGuardarEditarTecnico}
        onToggleEstado={d.handleToggleEstadoTecnico}
        togglingId={d.togglingTecnicoId}
      />

      <EspecialidadesModal
        isOpen={d.modalNuevaEspecialidad}
        onClose={() => d.setModalNuevaEspecialidad(false)}
        onEspecialidadesCambiadas={d.recargarEspecialidades}
        onCrearEspecialidad={d.handleCrearEspecialidad}
        guardando={d.guardandoEspecialidad}
      />

      <CuentasModal
        isOpen={d.modalGestionCuentas}
        onClose={() => d.setModalGestionCuentas(false)}
        onCuentasCambiadas={d.recargarCuentas}
      />

      <CatalogoMaterialesModal
        isOpen={d.modalGestionMateriales}
        onClose={() => d.setModalGestionMateriales(false)}
        especialidadPreseleccionada={d.nuevaOrden.tipoServicio}
      />

      <PerfilAdminModal
        isOpen={d.modalPerfilAdmin}
        onClose={() => d.setModalPerfilAdmin(false)}
        user={user}
        onLogout={onLogout}
      />

      <AfiliadoFormModal
        isOpen={d.modalNuevoAfiliado}
        onClose={() => {
          d.setModalNuevoAfiliado(false);
          d.setAfiliadoAEditar(null);
        }}
        onSubmit={d.handleCrearAfiliado}
        onEditar={d.handleGuardarEditarAfiliado}
        afiliadoAEditar={d.afiliadoAEditar}
        submitting={d.submitting}
        error={d.formError}
      />

      {d.mostrarHojaServicio && d.ordenSeleccionada && (
        <HojaServicioModal
          orden={d.ordenSeleccionada}
          onClose={() => d.setMostrarHojaServicio(false)}
        />
      )}
    </>
  );
};
