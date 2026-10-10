// Reconhecimento facial no navegador com face-api.js (TensorFlow.js).
// Detecção (TinyFaceDetector) → 68 pontos → embedding de 128 números → distância euclidiana.
// A câmera e as fotos nunca saem do aparelho: nada é enviado nem salvo.

const MODELS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const THRESHOLD = 0.55;

const T = {
  en: {
    "meta.title": "Face Recognition in the Browser — Emanuel Borges",
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
    hint: "<strong>Try it:</strong> turn on the camera, type your name and register your face — then move around and see if the model recognizes you. Or use the sample photo, register it as “Emanuel”, and upload another photo of a different person to see “Unknown”.",
    how: "<strong>How it works:</strong> TinyFaceDetector finds the faces; a 68-point landmark network aligns each one; a ResNet turns it into a 128-number embedding. Two faces belong to the same person when the Euclidean distance between their vectors is below 0.55. Everything runs with TensorFlow.js (WebGL) in your browser.",
  },
  pt: {
    "meta.title": "Reconhecimento Facial no Navegador — Emanuel Borges",
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
    hint: "<strong>Experimente:</strong> ligue a câmera, digite seu nome e cadastre seu rosto — depois se mexa e veja se o modelo te reconhece. Ou use a foto de exemplo, cadastre como “Emanuel” e envie a foto de outra pessoa para ver “Desconhecido”.",
    how: "<strong>Como funciona:</strong> o TinyFaceDetector encontra os rostos; uma rede de 68 pontos alinha cada um; uma ResNet gera um embedding de 128 números. Dois rostos são da mesma pessoa quando a distância euclidiana entre os vetores é menor que 0,55. Tudo roda com TensorFlow.js (WebGL) no seu navegador.",
  },
  es: {
    "meta.title": "Reconocimiento Facial en el Navegador — Emanuel Borges",
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
    hint: "<strong>Pruébalo:</strong> enciende la cámara, escribe tu nombre y registra tu rostro — luego muévete y mira si el modelo te reconoce. O usa la foto de ejemplo, regístrala como “Emanuel” y sube la foto de otra persona para ver “Desconocido”.",
    how: "<strong>Cómo funciona:</strong> TinyFaceDetector encuentra los rostros; una red de 68 puntos alinea cada uno; una ResNet genera un embedding de 128 números. Dos rostros son de la misma persona cuando la distancia euclidiana entre sus vectores es menor que 0,55. Todo se ejecuta con TensorFlow.js (WebGL) en tu navegador.",
  },
  fr: {
    "meta.title": "Reconnaissance faciale dans le navigateur — Emanuel Borges",
    "meta.description": "Reconnaissance faciale en temps réel avec face-api.js : détection, embeddings de 128 dimensions et comparaison, entièrement dans votre navigateur — la caméra ne quitte jamais votre appareil.",
    lang: "Langue",
    kicker: "// DÉMO D'IA · 100 % SUR VOTRE APPAREIL",
    title: "Reconnaissance faciale <span>dans le navigateur.</span>",
    lead: "Détecte les visages, transforme chacun en un vecteur de 128 nombres (embedding) et reconnaît la personne en comparant les vecteurs — en temps réel avec votre webcam ou avec une photo. Version interactive de mon Face Recognition POC.",
    back: "← Retour au portfolio",
    code: "Voir le code ↗",
    privacy: "🔒 <strong>Confidentialité :</strong> tout s'exécute dans votre navigateur. L'image de la caméra et les photos ne sont jamais envoyées ni enregistrées — les visages enregistrés disparaissent à la fermeture de la page.",
    camOn: "Activer la caméra",
    camOff: "Désactiver la caméra",
    upload: "Envoyer une photo",
    sample: "Utiliser la photo d'exemple",
    empty: "Activez la caméra, envoyez une photo ou utilisez la photo d'exemple.",
    loading: "Chargement des modèles d'IA (~7 Mo, seulement la première fois)…",
    ready: "Modèles prêts.",
    loadError: "Impossible de charger les modèles d'IA. Vérifiez la connexion et rechargez la page.",
    camError: "Impossible d'accéder à la caméra. Vous pouvez envoyer une photo.",
    faces: "Visages détectés : <strong>{n}</strong>",
    unknown: "Inconnu",
    namePh: "Nom de la personne",
    enroll: "Enregistrer le visage",
    needOne: "Pour enregistrer, l'image doit contenir exactement un visage.",
    needName: "Saisissez d'abord un nom.",
    enrolled: "<strong>{name}</strong> enregistré(e). Montrez maintenant la caméra ou une autre photo de la même personne.",
    people: "Personnes enregistrées",
    none: "Personne n'est encore enregistré.",
    remove: "Supprimer {name}",
    hint: "<strong>Essayez :</strong> activez la caméra, saisissez votre nom et enregistrez votre visage — puis bougez et voyez si le modèle vous reconnaît. Ou utilisez la photo d'exemple, enregistrez-la sous « Emanuel » et envoyez la photo d'une autre personne pour voir « Inconnu ».",
    how: "<strong>Fonctionnement :</strong> TinyFaceDetector trouve les visages ; un réseau de 68 points aligne chacun d'eux ; un ResNet produit un embedding de 128 nombres. Deux visages appartiennent à la même personne lorsque la distance euclidienne entre leurs vecteurs est inférieure à 0,55. Tout s'exécute avec TensorFlow.js (WebGL) dans votre navigateur.",
  },
  it: {
    "meta.title": "Riconoscimento Facciale nel Browser — Emanuel Borges",
    "meta.description": "Riconoscimento facciale in tempo reale con face-api.js: rilevamento, embedding a 128 dimensioni e confronto, tutto nel tuo browser — la fotocamera non lascia mai il tuo dispositivo.",
    lang: "Lingua",
    kicker: "// DEMO DI IA · 100% SUL TUO DISPOSITIVO",
    title: "Riconoscimento facciale <span>nel browser.</span>",
    lead: "Rileva i volti, trasforma ognuno in un vettore di 128 numeri (embedding) e riconosce chi è confrontando i vettori — in tempo reale con la webcam o con una foto. Versione interattiva del mio Face Recognition POC.",
    back: "← Torna al portfolio",
    code: "Vedi il codice ↗",
    privacy: "🔒 <strong>Privacy:</strong> tutto gira nel tuo browser. L'immagine della fotocamera e le foto non vengono mai inviate né salvate — i volti registrati spariscono quando chiudi la pagina.",
    camOn: "Accendi la fotocamera",
    camOff: "Spegni la fotocamera",
    upload: "Carica una foto",
    sample: "Usa la foto di esempio",
    empty: "Accendi la fotocamera, carica una foto o usa la foto di esempio.",
    loading: "Caricamento dei modelli di IA (~7 MB, solo la prima volta)…",
    ready: "Modelli pronti.",
    loadError: "Impossibile caricare i modelli di IA. Controlla la connessione e ricarica la pagina.",
    camError: "Impossibile accedere alla fotocamera. Puoi caricare una foto.",
    faces: "Volti rilevati: <strong>{n}</strong>",
    unknown: "Sconosciuto",
    namePh: "Nome della persona",
    enroll: "Registra il volto",
    needOne: "Per registrare, l'immagine deve contenere esattamente un volto.",
    needName: "Scrivi prima un nome.",
    enrolled: "<strong>{name}</strong> registrato/a. Ora mostra la fotocamera o un'altra foto della stessa persona.",
    people: "Persone registrate",
    none: "Ancora nessuno registrato.",
    remove: "Rimuovi {name}",
    hint: "<strong>Provalo:</strong> accendi la fotocamera, scrivi il tuo nome e registra il tuo volto — poi muoviti e guarda se il modello ti riconosce. Oppure usa la foto di esempio, registrala come “Emanuel” e carica la foto di un'altra persona per vedere “Sconosciuto”.",
    how: "<strong>Come funziona:</strong> TinyFaceDetector trova i volti; una rete a 68 punti allinea ciascuno; una ResNet genera un embedding di 128 numeri. Due volti appartengono alla stessa persona quando la distanza euclidea tra i vettori è inferiore a 0,55. Tutto gira con TensorFlow.js (WebGL) nel tuo browser.",
  },
  de: {
    "meta.title": "Gesichtserkennung im Browser — Emanuel Borges",
    "meta.description": "Gesichtserkennung in Echtzeit mit face-api.js: Erkennung, 128-dimensionale Embeddings und Abgleich, komplett in Ihrem Browser – die Kamera verlässt nie Ihr Gerät.",
    lang: "Sprache",
    kicker: "// KI-DEMO · 100 % AUF IHREM GERÄT",
    title: "Gesichtserkennung <span>im Browser.</span>",
    lead: "Erkennt Gesichter, wandelt jedes in einen Vektor aus 128 Zahlen (Embedding) um und erkennt die Person durch Vergleich der Vektoren – in Echtzeit per Webcam oder mit einem Foto. Interaktive Version meines Face Recognition POC.",
    back: "← Zurück zum Portfolio",
    code: "Code ansehen ↗",
    privacy: "🔒 <strong>Datenschutz:</strong> Alles läuft in Ihrem Browser. Kamerabild und Fotos werden nie gesendet oder gespeichert – registrierte Gesichter verschwinden, wenn Sie die Seite schließen.",
    camOn: "Kamera einschalten",
    camOff: "Kamera ausschalten",
    upload: "Foto hochladen",
    sample: "Beispielfoto verwenden",
    empty: "Schalten Sie die Kamera ein, laden Sie ein Foto hoch oder verwenden Sie das Beispielfoto.",
    loading: "KI-Modelle werden geladen (~7 MB, nur beim ersten Mal)…",
    ready: "Modelle bereit.",
    loadError: "Die KI-Modelle konnten nicht geladen werden. Prüfen Sie die Verbindung und laden Sie die Seite neu.",
    camError: "Kein Zugriff auf die Kamera. Sie können stattdessen ein Foto hochladen.",
    faces: "Erkannte Gesichter: <strong>{n}</strong>",
    unknown: "Unbekannt",
    namePh: "Name der Person",
    enroll: "Gesicht registrieren",
    needOne: "Zum Registrieren muss das Bild genau ein Gesicht enthalten.",
    needName: "Geben Sie zuerst einen Namen ein.",
    enrolled: "<strong>{name}</strong> registriert. Zeigen Sie jetzt die Kamera oder ein anderes Foto derselben Person.",
    people: "Registrierte Personen",
    none: "Noch niemand registriert.",
    remove: "{name} entfernen",
    hint: "<strong>Probieren Sie es aus:</strong> Schalten Sie die Kamera ein, geben Sie Ihren Namen ein und registrieren Sie Ihr Gesicht – bewegen Sie sich dann und sehen Sie, ob das Modell Sie erkennt. Oder registrieren Sie das Beispielfoto als „Emanuel“ und laden Sie das Foto einer anderen Person hoch, um „Unbekannt“ zu sehen.",
    how: "<strong>So funktioniert es:</strong> TinyFaceDetector findet die Gesichter; ein 68-Punkte-Netz richtet jedes aus; ein ResNet erzeugt ein Embedding aus 128 Zahlen. Zwei Gesichter gehören zur selben Person, wenn der euklidische Abstand ihrer Vektoren unter 0,55 liegt. Alles läuft mit TensorFlow.js (WebGL) in Ihrem Browser.",
  },
  zh: {
    "meta.title": "浏览器中的人脸识别 — Emanuel Borges",
    "meta.description": "基于 face-api.js 的实时人脸识别：检测、128 维嵌入向量与比对，全部在浏览器中完成——摄像头画面不会离开你的设备。",
    lang: "语言",
    kicker: "// AI 演示 · 100% 在你的设备上运行",
    title: "人脸识别 <span>在浏览器中。</span>",
    lead: "检测人脸，将每张脸转换为 128 个数字组成的向量（嵌入向量），并通过比较向量识别身份——可使用摄像头实时识别，也可以上传照片。这是我的 Face Recognition POC 的交互版本。",
    back: "← 返回作品集",
    code: "查看代码 ↗",
    privacy: "🔒 <strong>隐私：</strong>一切都在你的浏览器中运行。摄像头画面和照片不会被发送或保存——关闭页面后，已登记的人脸即被清除。",
    camOn: "打开摄像头",
    camOff: "关闭摄像头",
    upload: "上传照片",
    sample: "使用示例照片",
    empty: "打开摄像头、上传照片或使用示例照片。",
    loading: "正在加载 AI 模型（约 7 MB，仅首次）…",
    ready: "模型已就绪。",
    loadError: "无法加载 AI 模型。请检查网络并刷新页面。",
    camError: "无法访问摄像头。你可以改为上传照片。",
    faces: "检测到的人脸：<strong>{n}</strong>",
    unknown: "未知",
    namePh: "人员姓名",
    enroll: "登记人脸",
    needOne: "登记时，图像中必须恰好有一张人脸。",
    needName: "请先输入姓名。",
    enrolled: "已登记 <strong>{name}</strong>。现在打开摄像头或上传同一个人的另一张照片。",
    people: "已登记人员",
    none: "尚未登记任何人。",
    remove: "移除 {name}",
    hint: "<strong>试一试：</strong>打开摄像头，输入你的名字并登记你的脸——然后移动一下，看看模型是否认出你。或者使用示例照片，登记为“Emanuel”，再上传另一个人的照片，看看显示“未知”。",
    how: "<strong>工作原理：</strong>TinyFaceDetector 找到人脸；68 点关键点网络对齐每张脸；ResNet 生成 128 维嵌入向量。当两个向量之间的欧氏距离小于 0.55 时，判定为同一个人。全部通过 TensorFlow.js（WebGL）在你的浏览器中运行。",
  },
  ru: {
    "meta.title": "Распознавание лиц в браузере — Emanuel Borges",
    "meta.description": "Распознавание лиц в реальном времени с face-api.js: обнаружение, 128-мерные эмбеддинги и сравнение — полностью в вашем браузере, изображение с камеры не покидает устройство.",
    lang: "Язык",
    kicker: "// ДЕМО ИИ · 100% НА ВАШЕМ УСТРОЙСТВЕ",
    title: "Распознавание лиц <span>в браузере.</span>",
    lead: "Находит лица, превращает каждое в вектор из 128 чисел (эмбеддинг) и узнаёт человека, сравнивая векторы, — в реальном времени через веб-камеру или по фото. Интерактивная версия моего Face Recognition POC.",
    back: "← Назад к портфолио",
    code: "Смотреть код ↗",
    privacy: "🔒 <strong>Конфиденциальность:</strong> всё работает в вашем браузере. Изображение с камеры и фото никуда не отправляются и не сохраняются — зарегистрированные лица исчезают при закрытии страницы.",
    camOn: "Включить камеру",
    camOff: "Выключить камеру",
    upload: "Загрузить фото",
    sample: "Пример фото",
    empty: "Включите камеру, загрузите фото или используйте пример.",
    loading: "Загрузка моделей ИИ (~7 МБ, только в первый раз)…",
    ready: "Модели готовы.",
    loadError: "Не удалось загрузить модели ИИ. Проверьте подключение и обновите страницу.",
    camError: "Нет доступа к камере. Можно загрузить фото.",
    faces: "Найдено лиц: <strong>{n}</strong>",
    unknown: "Неизвестный",
    namePh: "Имя человека",
    enroll: "Зарегистрировать лицо",
    needOne: "Для регистрации на изображении должно быть ровно одно лицо.",
    needName: "Сначала введите имя.",
    enrolled: "<strong>{name}</strong> зарегистрирован(а). Теперь покажите камеру или другое фото того же человека.",
    people: "Зарегистрированные люди",
    none: "Пока никто не зарегистрирован.",
    remove: "Удалить {name}",
    hint: "<strong>Попробуйте:</strong> включите камеру, введите своё имя и зарегистрируйте лицо — затем подвигайтесь и проверьте, узнаёт ли вас модель. Или зарегистрируйте пример фото как «Emanuel» и загрузите фото другого человека, чтобы увидеть «Неизвестный».",
    how: "<strong>Как это работает:</strong> TinyFaceDetector находит лица; сеть из 68 точек выравнивает каждое; ResNet создаёт эмбеддинг из 128 чисел. Два лица принадлежат одному человеку, если евклидово расстояние между векторами меньше 0,55. Всё работает на TensorFlow.js (WebGL) в вашем браузере.",
  },
};

