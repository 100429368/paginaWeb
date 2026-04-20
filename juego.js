// ==========================================
// 1. VARIABLES GLOBALES
// ==========================================
var canvas;
var ctx;
var intervalId = 0;
var puntos = 0;
var jugador;
var coches = [];
var h = 40
var fondo
const video = document.getElementById('miVideo');
const teclasPresionadas = {};

// ==========================================
// 2. DEFINICIÓN DE CLASES
// ==========================================
class Jugador {
    constructor(x, y) {
        this.size = 20;
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.vx = 0;
        this.velocidadMax = 5;
        this.imagen = new Image();
        this.imagen.src = 'jugador.png'; // TODO CAMBIAR AQUI IMAGEN DEL JUGADOR
    }
    
    actualizar(limiteAlto,limiteAncho){
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x + this.size > limiteAncho) this.x = limiteAncho - this.size;
        if (this.y + this.size > limiteAlto) this.y = limiteAlto - this.size;
    }


 dibujar(ctx) {
            ctx.drawImage(this.imagen, this.x , this.y, this.size, this.size);
    }
}


class Coche {
    constructor(x, y, w, h, v) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.v = v;

        if (this.w === 30) {
            this.imagen = new Image();
            this.imagen.src = 'cochePeque.png'; // TODO CAMBIAR AQUI IMAGEN DEL COCHE
        } if (this.w === 45) {
            this.imagen = new Image();
            this.imagen.src = 'cochePeque.png'; // TODO CAMBIAR AQUI IMAGEN DEL COCHE
        } else {
            this.imagen = new Image(); //tamaño = 60
            this.imagen.src = 'cochePeque.png'; // TODO CAMBIAR AQUI IMAGEN DEL COCHE
        }
    }

    actualizarPosicion(limiteAncho) {
        this.x += this.v;
        // Efecto bucle: si sale por un lado, entra por el otro
        if (this.v > 0 && this.x > limiteAncho) this.x = -this.w;
        if (this.v < 0 && (this.x + this.w) < 0) this.x = limiteAncho;
    }

    dibujar(ctx) {
    if (this.v > 0) {
        //  EFECTO ESPEJO PARA VELOCIDAD POSITIVA 
        ctx.save(); // Guardamos el estado actual (rotación 0, escala 1, etc.)
        ctx.translate(this.x + this.w, this.y); 
        ctx.scale(-1, 1); //giro espejho
        ctx.drawImage(this.imagen, 0, 0, this.w, this.h);//corrección, el espejo NO es desde el centro :(
        ctx.restore(); // Restauramos el contexto para que el siguiente dibujo sea normal
    } else {
        // DIBUJO NORMAL PARA VELOCIDAD NEGATIVA 
        ctx.drawImage(this.imagen, this.x, this.y, this.w, this.h);
    }
}
    colisionaCon(j) {
        return (j.x < this.x + this.w && 
                j.x + j.size > this.x && 
                j.y < this.y + this.h && 
                j.y + j.size > this.y);
    }
}

class Fondo {
    constructor(rutas) {
        this.imagenes = rutas;
        this.indice = 0;
        this.imagen = new Image();
        this.imagen.src = this.imagenes[this.indice];
    }

    cambiar(puntos) {
        // Aseguramos que el índice no supere el tamaño del array de imágenes
        this.indice = puntos % this.imagenes.length;
        this.imagen.src = this.imagenes[this.indice];
    }

    reiniciar() {
        this.indice = 0;
        this.imagen.src = this.imagenes[0];
    }

    dibujar(ctx, width, height) {
        if (this.imagen.complete) {
            ctx.drawImage(this.imagen, 0, 0, width, height);
        }
    }
}


