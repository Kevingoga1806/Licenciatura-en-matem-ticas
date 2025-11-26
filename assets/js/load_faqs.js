/* load_faqs.js — carga FAQs y siteinfo desde LocalStorage y reemplaza contenido público */
(() => {
  const LS_KEYS = {
    faqs: "math_portal_faqs",
    siteinfo: "math_portal_siteinfo"
  };

  function _getLS(k, d){
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; }
    catch(e){ return d; }
  }

  function applyFaqsToIndex(){
    const faqs = _getLS(LS_KEYS.faqs, null);
    if(!faqs) return; // no hay nada guardado
    const faqSection = document.querySelector("section.faq");
    if(!faqSection) return;
    // Clear then build
    faqSection.innerHTML = "<h2>Preguntas frecuentes</h2>";
    faqs.forEach(item => {
      const div = document.createElement("div");
      div.className = "faq-item";
      div.innerHTML = `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`;
      // preserve toggle handler if exists
      div.addEventListener("click", () => {
        div.classList.toggle("open");
      });
      faqSection.appendChild(div);
    });
  }

  function applyFaqsToContacto(){
    const faqs = _getLS(LS_KEYS.faqs, null);
    if(!faqs) return;
    const cont = document.querySelector(".contacto-fichas");
    if(!cont) return;
    cont.innerHTML = "<h2>Preguntas Frecuentes</h2>";
    faqs.forEach(item => {
      const f = document.createElement("div");
      f.className = "ficha";
      f.textContent = item.q;
      // al hacer click se muestra alerta con respuesta (puedes cambiar por modal)
      // Crear tarjeta FAQ con respuesta oculta
      f.innerHTML = `
          <div class="ficha-pregunta">${escapeHtml(item.q)}</div>
          <div class="ficha-respuesta">
              ${escapeHtml(item.a)}
          </div>
      `;

      // Toggle para expandir / contraer
      f.addEventListener("click", () => {
          f.classList.toggle("open");
      });

      cont.appendChild(f);

    });
  }

  function applySiteInfo(){
    const info = _getLS(LS_KEYS.siteinfo, null);
    if(!info) return;
    // Banner alt or description
    const banner = document.querySelector(".banner img");
    if(banner && info.bannerText) banner.alt = info.bannerText;
    // Search title
    const t = document.querySelector(".buscador-section h2");
    if(t && info.searchTitle) t.textContent = info.searchTitle;
    // Footer
    const foot = document.querySelector(".footer");
    if(foot && info.footerText) foot.querySelector("p").textContent = info.footerText.split("\n")[0] || info.footerText;
  }

  function escapeHtml(str){
    return (''+str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyFaqsToIndex();
    applyFaqsToContacto();
    applySiteInfo();
  });
})();
