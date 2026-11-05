// Cena 3D do gol: chute de chuteira, bola no ângulo, rede estufando, estádio à noite.
// Usa three.js direto do CDN; a página cai na animação 2D se o 3D não carregar.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function suporta3D() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const fase = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const easeInQuad = t => t * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function canvasTex(w, h, desenhar, extra) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (extra) Object.assign(t, extra);
  return t;
}

// ---------- texturas ----------
function texGramado(aniso) {
  const S = 2048, M = 80, px = S / M; // cobre x e z de -40 a 40 metros
  const X = x => (x + 40) * px, Z = z => (z + 40) * px;
  return canvasTex(S, S, g => {
    for (let i = 0; i < M / 4; i++) {
      g.fillStyle = i % 2 ? '#2c8a37' : '#38a144';
      g.fillRect(0, i * 4 * px, S, 4 * px);
    }
    for (let i = 0; i < 60000; i++) {
      g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)';
      g.fillRect(Math.random() * S, Math.random() * S, 2, 3);
    }
    g.strokeStyle = 'rgba(255,255,255,.93)';
    g.lineWidth = .12 * px;
    g.beginPath(); g.moveTo(X(-34), Z(-11)); g.lineTo(X(34), Z(-11)); g.stroke();
    g.strokeRect(X(-20.16), Z(-11), 40.32 * px, 16.5 * px);
    g.strokeRect(X(-9.16), Z(-11), 18.32 * px, 5.5 * px);
    g.beginPath(); g.arc(X(0), Z(0), 9.15 * px, .645, 2.497); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath(); g.arc(X(0), Z(0), .14 * px, 0, Math.PI * 2); g.fill();
  }, { anisotropy: aniso });
}

function texBola() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, w, h);
    const fita = (cor, amp, fasei, esp, y0) => {
      g.strokeStyle = cor; g.lineWidth = esp; g.lineCap = 'round';
      g.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + amp * Math.sin((x / w) * Math.PI * 4 + fasei);
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    };
    fita('#F2C230', 70, 0, 44, 256);
    fita('#E0262F', 60, 1.6, 30, 150);
    fita('#1E2D5C', 60, 3.2, 30, 362);
    g.strokeStyle = 'rgba(30,40,60,.35)'; g.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = 40 + k * 86 + 26 * Math.sin((x / w) * Math.PI * 6 + k);
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

function texMeiao() {
  return canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14224a'; g.fillRect(0, 0, w, 30);
    g.fillStyle = '#F2C230'; g.fillRect(0, 30, w, 16);
    g.fillStyle = '#14224a'; g.fillRect(0, 46, w, 10);
    g.fillStyle = 'rgba(0,0,0,.05)';
    for (let x = 0; x < w; x += 6) g.fillRect(x, 56, 2, h);
  });
}

function texTorcida() {
  return canvasTex(2048, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#05070f'); grd.addColorStop(.22, '#0b1226'); grd.addColorStop(1, '#141c33');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const cores = ['#F2C230', '#E0262F', '#2a4fae', '#ffffff', '#ff7a1a', '#1E2D5C', '#d9c6a0'];
    for (let y = 120; y < h - 12; y += 7) {
      const luz = .45 + .55 * (y / h);
      for (let x = 0; x < w; x += 5 + Math.random() * 3) {
        if (Math.random() < .12) continue;
        g.globalAlpha = luz * (.55 + Math.random() * .45);
        g.fillStyle = cores[(Math.random() * cores.length) | 0];
        g.fillRect(x, y + Math.random() * 2, 3, 4);
      }
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(0,0,0,.55)';
    for (let y = 150; y < h; y += 60) g.fillRect(0, y, w, 3);
  }, { wrapS: THREE.RepeatWrapping, repeat: new THREE.Vector2(3, 1) });
}

function texPlacas() {
  return canvasTex(2048, 64, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, '#0F1B2D'); grd.addColorStop(.5, '#16306b'); grd.addColorStop(1, '#0F1B2D');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.font = 'bold 40px "Bebas Neue", Impact, sans-serif';
    g.textBaseline = 'middle';
    for (let x = 20, i = 0; x < w; x += 340, i++) {
      g.fillStyle = i % 2 ? '#F2C230' : '#ffffff';
      g.fillText(i % 2 ? 'TIME DE CAMPEÕES' : 'SUNSET BOULEVARD', x, h / 2 + 2);
    }
  }, { wrapS: THREE.RepeatWrapping, repeat: new THREE.Vector2(4, 1) });
}

