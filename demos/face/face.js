// Reconhecimento facial no navegador com face-api.js (TensorFlow.js).
// Detecção (TinyFaceDetector) → 68 pontos → embedding de 128 números → distância euclidiana.
// A câmera e as fotos nunca saem do aparelho: nada é enviado nem salvo.
import { Demo } from "../demos.js";

const MODELS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
// A biblioteca (~1,3 MB) e os modelos (~6 MB) só são baixados no primeiro uso (câmera, foto ou exemplo).
// integrity: o navegador só executa o arquivo se ele for idêntico ao conferido (proteção contra CDN adulterado).
const LIBRARY = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js";
const LIBRARY_SRI = "sha384-M5nePoB6/w/a9JhtegEibSLGiJy/+QMZZMfvcxjWVCQW/HPwrQ7i21V/Px/8AyVA";
const THRESHOLD = 0.55;

const T = {
  en: {
    idle: "The AI models (~7 MB) download only when you use the camera, a photo or the sample.",
    "meta.title": "Face Recognition in the Browser",
    "meta.description": "Real-time face recognition with face-api.js: detection, 128-dimension embeddings and matching, entirely in your browser — the camera never leaves your device.",
    lang: "Language",
    kicker: "// AI DEMO · 100% ON YOUR DEVICE",
    title: "Face recognition <span>in the browser.</span>",
    lead: "Detects faces, turns each one into a 128-number vector (embedding) and recognizes who it is by comparing vectors — in real time with your webcam or with a photo. Interactive version of my Face Recognition POC.",
    back: "← Back to portfolio",
    code: "View code ↗",
    privacy: "🔒 <strong>Privacy:</strong> everything runs in your browser. The camera image and photos are never sent or stored — registered faces disappear when you close the page.",
    camOn: "Turn on camera",
    camOff: "Turn off camera",
    upload: "Upload a photo",
    sample: "Use sample photo",
    empty: "Turn on the camera, upload a photo or use the sample photo.",
    loading: "Loading the AI models (~7 MB, only the first time)…",
    ready: "Models ready.",
    loadError: "Could not load the AI models. Check your connection and reload the page.",
    camError: "Could not access the camera. You can upload a photo instead.",
    faces: "Faces detected: <strong>{n}</strong>",
    unknown: "Unknown",
    namePh: "Person's name",
    enroll: "Register face",
    needOne: "To register, the image must contain exactly one face.",
    needName: "Type a name first.",
    enrolled: "<strong>{name}</strong> registered. Now show the camera or another photo of the same person.",
    people: "Registered people",
    none: "No one registered yet.",
    remove: "Remove {name}",
    hint: "<strong>Try it:</strong> turn on the camera, type your name and register your face — then move around and see if the model recognizes you. Or use the sample photo, register it as “{nome}”, and upload another photo of a different person to see “Unknown”.",
    how: "<strong>How it works:</strong> TinyFaceDetector finds the faces; a 68-point landmark network aligns each one; a ResNet turns it into a 128-number embedding. Two faces belong to the same person when the Euclidean distance between their vectors is below 0.55. Everything runs with TensorFlow.js (WebGL) in your browser.",
  },
  pt: {
    idle: "Os modelos de IA (~7 MB) só são baixados quando você usar a câmera, uma foto ou o exemplo.",
    "meta.title": "Reconhecimento Facial no Navegador",
    "meta.description": "Reconhecimento facial em tempo real com face-api.js: detecção, embeddings de 128 dimensões e comparação, tudo no seu navegador — a câmera nunca sai do seu aparelho.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · 100% NO SEU APARELHO",
    title: "Reconhecimento facial <span>no navegador.</span>",
    lead: "Detecta rostos, transforma cada um em um vetor de 128 números (embedding) e reconhece quem é comparando vetores — em tempo real pela webcam ou com uma foto. Versão interativa do meu Face Recognition POC.",
    back: "← Voltar ao portfólio",
    code: "Ver código ↗",
    privacy: "🔒 <strong>Privacidade:</strong> tudo roda no seu navegador. A imagem da câmera e as fotos nunca são enviadas nem salvas — os rostos cadastrados somem quando você fecha a página.",
    camOn: "Ligar câmera",
    camOff: "Desligar câmera",
    upload: "Enviar uma foto",
    sample: "Usar foto de exemplo",
    empty: "Ligue a câmera, envie uma foto ou use a foto de exemplo.",
    loading: "Carregando os modelos de IA (~7 MB, só na primeira vez)…",
    ready: "Modelos prontos.",
    loadError: "Não foi possível carregar os modelos de IA. Verifique a conexão e recarregue a página.",
    camError: "Não foi possível acessar a câmera. Você pode enviar uma foto.",
    faces: "Rostos detectados: <strong>{n}</strong>",
    unknown: "Desconhecido",
    namePh: "Nome da pessoa",
    enroll: "Cadastrar rosto",
    needOne: "Para cadastrar, a imagem precisa ter exatamente um rosto.",
    needName: "Digite um nome primeiro.",
    enrolled: "<strong>{name}</strong> cadastrado(a). Agora mostre a câmera ou outra foto da mesma pessoa.",
    people: "Pessoas cadastradas",
    none: "Ninguém cadastrado ainda.",
    remove: "Remover {name}",
    hint: "<strong>Experimente:</strong> ligue a câmera, digite seu nome e cadastre seu rosto — depois se mexa e veja se o modelo te reconhece. Ou use a foto de exemplo, cadastre como “{nome}” e envie a foto de outra pessoa para ver “Desconhecido”.",
    how: "<strong>Como funciona:</strong> o TinyFaceDetector encontra os rostos; uma rede de 68 pontos alinha cada um; uma ResNet gera um embedding de 128 números. Dois rostos são da mesma pessoa quando a distância euclidiana entre os vetores é menor que 0,55. Tudo roda com TensorFlow.js (WebGL) no seu navegador.",
  },
  es: {
    idle: "Los modelos de IA (~7 MB) solo se descargan cuando uses la cámara, una foto o el ejemplo.",
    "meta.title": "Reconocimiento Facial en el Navegador",
    "meta.description": "Reconocimiento facial en tiempo real con face-api.js: detección, embeddings de 128 dimensiones y comparación, todo en tu navegador — la cámara nunca sale de tu dispositivo.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · 100% EN TU DISPOSITIVO",
    title: "Reconocimiento facial <span>en el navegador.</span>",
    lead: "Detecta rostros, convierte cada uno en un vector de 128 números (embedding) y reconoce quién es comparando vectores — en tiempo real con tu webcam o con una foto. Versión interactiva de mi Face Recognition POC.",
    back: "← Volver al portafolio",
    code: "Ver código ↗",
    privacy: "🔒 <strong>Privacidad:</strong> todo se ejecuta en tu navegador. La imagen de la cámara y las fotos nunca se envían ni se guardan — los rostros registrados desaparecen al cerrar la página.",
    camOn: "Encender cámara",
    camOff: "Apagar cámara",
    upload: "Subir una foto",
    sample: "Usar foto de ejemplo",
    empty: "Enciende la cámara, sube una foto o usa la foto de ejemplo.",
    loading: "Cargando los modelos de IA (~7 MB, solo la primera vez)…",
    ready: "Modelos listos.",
    loadError: "No se pudieron cargar los modelos de IA. Revisa la conexión y recarga la página.",
    camError: "No se pudo acceder a la cámara. Puedes subir una foto.",
    faces: "Rostros detectados: <strong>{n}</strong>",
    unknown: "Desconocido",
    namePh: "Nombre de la persona",
    enroll: "Registrar rostro",
    needOne: "Para registrar, la imagen debe tener exactamente un rostro.",
    needName: "Escribe un nombre primero.",
    enrolled: "<strong>{name}</strong> registrado(a). Ahora muestra la cámara u otra foto de la misma persona.",
    people: "Personas registradas",
    none: "Nadie registrado todavía.",
    remove: "Eliminar {name}",
    hint: "<strong>Pruébalo:</strong> enciende la cámara, escribe tu nombre y registra tu rostro — luego muévete y mira si el modelo te reconoce. O usa la foto de ejemplo, regístrala como “{nome}” y sube la foto de otra persona para ver “Desconocido”.",
    how: "<strong>Cómo funciona:</strong> TinyFaceDetector encuentra los rostros; una red de 68 puntos alinea cada uno; una ResNet genera un embedding de 128 números. Dos rostros son de la misma persona cuando la distancia euclidiana entre sus vectores es menor que 0,55. Todo se ejecuta con TensorFlow.js (WebGL) en tu navegador.",
  },
};

