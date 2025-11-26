/* admin.js — panel admin sin backend (LocalStorage) */
(() => {
  // Ajusta esta contraseña si quieres
  const ADMIN_USER = "admin";
  const ADMIN_PASSWORD = "utadmin2025"; // <- cambia esto si quieres otra contraseña

  const LS_KEYS = {
    logged: "math_portal_admin_logged",
    faqs: "math_portal_faqs",
    siteinfo: "math_portal_siteinfo"
  };

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

  // Helpers
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
  function init() {
    // Login state
    const logged = _getLS(LS_KEYS.logged, false);
    if (logged) showPanel(); else showLogin();

    // Nav events
    navItems.forEach(li => {
      li.addEventListener("click", () => {
        navItems.forEach(i=>i.classList.remove("active"));
        li.classList.add("active");
        openSection(li.dataset.section);
      });
    });

    // Login
    loginBtn.addEventListener("click", doLogin);
    logoutBtn.addEventListener("click", doLogout);

    // FAQs
    newFaqForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addFaq(newQ.value.trim(), newA.value.trim());
      newFaqForm.reset();
    });
    saveAllBtn.addEventListener("click", () => {
      alert("Los cambios se guardaron en LocalStorage.\nPara que se vean en el sitio público, abre index.html o contacto.html en el mismo navegador.");
    });

    // Site info
    saveSiteInfoBtn.addEventListener("click", saveSiteInfo);
    resetSiteInfoBtn.addEventListener("click", resetSiteInfo);

    // Render initial
    renderFaqs();
    loadSiteInfoToForm();
  }

  /* LOGIN (falso) */
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
  function showPanel(){
    loginScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    renderFaqs();
    loadSiteInfoToForm();
  }

  /* SECCIONES */
