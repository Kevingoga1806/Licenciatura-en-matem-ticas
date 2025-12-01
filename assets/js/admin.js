/* admin.js — panel admin con backend Netlify */
(() => {
  // Ajusta esta contraseña si quieres
  const ADMIN_USER = "admin";
  const ADMIN_PASSWORD = "utadmin2025";

  const LS_KEYS = {
    logged: "math_portal_admin_logged",
    faqs: "math_portal_faqs",
    siteinfo: "math_portal_siteinfo"
  };

  /* ============================================================
      1. API URL (solicitud del usuario)
  ============================================================ */
  const API_URL = "https://fanciful-piroshki-d213dc.netlify.app/.netlify/functions/update-file";

  // DOM
  const loginScreen = document.getElementById("loginScreen");
  const adminPanel = document.getElementById("adminPanel");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Sections
  const navItems = document.querySelectorAll(".sidebar nav li");
  const sectionTitle = document.getElementById("sectionTitle");
  const sectionContent = document.getElementById("sectionContent");

  // FAQs elements
  const newFaqForm = document.getElementById("newFaqForm");
  const newQ = document.getElementById("newQuestion");
  const newA = document.getElementById("newAnswer");
  const faqsList = document.getElementById("faqsList");
  const saveAllBtn = document.getElementById("saveAllBtn");

  // Site info elements
  const bannerText = document.getElementById("bannerText");
  const searchTitle = document.getElementById("searchTitle");
  const footerText = document.getElementById("footerText");
  const saveSiteInfoBtn = document.getElementById("saveSiteInfo");
  const resetSiteInfoBtn = document.getElementById("resetSiteInfo");

  /* ============================================================
      2. BACKEND PERSISTENCIA – Netlify (solicitud del usuario)
  ============================================================ */

  async function apiGet(path) {
    try {
      const response = await fetch(`${API_URL}?path=${path}`);
      if (!response.ok) {
        console.error(`Error al leer ${path}: ${response.statusText}`);
        return { items: [] };
      }
      return response.json();
    } catch (e) {
      console.error("Error de red:", e);
      return { items: [] };
    }
  }

  async function apiPost(path, content, message) {
    try {
      const payload = { path, content, message };
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || result.ok === false) {
        console.error("Error API GitHub:", result.error || result);
        alert("ERROR: No se pudo guardar en GitHub.");
        return false;
      }

      alert("Cambios guardados en GitHub");
      return true;
    } catch (e) {
      console.error("Error en POST:", e);
      alert("ERROR DE RED al guardar.");
      return false;
    }
  }

  /* ============================================================
      Helpers (NO SE MUEVE NADA AQUÍ)
  ============================================================ */
  function _getLS(key, def) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : def;
    } catch (e) {
      return def;
    }
  }
  function _setLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }

  // Init
    async function init() {
    const logged = _getLS(LS_KEYS.logged, false);
    if (logged) showPanel(); else showLogin();

    navItems.forEach(li => {
      li.addEventListener("click", () => {
        navItems.forEach(i=>i.classList.remove("active"));
        li.classList.add("active");
        openSection(li.dataset.section);
      });
    });

    loginBtn.addEventListener("click", doLogin);
    logoutBtn.addEventListener("click", doLogout);

    newFaqForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addFaq(newQ.value.trim(), newA.value.trim());
      newFaqForm.reset();
    });

    saveAllBtn.addEventListener("click", () => {
      alert("Los cambios se guardaron localmente.");
    });

    saveSiteInfoBtn.addEventListener("click", saveSiteInfo);
    resetSiteInfoBtn.addEventListener("click", resetSiteInfo);

    await renderFaqs(); // <<< CAMBIO: AGREGAR 'await'
    await loadSiteInfoToForm(); // <<< CAMBIO: AGREGAR 'await'
  }

  /* LOGIN */
  function doLogin(){
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    if(user === ADMIN_USER && pass === ADMIN_PASSWORD){
      _setLS(LS_KEYS.logged, true);
      showPanel();
    } else {
      alert("Credenciales incorrectas.");
    }
  }
  function doLogout(){
    localStorage.removeItem(LS_KEYS.logged);
    showLogin();
  }
  function showLogin(){
    loginScreen.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  }
  async function showPanel(){
    loginScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    await renderFaqs();
    await loadSiteInfoToForm();
  }

