// ==================== ALMACENAMIENTO LOCAL ====================
const STORAGE_KEY = 'sc_tracker';

function obtenerOrdenes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function guardarOrdenes(ordenes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenes));
}

function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Estado global
let ordenes = [];
let ordenEliminar = null;
let editandoId = null;

// ==================== CÁLCULOS AUTOMÁTICOS ====================
function calcularSCAging(fechaStart) {
    if (!fechaStart) return '';
    const inicio = new Date(fechaStart + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diff = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + ' días' : '0 días';
}

function calcularPickupDate() {
    const poDate = document.getElementById('poCreatedDate').value;
    const fabDays = parseInt(document.getElementById('fabLeadTime').value) || 0;
    if (!poDate || fabDays === 0) {
        document.getElementById('calcPickupDate').value = '';
        return;
    }
    const fecha = new Date(poDate + 'T00:00:00');
    fecha.setDate(fecha.getDate() + fabDays);
    document.getElementById('calcPickupDate').value = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcularReceiveDate() {
    const poDate = document.getElementById('poCreatedDate').value;
    const fabDays = parseInt(document.getElementById('fabLeadTime').value) || 0;
    const freightDays = parseInt(document.getElementById('freightDays').value) || 0;
    if (!poDate || (fabDays === 0 && freightDays === 0)) {
        document.getElementById('calcReceiveDate').value = '';
        return;
    }
    const fecha = new Date(poDate + 'T00:00:00');
    fecha.setDate(fecha.getDate() + fabDays + freightDays);
    document.getElementById('calcReceiveDate').value = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcularRealReceiveDate() {
    const realPickup = document.getElementById('realPickupDate').value;
    const freightDays = parseInt(document.getElementById('freightDays').value) || 0;
    if (!realPickup || freightDays === 0) {
        document.getElementById('realReceiveDate').value = '';
        calcularETAELP();
        return;
    }
    const fecha = new Date(realPickup + 'T00:00:00');
    fecha.setDate(fecha.getDate() + freightDays);
    document.getElementById('realReceiveDate').value = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    calcularETAELP();
}

function calcularETAELP() {
    document.getElementById('etaElp').value = document.getElementById('realReceiveDate').value;
}

function calcularAvance() {
    const campos = ['avMOC', 'avSOW', 'avAltaProv', 'avSCUser', 'avCompras', 'avTrafico', 'avBUWC', 'avEHS', 'avFixedAsset', 'avFinance', 'avRegional', 'avTOP'];
    const total = campos.length;
    let ok = 0;
    let ip = 0;
    let na = 0;
    campos.forEach(id => {
        const val = document.getElementById(id).value;
        if (val === 'OK') ok++;
        else if (val === 'IP') ip++;
        else if (val === 'NA') na++;
    });
    const pct = Math.round(((ok + na + ip * 0.5) / total) * 100);
    document.getElementById('avanceFill').style.width = pct + '%';
    document.getElementById('avancePct').textContent = pct + '%';
}

// Event listeners para cálculos
document.getElementById('poCreatedDate').addEventListener('change', () => { calcularPickupDate(); calcularReceiveDate(); });
document.getElementById('fabLeadTime').addEventListener('input', () => { calcularPickupDate(); calcularReceiveDate(); });
document.getElementById('freightDays').addEventListener('input', () => { calcularReceiveDate(); calcularRealReceiveDate(); });
document.getElementById('realPickupDate').addEventListener('change', calcularRealReceiveDate);

// Event listeners para avance
['avMOC', 'avSOW', 'avAltaProv', 'avSCUser', 'avCompras', 'avTrafico', 'avBUWC', 'avEHS', 'avFixedAsset', 'avFinance', 'avRegional', 'avTOP'].forEach(id => {
    document.getElementById(id).addEventListener('change', calcularAvance);
});

// ==================== TABS ====================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

function resetTabs() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab').classList.add('active');
    document.getElementById('tab-sc').classList.add('active');
}

// ==================== NAVEGACIÓN ====================
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const pageTitle = document.getElementById('pageTitle');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

function switchView(viewName) {
    views.forEach(v => v.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    const viewId = 'view' + viewName.charAt(0).toUpperCase() + viewName.slice(1);
    const view = document.getElementById(viewId);
    if (view) view.classList.add('active');
    const navItem = document.querySelector(`[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add('active');
    const titles = { dashboard: 'Dashboard', ordenes: 'SC / PO', nueva: 'Nueva SC' };
    pageTitle.textContent = titles[viewName] || 'Dashboard';
    if (viewName === 'dashboard') cargarDashboard();
    if (viewName === 'ordenes') cargarTabla();
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(item.dataset.view);
        sidebar.classList.remove('open');
    });
});

menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
document.getElementById('btnNuevaOrden').addEventListener('click', () => { nuevoFormulario(); switchView('nueva'); });
document.getElementById('btnNuevaOrdenEmpty')?.addEventListener('click', () => { nuevoFormulario(); switchView('nueva'); });
document.getElementById('btnCancelar').addEventListener('click', () => { editandoId = null; switchView('ordenes'); });

function nuevoFormulario() {
    editandoId = null;
    document.getElementById('formTitle').textContent = ' Registrar Nueva SC';
    document.getElementById('formOrden').reset();
    document.getElementById('editarId').value = '';
    document.getElementById('startScDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('scAging').value = '';
    document.getElementById('calcPickupDate').value = '';
    document.getElementById('calcReceiveDate').value = '';
    document.getElementById('avanceFill').style.width = '0%';
    document.getElementById('avancePct').textContent = '0%';
    resetTabs();
}

// ==================== CARGAR DATOS ====================
function cargarOrdenes() {
    ordenes = obtenerOrdenes().sort((a, b) => new Date(b.start_sc_date || b.created_at) - new Date(a.start_sc_date || a.created_at));
    return ordenes;
}

// ==================== DASHBOARD ====================
function cargarDashboard() {
    cargarOrdenes();

    document.getElementById('statTotal').textContent = ordenes.length;
    document.getElementById('statOpen').textContent = ordenes.filter(o => o.status === 'Open').length;
    document.getElementById('statClose').textContent = ordenes.filter(o => o.status === 'Close').length;
    document.getElementById('statCancelled').textContent = ordenes.filter(o => o.status === 'Cancelled').length;

    const agings = ordenes.filter(o => o.start_sc_date).map(o => {
        const d = new Date(o.start_sc_date + 'T00:00:00');
        return Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
    });
    const avgAging = agings.length > 0 ? Math.round(agings.reduce((a, b) => a + b, 0) / agings.length) : 0;
    document.getElementById('statAvgAging').textContent = avgAging;

    // SC Open
    const containerRecientes = document.getElementById('scRecientes');
    const scOpen = ordenes.filter(o => o.status === 'Open');
    if (scOpen.length === 0) {
        containerRecientes.innerHTML = '<p class="empty-message">No hay SC abiertas</p>';
    } else {
        containerRecientes.innerHTML = scOpen.map(o => {
            const avance = calcularAvanceOrden(o);
            return `
                <div class="list-item list-item-block">
                    <div class="list-item-info">
                        <span class="list-item-title">${escapeHtml(o.sc)} ${o.supplier ? '- ' + escapeHtml(o.supplier) : ''}</span>
                        <span class="list-item-sub">${escapeHtml(o.customer || '')} - ${escapeHtml(o.equipment ? o.equipment.substring(0, 30) : '')}</span>
                        ${o.comments ? '<span class="list-item-comments">' + escapeHtml(o.comments.substring(0, 50)) + (o.comments.length > 50 ? '...' : '') + '</span>' : ''}
                    </div>
                    <div class="avance-inline">
                        <div class="mini-bar"><div class="mini-fill" style="width:${avance}%"></div></div>
                        <span class="mini-pct">${avance}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // SC con mayor aging
    const containerAging = document.getElementById('scAging');
    const conAging = ordenes.filter(o => o.start_sc_date && o.status === 'Open')
        .sort((a, b) => new Date(a.start_sc_date) - new Date(b.start_sc_date))
        .slice(0, 5);
    if (conAging.length === 0) {
        containerAging.innerHTML = '<p class="empty-message">No hay SC abiertas</p>';
    } else {
        containerAging.innerHTML = conAging.map(o => {
            const aging = calcularSCAging(o.start_sc_date);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <span class="list-item-title">${escapeHtml(o.sc)}</span>
                        <span class="list-item-sub">${escapeHtml(o.customer || '')}</span>
                    </div>
                    <span style="font-weight:600;color:var(--danger);font-size:0.85rem;">${aging}</span>
                </div>
            `;
        }).join('');
    }
}

// ==================== TABLA ====================
function cargarTabla() {
    cargarOrdenes();
    renderizarTabla(ordenes);
}

function renderizarTabla(data) {
    const tbody = document.getElementById('tablaBody');
    const emptyTable = document.getElementById('emptyTable');
    const table = document.getElementById('tablaOrdenes');

    if (data.length === 0) {
        table.style.display = 'none';
        emptyTable.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyTable.style.display = 'none';

    tbody.innerHTML = data.map(o => {
        const aging = calcularSCAging(o.start_sc_date);
        const avance = calcularAvanceOrden(o);
        return `
            <tr>
                <td><strong>${escapeHtml(o.sc)}</strong></td>
                <td>${escapeHtml(o.po_number || '-')}</td>
                <td>${escapeHtml(o.customer || '-')}</td>
                <td>${escapeHtml(o.supplier || '-')}</td>
                <td>${escapeHtml(o.equipment ? o.equipment.substring(0, 35) : '-')}${(o.equipment && o.equipment.length > 35) ? '...' : ''}</td>
                <td><span class="badge badge-${(o.status || 'open').toLowerCase()}">${escapeHtml(o.status)}</span></td>
                <td>${aging}</td>
                <td>${o.costo ? '$' + parseFloat(o.costo).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '-'}</td>
                <td>${formatDate(o.eta_elp)}</td>
                <td><div class="mini-bar"><div class="mini-fill" style="width:${avance}%"></div></div><span class="mini-pct">${avance}%</span></td>
                <td>
                    <button class="btn-icon" onclick="editarOrden('${o.id}')" title="Editar">&#9998;</button>
                    <button class="btn-icon" onclick="abrirEliminar('${o.id}', '${escapeHtml(o.sc)}')" title="Eliminar">&#128465;</button>
                </td>
            </tr>
        `;
    }).join('');
}

function calcularAvanceOrden(o) {
    const campos = [o.av_moc, o.av_sow, o.av_alta_prov, o.av_sc_user, o.av_compras, o.av_trafico, o.av_bu_wc, o.av_ehs, o.av_fixed_asset, o.av_finance, o.av_regional, o.av_top];
    const total = 12;
    let ok = 0, ip = 0, na = 0;
    campos.forEach(v => { if (v === 'OK') ok++; else if (v === 'IP') ip++; else if (v === 'NA') na++; });
    return Math.round(((ok + na + ip * 0.5) / total) * 100);
}

// Filtros
document.getElementById('searchInput').addEventListener('input', filtrarTabla);
document.getElementById('filterStatus').addEventListener('change', filtrarTabla);
document.getElementById('filterFreight').addEventListener('change', filtrarTabla);

function filtrarTabla() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const freight = document.getElementById('filterFreight').value;

    let filtradas = ordenes.filter(o => {
        const matchSearch = !search ||
            (o.sc && o.sc.toLowerCase().includes(search)) ||
            (o.po_number && o.po_number.toLowerCase().includes(search)) ||
            (o.customer && o.customer.toLowerCase().includes(search)) ||
            (o.supplier && o.supplier.toLowerCase().includes(search)) ||
            (o.equipment && o.equipment.toLowerCase().includes(search));
        const matchStatus = !status || o.status === status;
        const matchFreight = !freight || o.freight === freight;
        return matchSearch && matchStatus && matchFreight;
    });
    renderizarTabla(filtradas);
}

// ==================== CREAR / EDITAR ORDEN ====================
function obtenerDatosFormulario() {
    return {
        sc: document.getElementById('sc').value.trim(),
        customer: document.getElementById('customer').value.trim(),
        equipment: document.getElementById('equipment').value.trim(),
        start_sc_date: document.getElementById('startScDate').value,
        ep: document.getElementById('ep').value.trim() || null,
        status: document.getElementById('status').value,
        comments: document.getElementById('comments').value.trim() || null,
        po_number: document.getElementById('poNumber').value.trim() || null,
        supplier: document.getElementById('supplier').value.trim() || null,
        po_created_date: document.getElementById('poCreatedDate').value || null,
        costo: document.getElementById('costo').value ? parseFloat(document.getElementById('costo').value) : null,
        currency: document.getElementById('currency').value || null,
        notif_proveedor: document.getElementById('notifProveedor').checked,
        comments_po: document.getElementById('commentsPO').value.trim() || null,
        av_moc: document.getElementById('avMOC').value,
        av_sow: document.getElementById('avSOW').value,
        av_alta_prov: document.getElementById('avAltaProv').value,
        av_sc_user: document.getElementById('avSCUser').value,
        av_compras: document.getElementById('avCompras').value,
        av_trafico: document.getElementById('avTrafico').value,
        av_bu_wc: document.getElementById('avBUWC').value,
        av_ehs: document.getElementById('avEHS').value,
        av_fixed_asset: document.getElementById('avFixedAsset').value,
        av_finance: document.getElementById('avFinance').value,
        av_regional: document.getElementById('avRegional').value,
        av_top: document.getElementById('avTOP').value,
        freight: document.getElementById('freight').value || null,
        freight_days: document.getElementById('freightDays').value ? parseInt(document.getElementById('freightDays').value) : null,
        fab_lead_time: document.getElementById('fabLeadTime').value ? parseInt(document.getElementById('fabLeadTime').value) : null,
        real_pickup_date: document.getElementById('realPickupDate').value || null,
        real_receive_date: document.getElementById('realReceiveDate').value || null,
        eta_elp: document.getElementById('etaElp').value || null,
        challenge_date: document.getElementById('challengeDate').value || null,
        recieved_date: document.getElementById('recievedDate').value || null
    };
}

function llenarFormulario(o) {
    document.getElementById('editarId').value = o.id;
    document.getElementById('sc').value = o.sc || '';
    document.getElementById('customer').value = o.customer || '';
    document.getElementById('equipment').value = o.equipment || '';
    document.getElementById('startScDate').value = o.start_sc_date || '';
    document.getElementById('ep').value = o.ep || '';
    document.getElementById('status').value = o.status || 'Open';
    document.getElementById('comments').value = o.comments || '';
    document.getElementById('poNumber').value = o.po_number || '';
    document.getElementById('supplier').value = o.supplier || '';
    document.getElementById('poCreatedDate').value = o.po_created_date || '';
    document.getElementById('costo').value = o.costo || '';
    document.getElementById('currency').value = o.currency || '';
    document.getElementById('notifProveedor').checked = o.notif_proveedor || false;
    document.getElementById('commentsPO').value = o.comments_po || '';
    document.getElementById('avMOC').value = o.av_moc || '';
    document.getElementById('avSOW').value = o.av_sow || '';
    document.getElementById('avAltaProv').value = o.av_alta_prov || '';
    document.getElementById('avSCUser').value = o.av_sc_user || '';
    document.getElementById('avCompras').value = o.av_compras || '';
    document.getElementById('avTrafico').value = o.av_trafico || '';
    document.getElementById('avBUWC').value = o.av_bu_wc || '';
    document.getElementById('avEHS').value = o.av_ehs || '';
    document.getElementById('avFixedAsset').value = o.av_fixed_asset || '';
    document.getElementById('avFinance').value = o.av_finance || '';
    document.getElementById('avRegional').value = o.av_regional || '';
    document.getElementById('avTOP').value = o.av_top || '';
    document.getElementById('freight').value = o.freight || '';
    document.getElementById('freightDays').value = o.freight_days || '';
    document.getElementById('fabLeadTime').value = o.fab_lead_time || '';
    document.getElementById('realPickupDate').value = o.real_pickup_date || '';
    document.getElementById('realReceiveDate').value = o.real_receive_date || '';
    document.getElementById('etaElp').value = o.eta_elp || '';
    document.getElementById('challengeDate').value = o.challenge_date || '';
    document.getElementById('recievedDate').value = o.recieved_date || '';

    document.getElementById('scAging').value = calcularSCAging(o.start_sc_date);
    calcularPickupDate();
    calcularReceiveDate();
    calcularRealReceiveDate();
    calcularAvance();
}

document.getElementById('formOrden').addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = obtenerDatosFormulario();

    if (!datos.sc) { showToast('El campo SC es obligatorio', 'error'); return; }

    if (editandoId) {
        const todas = obtenerOrdenes();
        const index = todas.findIndex(o => o.id === editandoId);
        if (index === -1) { showToast('SC no encontrada', 'error'); return; }

        if (todas.some(o => o.sc === datos.sc && o.id !== editandoId)) {
            showToast('Ya existe otra SC con ese número', 'error'); return;
        }
        todas[index] = { ...todas[index], ...datos };
        guardarOrdenes(todas);
        showToast('SC actualizada exitosamente', 'success');
    } else {
        if (ordenes.some(o => o.sc === datos.sc)) {
            showToast('Ya existe una SC con ese número', 'error'); return;
        }
        const nueva = { ...datos, id: generarId(), created_at: new Date().toISOString() };
        const todas = obtenerOrdenes();
        todas.push(nueva);
        guardarOrdenes(todas);
        showToast('SC creada exitosamente', 'success');
    }

    editandoId = null;
    document.getElementById('formOrden').reset();
    document.getElementById('startScDate').value = new Date().toISOString().split('T')[0];
    resetTabs();
    switchView('ordenes');
});

// ==================== EDITAR ORDEN ====================
function editarOrden(id) {
    const orden = ordenes.find(o => o.id === id);
    if (!orden) return;
    editandoId = id;
    document.getElementById('formTitle').textContent = ' Editar SC';
    llenarFormulario(orden);
    switchView('nueva');
}

// ==================== ELIMINAR ORDEN ====================
function abrirEliminar(id, numero) {
    ordenEliminar = id;
    document.getElementById('eliminarNumero').textContent = numero;
    document.getElementById('modalEliminar').classList.add('active');
}

document.getElementById('btnCerrarModalEliminar').addEventListener('click', cerrarModalEliminar);
document.getElementById('btnCancelarEliminar').addEventListener('click', cerrarModalEliminar);

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').classList.remove('active');
    ordenEliminar = null;
}

document.getElementById('btnConfirmarEliminar').addEventListener('click', () => {
    if (!ordenEliminar) return;
    const todas = obtenerOrdenes().filter(o => o.id !== ordenEliminar);
    guardarOrdenes(todas);
    showToast('SC eliminada', 'success');
    cerrarModalEliminar();
    cargarTabla();
});

// ==================== EXPORTAR CSV ====================
document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    if (ordenes.length === 0) { showToast('No hay datos para exportar', 'info'); return; }

    const headers = ['SC', 'PO', 'Customer', 'Supplier', 'Equipment/Service', 'Status', 'Aging', 'Costo', 'Currency', 'Freight', 'ETA ELP', 'Challenge Date', 'Received Date', 'Comments', 'MOC', 'SOW', 'Alta Prov', 'SC User', 'Compras/GIP', 'Tráfico', 'BU WC', 'EHS', 'Fixed Asset', 'Finance', 'Regional', 'TOP Mgmt'];
    const rows = ordenes.map(o => [
        o.sc, o.po_number || '', o.customer || '', o.supplier || '', (o.equipment || '').replace(/\n/g, ' '),
        o.status, calcularSCAging(o.start_sc_date), o.costo || '', o.currency || '',
        o.freight || '', formatDateRaw(o.eta_elp), formatDateRaw(o.challenge_date), formatDateRaw(o.recieved_date),
        (o.comments || '').replace(/\n/g, ' '),
        o.av_moc, o.av_sow, o.av_alta_prov, o.av_sc_user, o.av_compras, o.av_trafico,
        o.av_bu_wc, o.av_ehs, o.av_fixed_asset, o.av_finance, o.av_regional, o.av_top
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sc_tracker_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('CSV exportado exitosamente', 'success');
});

// ==================== EXPORTAR / IMPORTAR JSON ====================
document.getElementById('btnExportJSON').addEventListener('click', () => {
    const datos = obtenerOrdenes();
    if (datos.length === 0) { showToast('No hay datos para exportar', 'info'); return; }
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_sc_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Copia de seguridad exportada', 'success');
});

document.getElementById('btnImportJSON').addEventListener('click', () => {
    document.getElementById('fileInputJSON').click();
});

document.getElementById('fileInputJSON').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const datos = JSON.parse(event.target.result);
            if (!Array.isArray(datos)) { showToast('Formato de archivo inválido', 'error'); return; }
            const confirmar = confirm(`Se importarán ${datos.length} SC.\n\n¿Reemplazar datos actuales o agregar?`);
            if (confirmar === null) { e.target.value = ''; return; }
            let resultado;
            if (confirmar) {
                resultado = datos;
            } else {
                const existentes = obtenerOrdenes();
                const existentesSC = new Set(existentes.map(o => o.sc));
                const nuevos = datos.filter(o => !existentesSC.has(o.sc));
                resultado = [...existentes, ...nuevos];
            }
            guardarOrdenes(resultado);
            showToast(`${datos.length} SC importadas`, 'success');
            cargarDashboard();
        } catch (err) {
            showToast('Error al leer el archivo', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ==================== UTILIDADES ====================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateRaw(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toISOString().split('T')[0];
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startScDate').value = new Date().toISOString().split('T')[0];
    cargarDashboard();
});