const { t, fmtNum, escape } = Demo;
const $ = (selector) => document.querySelector(selector);
const stage = $("[data-stage]");
const people = []; // { name, descriptor: Float32Array }
let source = null; // <video> ou <img> atual
let stream = null;
let lastFaces = [];
let looping = false;

const detectorOptions = () => new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });

const setStatus = (html) => ($("[data-status]").innerHTML = html);

function match(descriptor) {
  let best = { name: t("unknown"), distance: Infinity, known: false };
  for (const person of people) {
    const distance = faceapi.euclideanDistance(descriptor, person.descriptor);
    if (distance < best.distance) best = { name: person.name, distance, known: distance < THRESHOLD };
  }
  if (!best.known) best.name = t("unknown");
  return best;
}

function draw(faces) {
  let canvas = stage.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    stage.append(canvas);
  }
  const rect = source.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.left = `${rect.left - stageRect.left}px`;
  canvas.style.top = `${rect.top - stageRect.top}px`;
  const natural = source.videoWidth ? [source.videoWidth, source.videoHeight] : [source.naturalWidth, source.naturalHeight];
  const scale = rect.width / natural[0];
  const mirrored = source.tagName === "VIDEO";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "600 14px Manrope, sans-serif";
  for (const face of faces) {
    const box = face.detection.box;
    const w = box.width * scale;
    const h = box.height * scale;
    const x = mirrored ? canvas.width - (box.x * scale) - w : box.x * scale;
    const y = box.y * scale;
    const result = match(face.descriptor);
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(result.known ? "--series-1" : "--series-2").trim();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    const label = Number.isFinite(result.distance) ? `${result.name} · ${fmtNum(result.distance)}` : result.name;
    const labelWidth = ctx.measureText(label).width + 12;
    const labelY = y > 26 ? y - 24 : y + h;
    ctx.fillStyle = color;
    ctx.fillRect(x, labelY, labelWidth, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 6, labelY + 16);
  }
}

