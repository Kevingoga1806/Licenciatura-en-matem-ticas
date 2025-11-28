// netlify/functions/update-file.js

const fetch = require('node-fetch');

exports.handler = async function(event) {
    // 1. OBTENER VARIABLES DE ENTORNO
    // Usamos GITHUB_TOKEN2 ya que es la variable con valor secreto guardado.
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN2; 
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const TARGET_BRANCH = process.env.TARGET_BRANCH || 'main'; // Usa 'main' como valor por defecto

    // 2. VERIFICACIÓN CRÍTICA Y DIAGNÓSTICO (ESTE BLOQUE HA SIDO MODIFICADO)
    // El error "Missing env vars" significa que una de estas está vacía.
    // Usamos mensajes específicos para diagnosticar cuál falta en el log de Netlify.

    if (!REPO_OWNER) {
        // Diagnóstico: Si REPO_OWNER está vacío.
        return { statusCode: 500, body: 'Missing env vars: REPO_OWNER' };
    }

    if (!REPO_NAME) {
        // Diagnóstico: Si REPO_NAME está vacío.
        return { statusCode: 500, body: 'Missing env vars: REPO_NAME' };
    }

    if (!GITHUB_TOKEN) {
        // Diagnóstico: Si GITHUB_TOKEN2 está vacío (el error más probable).
        return { statusCode: 500, body: 'Missing env vars: GITHUB_TOKEN2' };
    }
    
    // --- BLOQUE DE LECTURA (GET) ---
    if (event.httpMethod === 'GET') {
        const path = event.queryStringParameters.path;
        if (!path) return { statusCode: 400, body: JSON.stringify({ error: 'Missing path parameter' }) };
        
        try {
            const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
            const getResp = await fetch(`${apiBase}?ref=${TARGET_BRANCH}`, { 
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });

            if (getResp.status !== 200) {
                // Si la ruta o el permiso del token son incorrectos, regresa este error.
                return { statusCode: getResp.status, body: JSON.stringify({ error: 'File not found on GitHub or API failure' }) };
            }

            const getJson = await getResp.json();
            const contentDecoded = Buffer.from(getJson.content, 'base64').toString('utf8');

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: contentDecoded
            };
        } catch (err) {
            return { statusCode: 500, body: `GET error: ${String(err)}` };
        }
    }
    // --- FIN BLOQUE DE LECTURA (GET) ---

    // --- BLOQUE DE ESCRITURA (POST) ---
    if (event.httpMethod === 'POST') {
        try {
            const payload = JSON.parse(event.body);
            const { path, content, message = 'Update via Netlify Function', branch = TARGET_BRANCH } = payload;
            
            // Lista de archivos permitidos para escritura
            const allowed = ['faqs.json','data/faqs.json','sugerencias.json','tarjetas.json','siteinfo.json','data/sugerencias.json','data/tarjetas.json','data/siteinfo.json'];
            if (!allowed.includes(path)) {
              return { statusCode: 403, body: JSON.stringify({ error: 'Path not allowed' }) };
            }

            const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

            // 1. Obtener SHA del archivo (necesario para actualizar)
            const getResp = await fetch(`${apiBase}?ref=${branch}`, {
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });

            let sha;
            if (getResp.status === 200) {
              const getJson = await getResp.json();
              sha = getJson.sha;
            }

            // 2. Preparar el cuerpo de la petición PUT
            const body = {
              message,
              // Convertir el contenido JSON a Base64
              content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'), 
              branch
            };
            if (sha) body.sha = sha; // Incluir SHA si el archivo existe

            // 3. Enviar la petición PUT (actualización/escritura)
            const putResp = await fetch(apiBase, {
              method: 'PUT',
              headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type':'application/json' },
              body: JSON.stringify(body)
            });

            const putJson = await putResp.json();
            if (putResp.status >= 200 && putResp.status < 300) {
              return { statusCode: 200, body: JSON.stringify({ ok: true, result: putJson }) };
            } else {
              return { statusCode: putResp.status, body: JSON.stringify({ ok: false, error: putJson }) };
            }
        } catch (err) {
            return { statusCode: 500, body: String(err) };
        }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
};