const { t, fmtNum, track, escape } = Demo;
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
    const color = result.known ? "#22d3ee" : "#b895ff";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    const label = Number.isFinite(result.distance) ? `${result.name} · ${fmtNum(result.distance)}` : result.name;
    const labelWidth = ctx.measureText(label).width + 12;
    const labelY = y > 26 ? y - 24 : y + h;
    ctx.fillStyle = color;
    ctx.fillRect(x, labelY, labelWidth, 22);
    ctx.fillStyle = "#090811";
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
  track("demo-face-camera", "Demo facial: ligou a câmera");
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

async function init() {
  Demo.setup(T, render);
  renderPeople();
  setStatus(t("loading"));
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS),
    ]);
  } catch {
    setStatus(t("loadError"));
    return;
  }
  setStatus(t("ready"));
  document.querySelectorAll("[data-camera], [data-upload], [data-sample]").forEach((el) => (el.disabled = false));

  $("[data-camera]").addEventListener("click", () => (stream ? stopCamera() : startCamera()));
  $("[data-sample]").addEventListener("click", () => {
    showImage("/emanuel-borges.jpg");
    $("[data-name]").value ||= "Emanuel";
  });
  $("[data-upload]").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) showImage(URL.createObjectURL(file));
    event.target.value = "";
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
    track("demo-face-cadastro", "Demo facial: cadastrou um rosto");
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
