/**
 * test-e2e.mjs
 * Pruebas E2E Integradas entre Frontend (Vite PWA :5173) y Backend (Spring Boot :8080)
 * 24/7 Asistencias
 */

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runE2ETests() {
  console.log('\n===============================================================');
  console.log('🚀 INICIANDO PRUEBAS E2E INTEGRADAS (FRONTEND + BACKEND 24/7)');
  console.log(`   Backend:  ${BACKEND_URL}`);
  console.log('===============================================================\n');

  let adminToken = null;
  let adminHeaders = null;
  let nuevaEspId = null;
  let nuevoTecnicoId = null;
  let tempAfiliadoE2EId = null;
  let ordenId = null;
  let ordenCancelarId = null;

  try {
    // -------------------------------------------------------------
    // FASE 1: FRONTEND PWA & SERVIDOR WEB VITE CON REVERSE PROXY
    // -------------------------------------------------------------
    console.log('📦 FASE 1: Salud y Recursos del Frontend (PWA / SPA / Proxy)');
    
    // 1.1 Root HTML
    const feRes = await request(`${FRONTEND_URL}/`);
    assert(feRes.status === 200, 'Frontend responde HTTP 200 en la raíz');
    assert(typeof feRes.data === 'string' && feRes.data.includes('<div id="root"></div>'), 'Frontend entrega el contenedor SPA #root');
    assert(typeof feRes.data === 'string' && feRes.data.includes('manifest.webmanifest'), 'Frontend referencia el Web App Manifest PWA');

    // 1.2 Integración Reverse Proxy Frontend -> Backend
    const proxyRes = await request(`${FRONTEND_URL}/api/especialidades`);
    assert(proxyRes.status === 200, 'Vite Proxy inverso (Frontend :5173 -> Backend :8080) responde HTTP 200');
    assert(Array.isArray(proxyRes.data) && proxyRes.data.length > 0, 'Vite Proxy entrega catálogo dinámico del Backend a través del puerto del Frontend');

    // 1.3 Logo Oficial
    const logoRes = await request(`${FRONTEND_URL}/src/assets/Logo_negro.png`);
    assert(logoRes.status === 200, 'El activo estático del Logo Oficial responde HTTP 200');

    // -------------------------------------------------------------
    // FASE 2: AUTENTICACIÓN Y SEGURIDAD JWT (BACKEND REST)
    // -------------------------------------------------------------
    console.log('\n🔐 FASE 2: Autenticación y Autorización por Roles (JWT)');

    // 2.1 Login con credenciales incorrectas
    const badLoginRes = await request(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'falso@asistencias247.com', password: 'clave-erronea' }),
    });
    assert(badLoginRes.status === 401 || badLoginRes.status === 403, 'Rechazo seguro de credenciales inválidas (401/403)');

    // 2.2 Login Administrador
    const adminLoginRes = await request(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@asistencias247.com', password: 'admin123' }),
    });
    assert(adminLoginRes.status === 200, 'Login Administrador exitoso (HTTP 200)');
    assert(adminLoginRes.data.token && typeof adminLoginRes.data.token === 'string', 'Token JWT emitido para Administrador');
    assert(adminLoginRes.data.rol === 'ADMINISTRADOR', 'Rol confirmado como ADMINISTRADOR');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${adminToken}`,
    };

    // 2.3 Login Técnico
    const tecnicoLoginRes = await request(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'tecnico@asistencias247.com', password: 'tecnico123' }),
    });
    assert(tecnicoLoginRes.status === 200, 'Login Técnico exitoso (HTTP 200)');
    assert(tecnicoLoginRes.data.token && typeof tecnicoLoginRes.data.token === 'string', 'Token JWT emitido para Técnico');
    assert(tecnicoLoginRes.data.rol === 'TECNICO', 'Rol confirmado como TECNICO');
    const tecnicoToken = tecnicoLoginRes.data.token;
    const tecnicoHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${tecnicoToken}`,
    };

    // -------------------------------------------------------------
    // FASE 3: CONSUMO 100% DINÁMICO DE ESPECIALIDADES (CERO HARDCODING)
    // -------------------------------------------------------------
    console.log('\n🏷️ FASE 3: Catálogo Dinámico de Especialidades (Cero Hardcoding)');

    // 3.1 Consulta pública de especialidades
    const espListRes = await request(`${BACKEND_URL}/especialidades`);
    assert(espListRes.status === 200, 'GET /api/especialidades responde HTTP 200');
    assert(Array.isArray(espListRes.data) && espListRes.data.length > 0, `Catálogo de especialidades contiene ${espListRes.data.length} ítems activos`);

    // 3.2 Creación dinámica de nueva especialidad desde panel de administración
    const nombreEspTest = `Carpintería E2E ${Date.now() % 10000}`;
    const crearEspRes = await request(`${BACKEND_URL}/admin/especialidades`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ nombre: nombreEspTest }),
    });
    assert(crearEspRes.status === 201, `POST /api/admin/especialidades crea '${nombreEspTest}' con HTTP 201`);
    assert(crearEspRes.data.id && crearEspRes.data.nombre === nombreEspTest, 'La especialidad creada retorna ID y nombre fiel');
    const nuevaEspId = crearEspRes.data.id;

    // 3.3 Verificación en listado general
    const espListActualizado = await request(`${BACKEND_URL}/especialidades`);
    const encontrada = espListActualizado.data.some(e => e.id === nuevaEspId && e.nombre === nombreEspTest);
    assert(encontrada, `La nueva especialidad '${nombreEspTest}' se refleja de inmediato en GET /api/especialidades`);

    // 3.4 Prevención de duplicados
    const dupEspRes = await request(`${BACKEND_URL}/admin/especialidades`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ nombre: nombreEspTest }),
    });
    assert(dupEspRes.status === 400, 'Validación de unicidad: rechaza duplicados con HTTP 400');

    // 3.5 Edición y Baja Lógica (CRUD Completo de Especialidades)
    const nombreTempOriginal = `Seguridad y Alarmas ${Date.now()}`;
    const crearTempRes = await request(`${BACKEND_URL}/admin/especialidades`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ nombre: nombreTempOriginal }),
    });
    assert(crearTempRes.status === 201, 'Creación de especialidad temporal para ciclo CRUD completo (HTTP 201)');
    const idTemp = crearTempRes.data.id;

    // Actualizar nombre
    const nombreTempEditado = `Seguridad Electrónica ${Date.now()}`;
    const editTempRes = await request(`${BACKEND_URL}/admin/especialidades/${idTemp}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ nombre: nombreTempEditado }),
    });
    assert(editTempRes.status === 200, 'PUT /api/admin/especialidades/{id} actualiza nombre con HTTP 200');
    assert(editTempRes.data.nombre === nombreTempEditado, 'Nombre actualizado devuelto correctamente');

    // Baja lógica (DELETE)
    const delTempRes = await request(`${BACKEND_URL}/admin/especialidades/${idTemp}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(delTempRes.status === 200, 'DELETE /api/admin/especialidades/{id} realiza baja lógica con HTTP 200');

    // Verificar que ya no aparece en el listado activo
    const listaTrasDelete = await request(`${BACKEND_URL}/especialidades`);
    const siguePresente = listaTrasDelete.data.some(e => e.id === idTemp);
    assert(!siguePresente, 'Especialidad dada de baja lógica no figura en GET /api/especialidades');

    // -------------------------------------------------------------
    // FASE 4: GESTIÓN DE TÉCNICOS OPERATIVOS
    // -------------------------------------------------------------
    console.log('\n👷 FASE 4: Gestión de Técnicos Operativos (Admin)');

    // 4.1 Listado de técnicos
    const tecnicosRes = await request(`${BACKEND_URL}/admin/tecnicos`, { headers: adminHeaders });
    assert(tecnicosRes.status === 200, 'GET /api/admin/tecnicos responde HTTP 200');
    assert(Array.isArray(tecnicosRes.data), `Lista de técnicos recuperada con ${tecnicosRes.data.length} técnicos`);

    // 4.2 Alta de nuevo técnico con la especialidad dinámica creada
    const correoTecnicoNuevo = `tec_e2e_${Date.now()}@asistencias247.com`;
    const nuevoTecnicoBody = {
      nombreCompleto: 'Téc. Abraham Valdivia E2E',
      correo: correoTecnicoNuevo,
      telefono: '987654321',
      password: 'password123',
      especialidad: nombreEspTest,
    };
    const crearTecnicoRes = await request(`${BACKEND_URL}/admin/tecnicos`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(nuevoTecnicoBody),
    });
    assert(crearTecnicoRes.status === 201, 'POST /api/admin/tecnicos crea nuevo técnico con HTTP 201');
    assert(crearTecnicoRes.data.especialidad === nombreEspTest, `Técnico asociado fielmente a '${nombreEspTest}'`);
    const nuevoTecnicoId = crearTecnicoRes.data.id;

    // 4.3 Toggle Suspender Cuenta
    const suspenderRes = await request(`${BACKEND_URL}/admin/tecnicos/${nuevoTecnicoId}/estado`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ activo: false }),
    });
    assert(suspenderRes.status === 200, 'PATCH /admin/tecnicos/{id}/estado responde HTTP 200');
    assert(suspenderRes.data.activo === false, 'Cuenta del técnico suspendida con éxito (activo = false)');

    // 4.4 Toggle Reactivar Cuenta
    const reactivarRes = await request(`${BACKEND_URL}/admin/tecnicos/${nuevoTecnicoId}/estado`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ activo: true }),
    });
    assert(reactivarRes.status === 200, 'PATCH /admin/tecnicos/{id}/estado reactiva con HTTP 200');
    assert(reactivarRes.data.activo === true, 'Cuenta del técnico reactivada con éxito (activo = true)');

    // -------------------------------------------------------------
    // FASE 5: CICLO COMPLETO DE ÓRDENES DE SERVICIO
    // -------------------------------------------------------------
    console.log('\n📋 FASE 5: Ciclo de Vida E2E de Órdenes de Servicio');

    // 5.1 Obtener afiliados para asociar la orden
    const afiliadosRes = await request(`${BACKEND_URL}/admin/afiliados`, { headers: adminHeaders });
    assert(afiliadosRes.status === 200 && Array.isArray(afiliadosRes.data) && afiliadosRes.data.length > 0, 'Afiliados recuperados para registro de orden');
    const afiliadoId = afiliadosRes.data[0].id;

    // 5.2 Registrar Nueva Orden con la especialidad dinámica y el técnico creado
    const nuevaOrdenBody = {
      afiliadoId: afiliadoId,
      tecnicoId: nuevoTecnicoId,
      tipoServicio: nombreEspTest,
      descripcion: 'Prueba E2E Integral: Reparación y ajuste de puertas y muebles',
      direccion: 'Av. Las Palmas 450',
      distrito: 'San Isidro',
      referencia: 'Frente al parque olivar',
    };
    const crearOrdenRes = await request(`${BACKEND_URL}/admin/ordenes`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(nuevaOrdenBody),
    });
    assert(crearOrdenRes.status === 201, 'POST /api/admin/ordenes registra orden con HTTP 201');
    assert(crearOrdenRes.data.codigoOrden && crearOrdenRes.data.codigoOrden.startsWith('ORD-'), `Código correlativo autogenerado: ${crearOrdenRes.data.codigoOrden}`);
    assert(crearOrdenRes.data.estado === 'PENDIENTE', 'Estado inicial de la orden es PENDIENTE');
    ordenId = crearOrdenRes.data.id;

    // 5.3 Consulta de órdenes por Administrador (Validación de Datos Dinámicos)
    const ordenesAdminRes = await request(`${BACKEND_URL}/admin/ordenes`, { headers: adminHeaders });
    assert(ordenesAdminRes.status === 200, 'GET /api/admin/ordenes responde HTTP 200');
    const ordenRegistrada = ordenesAdminRes.data.find(o => o.id === ordenId);
    assert(Boolean(ordenRegistrada), 'La orden creada aparece en el listado del Administrador');
    assert(ordenRegistrada.tipoServicio === nombreEspTest, 'Especialidad dinámica reflejada en la orden');
    assert(ordenRegistrada.tecnico?.nombre === 'Téc. Abraham Valdivia E2E' || ordenRegistrada.nombreTecnico === 'Téc. Abraham Valdivia E2E', 'Nombre del técnico asignado se renderiza dinámicamente');

    // 5.4 Aislamiento y Privacidad: Consulta de órdenes por Técnico
    const ordenesTecnicoRes = await request(`${BACKEND_URL}/tecnico/ordenes/${nuevoTecnicoId}`, { headers: adminHeaders });
    assert(ordenesTecnicoRes.status === 200, 'GET /api/tecnico/ordenes/{tecnicoId} responde HTTP 200');
    const ordenParaTecnico = ordenesTecnicoRes.data.find(o => o.id === ordenId);
    assert(Boolean(ordenParaTecnico), 'La orden asignada aparece en la bandeja operativa del técnico');
    assert(ordenParaTecnico.telefono === undefined, 'PRIVACIDAD ESTRICTA: El teléfono del afiliado NO se expone al técnico');

    // 5.5 Flujo Técnico: Confirmar Llegada al Domicilio
    const llegadaRes = await request(`${BACKEND_URL}/tecnico/ordenes/${ordenId}/llegada`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    assert(llegadaRes.status === 200, 'PATCH /api/tecnico/ordenes/{id}/llegada responde HTTP 200');
    assert(llegadaRes.data.estado === 'EN_DOMICILIO', 'Estado de la orden avanza a EN_DOMICILIO');

    // 5.6 Flujo Técnico: Cierre y Generación de Hoja de Servicio
    const cierreBody = {
      evaluacionAveria: 'Se detectaron bisagras desgastadas y desalineación estructural.',
      detalleSolucion: 'Se reemplazaron 4 bisagras de copa y se nivelaron las puertas con tornillos reforzados.',
      sugerencias: 'Evitar sobrepeso en repisas superiores y lubricar cada 6 meses.',
      calificacion: 5,
      califPuntualidad: 5,
      califSolucion: 5,
      firmaDigitalUrl: 'https://res.cloudinary.com/asistencias/image/upload/v1/firmas/firma_test.png',
      materiales: [
        {
          materialId: null,
          descripcion: 'Bisagras de copa 35mm (Otro)',
          cantidad: 4,
        },
      ],
    };
    const cerrarRes = await request(`${BACKEND_URL}/tecnico/ordenes/${ordenId}/cerrar`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(cierreBody),
    });
    assert(cerrarRes.status === 200 || cerrarRes.status === 201, 'POST /api/tecnico/ordenes/{id}/cerrar responde HTTP 200/201 (Creado)');
    assert(cerrarRes.data.estado === 'FINALIZADA', 'Estado final de la orden es FINALIZADA');

    // 5.7 Verificación de Inmutabilidad de Órdenes Finalizadas
    const cancelarFinalizadaRes = await request(`${BACKEND_URL}/admin/ordenes/${ordenId}/cancelar`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ motivo: 'Intento indebido de cancelar orden finalizada' }),
    });
    assert(cancelarFinalizadaRes.status === 400, 'REGLA DE NEGOCIO: No se permite anular orden con Hoja de Servicio firmada (HTTP 400)');

    // -------------------------------------------------------------
    // FASE 6: ANULACIÓN DE ÓRDENES PENDIENTES (SOFT DELETE CON MOTIVO)
    // -------------------------------------------------------------
    console.log('\n🚫 FASE 6: Anulación de Orden Pendiente (Soft Delete con Motivo)');

    // 6.1 Crear orden para cancelar
    const ordenParaCancelarRes = await request(`${BACKEND_URL}/admin/ordenes`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        afiliadoId: afiliadoId,
        tecnicoId: nuevoTecnicoId,
        tipoServicio: nombreEspTest,
        descripcion: 'Orden de prueba para anulación controlada',
        direccion: 'Calle Los Sauces 123',
        distrito: 'Surco',
      }),
    });
    ordenCancelarId = ordenParaCancelarRes.data.id;
    assert(ordenParaCancelarRes.status === 201, 'Orden temporal para cancelación creada con HTTP 201');

    // 6.2 Cancelar con motivo
    const motivoCancelacion = 'Afiliado reprogramó el servicio para otra fecha por viaje.';
    const cancelarValidaRes = await request(`${BACKEND_URL}/admin/ordenes/${ordenCancelarId}/cancelar`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ motivo: motivoCancelacion }),
    });
    assert(cancelarValidaRes.status === 200, 'PATCH /api/admin/ordenes/{id}/cancelar responde HTTP 200');
    assert(cancelarValidaRes.data.estado === 'CANCELADA', 'Estado de la orden cambia a CANCELADA');
    assert(cancelarValidaRes.data.motivoCancelacion === motivoCancelacion, 'Motivo de cancelación registrado correctamente');
    assert(Boolean(cancelarValidaRes.data.fechaCancelacion), 'Fecha y hora de cancelación estampada automáticamente');

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // FASE 8: CRUD DE MATERIALES POR ESPECIALIDAD & CATÁLOGO
    // -------------------------------------------------------------
    console.log('\n📦 FASE 8: Catálogo y CRUD de Materiales/Repuestos por Especialidad');

    // 8.1 Listado público de materiales activos
    const matListRes = await request(`${BACKEND_URL}/materiales`);
    assert(matListRes.status === 200, 'GET /api/materiales responde HTTP 200');
    assert(Array.isArray(matListRes.data), 'GET /api/materiales retorna lista de materiales');
    assert(matListRes.data.every(m => m.activo === true), 'Todos los materiales listados están activos');

    // 8.2 Filtrado por nombre de especialidad
    let espFiltroNombre = encodeURIComponent(nombreEspTest);
    let espMaterialId = nuevaEspId;
    if (matListRes.data.length > 0 && matListRes.data[0].especialidadNombre) {
      espFiltroNombre = encodeURIComponent(matListRes.data[0].especialidadNombre);
      espMaterialId = matListRes.data[0].especialidadId || nuevaEspId;
    }
    const matClimaRes = await request(`${BACKEND_URL}/materiales?especialidadNombre=${espFiltroNombre}`);
    assert(matClimaRes.status === 200, 'GET /api/materiales?especialidadNombre responde HTTP 200');
    assert(Array.isArray(matClimaRes.data), 'Materiales filtrados por especialidad responden correctamente');
    assert(matClimaRes.data.every(m => m.activo === true), 'Todos los materiales filtrados están activos');

    // 8.3 Creación de nuevo material administrativo
    const nuevoMatRes = await request(`${BACKEND_URL}/admin/materiales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        nombre: 'Material E2E Test ' + Date.now(),
        unidad: 'Unidad',
        especialidadId: espMaterialId,
      }),
    });
    assert(nuevoMatRes.status === 201, 'POST /api/admin/materiales responde HTTP 201 Created');
    assert(Boolean(nuevoMatRes.data.id), 'Nuevo material recibe ID auto-incremental');
    const nuevoMatId = nuevoMatRes.data.id;

    // 8.4 Actualización de material
    const nombreActualizado = 'Material E2E Test Pro ' + Date.now();
    const matActualizadoRes = await request(`${BACKEND_URL}/admin/materiales/${nuevoMatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        nombre: nombreActualizado,
        unidad: 'Kit',
        especialidadId: espMaterialId,
        activo: true,
      }),
    });
    assert(matActualizadoRes.status === 200, 'PUT /api/admin/materiales/{id} responde HTTP 200');
    assert(matActualizadoRes.data.unidad === 'Kit', 'Unidad de medida actualizada a Kit');
    assert(matActualizadoRes.data.nombre === nombreActualizado, 'Nombre de material actualizado correctamente');

    // 8.5 Eliminación (Soft-delete)
    const matEliminarRes = await request(`${BACKEND_URL}/admin/materiales/${nuevoMatId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(matEliminarRes.status === 200, 'DELETE /api/admin/materiales/{id} responde HTTP 200');

    // 8.6 Verificar que el material eliminado ya no aparece en activos
    const matVerifRes = await request(`${BACKEND_URL}/materiales?especialidadId=${espMaterialId}`);
    assert(matVerifRes.data.every(m => m.id !== nuevoMatId), 'Material desactivado no figura en el catálogo de materiales activos');

    // 8.7 Proxy inverso Frontend -> Backend para materiales
    const matProxyRes = await request(`${FRONTEND_URL}/api/materiales`);
    assert(matProxyRes.status === 200, 'Vite Proxy entrega /api/materiales a través de puerto :5173');

    // -------------------------------------------------------------
    // FASE 9: CRUD COMPLETO DE CLIENTES AFILIADOS (SPRING BOOT + POSTGRESQL)
    // -------------------------------------------------------------
    console.log('\n👥 FASE 9: CRUD Completo de Clientes Afiliados (Spring Boot + PostgreSQL)');

    // 9.1 Listado inicial de afiliados
    const listaAfiliadosRes = await request(`${BACKEND_URL}/clientes`, { headers: adminHeaders });
    assert(listaAfiliadosRes.status === 200, 'GET /api/clientes responde HTTP 200 para ADMINISTRADOR');
    assert(Array.isArray(listaAfiliadosRes.data), 'GET /api/clientes retorna listado de afiliados activos');
    assert(listaAfiliadosRes.data.every(c => c.activo === true), 'Todos los afiliados listados tienen activo = true');

    // 9.2 Alta de nuevo afiliado vía POST /api/clientes
    const dniTest = '7' + Math.floor(1000000 + Math.random() * 9000000);
    const nuevoClienteBody = {
      nombreCompleto: 'Carlos Mendoza Ramos E2E',
      dni: dniTest,
      telefono: '988112233',
      direccion: 'Av. Paseo de la República 345',
      distrito: 'Miraflores',
      referencia: 'Cerca a la estación Benavides',
    };
    const crearClienteRes = await request(`${BACKEND_URL}/clientes`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(nuevoClienteBody),
    });
    assert(crearClienteRes.status === 201, 'POST /api/clientes registra nuevo afiliado con HTTP 201');
    assert(Boolean(crearClienteRes.data.id), 'Nuevo afiliado recibe ID auto-incremental');
    assert(crearClienteRes.data.dni === dniTest, 'DNI asignado fielmente');
    const clienteId = crearClienteRes.data.id;

    // 9.3 Validación de unicidad de DNI (HTTP 400)
    const dupDniRes = await request(`${BACKEND_URL}/clientes`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        nombreCompleto: 'Duplicado Test',
        dni: dniTest,
        telefono: '911223344',
        direccion: 'Calle Falsa 123',
        distrito: 'Lima',
      }),
    });
    assert(dupDniRes.status === 400, 'Validación de unicidad: rechaza DNI duplicado activo con HTTP 400');

    // 9.4 Búsqueda en tiempo real por DNI (?query=...)
    const queryDniRes = await request(`${BACKEND_URL}/clientes?query=${dniTest}`, { headers: adminHeaders });
    assert(queryDniRes.status === 200, 'GET /api/clientes?query={dni} responde HTTP 200');
    assert(queryDniRes.data.some(c => c.id === clienteId), 'Búsqueda por DNI localiza al afiliado creado');

    // 9.5 Búsqueda en tiempo real por Nombre (?query=...)
    const queryNomRes = await request(`${BACKEND_URL}/clientes?query=Mendoza`, { headers: adminHeaders });
    assert(queryNomRes.status === 200, 'GET /api/clientes?query={nombre} responde HTTP 200');
    assert(queryNomRes.data.some(c => c.id === clienteId), 'Búsqueda por nombre parcial localiza al afiliado');

    // 9.6 Actualización vía PUT /api/clientes/{id}
    const updateRes = await request(`${BACKEND_URL}/clientes/${clienteId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        nombreCompleto: 'Carlos Mendoza Ramos Actualizado',
        telefono: '912345678',
        direccion: 'Av. Las Palmeras 555 Int 2',
        distrito: 'San Isidro',
      }),
    });
    assert(updateRes.status === 200, 'PUT /api/clientes/{id} responde HTTP 200');
    assert(updateRes.data.nombreCompleto === 'Carlos Mendoza Ramos Actualizado', 'Nombre del afiliado actualizado correctamente');
    assert(updateRes.data.telefono === '912345678', 'Teléfono actualizado correctamente');

    // 9.7 Baja lógica vía DELETE /api/clientes/{id}
    const deleteRes = await request(`${BACKEND_URL}/clientes/${clienteId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(deleteRes.status === 200, 'DELETE /api/clientes/{id} responde HTTP 200');

    // 9.8 Verificar exclusión del listado activo
    const listaTrasBaja = await request(`${BACKEND_URL}/clientes`, { headers: adminHeaders });
    assert(listaTrasBaja.data.every(c => c.id !== clienteId), 'Afiliado dado de baja no figura en el padrón activo de clientes');

    // -------------------------------------------------------------
    // FASE 10: LIMPIEZA AUTOMÁTICA (CLEANUP) DE REGISTROS TEMPORALES E2E
    // -------------------------------------------------------------
    console.log('\n🧹 FASE 10: Limpieza Automática de Registros Temporales E2E');

    // 10.1 Baja lógica de la especialidad temporal creada
    if (nuevaEspId) {
      const delEsp = await request(`${BACKEND_URL}/admin/especialidades/${nuevaEspId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      assert(delEsp.status === 200, 'Limpieza E2E: Especialidad temporal dada de baja con éxito');
    }

    // 10.2 Desactivación del técnico temporal creado
    if (nuevoTecnicoId) {
      const delTec = await request(`${BACKEND_URL}/admin/tecnicos/${nuevoTecnicoId}/estado`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ activo: false }),
      });
      assert(delTec.status === 200, 'Limpieza E2E: Técnico temporal desactivado con éxito');
    }

    // 10.3 Baja lógica del afiliado temporal si fue creado para el ciclo de orden
    if (tempAfiliadoE2EId) {
      const delAf = await request(`${BACKEND_URL}/clientes/${tempAfiliadoE2EId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      assert(delAf.status === 200, 'Limpieza E2E: Afiliado temporal dado de baja con éxito');
    }

    // 10.4 Eliminación de órdenes temporales creadas durante las pruebas
    if (ordenCancelarId) {
      const delOrdCan = await request(`${BACKEND_URL}/admin/ordenes/${ordenCancelarId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      assert(delOrdCan.status === 204 || delOrdCan.status === 200, 'Limpieza E2E: Orden cancelada temporal eliminada con éxito');
    }

    if (ordenId) {
      const delOrd = await request(`${BACKEND_URL}/admin/ordenes/${ordenId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      assert(delOrd.status === 204 || delOrd.status === 200, 'Limpieza E2E: Orden finalizada temporal eliminada con éxito');
    }

  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO DURANTE LA EJECUCIÓN E2E:', error);
    failedTests++;
  }

  // -------------------------------------------------------------
  // REPORTE FINAL
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 REPORTE DE RESULTADOS DE PRUEBAS E2E INTEGRADAS');
  console.log('===============================================================');
  console.log(`  Total de Aserciones: ${totalTests}`);
  console.log(`  Pruebas Exitosas:    ${passedTests} ✅`);
  console.log(`  Pruebas Fallidas:    ${failedTests} ❌`);
  console.log(`  Tasa de Éxito:       ${((passedTests / (totalTests || 1)) * 100).toFixed(1)}%`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests();