function openSection(name){
    sectionTitle.textContent = name === "faqs" ? "Editar FAQs" :
                                name === "siteinfo" ? "Editar información del sitio" :
                                name === "docs" ? "Administrar documentos" :
                                name === "tarjetas" ? "Editar tarjetas" :
                                "Sugerencias";

    // Ocultar todas las secciones
    document.querySelectorAll(".panel-section").forEach(s => s.classList.add("hidden"));

    if(name === "faqs")
        document.getElementById("faqsSection").classList.remove("hidden");

    if(name === "siteinfo")
        document.getElementById("siteinfoSection").classList.remove("hidden");

    if(name === "docs")
        document.getElementById("docsSection").classList.remove("hidden");

    if(name === "sugerencias") {
        document.getElementById("sugerenciasSection").classList.remove("hidden");
        renderSugerencias();
    }
    /* 👉 Aquí está la sección nueva de tarjetas */
    if(name === "tarjetas") {
        document.getElementById("tarjetasSection").classList.remove("hidden");
        mostrarTarjetasEnAdmin(); // actualizar lista
    }
}


  /* FAQs CRUD (LocalStorage) */
  function getFaqs(){ return _getLS(LS_KEYS.faqs, defaultFaqs()); }
  function saveFaqs(list){ _setLS(LS_KEYS.faqs, list); renderFaqs(); }

  function defaultFaqs(){
    // Si no hay FAQs guardadas, inicializa con cinco ejemplos (coinciden con tu index)
    return [
      { id: uid(), q: "¿Cuáles son los requisitos para una validación?", a: "La validación requiere... (texto editable por el admin)" },
      { id: uid(), q: "¿Qué debo saber sobre homologaciones?", a: "Para una homologación se necesita... (texto editable por el admin)" },
      { id: uid(), q: "¿Cómo funciona la transferencia o cambio de carrera?", a: "Para cambio de carrera... (texto editable por el admin)" },
      { id: uid(), q: "¿Cómo solicitar matrícula extemporánea?", a: "La matrícula extemporánea se solicita... (texto editable por el admin)" },
      { id: uid(), q: "Información sobre becas", a: "Las becas disponibles son... (texto editable por el admin)" }
    ];
  }

  function renderFaqs(){
    const list = getFaqs();
    faqsList.innerHTML = "";
    if(!list.length){
      faqsList.innerHTML = "<p class='muted'>No hay FAQs. Agrega la primera usando el formulario.</p>";
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

    // Attach actions
    faqsList.querySelectorAll(".editBtn").forEach(b => b.addEventListener("click", startEdit));
    faqsList.querySelectorAll(".saveBtn").forEach(b => b.addEventListener("click", saveEdit));
    faqsList.querySelectorAll(".cancelBtn").forEach(b => b.addEventListener("click", cancelEdit));
    faqsList.querySelectorAll("button[title='Eliminar']").forEach(b => b.addEventListener("click", deleteFaq));
  }

  function startEdit(e){
    const id = e.target.dataset.id;
    const container = e.target.closest(".faq-item-admin");
    const h4 = container.querySelector("h4");
    const ans = container.querySelector(".answer");

    // Make editable
    const qText = h4.textContent;
    const aText = ans.textContent;
    h4.contentEditable = true;
    ans.contentEditable = true;
    container.querySelector(".editBtn").classList.add("hidden");
    container.querySelector(".saveBtn").classList.remove("hidden");
    container.querySelector(".cancelBtn").classList.remove("hidden");
  }
  function saveEdit(e){
    const id = e.target.dataset.id;
    const container = e.target.closest(".faq-item-admin");
    const h4 = container.querySelector("h4");
    const ans = container.querySelector(".answer");
    const list = getFaqs();
    const idx = list.findIndex(x => x.id === id);
    if(idx === -1) return;
    list[idx].q = h4.textContent.trim();
    list[idx].a = ans.textContent.trim();
    saveFaqs(list);
    // toggle buttons
    container.querySelector(".editBtn").classList.remove("hidden");
    container.querySelector(".saveBtn").classList.add("hidden");
    container.querySelector(".cancelBtn").classList.add("hidden");
    h4.contentEditable = false; ans.contentEditable = false;
  }
  function cancelEdit(e){
    // re-render to reset
    renderFaqs();
  }
  function deleteFaq(e){
    if(!confirm("¿Eliminar esta FAQ? Esta acción no se puede deshacer.")) return;
    const id = e.target.dataset.id;
    const list = getFaqs().filter(x => x.id !== id);
    saveFaqs(list);
  }

  function addFaq(question, answer){
    if(!question || !answer){ alert("Pregunta y respuesta obligatorias."); return; }
    const list = getFaqs();
    list.unshift({ id: uid(), q: question, a: answer });
    saveFaqs(list);
    renderFaqs();
  }

  // Site info
  function loadSiteInfoToForm(){
    const info = _getLS(LS_KEYS.siteinfo, defaultSiteInfo());
    bannerText.value = info.bannerText || "";
    searchTitle.value = info.searchTitle || "";
    footerText.value = info.footerText || "";
  }
  function defaultSiteInfo(){
    return {
      bannerText: "Banner Institucional - Licenciatura en Matemáticas",
      searchTitle: "¿Qué necesitas saber?",
      footerText: "© 2025 Facultad de Matemáticas - Universidad del Tolima\nDesarrollado por Kevin Andrés Gómez Garzón"
    };
  }
  function saveSiteInfo(){
    const payload = {
      bannerText: bannerText.value.trim(),
      searchTitle: searchTitle.value.trim(),
      footerText: footerText.value.trim()
    };
    _setLS(LS_KEYS.siteinfo, payload);
    alert("Información del sitio guardada en LocalStorage.");
  }
  function resetSiteInfo(){
    if(!confirm("Restablecer la información del sitio a valores por defecto?")) return;
    _setLS(LS_KEYS.siteinfo, defaultSiteInfo());
    loadSiteInfoToForm();
  }

  /* ============================================================
   SUGERENCIAS - CRUD EN LOCALSTORAGE
   ============================================================ */

  const LS_SUGERENCIAS = "sugerenciasList";

  /* Obtener lista completa */
  function getSugerencias() {
      try {
          return JSON.parse(localStorage.getItem(LS_SUGERENCIAS)) || [];
      } catch {
          return [];
      }
  }

  /* Guardar lista */
  function saveSugerencias(list) {
      localStorage.setItem(LS_SUGERENCIAS, JSON.stringify(list));
  }

  /* Renderizar sugerencias en el Admin */

  function renderSugerencias() {

      const cont = document.getElementById("sugerenciasList");

      if (!cont) return;

      const list = getSugerencias();
      cont.innerHTML = "";

      if (!list.length) {
          cont.innerHTML = "<p class='muted'>No hay sugerencias todavía.</p>";
          return;
      }

      list.forEach((s, index) => {

          const box = document.createElement("div");
          box.className = "sug-item-admin";

          box.innerHTML = `
              <h4>${escapeHtml(s.nombre || "Anónimo")} — 
                  <span style='font-size:14px;color:#555;'>${escapeHtml(s.email || "Sin correo")}</span>
              </h4>

              <p style="white-space:pre-wrap;">${escapeHtml(s.texto)}</p>

              <div class="sug-actions">
                  <button class="btn" style="background:#e74c3c;color:#fff;"
                          onclick="borrarSugerencia(${index})">
                      Eliminar
                  </button>
              </div>
              <hr>
          `;


          cont.appendChild(box);
      });
  }





  // simple escape for rendering safe text nodes
  function escapeHtml(str){
    if(!str) return "";
    return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  // run
  document.addEventListener("DOMContentLoaded", init);
  window.renderSugerencias = renderSugerencias;
  window.getSugerencias = getSugerencias;


})();

  /* Eliminar 1 sugerencia */
