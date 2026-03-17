const { google } = require("googleapis");

// =========================
// SEGURIDAD (SIN CAMBIOS)
// =========================
const intentosFallidos = {};
const bloqueosTemporales = {};
const bloqueosPermanentes = {};
const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 10 * 60 * 1000;
const MAX_BLOQUEOS_TEMP = 3;

function getIP(req) {
  return req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "desconocida";
}

function registrarIntento(ip, exito) {
  console.log("Intento desde IP:", ip, "Éxito:", exito);
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

    if (bloqueosPermanentes[ip] >= MAX_BLOQUEOS_TEMP) {
      bloqueosPermanentes[ip] = true;
    }
  }
}

// =========================
// GOOGLE SHEETS
// =========================
function getClient() {
  const credJson = process.env.GOOGLE_CREDENTIALS;
  if (!credJson) return null;

  let cred;
  try {
    cred = JSON.parse(credJson);
  } catch (e) {
    return null;
  }

  return new google.auth.JWT(
    cred.client_email,
    null,
    cred.private_key,
    ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  );
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

  if (bloqueo === "permanente")
    return res.status(403).json({ ok: false, error: "IP bloqueada permanentemente" });

  if (bloqueo === "temporal")
    return res.status(403).json({ ok: false, error: "IP bloqueada temporalmente" });

  if (req.method !== "POST")
    return res.status(200).json({ ok: false, error: "Método no permitido" });

  const { usuario, nip } = req.body || {};
  if (!usuario || !nip)
    return res.status(400).json({ ok: false, error: "Faltan datos" });

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const auth = getClient();
  if (!auth) return res.status(500).json({ ok: false, error: "Error con credenciales" });

  try {
    const directorio = await leerHoja(auth, spreadsheetId, "Directorio!A:E");

    let institucion = null;
    let esAdmin = false;

    for (let i = 1; i < directorio.length; i++) {
      const fila = directorio[i];
      if (fila[3] === usuario && fila[4] === nip) {
        institucion = fila[0];
        esAdmin = fila[0] === "Administrador";
        break;
      }
    }

    if (!institucion) {
      registrarFallo(ip);
      registrarIntento(ip, false);
      return res.status(200).json({ ok: false, error: "Usuario o NIP incorrectos" });
    }

    registrarIntento(ip, true);

    const reportes = await leerHoja(auth, spreadsheetId, "Reportes de entrega!A:M");
    const headers = reportes[0] || [];
    const filas = reportes.slice(1);

    // Asegurar que cada fila tenga al menos 13 columnas
    const filasNormalizadas = filas.map(f => {
      while (f.length < 13) f.push("");
      return f;
    });

    if (esAdmin) {
      return res.status(200).json({
        ok: true,
        admin: true,
        headers,
        reportes: filasNormalizadas
      });
    }

    const datosUsuario = filasNormalizadas.filter(f => f[5] === institucion);

    return res.status(200).json({
      ok: true,
      admin: false,
      institucion,
      headers,
      reportes: datosUsuario
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: "Error leyendo Google Sheets" });
  }
};