function texBrilho() {
  return canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(.2, 'rgba(255,246,220,.85)');
    r.addColorStop(.5, 'rgba(255,230,180,.18)');
    r.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}

function texCeu() {
  return canvasTex(16, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#03050c'); grd.addColorStop(.55, '#0a1733'); grd.addColorStop(1, '#1d3566');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
}

// ---------- montagem ----------
const torno = pts => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 32);

function montarPerna(mat) {
  const quadril = new THREE.Group();
  const add = (pai, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; pai.add(o); return o; };
  // calção solto, coxa com volume anatômico
  add(quadril, torno([[.142, -.2], [.139, -.1], [.131, .06], [.126, .3]]), mat.shorts, 0, 0, 0);
  add(quadril, new THREE.TorusGeometry(.141, .007, 8, 40), mat.faixa, 0, -.19, 0).rotation.x = Math.PI / 2;
  add(quadril, torno([[.001, -.47], [.05, -.46], [.058, -.42], [.066, -.32], [.075, -.18], [.084, -.05], [.087, .02], [.001, .03]]), mat.pele, 0, 0, 0);
  const joelho = new THREE.Group();
  joelho.position.y = -.45;
  quadril.add(joelho);
  add(joelho, new THREE.SphereGeometry(.056, 24, 16), mat.pele, 0, 0, -.006);
  // canela com panturrilha, coberta pelo meião listrado
  add(joelho, torno([[.001, -.44], [.036, -.43], [.038, -.37], [.046, -.29], [.059, -.17], [.063, -.1], [.058, -.04], [.054, -.01], [.001, 0]]), mat.meiao, 0, 0, 0);
  const chuteira = new THREE.Group();
  chuteira.position.set(0, -.455, -.02);
  joelho.add(chuteira);
  const corpo = add(chuteira, new THREE.CapsuleGeometry(.05, .17, 10, 24), mat.chuteira, 0, .006, -.06);
  corpo.rotation.x = Math.PI / 2;
  corpo.scale.set(1, 1, .72);
  add(chuteira, new THREE.CylinderGeometry(.043, .047, .06, 24), mat.chuteira, 0, .035, .03);
  add(chuteira, new THREE.BoxGeometry(.096, .016, .28), mat.sola, 0, -.032, -.06);
  for (let i = 0; i < 4; i++) add(chuteira, new THREE.BoxGeometry(.06, .006, .012), mat.risca, 0, .041, -.025 - i * .028);
  const risca = add(chuteira, new THREE.BoxGeometry(.104, .014, .1), mat.risca, 0, .006, -.03);
  risca.rotation.x = -.4;
  [[-.03, -.17], [.03, -.17], [-.03, -.1], [.03, -.1], [-.028, .03], [.028, .03]].forEach(([x, z]) =>
    add(chuteira, new THREE.CylinderGeometry(.007, .009, .016, 10), mat.sola, x, -.046, z));
  return { quadril, joelho };
}

// tufos de grama de verdade perto da bola (dão realismo ao close)
function montarGrama() {
  const N = 6000;
  const geo = new THREE.PlaneGeometry(.011, .07, 1, 2);
  geo.translate(0, .035, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * (1 - pos.getY(i) / .075));
  const capim = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .9 }), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(Math.random()) * 1.7, a = Math.random() * Math.PI * 2;
    p.set(Math.cos(a) * r + .2, 0, Math.sin(a) * r);
    e.set((Math.random() - .5) * .5, Math.random() * Math.PI, (Math.random() - .5) * .5);
    q.setFromEuler(e);
    const h = .6 + Math.random() * .7;
    s.set(1, h, 1);
    capim.setMatrixAt(i, m.compose(p, q, s));
    capim.setColorAt(i, c.setHSL(.3 + Math.random() * .04, .55 + Math.random() * .2, .22 + Math.random() * .14));
  }
  return capim;
}

function montarRede(GZ, W, H) {
  const pontos = [], segs = [];
  const superficie = (nu, nv, f) => {
    const base = pontos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const p = f(i / nu, j / nv);
      pontos.push(p[0], p[1], p[2]);
      const id = base + j * (nu + 1) + i;
      if (i < nu) segs.push(id, id + 1);
      if (j < nv) segs.push(id, id + nu + 1);
    }
  };
  const tb = [H - .3, GZ - 1.2], fb = [0, GZ - 2.0];
  superficie(60, 10, (u, v) => [lerp(-W, W, u), lerp(H, tb[0], v), lerp(GZ, tb[1], v)]);
  superficie(60, 18, (u, v) => [lerp(-W, W, u), lerp(tb[0], fb[0], v), lerp(tb[1], fb[1], v)]);
  [-W, W].forEach(x => superficie(14, 20, (s, h) => {
    const yTop = lerp(H, tb[0], s), zTop = lerp(GZ, tb[1], s);
    const zBot = lerp(GZ, fb[1], s);
    return [x, lerp(0, yTop, h), lerp(zBot, zTop, h)];
  }));
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(pontos);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(segs);
  const linhas = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .72 }));
  return { linhas, repouso: pos.slice(), attr: geo.attributes.position };
}

