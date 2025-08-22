function doGet(e) {
  // Log de depuración para ver los parámetros recibidos
  Logger.log('Parametros recibidos: ' + JSON.stringify(e.parameter));
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Hoja 1");

  // Datos generales
  var nombre = e.parameter.nombre ? String(e.parameter.nombre) : "";
  var email = e.parameter.email ? String(e.parameter.email) : "";
  var documento = e.parameter.documento ? String(e.parameter.documento) : "";
  var nombre_servicio = e.parameter.nombre_servicio ? String(e.parameter.nombre_servicio) : "";
  var cuadrilla = e.parameter.cuadrilla ? String(e.parameter.cuadrilla) : "";

  // Recibe los elementos como JSON (array)
  var elementos = [];
  if (e.parameter.elementos) {
    try {
      elementos = JSON.parse(e.parameter.elementos);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({status: "error", message: "Elementos mal formateados"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else {
    // Compatibilidad: si no hay array, intenta con los parámetros individuales (caso antiguo)
    var nombre_elemento = e.parameter.mensaje || "";
    var caracteristica = e.parameter.caracteristica || "";
    var codigo_unico = e.parameter.codigo_unico || "";
    var estado = e.parameter.estado || "";
    if (nombre_elemento || caracteristica || codigo_unico || estado) {
      elementos.push({
        nombre_elemento: nombre_elemento,
        caracteristica: caracteristica,
        codigo_unico: codigo_unico,
        estado: estado
      });
    }
  }

  // Agrega una fila por cada elemento
  elementos.forEach(function(el) {
    var nombre_elemento = el.nombre_elemento || "";
    var caracteristica = el.caracteristica || "";
    var codigo_unico = el.codigo_unico || "";
    var estado = el.estado || "";
    sheet.appendRow([
      nombre,
      email,
      documento,
      nombre_servicio,
      cuadrilla,
      el.nombre_elemento ? String(el.nombre_elemento) : "",
      el.caracteristica ? String(el.caracteristica) : "",
      el.codigo_unico ? String(el.codigo_unico) : "",
      el.estado ? String(el.estado) : "",
      new Date()
    ]);
  });

  return ContentService
    .createTextOutput(JSON.stringify({status: "ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}