/* SECCIONES — CORREGIDO */
async function openSection(name){ // <<< HACER ASÍNCRONA
    sectionTitle.textContent =
      name === "faqs" ? "Editar FAQs" :
      name === "siteinfo" ? "Editar información del sitio" :
      name === "docs" ? "Administrar documentos" :
      name === "tarjetas" ? "Editar tarjetas" :
      "Sugerencias";

    document.querySelectorAll(".panel-section")
      .forEach(s => s.classList.add("hidden"));

    if(name === "faqs") document.getElementById("faqsSection").classList.remove("hidden");
    if(name === "siteinfo") document.getElementById("siteinfoSection").classList.remove("hidden");
    if(name === "docs") document.getElementById("docsSection").classList.remove("hidden");

    if(name === "sugerencias") {
      document.getElementById("sugerenciasSection").classList.remove("hidden");
      await renderSugerencias(); // <<< AWAIT AGREGADO
    }

    if(name === "tarjetas") {
      document.getElementById("tarjetasSection").classList.remove("hidden");
      await mostrarTarjetasEnAdmin(); // <<< AWAIT AGREGADO
    }
}

  /* ============================================================
      3. FAQs CRUD — MODIFICADO A BACKEND
  ============================================================ */

  async function getFaqs() {
    const remote = await apiGet("faqs.json");
    return remote.items || defaultFaqs();
  }

  async function saveFaqs(list) {
    const ok = await apiPost(
      "faqs.json",
      { items: list },
      "Actualización de FAQs desde el panel Admin"
    );

    if (ok) await renderFaqs();
  }

  function defaultFaqs() {
    return [
      { id: uid(), q: "¿Cuáles son los requisitos para una validación?", a: "La validación requiere..." },
      { id: uid(), q: "¿Qué debo saber sobre homologaciones?", a: "Para una homologación..." },
      { id: uid(), q: "¿Cómo funciona la transferencia o cambio de carrera?", a: "Para cambio de carrera..." },
      { id: uid(), q: "¿Cómo solicitar matrícula extemporánea?", a: "La matrícula extemporánea se solicita..." },
      { id: uid(), q: "Información sobre becas", a: "Las becas disponibles son..." }
    ];
  }

  /* renderFaqs ahora es ASYNC */
  async function renderFaqs() {
    const list = await getFaqs();
    faqsList.innerHTML = "";

    if (!list.length) {
      faqsList.innerHTML = "<p class='muted'>No hay FAQs aún.</p>";
      return;
    }

    list.forEach(item => {
      const el = document.createElement("div");
      el.className = "faq-item-admin";
      el.innerHTML = `
        <h4 contenteditable="false" data-id="${item.id}">${escapeHtml(item.q)}</h4>
        <div data-id="${item.id}" class="answer" style="white-space:pre-wrap;">${escapeHtml(item.a)}</div>
        <div class="faq-actions">
          <button class="btn outline editBtn" data-id="${item.id}">Editar</button>
          <button class="btn primary saveBtn hidden" data-id="${item.id}">Guardar</button>
          <button class="btn outline cancelBtn hidden" data-id="${item.id}">Cancelar</button>
          <button class="btn" style="background:#e74c3c;color:#fff" data-id="${item.id}" title="Eliminar">Eliminar</button>
        </div>
      `;
      faqsList.appendChild(el);
    });

    faqsList.querySelectorAll(".editBtn").forEach(b => b.addEventListener("click", startEdit));
    faqsList.querySelectorAll(".saveBtn").forEach(b => b.addEventListener("click", saveEdit));
    faqsList.querySelectorAll(".cancelBtn").forEach(b => b.addEventListener("click", cancelEdit));
    faqsList.querySelectorAll("button[title='Eliminar']").forEach(b => b.addEventListener("click", deleteFaq));
  }

    /* ============================================================
      Continuación de CRUD FAQs
  ============================================================ */

  async function addFaq(question, answer) {
    if (!question || !answer) {
      alert("Pregunta y respuesta obligatorias.");
      return;
    }

    const list = await getFaqs();
    list.unshift({ id: uid(), q: question, a: answer });
    await saveFaqs(list);
  }

  async function startEdit(e) {
    const id = e.target.dataset.id;
    const box = e.target.closest(".faq-item-admin");

    const title = box.querySelector("h4");
    const ans = box.querySelector(".answer");

    title.contentEditable = true;
    ans.contentEditable = true;

    box.querySelector(".editBtn").classList.add("hidden");
    box.querySelector(".saveBtn").classList.remove("hidden");
    box.querySelector(".cancelBtn").classList.remove("hidden");
  }

  async function saveEdit(e) {
    const id = e.target.dataset.id;
    const box = e.target.closest(".faq-item-admin");

    const title = box.querySelector("h4");
    const ans = box.querySelector(".answer");

    const list = await getFaqs();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return;

    list[idx].q = title.textContent.trim();
    list[idx].a = ans.textContent.trim();

    await saveFaqs(list);
  }

  async function cancelEdit(e) {
    await renderFaqs();
  }

  async function deleteFaq(e) {
    if (!confirm("¿Eliminar esta FAQ?")) return;
    const id = e.target.dataset.id;

    const list = await getFaqs();
    const filtered = list.filter(x => x.id !== id);

    await saveFaqs(filtered);
  }

  /* ============================================================
      SITE INFO
  ============================================================ */

  async function getSiteInfo() { // <<< REEMPLAZAR CON ESTO
      const remote = await apiGet("siteinfo.json");
      
      // Si la lectura remota fue exitosa y trae contenido, la usamos.
      if (remote && Object.keys(remote).length > 0) {
          return remote;
      }
      // Si falla o está vacío, usamos los valores por defecto
      return { 
          bannerText: "Banner Institucional - Licenciatura en Matemáticas", 
          searchTitle: "¿Qué necesitas saber?", 
          footerText: "© 2025 Facultad de Matemáticas - Universidad del Tolima\nDesarrollado por Kevin Andrés Gómez Garzón"
      };
  }

  async function saveSiteInfo() { // <<< REEMPLAZAR CON ESTO
      const data = {
          bannerText: bannerText.value.trim(), 
          searchTitle: searchTitle.value.trim(),
          footerText: footerText.value.trim()
      };
      
      // Se elimina la línea _setLS
      
      const ok = await apiPost(
          "siteinfo.json",
          data, // Enviamos el objeto de datos
          "Actualización de Site Info desde el panel Admin"
      );
  
      if (ok) {
          // Recargamos el formulario para confirmar los nuevos valores
          await loadSiteInfoToForm(); 
      }
  }

  function resetSiteInfo() {
    if (!confirm("¿Restablecer valores por defecto?")) return;

    bannerText.value = "Bienvenido al Portal Académico";
    searchTitle.value = "Buscador general";
    footerText.value = "Universidad del Tolima - Todos los derechos reservados";

    saveSiteInfo();
  }

  async function loadSiteInfoToForm() { // <<< REEMPLAZAR CON ESTO
      const info = await getSiteInfo();
      // Usamos las claves que estás usando en el formulario (deben ser consistentes)
      bannerText.value = info.bannerText || ''; 
      searchTitle.value = info.searchTitle || '';
      footerText.value = info.footerText || '';
  }

