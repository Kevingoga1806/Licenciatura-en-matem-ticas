/* load_faqs.js — leer faqs desde /faqs.json con fallback a localStorage */
(() => {
  const LS_KEY = "math_portal_faqs";

  function escapeHtml(str){
    return (''+str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  async function fetchDataOrLS(url, lsKey, defaultValue = []) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('fetch failed, fallback to localStorage', e);
    }
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async function applyFaqsToIndex(){
    const faqs = await fetchDataOrLS('/faqs.json', LS_KEY, []);
    if(!faqs || !Array.isArray(faqs) || faqs.length===0) return;
    const faqSection = document.querySelector("section.faq");
    if(!faqSection) return;
    faqSection.innerHTML = "<h2>Preguntas frecuentes</h2>";
    faqs.forEach(item => {
      const div = document.createElement("div");
      div.className = "faq-item";
      const q = item.question || item.q || item.pregunta || '';
      const a = item.answer || item.a || item.respuesta || '';
      div.innerHTML = `<h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p>`;
      div.addEventListener("click", () => div.classList.toggle("open"));
      faqSection.appendChild(div);
    });
  }

  async function applyFaqsToContacto(){
    const faqs = await fetchDataOrLS('/faqs.json', LS_KEY, []);
    if(!faqs || !Array.isArray(faqs) || faqs.length===0) return;
    const cont = document.querySelector(".contacto-fichas");
    if(!cont) return;
    cont.innerHTML = "<h2>Preguntas Frecuentes</h2>";
    faqs.forEach(item => {
      const f = document.createElement("div");
      f.className = "ficha";
      const q = item.question || item.q || item.pregunta || '';
      const a = item.answer || item.a || item.respuesta || '';
      f.innerHTML = `
        <div class="ficha-pregunta">${escapeHtml(q)}</div>
        <div class="ficha-respuesta">${escapeHtml(a)}</div>
      `;
      f.addEventListener("click", () => f.classList.toggle("open"));
      cont.appendChild(f);
    });
  }

  async function applySiteInfo(){
    // si tu siteinfo sigue en LS, lo dejamos igual (puedes migrarlo después)
    const raw = localStorage.getItem("math_portal_siteinfo");
    if(!raw) return;
    try{
      const info = JSON.parse(raw);
      const banner = document.querySelector(".banner img");
      if (banner && info.bannerText) banner.alt = info.bannerText;
      const t = document.querySelector(".buscador-section h2");
      if (t && info.searchTitle) t.textContent = info.searchTitle;
      const foot = document.querySelector(".footer");
      if (foot && info.footerText) foot.querySelector("p").textContent = info.footerText.split("\n")[0] || info.footerText;
    }catch{}
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyFaqsToIndex();
    applyFaqsToContacto();
    applySiteInfo();
  });
})();

})();