// ==========================================
// 3. FUNCIONES DEL JUEGO
// ==========================================
function crearCoches() {
    coches = [];
    const filas = 8;
    const margenSuelo = 60;
    const margenTecho = 40;
    const zonaTráfico = canvas.height - margenSuelo - margenTecho;
    const distanciaEntreFilas = zonaTráfico / filas;
    const tamañosPosibles = [30, 45, 60]; 

    //creamos un array del tamaño filas, lo rellenamos con "undefined" y por cada elemento, lo rellenamos
    Array(filas).fill().forEach((_, i) => {
        let y = margenTecho + (i * distanciaEntreFilas);
        
        // 2. Seleccionamos un índice al azar entre 0 y 2
        let indiceAleatorio = Math.floor(Math.random() * tamañosPosibles.length);
        let anchoCoche = tamañosPosibles[indiceAleatorio];

        let velocidad = (Math.random() * 3 + 1) * (i % 2 === 0 ? 1 : -1);
        coches.push(new Coche(Math.random() * canvas.width, y, anchoCoche, h, velocidad));
    });
}
function pintar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fondo.dibujar(ctx, canvas.width, canvas.height);

    let colisionDetectada = false;

    // 1. Gestionar movimiento suave del jugador
    gestionarTeclado();
    jugador.actualizar(canvas.width, canvas.height);

    // 2. Coches (usando forEach como pediste)
    coches.forEach((coche) => {
        coche.actualizarPosicion(canvas.width);
        coche.dibujar(ctx);

        if (coche.colisionaCon(jugador)) {
            colisionDetectada = true;
        }
    });

    if (colisionDetectada) {
        playstop(); 
        reproducirVideo();
        return; 
    }

    // 3. Dibujar jugador
    jugador.dibujar(ctx);

    // 4. Meta
    if (jugador.y <= 0) {
        puntos++;
        log("Partido en juego. Puntos: " + puntos);
        jugador.y = canvas.height - jugador.size - 10; 
        actualizarVelocidadCoches();
        cambiarFondo();
    }
}
function cambiarFondo() {
    fondo.cambiar(puntos);
}

function actualizarVelocidadCoches() {
    coches.forEach(coche => {
        coche.v *= 2; 
    });
}

function playstop() {
    const video = document.getElementById('miVideo');
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = 0;
        log("Fin del juego. Puntuación: " + puntos);
    } else {
        video.pause();
        video.style.display = "none"; // Escondemos el vídeo
        puntos = 0;
        fondo.reiniciar();
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

function resizeCanvas() {
    let ancho = window.innerWidth * 0.9;
    
    if (ancho > 800) ancho = 800;

    canvas.width = ancho;
    canvas.height = ancho * (2 / 3); 

    if (jugador) {
        jugador.x = canvas.width / 2 - 10;
        jugador.y = canvas.height - 30;
    }
    if (intervalId) {
        crearCoches(); 
    }
}

function gestionarTeclado() {
    // Reseteamos velocidad y la aplicamos según las teclas activas
    jugador.vx = 0;
    jugador.vy = 0;

    if (teclasPresionadas[38]) jugador.vy = -jugador.velocidadMax; // Arriba
    if (teclasPresionadas[40]) jugador.vy = jugador.velocidadMax;  // Abajo
    if (teclasPresionadas[37]) jugador.vx = -jugador.velocidadMax; // Izquierda
    if (teclasPresionadas[39]) jugador.vx = jugador.velocidadMax;  // Derecha
}

// ==========================================
// 4. ARRANQUE (Al cargar la ventana!!)
// ==========================================
window.onload = function() {
    canvas = document.getElementById("canvas");
    const rutasFondo = ['fondo.png', 'fondo2.png', 'fondo3.png', 'fondo4.png', 'fondo5.png']; // TODO CAMBIAR AQUI NOMBRE DE IMAGENES  DEL FONDO
    fondo = new Fondo(rutasFondo);
    
    if (canvas && canvas.getContext) {
        ctx = canvas.getContext("2d");

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        var boton = document.getElementById("playButton");
        if (boton) boton.addEventListener("click", playstop);

        document.addEventListener("keydown", function(event) {
            const teclasJuego = [37, 38, 39, 40]; 
            if (intervalId) { 
                if (teclasJuego.includes(event.keyCode)) {
                    event.preventDefault();// ESTO ES PARA QUE NO HAGA SCROLL LA PANTALLA!!! Fuente:google, no lo conozco
                }
                jugador.mover(event.keyCode, canvas.width, canvas.height);
            }
        });
        
        // Inicia el juego nada más abrir la página
        playstop(); 
    } else {
        alert("Tu navegador no soporta Canvas.");
    }

    /*SI TERMINA EL VÍDEO:  */
    // Buscamos el video
    const videoGameOver = document.getElementById('miVideo');

    // Le decimos escuchador del evento 'ended' (cuando termina el video)
    //Evento que NO es de usuario!!
    videoGameOver.addEventListener('ended', function() {
        //Esconder vídeo
        videoGameOver.style.display = "none";
        //reiniciar
        playstop(); 
    });
};

// ==========================================
// 5. FUNCIONES DEL VÍDEO
// ==========================================
function reproducirVideo() {
    const video = document.getElementById('miVideo');
    video.style.display = "block";
    video.currentTime = 0;
    video.play();
}

/*EVENTOS*/

// Eventos globales
document.addEventListener("keydown", (e) => { 
    teclasPresionadas[e.keyCode] = true; 
    if([37,38,39,40].includes(e.keyCode)) e.preventDefault();
});
document.addEventListener("keyup", (e) => { 
    teclasPresionadas[e.keyCode] = false; 
});