/* ============================================================
    SUGERENCIAS — MIGRADO A BACKEND
============================================================ */

async function getSugerencias() {
    const remote = await apiGet("sugerencias.json");
    // Si la lista está vacía, devuelve un array vacío.
    return remote || [];
}

async function saveSugerencias(list) {
    const ok = await apiPost(
        "sugerencias.json",
        list, // El payload es la lista directa
        "Actualización de sugerencias desde el panel Admin"
    );
    if (ok) await renderSugerencias();
}

async function deleteSugerencia(idx) {
    if (!confirm("¿Eliminar esta sugerencia?")) return;

    const list = await getSugerencias();
    // Convierte el índice a número antes de usar splice, ya que viene del data-idx (string)
    const indexNum = parseInt(idx, 10); 
    list.splice(indexNum, 1); 
    
    await saveSugerencias(list);
}

// Ahora es ASYNC para leer de GitHub
async function renderSugerencias() {
    const cont = document.getElementById("sugerenciasList");
    const list = await getSugerencias(); 

    cont.innerHTML = "";

    if (!list.length) {
      cont.innerHTML = "<p class='muted'>No hay sugerencias aún.</p>";
      return;
    }

    list.forEach((sug, i) => {
      const div = document.createElement("div");
      div.className = "sug-item";
      div.innerHTML = `
        <p>${escapeHtml(sug)}</p>
        <button class="btn" style="background:#e74c3c;color:#fff" data-idx="${i}">Eliminar</button>
      `;
      cont.appendChild(div);
    });

    cont.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", e => deleteSugerencia(e.target.dataset.idx));
    });
}

    cont.innerHTML = "";

    if (!list.length) {
      cont.innerHTML = "<p class='muted'>No hay sugerencias aún.</p>";
      return;
    }

    list.forEach((sug, i) => {
      const div = document.createElement("div");
      div.className = "sug-item";
      div.innerHTML = `
        <p>${escapeHtml(sug)}</p>
        <button class="btn" style="background:#e74c3c;color:#fff" data-idx="${i}">Eliminar</button>
      `;
      cont.appendChild(div);
    });

    cont.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", e => deleteSugerencia(e.target.dataset.idx));
    });
  }
