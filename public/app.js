import { firebaseConfig } from "./firebase-config.js";
import { createStore } from "./store.js";
import { createMusic } from "./music.js";

/* ---------- room ---------- */
// One shared river for everyone who opens the site.
const room = "together";
if (location.search) history.replaceState(null, "", location.pathname); // drop old ?r= links

const MINE_KEY = `loy:mine:${room}`;
const NAME_KEY = "loy:name";
const mine = new Set(safeGet(MINE_KEY, []));

/* ---------- elements ---------- */
const $ = (id) => document.getElementById(id);
const layer = $("krathongs");
const river = $("river");
const formDialog = $("formDialog");
const detailDialog = $("detailDialog");
const titleDialog = $("titleDialog");
const form = $("form");
const photoInput = $("photo");
const photoPreview = $("photoPreview");

/* ---------- stars ---------- */
for (let i = 0; i < 60; i++) {
  const s = document.createElement("i");
  s.className = "star";
  s.style.left = `${Math.random() * 100}%`;
  s.style.top = `${Math.random() * 90}%`;
  s.style.setProperty("--d", `${3 + Math.random() * 4}s`);
  s.style.setProperty("--delay", `${-Math.random() * 6}s`);
  if (Math.random() < 0.2) s.style.width = s.style.height = "3px";
  $("stars").append(s);
}

/* ---------- colors ---------- */
const COLORS = ["#f4b6c2", "#f6e3b4", "#ffffff", "#c9b8f0", "#f7a072"];
let color = COLORS[0];
for (const c of COLORS) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "swatch";
  b.style.setProperty("--c", c);
  b.setAttribute("aria-label", c);
  b.setAttribute("aria-pressed", String(c === color));
  b.onclick = () => {
    color = c;
    document.querySelectorAll(".swatch").forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
  };
  $("swatches").append(b);
}

/* ---------- krathong svg ---------- */
function krathongSVG(petal) {
  const petals = [-60, -36, -12, 12, 36, 60]
    .map((a, i) => `<path d="M50 62 Q40 46 50 30 Q60 46 50 62Z" fill="${petal}" opacity="${i % 2 ? 0.95 : 0.8}" transform="rotate(${a} 50 62)"/>`)
    .join("");
  return `
  <svg viewBox="0 0 100 80" aria-hidden="true">
    <path d="M4 62 Q50 84 96 62 L90 56 Q50 70 10 56Z" fill="#2f6b45"/>
    <path d="M10 56 Q50 70 90 56" stroke="#4f9467" stroke-width="1.2" fill="none"/>
    ${petals}
    <path d="M50 64 Q42 52 50 40 Q58 52 50 64Z" fill="${petal}"/>
    <rect x="47.5" y="14" width="5" height="26" rx="1.5" fill="#f3ead6"/>
    <rect x="58" y="22" width="2.5" height="20" rx="1" fill="#c9a66b" transform="rotate(8 59 32)"/>
    <rect x="40" y="22" width="2.5" height="20" rx="1" fill="#c9a66b" transform="rotate(-8 41 32)"/>
    <g class="flame">
      <path d="M50 3 Q55 10 50 15 Q45 10 50 3Z" fill="#ffcf7a"/>
      <path d="M50 8 Q52 11 50 14 Q48 11 50 8Z" fill="#fff6dc"/>
    </g>
  </svg>`;
}

/* ---------- floating ---------- */
const CROSS_MS = 90_000; // time to cross the screen once