function borrarSugerencia(index) {
    let lista = window.getSugerencias();
    lista.splice(index, 1);
    localStorage.setItem("sugerenciasList", JSON.stringify(lista));
    window.renderSugerencias();
}




function obtenerTarjetas() {
    return JSON.parse(localStorage.getItem("tarjetasInfo")) || [];
}

function guardarTarjetas(tarjetas) {
    localStorage.setItem("tarjetasInfo", JSON.stringify(tarjetas));
    alert("Cambios guardados correctamente");
}

function mostrarTarjetasEnAdmin() {
    const lista = document.getElementById("lista-tarjetas");
    if (!lista) return;

    const tarjetas = obtenerTarjetas();
    lista.innerHTML = "";

    tarjetas.forEach((t, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${t.titulo}</strong>
            <button onclick="editarTarjeta(${index})">Editar</button>
            <button onclick="eliminarTarjeta(${index})" style="color:red;">Eliminar</button>
        `;

        lista.appendChild(li);
    });
}

document.getElementById("btn-agregar-tarjeta").addEventListener("click", () => {
    const titulo = document.getElementById("titulo-tarjeta").value.trim();
    const contenido = document.getElementById("contenido-tarjeta").value.trim();

    if (!titulo || !contenido) {
        alert("Debe completar ambos campos");
        return;
    }

    const tarjetas = obtenerTarjetas();
    tarjetas.push({ titulo, contenido });

    guardarTarjetas(tarjetas);
    mostrarTarjetasEnAdmin();
});

function eliminarTarjeta(index) {
    const tarjetas = obtenerTarjetas();
    tarjetas.splice(index, 1);
    guardarTarjetas(tarjetas);
    mostrarTarjetasEnAdmin();
}

function editarTarjeta(index) {
    const tarjetas = obtenerTarjetas();
    const nueva = prompt("Nuevo contenido:", tarjetas[index].contenido);

    if (nueva !== null) {
        tarjetas[index].contenido = nueva;
        guardarTarjetas(tarjetas);
        mostrarTarjetasEnAdmin();
    }
}

