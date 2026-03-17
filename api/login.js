/* ======== GENERALES ======== */
body {
    font-family: Arial, sans-serif;
    background: #F2F2F2;
    padding: 40px;
    margin: 0;
}

/* ======== ENCABEZADO INSTITUCIONAL ======== */
.header-uaeh {
    text-align: center;
    margin-bottom: 25px;
    color: #4D4D4F;
}

.header-uaeh h1 {
    margin: 0;
    font-size: 24px;
    color: #8A1538;
    font-weight: bold;
}

.header-uaeh h2 {
    margin: 5px 0 0 0;
    font-size: 18px;
    font-weight: 600;
}

.header-uaeh h3, .header-uaeh h4 {
    margin: 3px 0 0 0;
    font-size: 16px;
    font-weight: 500;
}

/* ======== BOTÓN CERRAR SESIÓN (SUPERIOR DERECHA) ======== */
.top-right {
    position: fixed;
    top: 15px;
    right: 20px;
    z-index: 10000;
}

.btn-logout {
    background: #8A1538;
    color: white !important;
    padding: 8px 14px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 13px;
    font-weight: bold;
    display: inline-block;
    border: none;
}

/* ======== LOGIN CONTAINER (CUADRO ORIGINAL) ======== */
.login-container {
    max-width: 400px;
    margin: 0 auto;
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.login-container label {
    display: block;
    margin-top: 15px;
    color: #4D4D4F;
}

.login-container input {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
}

.login-container button {
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    background: #8A1538;
    color: white;
    border: none;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
}

/* ======== TABLAS Y FILTROS EN UNA FILA ======== */
.table-container {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-bottom: 60px;
}

.filters {
    margin-bottom: 15px;
    display: flex;
    gap: 15px;
    align-items: flex-end;
    flex-wrap: wrap;
}

.filters label {
    display: block;
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 5px;
}

.filters input, .filters select {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

th {
    background: #8A1538;
    color: white;
    padding: 10px;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
}

td {
    border: 1px solid #ddd;
    padding: 8px;
    font-size: 13px;
}

.tr-entregado {
    background-color: #e6f4ea !important; /* Verde para entregados */
}

/* ======== PAGINACIÓN ======== */
#paginacion, #paginacionA {
    text-align: center;
    margin-top: 20px;
}

.pag-btn {
    padding: 8px 14px;
    margin: 3px;
    border: 1px solid #8A1538;
    background: white;
    color: #8A1538;
    cursor: pointer;
    border-radius: 4px;
}

.pag-btn:hover {
    background: #8A1538;
    color: white;
}

/* ======== PIE DE PÁGINA (FIRMA ORIGINAL) ======== */
.footer-firma {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: rgba(108, 117, 125, 0.8);
    padding: 8px 0;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(4px);
    z-index: 9999;
}