// Inicia a cena dentro de `container`. Retorna { gol: Promise (bola cruza a linha), parar() }.
export function iniciar(container) {
  const largura = () => container.clientWidth || window.innerWidth;
  const altura = () => container.clientHeight || window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(largura(), altura());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  container.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  cena.background = texCeu();
  cena.fog = new THREE.Fog(0x0b1834, 38, 100);

  const camera = new THREE.PerspectiveCamera(50, largura() / altura(), .05, 200);

  // luzes
  cena.add(new THREE.HemisphereLight(0xc4d6ff, 0x1d5a2c, .75));
  const sol = new THREE.DirectionalLight(0xfff3e0, 2.6);
  sol.position.set(9, 22, 7);
  sol.target.position.set(1.5, 0, -5);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 70 });
  sol.shadow.bias = -.0005;
  cena.add(sol, sol.target);
  const contra = new THREE.DirectionalLight(0x9fc0ff, 1.1);
  contra.position.set(-14, 18, -24);
  cena.add(contra);
  const flash = new THREE.PointLight(0xfff1c9, 0, 9, 1.6);
  cena.add(flash);

  // gramado
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: texGramado(aniso), roughness: .95 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);
  cena.add(montarGrama());

  // estádio: arquibancada, placas de LED e refletores
  const arquibancada = new THREE.Mesh(
    new THREE.CylinderGeometry(44, 44, 26, 96, 1, true),
    new THREE.MeshBasicMaterial({ map: texTorcida(), side: THREE.BackSide, fog: false, color: 0xbbbbbb })
  );
  arquibancada.position.y = 13;
  cena.add(arquibancada);
  const placas = new THREE.Mesh(
    new THREE.CylinderGeometry(36, 36, 1, 96, 1, true),
    new THREE.MeshBasicMaterial({ map: texPlacas(), side: THREE.BackSide, fog: false })
  );
  placas.position.y = .5;
  cena.add(placas);
  const brilho = texBrilho();
  [[-30, 32, -36], [30, 32, -36], [-40, 30, 6], [40, 30, 6], [0, 34, -42]].forEach(p => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho, color: 0xfff4dc, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    s.position.set(p[0], p[1], p[2]);
    s.scale.set(16, 16, 1);
    cena.add(s);
  });

  // gol
  const GZ = -11, W = 3.66, H = 2.44, R = .062;
  const branco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3, metalness: .05 });
  const barra = (a, b, r) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 20), branco);
    m.position.copy(va).add(vb).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    m.castShadow = true;
    cena.add(m);
  };
  barra([-W, 0, GZ], [-W, H, GZ], R);
  barra([W, 0, GZ], [W, H, GZ], R);
  barra([-W - R, H, GZ], [W + R, H, GZ], R);
  barra([-W, H, GZ], [-W, H - .3, GZ - 1.2], .025);
  barra([W, H, GZ], [W, H - .3, GZ - 1.2], .025);
  barra([-W, 0, GZ - 2], [W, 0, GZ - 2], .025);
  const rede = montarRede(GZ, W, H);
  cena.add(rede.linhas);

  // bola
  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(.11, 48, 32),
    new THREE.MeshPhysicalMaterial({ map: texBola(), roughness: .32, clearcoat: .9, clearcoatRoughness: .15 })
  );
  bola.castShadow = true;
  bola.position.set(0, .11, 0);
  bola.rotation.set(.3, .8, 0);
  cena.add(bola);

  // pernas
  const mat = {
    pele: new THREE.MeshStandardMaterial({ color: 0xb07650, roughness: .55 }),
    shorts: new THREE.MeshStandardMaterial({ color: 0x14224a, roughness: .8 }),
    faixa: new THREE.MeshStandardMaterial({ color: 0xF2C230, roughness: .6 }),
    meiao: new THREE.MeshStandardMaterial({ map: texMeiao(), roughness: .85 }),
    chuteira: new THREE.MeshPhysicalMaterial({ color: 0xff3d1f, roughness: .28, clearcoat: 1, clearcoatRoughness: .2 }),
    sola: new THREE.MeshStandardMaterial({ color: 0xf6e600, roughness: .5 }),
    risca: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 })
  };
  const chute = montarPerna(mat);
  chute.quadril.position.set(.13, .95, .24);
  chute.quadril.rotation.y = -.12;
  cena.add(chute.quadril);
  const apoio = montarPerna(mat);
  apoio.quadril.position.set(-.26, .95, .06);
  apoio.quadril.rotation.set(.12, .1, .05);
  apoio.joelho.rotation.x = -.08;
  cena.add(apoio.quadril);
  // quadril (calção inteiriço) e tronco com a camisa, para o jogador não parecer só duas pernas
  const corpo = new THREE.Group();
  const quadris = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .2, 10, 28), mat.shorts);
  quadris.rotation.z = Math.PI / 2;
  quadris.scale.set(1, 1, .82);
  quadris.position.set(-.065, 1.13, .15);
  const camisa = new THREE.Mesh(torno([[.17, 0], [.2, .12], [.215, .35], [.205, .6], [.17, .72]]), new THREE.MeshStandardMaterial({ color: 0x1b2c5e, roughness: .7, side: THREE.DoubleSide }));
  camisa.position.set(-.065, 1.16, .17);
  camisa.rotation.x = -.14;
  const faixaCamisa = new THREE.Mesh(new THREE.TorusGeometry(.172, .01, 8, 40), mat.faixa);
  faixaCamisa.rotation.x = Math.PI / 2 - .14;
  faixaCamisa.position.set(-.065, 1.165, .17);
  [quadris, camisa, faixaCamisa].forEach(o => { o.castShadow = true; corpo.add(o); });
  cena.add(corpo);

  // trajetória
  const P0 = new THREE.Vector3(0, .11, 0);
  const P1 = new THREE.Vector3(1.0, 2.3, -5.5);
  const P2 = new THREE.Vector3(3.05, 2.04, GZ - .05);
  const PI_ = new THREE.Vector3(3.05, 2.0, GZ - 1.15);
  const dirRede = new THREE.Vector3(.25, .1, -1).normalize();
  const eixoGiro = new THREE.Vector3(-1, .35, .1).normalize();
  const bez = (t, out) => {
    const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    return out.set(a * P0.x + b * P1.x + c * P2.x, a * P0.y + b * P1.y + c * P2.y, a * P0.z + b * P1.z + c * P2.z);
  };

  // Tomada 1: close rente à grama, do lado da chuteira. Tomada 2: câmera atrás do gol, de frente para a bola.
  const retrato = () => (container.clientWidth || 1) / (container.clientHeight || 1) < .8;
  const A0 = retrato() ? new THREE.Vector3(2.05, .2, .42) : new THREE.Vector3(1.25, .22, .4);
  const A1 = retrato() ? new THREE.Vector3(1.85, .19, .3) : new THREE.Vector3(1.1, .2, .28);
  const AL = new THREE.Vector3(0, .3, .1);
  const B0 = new THREE.Vector3(5.9, 1.8, -14.5), B1 = new THREE.Vector3(5.0, 1.58, -13.4), BL = new THREE.Vector3(1.0, 1.05, -4);
  const olhar = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

  const T_CONTATO = .70, T_CORTE = .8, T_LINHA = 1.55, T_FUNDO = 1.78;
  let t = 0, ultimo = performance.now(), quadro = 0, parado = false, golDado = false, resolverGol;
  const gol = new Promise(r => { resolverGol = r; });

  function poseChute(tt) {
    if (tt < .45) { const f = easeInOut(fase(tt, 0, .45)); return [lerp(-.2, -.58, f), lerp(-.6, -1.38, f)]; }
    if (tt < T_CONTATO) { const f = easeInQuad(fase(tt, .45, T_CONTATO)); return [lerp(-.58, .18, f), lerp(-1.38, .05, f)]; }
    const f = easeOutCubic(fase(tt, T_CONTATO, 1.2)); return [lerp(.18, .98, f), lerp(.05, .32, f)];
  }

  function amplitudeRede(tt) {
    if (tt < T_LINHA) return 0;
    if (tt < T_FUNDO) return .55 * easeOutCubic(fase(tt, T_LINHA, T_FUNDO));
    const s = tt - T_FUNDO;
    return .55 * Math.exp(-4.5 * s) * Math.cos(9 * s);
  }

  function atualizarRede(A) {
    const arr = rede.attr.array, rp = rede.repouso;
    for (let i = 0; i < arr.length; i += 3) {
      const dx = rp[i] - PI_.x, dy = rp[i + 1] - PI_.y, dz = rp[i + 2] - PI_.z;
      const f = A * Math.exp(-(dx * dx + dy * dy + dz * dz) / .9);
      arr[i] = rp[i] + dirRede.x * f;
      arr[i + 1] = rp[i + 1] + dirRede.y * f;
      arr[i + 2] = rp[i + 2] + dirRede.z * f;
    }
    rede.attr.needsUpdate = true;
  }

  function posicaoBola(tt, out) {
    if (tt < T_CONTATO) return out.copy(P0);
    if (tt < T_LINHA) return bez(easeOutCubic(fase(tt, T_CONTATO, T_LINHA)) * .35 + fase(tt, T_CONTATO, T_LINHA) * .65, out);
    if (tt < T_FUNDO) {
      const f = easeOutCubic(fase(tt, T_LINHA, T_FUNDO));
      return out.copy(P2).lerp(tmp2.copy(PI_).addScaledVector(dirRede, .5), f);
    }
    const s = tt - T_FUNDO;
    const base = tmp2.copy(PI_).addScaledVector(dirRede, Math.max(.05, .5 * Math.exp(-3 * s)));
    const y = Math.max(.11, base.y - 4.9 * s * s);
    const quique = y <= .11 ? Math.abs(Math.sin((s - .62) * 7)) * .25 * Math.exp(-3 * (s - .62)) : 0;
    return out.set(base.x + s * .2, y + quique, base.z - s * .15);
  }

  function frame(agora) {
    if (parado) return;
    quadro = requestAnimationFrame(frame);
    const dt = Math.min(.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const lento = (t > .56 && t < T_CORTE) ? .4 : (t > 1.3 && t < 1.85 ? .5 : 1);
    t += dt * lento;

    const [a, k] = poseChute(t);
    chute.quadril.rotation.x = a;
    chute.joelho.rotation.x = k;

    const antes = tmp.copy(bola.position);
    posicaoBola(t, bola.position);
    if (t >= T_CONTATO) bola.rotateOnAxis(eixoGiro, dt * lento * (t < T_FUNDO ? 34 : 9));
    if (t >= T_LINHA && !golDado) { golDado = true; resolverGol(); }

    atualizarRede(amplitudeRede(t));
    flash.position.copy(PI_);
    flash.intensity = t > T_LINHA - .02 ? 45 * Math.exp(-7 * Math.max(0, t - T_LINHA)) : 0;

    // câmera: corte seco entre as duas tomadas, como numa transmissão
    const tomada1 = t < T_CORTE;
    chute.quadril.visible = apoio.quadril.visible = corpo.visible = tomada1;
    if (tomada1) {
      camera.position.copy(A0).lerp(A1, easeOutCubic(fase(t, 0, T_CORTE)));
      olhar.copy(AL);
      if (t > T_CONTATO) olhar.lerp(bola.position, .35);
    } else if (t < T_FUNDO) {
      camera.position.copy(B0).lerp(B1, easeOutCubic(fase(t, T_CORTE, 3.4)));
      olhar.copy(BL).lerp(bola.position, easeInOut(fase(t, T_CORTE, T_LINHA)) * .75);
    } else {
      camera.position.copy(B0).lerp(B1, easeOutCubic(fase(t, T_CORTE, 3.4)));
      olhar.lerp(PI_, .06);
    }
    const tremor = t > T_LINHA && t < T_LINHA + .45 ? .035 * (1 - fase(t, T_LINHA, T_LINHA + .45)) : 0;
    if (tremor) camera.position.add(tmp2.set((Math.random() - .5) * tremor, (Math.random() - .5) * tremor, 0));
    camera.lookAt(olhar);

    renderer.render(cena, camera);
    void antes;
  }

  function redimensionar() {
    renderer.setSize(largura(), altura());
    camera.aspect = largura() / altura();
    camera.fov = camera.aspect < .8 ? 58 : 46;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();
  quadro = requestAnimationFrame(frame);

  function parar() {
    if (parado) return;
    parado = true;
    cancelAnimationFrame(quadro);
    window.removeEventListener('resize', redimensionar);
    cena.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(m => { Object.values(m).forEach(v => { if (v && v.isTexture) v.dispose(); }); m.dispose(); });
    });
    if (cena.background && cena.background.dispose) cena.background.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { gol, parar };
}
