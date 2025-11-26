/* ------------------------------------------------------
   SISTEMA DE TARJETAS – PORTAL INFORMATIVO UT
   Animación suave + Expansibles + Buscador dinámico
   100% compatible con admin.js
------------------------------------------------------ */

// -----------------------------------
// Obtener tarjetas desde localStorage
// -----------------------------------
function obtenerTarjetas() {
    return JSON.parse(localStorage.getItem("tarjetasInfo")) || [];
}

// -----------------------------------
// Guardar tarjetas (para uso del admin)
// -----------------------------------
function guardarTarjetas(tarjetas) {
    localStorage.setItem("tarjetasInfo", JSON.stringify(tarjetas));
}

// ------------------------------------
// Renderizar tarjetas (inicio y filtro)
// ------------------------------------
function renderizarTarjetas(lista) {
    const container = document.getElementById("tarjetas-container");
    if (!container) return;

    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = `<p style="padding: 15px;">No se encontraron resultados.</p>`;
        return;
    }

    lista.forEach((tarjeta, index) => {
        const div = document.createElement("div");
        div.classList.add("tarjeta");

        // Animación en cascada
        div.style.animationDelay = (index * 90) + "ms";

        div.innerHTML = `
            <div class="tarjeta-titulo toggle-tarjeta">
                ${tarjeta.titulo}
            </div>

            <div class="tarjeta-contenido">
                ${tarjeta.contenido}
            </div>
        `;

        // Expandible
        const titulo = div.querySelector(".toggle-tarjeta");
        const contenido = div.querySelector(".tarjeta-contenido");

        titulo.addEventListener("click", () => {
            contenido.classList.toggle("expandida");
        });

        container.appendChild(div);
    });
}

// -----------------------------------------------------
// Cargar TODAS las tarjetas al inicio (con animación)
// -----------------------------------------------------
function cargarTarjetasEnInicio() {
    const tarjetas = obtenerTarjetas();
    renderizarTarjetas(tarjetas);
}

// -----------------------------------------------
// BUSCADOR dinámico (en tiempo real)
// -----------------------------------------------
function agregarBuscador() {
    const buscador = document.getElementById("buscadorInput");
    const lupa = document.getElementById("lupaBuscar");

    if (!buscador) return;

    function filtrar() {
        const texto = buscador.value.toLowerCase();
        const tarjetas = obtenerTarjetas();

        const filtradas = tarjetas.filter(t =>
            t.titulo.toLowerCase().includes(texto) ||
            t.contenido.toLowerCase().includes(texto)
        );

        renderizarTarjetas(filtradas);
    }

    buscador.addEventListener("input", filtrar);

    if (lupa) {
        lupa.addEventListener("click", filtrar);
    }
}

// -------------------------------
// Inicializar todo al cargar página
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
    cargarTarjetasEnInicio();
    agregarBuscador();
});