// Krathongs from "other people" drifting far away, so the river never feels empty.
// Deterministic (fixed t), so both of you see them at the same spots. Not stored anywhere.
const AMBIENT = [
  ["#f4b6c2", "ขอให้ครอบครัวแข็งแรง"],
  ["#ffffff", "ขอให้สอบผ่าน"],
  ["#f6e3b4", "ขอให้ปีหน้าดีกว่าปีนี้"],
  ["#c9b8f0", "ขอให้เจอคนที่ใช่"],
  ["#f7a072", "ขอให้งานราบรื่น"],
  ["#f4b6c2", "ขอขมาพระแม่คงคา"],
  ["#ffffff", "ขอให้ทุกคนมีความสุข"],
  ["#f6e3b4", "ขอให้หายเหนื่อย"],
].map(([color, wish], i) => ({
  id: `ambient-${i}`, ambient: true, name: "", wish, color,
  t: 0, phase: i / 8, speed: 1.3 + (i % 3) * 0.15, lane: 0.1 + (i * 0.375 % 1) * 0.28,
}));
let latest = [];
const items = new Map(); // id -> { el, data, lane, seed }

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

function render(list = latest) {
  latest = list;
  list = [...list, ...AMBIENT];
  const seen = new Set();
  for (const k of list) {
    seen.add(k.id);
    if (items.has(k.id)) continue;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "kt" + (mine.has(k.id) ? " mine" : "") + (k.ambient ? " ambient" : "");
    el.setAttribute("aria-label", k.ambient ? "กระทงของใครสักคน" : `กระทงของ ${k.name}`);
    el.innerHTML = `<span class="glow"></span><span class="reflect"></span>${krathongSVG(k.color || COLORS[0])}`;
    if (k.photo) {
      const img = document.createElement("img");
      img.className = "face";
      img.src = k.photo;
      img.alt = "";
      el.append(img);
    }
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = k.name;
    el.append(label);
    el.onclick = () => showDetail(k);
    if (Date.now() - k.t < 5000) el.classList.add("new");
    layer.append(el);
    const seed = hash(k.id);
    items.set(k.id, { el, data: k, seed, lane: k.lane ?? 0.42 + ((seed * 7.31) % 1) * 0.32 });
  }
  for (const [id, it] of items) if (!seen.has(id)) { it.el.remove(); items.delete(id); }

  const n = latest.length;
  $("count").textContent = n ? `มีกระทง ${n} ใบ ลอยอยู่` : "สายน้ำยังว่างอยู่";
}

