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
  // Debug: mostrar el valor de nombre_servicio antes de enviar
  console.log('Valor de nombre_servicio:', usuario.nombre_servicio);
  if (!usuario.nombre_servicio) {
    alert('Error: El nombre del servicio no se está enviando. Valor actual: ' + usuario.nombre_servicio);
    return;
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
        <button type="button" onclick="editarElemento(${idx})">Editar</button>
        <button type="button" onclick="eliminarElemento(${idx})">Eliminar</button>
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
