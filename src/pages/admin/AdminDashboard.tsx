import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminBottomNav } from '../../components/admin';
import { useAdminDashboard } from './useAdminDashboard';
import { OrdenesTab, TecnicosTab, NuevaOrdenTab, ClientesTab, ReportesTab } from './tabs';
import { AdminModals } from './modals';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const d = useAdminDashboard();

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-between">
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#f1f5f9] pb-24 relative shadow-xl flex flex-col">
        {d.activeTab === 'ordenes' && (
          <OrdenesTab
            ordenes={d.ordenes}
            loading={d.loading}
            isFetching={d.isFetching}
            busqueda={d.busqueda}
            onBusquedaChange={d.setBusqueda}
            filtroActivo={d.filtroActivo}
            onFiltroChange={d.setFiltroActivo}
            onSelectOrden={d.setOrdenSeleccionada}
            onOpenPerfil={() => d.setModalPerfilAdmin(true)}
          />
        )}

        {d.activeTab === 'tecnicos' && (
          <TecnicosTab
            tecnicos={d.tecnicos}
            ordenes={d.ordenes}
            onNuevoTecnico={() => {
              d.setFormError(null);
              d.setModalNuevoTecnico(true);
            }}
            onEditarTecnico={(tec) => {
              d.setTecnicoAEditar(tec);
              d.setFormError(null);
              d.setModalEditarTecnico(true);
            }}
          />
        )}

        {d.activeTab === 'nuevo' && (
          <NuevaOrdenTab
            nuevaOrden={d.nuevaOrden}
            onNuevaOrdenChange={d.setNuevaOrden}
            especialidades={d.especialidades}
            cargandoEspecialidades={d.cargandoEspecialidades}
            afiliados={d.afiliados}
            tecnicos={d.tecnicos}
            submitting={d.submitting}
            formError={d.formError}
            formExito={d.formExito}
            onSubmit={d.handleCrearOrden}
            onAbrirNuevoAfiliado={() => d.setModalNuevoAfiliado(true)}
            onAbrirMateriales={() => d.setModalGestionMateriales(true)}
            onAbrirEspecialidades={() => d.setModalNuevaEspecialidad(true)}
          />
        )}

        {d.activeTab === 'clientes' && (
          <ClientesTab
            afiliados={d.afiliados}
            onNuevoAfiliado={() => d.setModalNuevoAfiliado(true)}
          />
        )}

        {d.activeTab === 'reportes' && <ReportesTab ordenes={d.ordenes} />}

        <AdminBottomNav activeTab={d.activeTab} onTabChange={d.setActiveTab} />

        <AdminModals
          d={d}
          user={user}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
