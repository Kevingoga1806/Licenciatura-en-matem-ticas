document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contactForm");

    form.addEventListener("submit", function (e) {
        e.preventDefault(); // ⛔ Detiene envío automático

        alert("📩 Tu mensaje ha sido enviado con éxito. Pronto recibirás respuesta.");

        // ✅ Enviar formulario manualmente después de la alerta
        form.submit();
    });
});
