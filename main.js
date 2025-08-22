import { cargarServiciosYCuadrillas, getCuadrillasPorServicio } from './servicios.js';

let usuario = {};
let elementos = [];
let editIndex = null;

// DOM Elements
const usuarioForm = document.getElementById('usuario-form');
const elementoForm = document.getElementById('elemento-form');
const formularioUsuario = document.getElementById('formulario-usuario');
const formularioElementos = document.getElementById('formulario-elementos');
const servicioSelect = document.getElementById('servicio');
const cuadrillaSelect = document.getElementById('cuadrilla');
const tablaElementos = document.getElementById('tabla-elementos').getElementsByTagName('tbody')[0];
const guardarBtn = document.getElementById('guardar-btn');
const enviarBtn = document.getElementById('enviar-btn');

// Cargar servicios y cuadrillas
let serviciosData = {};
document.addEventListener('DOMContentLoaded', async () => {
  serviciosData = await cargarServiciosYCuadrillas();
  // Llenar select de servicios
  servicioSelect.innerHTML = '<option value="">Seleccione un servicio</option>';
  Object.keys(serviciosData).forEach(servicio => {
    const opt = document.createElement('option');
    opt.value = servicio;
    opt.textContent = servicio;
    servicioSelect.appendChild(opt);
  });
});

// Cambiar cuadrillas según servicio
servicioSelect.addEventListener('change', () => {
  const servicio = servicioSelect.value;
  cuadrillaSelect.innerHTML = '<option value="">Seleccione una cuadrilla</option>';
  if (servicio && serviciosData[servicio]) {
    serviciosData[servicio].forEach(cuadrilla => {
      const opt = document.createElement('option');
      opt.value = cuadrilla;
      opt.textContent = cuadrilla;
      cuadrillaSelect.appendChild(opt);
    });
  }
});

// Paso 1: Datos usuario
usuarioForm.addEventListener('submit', e => {
  e.preventDefault();
  usuario = {
    nombre: usuarioForm.nombre.value.trim(),
    documento: usuarioForm.documento.value.trim(),
    email: usuarioForm.email.value.trim(),
    nombre_servicio: servicioSelect.value,
    cuadrilla: cuadrillaSelect.value
  };
  if (!usuario.nombre || !usuario.documento || !usuario.email || !usuario.nombre_servicio || !usuario.cuadrilla) {
    alert('Por favor complete todos los campos.');
    return;
  }
  // Oculta el div completo del formulario de usuario y muestra el de elementos
  if (formularioUsuario) formularioUsuario.style.display = 'none';
  formularioElementos.style.display = 'block';
  const tablaPanel = document.getElementById('tabla-elementos-panel');
  if (tablaPanel) tablaPanel.style.display = 'flex';
  // Asegura que el formulario de elementos no esté en posición absoluta ni tape la tabla
  formularioElementos.style.position = '';
  formularioElementos.style.left = '';
  formularioElementos.style.top = '';
  formularioElementos.style.width = '';
});

// Paso 2: Elementos
function limpiarFormularioElemento() {
  elementoForm.reset();
  editIndex = null;
  guardarBtn.textContent = 'Guardar';
}

elementoForm.addEventListener('submit', e => {
  e.preventDefault();
  const el = {
    nombre_elemento: elementoForm.nombre_elemento.value.trim(),
    caracteristica: elementoForm.caracteristica.value.trim(),
    codigo_unico: elementoForm.codigo_unico.value.trim(),
    estado: elementoForm.estado.value
  };
  if (!el.nombre_elemento || !el.caracteristica || !el.codigo_unico || !el.estado) {
    alert('Complete todos los campos del elemento.');
    return;
  }
  if (editIndex !== null) {
    elementos[editIndex] = el;
    editIndex = null;
    guardarBtn.textContent = 'Guardar';
  } else {
    elementos.push(el);
  }
  renderTabla();
  limpiarFormularioElemento();
});