/* ============================================================
    TARJETAS — MIGRADO A BACKEND
============================================================ */

// Ahora es ASYNC para leer de GitHub
async function obtenerTarjetas() {
    const remote = await apiGet("tarjetas.json");
    
    // Usamos los valores por defecto si no hay un array válido en GitHub
    return remote.items || [
      { id: uid(), titulo: "Validaciones", descripcion: "Información sobre validaciones y requisitos." },
      { id: uid(), titulo: "Homologaciones", descripcion: "Guía completa para homologaciones." },
      { id: uid(), titulo: "Transferencias internas", descripcion: "Procedimiento para cambiar de programa." }
    ];
}

// Ahora es ASYNC y usa apiPost
async function guardarTarjetas(list) {
    const ok = await apiPost(
        "tarjetas.json",
        { items: list }, // Usamos el formato { items: [...] }
        "Actualización de tarjetas desde el panel Admin"
    );
    return ok;
}

// Ahora es ASYNC para leer de GitHub
async function mostrarTarjetasEnAdmin() {
    const cont = document.getElementById("tarjetasList");
    const list = await obtenerTarjetas(); // <<< Await aquí

    cont.innerHTML = "";

    if (!list.length) {
      cont.innerHTML = "<p class='muted'>No hay tarjetas.</p>";
      return;
    }

    list.forEach(card => {
      const div = document.createElement("div");
      div.className = "card-item-admin";
      
      div.innerHTML = `
        <h4 contenteditable="false" data-id="${card.id}">${escapeHtml(card.titulo)}</h4>
        <p class="desc" contenteditable="false" data-id="${card.id}">${escapeHtml(card.descripcion)}</p>

        <div class="card-actions">
          <button class="btn outline editCard" data-id="${card.id}">Editar</button>
          <button class="btn primary saveCard hidden" data-id="${card.id}">Guardar</button>
          <button class="btn outline cancelCard hidden" data-id="${card.id}">Cancelar</button>
          <button class="btn" style="background:#e74c3c;color:#fff" data-id="${card.id}">Eliminar</button>
        </div>
      `;
      cont.appendChild(div);
    });

    cont.querySelectorAll(".editCard").forEach(b => b.addEventListener("click", startEditCard));
    cont.querySelectorAll(".saveCard").forEach(b => b.addEventListener("click", saveCard));
    cont.querySelectorAll(".cancelCard").forEach(b => b.addEventListener("click", cancelCard));
    cont.querySelectorAll("button[style*='e74c3c']").forEach(b => b.addEventListener("click", deleteCard));
}

// Esta función no necesita ASYNC ya que solo manipula el DOM
function startEditCard(e) {
  const id = e.target.dataset.id;
  const box = e.target.closest(".card-item-admin");

  box.querySelector("h4").contentEditable = true;
  box.querySelector(".desc").contentEditable = true;

  box.querySelector(".editCard").classList.add("hidden");
  box.querySelector(".saveCard").classList.remove("hidden");
  box.querySelector(".cancelCard").classList.remove("hidden");
}

async function cancelCard() { // <<< ASYNC
    await mostrarTarjetasEnAdmin();
}

async function saveCard(e) { // <<< ASYNC
    const id = e.target.dataset.id;
    const box = e.target.closest(".card-item-admin");

    const t = box.querySelector("h4").textContent.trim();
    const d = box.querySelector(".desc").textContent.trim();

    const list = await obtenerTarjetas(); // <<< Await aquí
    const idx = list.findIndex(x => x.id === id);

    if (idx !== -1) {
      list[idx].titulo = t;
      list[idx].descripcion = d;
      await guardarTarjetas(list); // <<< Await aquí
    }

    await mostrarTarjetasEnAdmin(); // <<< Await aquí
}

async function deleteCard(e) { // <<< ASYNC
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    const id = e.target.dataset.id;

    const list = await obtenerTarjetas(); // <<< Await aquí
    const filtered = list.filter(x => x.id !== id);

    await guardarTarjetas(filtered); // <<< Await aquí

    await mostrarTarjetasEnAdmin(); // <<< Await aquí
}

  /* ============================================================
      UTILIDADES
  ============================================================ */

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  // Iniciar todo:
  document.addEventListener("DOMContentLoaded", init);
})();