function describe(faces) {
  const names = faces.map((face) => {
    const result = match(face.descriptor);
    return Number.isFinite(result.distance) ? `${escape(result.name)} (${fmtNum(result.distance)})` : escape(result.name);
  });
  $("[data-results]").innerHTML = t("faces", { n: faces.length }) + (names.length ? ` — ${names.join(", ")}` : "");
  $("[data-enroll-button]").disabled = faces.length !== 1;
}

async function analyze() {
  if (!source) return;
  const faces = await faceapi.detectAllFaces(source, detectorOptions()).withFaceLandmarks().withFaceDescriptors();
  lastFaces = faces;
  draw(faces);
  describe(faces);
}

function show(element) {
  stage.replaceChildren(element);
  source = element;
  lastFaces = [];
}

async function loop() {
  if (!looping) return;
  if (source?.readyState >= 2) await analyze().catch(() => {});
  setTimeout(() => requestAnimationFrame(loop), 120);
}

function stopCamera() {
  looping = false;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  $("[data-camera]").dataset.t = "camOn";
  $("[data-camera]").textContent = t("camOn");
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 } }, audio: false });
  } catch {
    setStatus(t("camError"));
    return;
  }
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  show(video);
  await video.play();
  $("[data-camera]").dataset.t = "camOff";
  $("[data-camera]").textContent = t("camOff");
  looping = true;
  loop();
}

async function showImage(url) {
  stopCamera();
  const img = new Image();
  img.src = url;
  await img.decode();
  show(img);
  await analyze();
}

function renderPeople() {
  $("[data-people]").innerHTML = people.length
    ? people.map((p, i) => `<li>${escape(p.name)} <button type="button" data-remove="${i}" aria-label="${escape(t("remove", { name: p.name }))}">×</button></li>`).join("")
    : `<li style="border:0;padding-left:0;color:var(--muted)">${t("none")}</li>`;
}

function render() {
  renderPeople();
  if (source && !looping) analyze();
}

let aiReady = null;
const loadScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LIBRARY;
    script.integrity = LIBRARY_SRI;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

// Baixa e prepara a IA uma única vez; se falhar, a próxima tentativa recomeça.
function loadAI() {
  aiReady ??= (async () => {
    setStatus(t("loading"));
    await loadScript();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS),
    ]);
    setStatus(t("ready"));
  })().catch((error) => {
    aiReady = null;
    setStatus(t("loadError"));
    throw error;
  });
  return aiReady;
}

// Executa a ação depois que a IA estiver pronta (ignora se o carregamento falhar).
const withAI = (action) => async (...args) => {
  try {
    await loadAI();
  } catch {
    return;
  }
  return action(...args);
};

function init() {
  Demo.setup(T, render);
  renderPeople();
  setStatus(t("idle"));

  $("[data-camera]").addEventListener("click", withAI(() => (stream ? stopCamera() : startCamera())));
  $("[data-sample]").addEventListener("click", withAI(() => {
    showImage(`/${globalThis.PERFIL.foto}`);
    $("[data-name]").value ||= globalThis.PERFIL.nome;
  }));
  $("[data-upload]").addEventListener("change", (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (file) withAI(() => showImage(URL.createObjectURL(file)))();
  });
  $("[data-enroll]").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("[data-name]").value.trim();
    if (!name) return setStatus(t("needName"));
    if (lastFaces.length !== 1) return setStatus(t("needOne"));
    people.push({ name, descriptor: lastFaces[0].descriptor });
    $("[data-name]").value = "";
    setStatus(t("enrolled", { name: escape(name) }));
    renderPeople();
    if (!looping) analyze();
  });
  $("[data-people]").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    people.splice(Number(button.dataset.remove), 1);
    renderPeople();
    if (!looping) analyze();
  });
  addEventListener("resize", () => source && draw(lastFaces));
}

init();
