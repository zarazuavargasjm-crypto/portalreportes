const { google } = require("googleapis");

// =========================
// SEGURIDAD (Sin cambios en tu lógica)
// =========================
const intentosFallidos = {};
const bloqueosTemporales = {};
const bloqueosPermanentes = {};
const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 10 * 60 * 1000;
const MAX_BLOQUEOS_TEMP = 3;

function getIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || "desconocida";
}

// FUNCIÓN AJUSTADA: Formato de fecha y celdas individuales
async function registrarEnSheets(auth, spreadsheetId, usuario, ip, tipo, institucion) {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    
    // Formato de fecha: DD/MM/YYYY HH:MM:SS
    const ahora = new Date();
    const fechaMX = new Date(ahora.getTime() - (6 * 60 * 60 * 1000));
    const d = fechaMX.getDate().toString().padStart(2, '0');
    const m = (fechaMX.getMonth() + 1).toString().padStart(2, '0');
    const a = fechaMX.getFullYear();
    const h = fechaMX.getHours().toString().padStart(2, '0');
    const min = fechaMX.getMinutes().toString().padStart(2, '0');
    const s = fechaMX.getSeconds().toString().padStart(2, '0');
    
    const fechaFormato = `${d}/${m}/${a} ${h}:${min}:${s}`;
    
    // Cada elemento en el array interno es una celda (Columna A, B, C, D, E)
    const values = [[fechaFormato, usuario, ip, tipo, institucion]];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Registro de consultas!A1",
      valueInputOption: "RAW",
      requestBody: { values }
    });
  } catch (e) {
    console.error("[ERROR] Registro:", e.message);
  }
}

function estaBloqueado(ip) {
  if (bloqueosPermanentes[ip] === true) return "permanente";
  const bloqueo = bloqueosTemporales[ip];
  if (!bloqueo) return false;
  if (Date.now() > bloqueo) {
    delete bloqueosTemporales[ip];
    return false;
  }
  return "temporal";
}

function registrarFallo(ip) {
  intentosFallidos[ip] = (intentosFallidos[ip] || 0) + 1;
  if (intentosFallidos[ip] >= MAX_INTENTOS) {
    intentosFallidos[ip] = 0;
    bloqueosTemporales[ip] = Date.now() + TIEMPO_BLOQUEO_MS;
    bloqueosPermanentes[ip] = (bloqueosPermanentes[ip] || 0) + 1;
    if (bloqueosPermanentes[ip] >= MAX_BLOQUEOS_TEMP) bloqueosPermanentes[ip] = true;
  }
}

// =========================
// GOOGLE SHEETS
// =========================
function getClient() {
  const credJson = process.env.GOOGLE_CREDENTIALS;
  if (!credJson) return null;
  try {
    const cred = JSON.parse(credJson);
    const privateKey = cred.private_key.replace(/\\n/g, '\n');
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    return new google.auth.JWT(cred.client_email, null, privateKey, scopes);
  } catch (e) {
    return null;
  }
}

async function leerHoja(auth, spreadsheetId, range) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

// =========================
// HANDLER PRINCIPAL
// =========================
module.exports = async (req, res) => {
  const ip = getIP(req);
  const bloqueo = estaBloqueado(ip);

  if (bloqueo === "permanente") return res.status(403).json({ ok: false, error: "IP bloqueada permanentemente" });
  if (bloqueo === "temporal") return res.status(403).json({ ok: false, error: "IP bloqueada temporalmente" });

  if (req.method !== "POST") return res.status(200).json({ ok: false, error: "Método no permitido" });

  const { usuario, nip } = req.body || {};
  if (!usuario || !nip) return res.status(400).json({ ok: false, error: "Faltan datos" });

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const auth = getClient();
  if (!auth || !spreadsheetId) return res.status(500).json({ ok: false, error: "Error de configuración" });

  try {
    const directorio = await leerHoja(auth, spreadsheetId, "Directorio!A:E");
    let institucion = null;
    let esAdmin = false;

    for (let i = 1; i < directorio.length; i++) {
      const fila = directorio[i];
      if (fila.length < 5) continue;
      if (usuario === fila[3] && nip === fila[4]) {
        institucion = fila[0];
        esAdmin = (institucion === "Administrador");
        break;
      }
    }

    if (!institucion) {
      registrarFallo(ip);
      // Registro de incidente por credenciales
      await registrarEnSheets(auth, spreadsheetId, usuario, ip, "Credenciales incorrectas", "-");
      return res.status(200).json({ ok: false, error: "Usuario o NIP incorrectos" });
    }

    // Registro de éxito con el tipo (Administrador o Usuario) y mensaje solicitado
    const tipoRegistro = esAdmin ? "Administrador, Inicio de sesión exitoso" : "Usuario, Inicio de sesión exitoso";
    await registrarEnSheets(auth, spreadsheetId, usuario, ip, tipoRegistro, institucion);

    const reportes = await leerHoja(auth, spreadsheetId, "Reportes de entrega!A:M");
    const headers = reportes[0] || [];
    const filas = reportes.slice(1);

    if (esAdmin) {
      return res.status(200).json({ ok: true, admin: true, headers, reportes: filas });
    }

    const datosUsuario = filas.filter(f => f[5] === institucion);
    return res.status(200).json({ ok: true, admin: false, institucion, headers, reportes: datosUsuario });

  } catch (e) {
    return res.status(500).json({ ok: false, error: "Error de conexión" });
  }
};
