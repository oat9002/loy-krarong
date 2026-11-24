// Data layer: Firebase Firestore when configured, otherwise a local demo
// store that syncs across tabs of the same browser.

const FB = "https://www.gstatic.com/firebasejs/10.12.2";

export async function createStore(config, room) {
  if (!config?.apiKey || config.apiKey.startsWith("YOUR_")) return demoStore(room);

  const { initializeApp } = await import(`${FB}/firebase-app.js`);
  const fs = await import(`${FB}/firebase-firestore.js`);
  const db = fs.getFirestore(initializeApp(config));
  const col = fs.collection(db, "rooms", room, "krathongs");
  const roomRef = fs.doc(db, "rooms", room);

  return {
    demo: false,
    async add(data) {
      const ref = await fs.addDoc(col, { ...data, photo: data.photo || null, createdAt: fs.serverTimestamp() });
      return ref.id;
    },
    subscribe(cb) {
      const q = fs.query(col, fs.orderBy("t", "desc"), fs.limit(60));
      return fs.onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("firestore:", err));
    },
    async setTitle(title) {
      await fs.setDoc(roomRef, { title }, { merge: true });
    },
    subscribeTitle(cb) {
      return fs.onSnapshot(roomRef, (snap) => cb(snap.data()?.title || ""),
        (err) => console.error("firestore:", err));
    },
  };
}

function demoStore(room) {
  const key = `loy:demo:${room}`;
  const titleKey = `${key}:title`;
  const titleListeners = new Set();
  const emitTitle = () => titleListeners.forEach((cb) => cb(localStorage.getItem(titleKey) || ""));
  const bc = "BroadcastChannel" in window ? new BroadcastChannel(key) : null;
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
  const listeners = new Set();
  const emit = () => { const list = read(); listeners.forEach((cb) => cb(list)); };
  bc?.addEventListener("message", () => { emit(); emitTitle(); });
  window.addEventListener("storage", (e) => { if (e.key === key) emit(); if (e.key === titleKey) emitTitle(); });

  return {
    demo: true,
    async add(data) {
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      const list = [{ id, ...data }, ...read()].slice(0, 30);
      localStorage.setItem(key, JSON.stringify(list));
      bc?.postMessage("change");
      emit();
      return id;
    },
    subscribe(cb) { listeners.add(cb); cb(read()); return () => listeners.delete(cb); },
    async setTitle(title) {
      localStorage.setItem(titleKey, title);
      bc?.postMessage("change");
      emitTitle();
    },
    subscribeTitle(cb) { titleListeners.add(cb); emitTitle(); return () => titleListeners.delete(cb); },
  };
}
