// servicios.js
// Carga y expone los servicios y cuadrillas desde cuadrillas.json

export async function cargarServiciosYCuadrillas() {
  // En entorno real, fetch a un endpoint o archivo estático
  // Aquí, como ejemplo, lo importamos como módulo local
  const response = await fetch('cuadrillas.json');
  const data = await response.json();
  return data.servicios;
}

export function getCuadrillasPorServicio(servicios, servicio) {
  return servicios[servicio] || [];
}
