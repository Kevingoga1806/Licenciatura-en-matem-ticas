/* sugerencias.js CORREGIDO */

/* IIFE */
(() => {

  const LS_KEY = "sugerenciasList";

  // 1. Elementos correctos del HTML
  const form = document.getElementById("formSugerencia");
  const nombre = document.getElementById("nombre");
  const email = document.getElementById("correo");
  const tipo = document.getElementById("tipo");
  const texto = document.getElementById("mensaje");
  const feedback = document.getElementById("sug-feedback");
  const btnLimpiar = document.getElementById("btnLimpiar");

  // 2. Helpers localStorage
  function _get() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _set(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  // 3. Feedback visual temporal
  function mostrarFeedback(msg, tipoClass = "success") {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.className = `feedback ${tipoClass}`;
    feedback.classList.remove("hidden");

    setTimeout(() => {
      feedback.classList.add("hidden");
    }, 2500);
  }

  // 4. Limpia formulario
  function limpiarFormulario() {
    nombre.value = "";
    email.value = "";
    tipo.selectedIndex = 0;
    texto.value = "";
  }

  // 5. Genera objeto sugerencia
  function crearSugerenciaObj() {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nombre: nombre.value.trim(),
      email: email.value.trim(),
      tipo: tipo.value,
      texto: texto.value.trim(),
      createdAt: new Date().toISOString(),
      estado: "nueva"
    };
  }

  // 6. Submit del formulario
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!texto.value.trim()) {
        mostrarFeedback("Escribe tu sugerencia antes de enviar.", "error");
        return;
      }

      const lista = _get();
      lista.unshift(crearSugerenciaObj());
      _set(lista);

      limpiarFormulario();
      mostrarFeedback("Gracias, tu sugerencia fue enviada.", "success");
      showSuccessPopup();
    });
  }

  // 7. Botón limpiar
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", limpiarFormulario);
  }

})();
  
// 8. Popup verde de éxito
function showSuccessPopup() {
  const popup = document.getElementById("successPopup");
  if (!popup) return;

  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2000);
}
