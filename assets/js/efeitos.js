// Funções puras dos efeitos da home (sem DOM), testáveis em Node.

export function pesoPorDistancia(dist, { repouso = 350, pico = 800, raio = 240 } = {}) {
  if (!(dist < raio)) return repouso;
  const t = Math.max(0, dist) / raio;
  const suave = (1 + Math.cos(Math.PI * t)) / 2; // 1 no centro, 0 na borda
  return repouso + (pico - repouso) * suave;
}

const limita = (n, min, max) => Math.min(max, Math.max(min, n));

export function inclinacao(nx, ny) {
  return {
    rotY: limita(nx, -1, 1) * 30 + 0, // + 0 normaliza -0
    rotX: -limita(ny, -1, 1) * 22 + 0,
  };
}

export function suportaGiroscopio(win) {
  const D = win && win.DeviceOrientationEvent;
  if (!D) return 'nao';
  return typeof D.requestPermission === 'function' ? 'permissao' : 'sim';
}

export function escalaComputador(larguraDisponivel, base = 1280) {
  const e = larguraDisponivel / base;
  if (!(e > 0)) return 0.01;
  return Math.min(1, e);
}
