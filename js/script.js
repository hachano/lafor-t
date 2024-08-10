document.addEventListener('DOMContentLoaded', function () {
    // Obtener el modal
    var modal = document.getElementById("postModal");
    var btn = document.getElementById("openModalBtn");
    var span = document.getElementsByClassName("close")[0];

    // Cuando el usuario hace clic en el botón, abrir el modal
    btn.onclick = function() {
        modal.style.display = "block";
    }

    // Cuando el usuario hace clic en <span> (x), cerrar el modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Cuando el usuario hace clic en cualquier parte fuera del modal, también cerrarlo
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Manejar el envío del formulario
    document.getElementById("postForm").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevenir el envío del formulario por defecto
        // Aquí puedes manejar el envío del formulario, por ejemplo usando fetch o XMLHttpRequest
        // Para simplificar, solo muestra un mensaje
        alert("Post publicado.");
        modal.style.display = "none"; // Cerrar el modal
    });
});
