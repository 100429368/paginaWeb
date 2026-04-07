// ==========================================
// 1. VARIABLES GLOBALES
// ==========================================
var canvas;
var ctx;
var intervalId = 0;
var puntos = 0;
var jugador;
var coches = [];

// ==========================================
// 2. DEFINICIÓN DE CLASES
// ==========================================
class Jugador {
    constructor(x, y) {
        this.size = 20;
        this.x = x;
        this.y = y;
    }

    mover(tecla, limiteAncho, limiteAlto) {
        var salto = 25;
        if (tecla == 38) this.y -= salto; // Arriba
        if (tecla == 40) this.y += salto; // Abajo
        if (tecla == 37) this.x -= salto; // Izquierda
        if (tecla == 39) this.x += salto; // Derecha

        // Comprobar límites para no salirse del canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.size > limiteAncho) this.x = limiteAncho - this.size;
        if (this.y + this.size > limiteAlto) this.y = limiteAlto - this.size;
    }

    dibujar(ctx) {
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Coche {
    constructor(x, y, w, h, v) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.v = v;
    }

    actualizarPosicion(limiteAncho) {
        this.x += this.v;
        // Efecto bucle: si sale por un lado, entra por el otro
        if (this.v > 0 && this.x > limiteAncho) this.x = -this.w;
        if (this.v < 0 && (this.x + this.w) < 0) this.x = limiteAncho;
    }

    dibujar(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    colisionaCon(j) {
        return (j.x < this.x + this.w && 
                j.x + j.size > this.x && 
                j.y < this.y + this.h && 
                j.y + j.size > this.y);
    }
}

// ==========================================
// 3. FUNCIONES DEL JUEGO
// ==========================================
function crearCoches() {
    coches = [];
    const filas = 8;        // nº filas coches
    const margenSuelo = 60; // Espacio del inicio
    const margenTecho = 40; // Espacio del final
    
    const zonaTráfico = canvas.height - margenSuelo - margenTecho; //Espacio donde hay coches
    const distanciaEntreFilas = zonaTráfico / filas;

    for (let i = 0; i < filas; i++) {
        let y = margenTecho + (i * distanciaEntreFilas);
        let anchoCoche = 30 + Math.random() * 30; // diferentes tamaños de coche
        let velocidad = (Math.random() * 3 + 1) * (i % 2 === 0 ? 1 : -1); // Dirección alterna
        coches.push(new Coche(Math.random() * canvas.width, y, anchoCoche, 20, velocidad));// Crea coche
    }
}

function pintar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < coches.length; i++) {
        coches[i].actualizarPosicion(canvas.width);
        coches[i].dibujar(ctx);

        if (coches[i].colisionaCon(jugador)) {
            playstop(); // Fin del juego
            return; 
        }
    }

    jugador.dibujar(ctx);

    // Llegar a la meta (borde superior)
    if (jugador.y <= 0) {
        puntos++;
        log("¡Bien hecho! Puntos: " + puntos);
        jugador.y = canvas.height - jugador.size - 10; 
    }
}

function playstop() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = 0;
        log("Fin del juego. Puntuación: " + puntos);
    } else {
        puntos = 0;
        log("Partido en juego. Puntos: " + puntos);
        
        jugador = new Jugador(canvas.width / 2 - 10, canvas.height - 30);
        crearCoches();

        intervalId = setInterval(pintar, 20);
    }
}

function log(text) {
    var logDiv = document.getElementById("log");
    if (logDiv) logDiv.innerHTML = text;
}

// ==========================================
// 4. ARRANQUE (Al cargar la ventana)
// ==========================================
window.onload = function() {
    canvas = document.getElementById("canvas");
    
    if (canvas && canvas.getContext) {
        ctx = canvas.getContext("2d");

        var boton = document.getElementById("playButton");
        if (boton) boton.addEventListener("click", playstop);

        document.addEventListener("keydown", function(event) {
            if (intervalId) { 
                jugador.mover(event.keyCode, canvas.width, canvas.height);
            }
        });
        
        // Inicia el juego nada más abrir la página
        playstop(); 
    } else {
        alert("Tu navegador no soporta Canvas.");
    }
};