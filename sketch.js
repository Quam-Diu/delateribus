/* Red sutil con p5.js — De Lateribus
   Parámetros que puedes ajustar rápidamente:
*/
const PARAMS = {
  NODE_COUNT: 90,           // número de nodos (sube/baja según tu gusto/performance)
  LINK_RADIUS: 120,         // distancia máxima para conectar nodos (px)
  BASE_NODE_SIZE: 2.4,      // tamaño base del nodo
  HOVER_RADIUS: 110,        // radio de influencia del cursor
  DRIFT_STRENGTH: 0.45,     // intensidad del “aliento” (deriva) del ruido Perlin
  NOISE_SCALE: 0.0009,      // escala del ruido espacial
  NOISE_TIME_SCALE: 0.002,  // velocidad del tiempo en el ruido
  BG_COLOR: [15, 17, 22],   // fondo
  FG_COLOR: [220, 224, 235] // color base para líneas/nodos
};

let nodes = [];
let t0;

function setup() {
  const wrap = document.getElementById('canvas-wrap');
  const w = Math.min(window.innerWidth, 980);
  const h = Math.round(w * 0.45);
  const c = createCanvas(w, h);
  c.parent(wrap);
  pixelDensity(1);

  t0 = random(1000);
  initNodes();
  noStroke();
}

function windowResized() {
  const w = Math.min(window.innerWidth, 980);
  const h = Math.round(w * 0.45);
  resizeCanvas(w, h);
  // Opcional: reubicar nodos al redimensionar
  // initNodes(); // comenta si prefieres mantener posiciones relativas
}

function initNodes() {
  nodes = [];
  for (let i = 0; i < PARAMS.NODE_COUNT; i++) {
    nodes.push({
      x: random(width),
      y: random(height),
      // Semillas para el ruido por nodo (independiza las trayectorias)
      nx: random(1000), 
      ny: random(1000),
      deg: 0 // grado (se recalcula cada frame)
    });
  }
}

function draw() {
  background(PARAMS.BG_COLOR[0], PARAMS.BG_COLOR[1], PARAMS.BG_COLOR[2]);

  const t = (millis() * PARAMS.NOISE_TIME_SCALE) + t0;

  // 1) Actualizar posiciones con ruido (deriva muy sutil)
  for (let n of nodes) {
    const ax = (noise(n.nx + n.x * PARAMS.NOISE_SCALE, t) - 0.5) * PARAMS.DRIFT_STRENGTH;
    const ay = (noise(n.ny + n.y * PARAMS.NOISE_SCALE, t + 1234) - 0.5) * PARAMS.DRIFT_STRENGTH;
    n.x = constrain(n.x + ax, 0, width);
    n.y = constrain(n.y + ay, 0, height);
    n.deg = 0; // lo recalcularemos
  }

  // 2) Dibujar enlaces (líneas) con opacidad según distancia
  //    y calcular el "grado" de cada nodo
  const maxD = PARAMS.LINK_RADIUS;
  strokeWeight(1);
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < maxD) {
        // Opacidad y grosor suaves con distancia
        const alpha = map(d, 0, maxD, 180, 0, true); // 0–180 (sutil)
        const w = map(d, 0, maxD, 1.5, 0.4, true);
        stroke(PARAMS.FG_COLOR[0], PARAMS.FG_COLOR[1], PARAMS.FG_COLOR[2], alpha);
        strokeWeight(w);
        line(a.x, a.y, b.x, b.y);

        a.deg++;
        b.deg++;
      }
    }
  }

  // 3) Dibujar nodos (tamaño según grado, opacidad suave)
  noStroke();
  for (let n of nodes) {
    const base = PARAMS.BASE_NODE_SIZE;
    const size = base + Math.min(4, Math.sqrt(n.deg) * 0.6);
    fill(PARAMS.FG_COLOR[0], PARAMS.FG_COLOR[1], PARAMS.FG_COLOR[2], 180);
    circle(n.x, n.y, size);
  }

  // 4) Resaltar cercanos al cursor (hover sutil)
  if (mouseX >= 0 && mouseY >= 0 && mouseX <= width && mouseY <= height) {
    const r = PARAMS.HOVER_RADIUS;
    const r2 = r * r;
    noStroke();
    for (let n of nodes) {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      const d2 = dx*dx + dy*dy;
      if (d2 < r2) {
        const k = 1 - (Math.sqrt(d2) / r); // 0..1
        const halo = 2 + k * 4;
        fill(130, 180, 255, 60 + 80 * k); // leve aura
        circle(n.x, n.y, (PARAMS.BASE_NODE_SIZE + 2) + halo);
      }
    }
  }
}