function tick(now) {
  const w = river.clientWidth;
  const h = river.clientHeight;
  const wall = Date.now();
  const span = w + 200;
  for (const it of items.values()) {
    // position derived from creation time so both of you see the same spot
    const start = (100 + w * (0.08 + ((it.seed * 13.7) % 1) * 0.55)) / span; // first appear 8–63% in, spread apart
    const p = (((wall - it.data.t) / (CROSS_MS * (it.data.speed || 1)) + (it.data.phase ?? start)) % 1 + 1) % 1;
    const x = -100 + p * span;
    const bob = Math.sin(now / 900 + it.seed * 40) * 3;
    const tilt = Math.sin(now / 1300 + it.seed * 20) * 3;
    const y = it.lane * h + bob;
    const scale = (0.62 + it.lane * 0.55) * (it.data.ambient ? 1 : 1.4); // nearer = bigger; ours stand out
    it.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg) scale(${scale})`;
    it.el.style.zIndex = String(Math.round(it.lane * 100));
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------- detail ---------- */
function showDetail(k) {
  const img = $("dPhoto");
  img.hidden = !k.photo;
  if (k.photo) img.src = k.photo;
  $("dWish").textContent = k.wish;
  $("dName").textContent = k.ambient ? "ใครสักคน" : k.name;
  $("dTime").textContent = k.ambient ? "คืนนี้" : new Date(k.t).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  detailDialog.showModal();
}

/* ---------- form ---------- */
let photoData = null;
$("name").value = localStorage.getItem(NAME_KEY) || "";

$("openForm").onclick = () => formDialog.showModal();
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
for (const d of [formDialog, detailDialog, titleDialog]) {
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); }); // click backdrop
}

photoInput.onchange = async () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  try {
    photoData = await compressImage(file);
    photoPreview.style.backgroundImage = `url(${photoData})`;
    photoPreview.classList.add("has");
  } catch {
    toast("เปิดรูปนี้ไม่ได้ ลองรูปอื่นนะ");
  }
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const name = $("name").value.trim();
  const wish = $("wish").value.trim();
  if (!name || !wish) return;
  const btn = $("submitBtn");
  btn.disabled = true;
  try {
    const id = await store.add({ name, wish, color, photo: photoData, t: Date.now() });
    mine.add(id);
    safeSet(MINE_KEY, [...mine]);
    localStorage.setItem(NAME_KEY, name);
    $("wish").value = "";
    photoData = null;
    photoInput.value = "";
    photoPreview.style.backgroundImage = "";
    photoPreview.classList.remove("has");
    formDialog.close();
    toast("ลอยแล้ว ✦");
  } catch (err) {
    console.error(err);
    toast("ส่งไม่สำเร็จ ลองอีกครั้งนะ");
  } finally {
    btn.disabled = false;
  }
};

/* ---------- room title ---------- */
const DEFAULT_TITLE = "ลอยกระทง";
let roomTitle = "";
function showTitle(t) {
  roomTitle = t || "";
  $("roomTitle").textContent = roomTitle || DEFAULT_TITLE;
  document.title = roomTitle ? `${roomTitle} · ลอยกระทง` : DEFAULT_TITLE;
}
$("titleBtn").onclick = () => {
  $("titleInput").value = roomTitle;
  titleDialog.showModal();
};
$("titleForm").onsubmit = async (e) => {
  e.preventDefault();
  const t = $("titleInput").value.trim().slice(0, 40);
  try {
    await store.setTitle(t);
    showTitle(t);
    titleDialog.close();
  } catch (err) {
    console.error(err);
    toast("บันทึกไม่สำเร็จ ลองอีกครั้งนะ");
  }
};

/* ---------- music ---------- */
const MUSIC_KEY = "loy:music";
const music = createMusic();
const musicBtn = $("musicBtn");
function syncMusicBtn() {
  musicBtn.setAttribute("aria-pressed", String(music.playing));
  musicBtn.setAttribute("aria-label", music.playing ? "ปิดเพลง" : "เปิดเพลง");
}
musicBtn.onclick = async () => {
  if (music.playing) music.stop(); else await music.start().catch(() => toast("เปิดเพลงไม่ได้"));
  safeSet(MUSIC_KEY, music.playing);
  syncMusicBtn();
};
// browsers need a tap before playing sound: resume the user's choice on first tap
if (safeGet(MUSIC_KEY, false)) {
  const resume = async (e) => {
    if (e.target.closest?.("#musicBtn")) return;
    await music.start().catch(() => {});
    syncMusicBtn();
  };
  window.addEventListener("pointerdown", resume, { once: true });
}
let resumeOnShow = false; // pause while the tab is in the background
document.addEventListener("visibilitychange", () => {
  if (document.hidden && music.playing) { music.stop(); resumeOnShow = true; }
  else if (!document.hidden && resumeOnShow) { resumeOnShow = false; music.start().then(syncMusicBtn).catch(() => {}); }
});

/* ---------- helpers ---------- */
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

async function compressImage(file, maxSide = 720, maxBytes = 400_000) {
  const bmp = await createImageBitmap(file);
  let side = maxSide;
  for (let q = 0.82; ; q -= 0.12) {
    const s = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", Math.max(q, 0.4));
    if (url.length <= maxBytes || side < 240) return url;
    if (q < 0.5) { side *= 0.75; q = 0.94; }
  }
}

function safeGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/* ---------- start ---------- */
let store;
render([]);
try {
  store = await createStore(firebaseConfig, room);
  if (store.demo) $("demoBadge").hidden = false;
  store.subscribe(render);
  store.subscribeTitle(showTitle);
} catch (err) {
  console.error(err);
  toast("เชื่อมต่อไม่ได้ ลองรีเฟรชหน้าอีกครั้งนะ");
}
