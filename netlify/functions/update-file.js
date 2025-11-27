// netlify/functions/update-file.js

const fetch = require('node-fetch');

exports.handler = async function(event) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const TARGET_BRANCH = process.env.TARGET_BRANCH || 'main';

    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        return { statusCode: 500, body: 'Missing env vars' };
    }

    // --- BLOQUE DE LECTURA (GET) ---
    if (event.httpMethod === 'GET') {
        const path = event.queryStringParameters.path;
        if (!path) return { statusCode: 400, body: JSON.stringify({ error: 'Missing path parameter' }) };
        
        try {
            const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
            const getResp = await fetch(`${apiBase}?ref=${TARGET_BRANCH}`, { // Usa TARGET_BRANCH aquí
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });

            if (getResp.status !== 200) {
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

    // --- BLOQUE DE ESCRITURA (POST) - (Tu código original) ---
    if (event.httpMethod === 'POST') {
        try {
            const payload = JSON.parse(event.body);
            // ... (el resto de tu código POST va aquí, sin necesidad de redeclarar variables)
            const { path, content, message = 'Update via Netlify Function', branch = TARGET_BRANCH } = payload;
            
            const allowed = ['faqs.json','data/faqs.json','sugerencias.json','tarjetas.json','siteinfo.json','data/sugerencias.json','data/tarjetas.json','data/siteinfo.json'];
            if (!allowed.includes(path)) {
              return { statusCode: 403, body: JSON.stringify({ error: 'Path not allowed' }) };
            }

            const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

            const getResp = await fetch(`${apiBase}?ref=${branch}`, {
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });

            let sha;
            if (getResp.status === 200) {
              const getJson = await getResp.json();
              sha = getJson.sha;
            }

            const body = {
              message,
              content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
              branch
            };
            if (sha) body.sha = sha;

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

    return { statusCode: 405, body: 'Method Not Allowed' }; // Manejo para métodos no definidos
};