enviarBtn.addEventListener('click', async () => {
  if (elementos.length === 0) {
    alert('Agregue al menos un elemento antes de enviar.');
    return;
  }
  // Generar PDF antes de enviar
  if (window.jspdf && window.jspdf.jsPDF) {
    const doc = new window.jspdf.jsPDF();
    // Título
    const titulo = `reporte_cuadrilla_${usuario.cuadrilla}`;
    doc.setFontSize(18);
    doc.text(titulo, 105, 18, { align: 'center' });
    // Tabla de elementos
    const headers = [["Nombre", "Característica", "Código único", "Estado"]];
    const data = elementos.map(el => [el.nombre_elemento, el.caracteristica, el.codigo_unico, el.estado]);
    doc.autoTable({
      head: headers,
      body: data,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 11 }
    });
    // Datos del usuario debajo de la tabla
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 38 + data.length * 10;
    doc.setFontSize(13);
    doc.text(`Nombre: ${usuario.nombre}`, 14, finalY);
    doc.text(`Documento: ${usuario.documento}`, 14, finalY + 8);
    doc.text(`Email: ${usuario.email}`, 14, finalY + 16);
    // Guardar PDF
    doc.save(`reporte_cuadrilla_${usuario.cuadrilla}.pdf`);
  }
  // Enviar datos al servidor (Google Apps Script)
  try {
    const url = 'https://script.google.com/macros/s/AKfycbw4SoxdNrpb3b0G_1D-1cXaPPA7wn7IhkCjpbDBJA43zSjgpdXuYyP6s0lacINzRaLs/exec';
    const payload = {
      nombre: usuario.nombre,
      documento: usuario.documento,
      email: usuario.email,
      nombre_servicio: usuario.nombre_servicio,
      cuadrilla: usuario.cuadrilla,
      elementos: elementos
    };
    const res = await fetch(url + '?nombre=' + encodeURIComponent(payload.nombre) +
      '&documento=' + encodeURIComponent(payload.documento) +
      '&email=' + encodeURIComponent(payload.email) +
      '&nombre_servicio=' + encodeURIComponent(payload.nombre_servicio) +
      '&cuadrilla=' + encodeURIComponent(payload.cuadrilla) +
      '&elementos=' + encodeURIComponent(JSON.stringify(payload.elementos)), {
      method: 'GET'
    });
    const data = await res.json();
    if (data.status === 'ok') {
      alert('Datos enviados correctamente.');
      location.reload();
    } else {
      alert('Error al enviar: ' + (data.message || 'Error desconocido.'));
    }
  } catch (err) {
    alert('Error de conexión: ' + err.message);
  }
});

function renderTabla() {
  tablaElementos.innerHTML = '';
  elementos.forEach((el, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${el.nombre_elemento}</td>
      <td>${el.caracteristica}</td>
      <td>${el.codigo_unico}</td>
      <td>${el.estado}</td>
      <td>
        <button type="button" class="tabla-btn btn-editar" onclick="editarElemento(${idx})"><span class="icono-editar" aria-hidden="true">✏️</span> Editar</button>
        <button type="button" class="tabla-btn btn-eliminar" onclick="eliminarElemento(${idx})"><span class="icono-eliminar" aria-hidden="true">🗑️</span> Eliminar</button>
      </td>
    `;
    tablaElementos.appendChild(row);
  });
}

// Exponer funciones para botones de la tabla
globalThis.editarElemento = function(idx) {
  const el = elementos[idx];
  elementoForm.nombre_elemento.value = el.nombre_elemento;
  elementoForm.caracteristica.value = el.caracteristica;
  elementoForm.codigo_unico.value = el.codigo_unico;
  elementoForm.estado.value = el.estado;
  editIndex = idx;
  guardarBtn.textContent = 'Guardar cambio';
};

globalThis.eliminarElemento = function(idx) {
  if (confirm('¿Está seguro de eliminar este elemento?')) {
    elementos.splice(idx, 1);
    renderTabla();
  }
};
