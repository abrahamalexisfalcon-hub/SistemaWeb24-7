import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminBottomNav, AdminSidebar } from '../../components/admin';
import { useAdminDashboard } from './useAdminDashboard';
import { OrdenesTab, TecnicosTab, NuevaOrdenTab, ClientesTab, ReportesTab } from './tabs';
import { AdminModals } from './modals';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const d = useAdminDashboard();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ordenesPendientesCount = (d.ordenes || []).filter(
    (o) => o && (o.estado === 'PENDIENTE' || o.estado === 'EN_DOMICILIO')
  ).length;

  const renderActiveTab = () => {
    switch (d.activeTab) {
      case 'ordenes':
        return (
          <OrdenesTab
            ordenes={d.ordenes}
            loading={d.loading}
            isFetching={d.isFetching}
            busqueda={d.busqueda}
            onBusquedaChange={d.setBusqueda}
            filtroActivo={d.filtroActivo}
            onFiltroChange={d.setFiltroActivo}
            onSelectOrden={d.setOrdenSeleccionada}
            onReaperturarOrden={d.handleAbrirReaperturarOrden}
            onOpenPerfil={() => d.setModalPerfilAdmin(true)}
          />
        );
      case 'tecnicos':
        return (
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
        );
      case 'nuevo':
        return (
          <NuevaOrdenTab
            nuevaOrden={d.nuevaOrden}
            onNuevaOrdenChange={d.setNuevaOrden}
            especialidades={d.especialidades}
            cargandoEspecialidades={d.cargandoEspecialidades}
            cuentas={d.cuentas}
            cargandoCuentas={d.cargandoCuentas}
            afiliados={d.afiliados}
            tecnicos={d.tecnicos}
            submitting={d.submitting}
            formError={d.formError}
            formExito={d.formExito}
            onSubmit={d.handleCrearOrden}
            onAbrirNuevoAfiliado={() => {
              d.setAfiliadoAEditar(null);
              d.setFormError(null);
              d.setModalNuevoAfiliado(true);
            }}
            onAbrirMateriales={() => d.setModalGestionMateriales(true)}
            onAbrirEspecialidades={() => d.setModalNuevaEspecialidad(true)}
            onAbrirCuentas={() => d.setModalGestionCuentas(true)}
          />
        );
      case 'clientes':
        return (
          <ClientesTab
            afiliados={d.afiliados}
            onNuevoAfiliado={() => {
              d.setAfiliadoAEditar(null);
              d.setFormError(null);
              d.setModalNuevoAfiliado(true);
            }}
            onEditarAfiliado={(afiliado) => {
              d.setAfiliadoAEditar(afiliado);
              d.setFormError(null);
              d.setModalNuevoAfiliado(true);
            }}
            onEliminarAfiliado={d.handleEliminarAfiliado}
          />
        );
      case 'reportes':
        return <ReportesTab ordenes={d.ordenes} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 w-full flex">
      {/* 1. Sidebar lateral fijo a la izquierda: visible únicamente en escritorio (>= lg) */}
      <AdminSidebar
        activeTab={d.activeTab}
        onTabChange={d.setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenPerfil={() => d.setModalPerfilAdmin(true)}
        ordenesPendientesCount={ordenesPendientesCount}
        onRefresh={d.refrescarManual}
        isRefreshing={d.isFetching}
      />

      {/* 2. Área de contenido principal 100% responsiva */}
      <div className="flex-1 min-w-0 min-h-screen flex flex-col justify-between w-full overflow-x-hidden">
        {/* Móvil/Tablet (< lg): max-w-3xl centrado sin franjas excesivas. Escritorio (>= lg): fluido con p-6 xl:p-10 */}
        <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24 lg:max-w-none lg:mx-0 lg:p-6 xl:p-10 flex-1 flex flex-col min-w-0 overflow-y-auto">
          {renderActiveTab()}
        </main>

        {/* 3. Navegación inferior fija: visible únicamente en móvil y tablet (< lg) */}
        <div className="block lg:hidden">
          <AdminBottomNav activeTab={d.activeTab} onTabChange={d.setActiveTab} />
        </div>
      </div>

      {/* 4. Modales del panel de administración */}
      <AdminModals
        d={d}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AdminDashboard;
