# ลอยกระทง 🪷

เว็บลอยกระทงสำหรับสองคน — เห็นกระทงของกันและกันแบบ realtime ใส่คำอธิษฐานและรูปได้

- ไม่มี build step เป็น HTML/CSS/JS ล้วน อยู่ในโฟลเดอร์ `public/`
- ใช้ Firebase Firestore (แพลนฟรี Spark พอ) เก็บข้อมูลและซิงก์แบบ realtime
- รูปถูกย่อในเบราว์เซอร์แล้วเก็บใน Firestore เลย ไม่ต้องใช้ Firebase Storage
- กดชื่อมุมซ้ายบนเพื่อตั้งชื่อห้องเอง (เช่น "ออม ♡ ต้น") แฟนจะเห็นชื่อเดียวกันทันที
- แต่ละห้องมีรหัสสุ่มในลิงก์ (`?r=...`) ส่งลิงก์ให้แฟนแล้วจะอยู่ห้องเดียวกัน
- ตำแหน่งกระทงคำนวณจากเวลาที่ลอย ทั้งสองเครื่องจึงเห็นกระทงอยู่ตรงเดียวกัน

## ลองเล่นในเครื่อง

```bash
npx serve public     # หรือ python3 -m http.server -d public
```

ถ้ายังไม่ได้ตั้งค่า Firebase จะเป็น "โหมดทดลอง" ซิงก์ได้เฉพาะแท็บในเบราว์เซอร์เดียวกัน
(เปิดสองแท็บด้วยลิงก์เดียวกันเพื่อลองดู)

## เปิดใช้จาก iPad / มือถือ (ไม่ต้องใช้คอม)

1. Firebase Console → **Firestore Database** → แท็บ **Rules** → วางเนื้อหาจาก `firestore.rules` → **Publish**
2. GitHub → repo นี้ → **Settings → Pages** → Source: **GitHub Actions**
3. GitHub → **Actions** → *Deploy to GitHub Pages* → **Run workflow**
4. เปิด <https://oat9002.github.io/loy-krarong/>

หลังจากนี้ทุกครั้งที่แก้ไฟล์ใน `public/` เว็บจะ deploy ใหม่เองอัตโนมัติ

## ตั้งค่า Firebase ด้วย CLI (ประมาณ 5 นาที)

1. ไปที่ <https://console.firebase.google.com> → **Add project**
2. **Build → Firestore Database → Create database** (เลือก production mode, region `asia-southeast1`)
3. **Project settings → Your apps → Web (`</>`)** สร้างแอป แล้วคัดลอกค่า config
   มาใส่ใน `public/firebase-config.js`
4. ติดตั้ง CLI แล้ว deploy rules + hosting

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # เลือกโปรเจกต์ที่สร้างไว้
   firebase deploy             # deploy ทั้ง hosting และ firestore rules
   ```

5. เปิด `https://<project>.web.app` กด **ชวนแฟน** แล้วส่งลิงก์ไปได้เลย

> จะ host ที่อื่นก็ได้ (GitHub Pages, Netlify, Vercel) เพราะเป็น static ล้วน
> แค่อย่าลืม deploy `firestore.rules` ด้วย `firebase deploy --only firestore:rules`

## โครงสร้าง

```
public/
  index.html           หน้าเว็บ
  style.css            ดีไซน์ (โทนกลางคืน minimal)
  app.js               UI, การลอย, ฟอร์ม, ย่อรูป
  store.js             ชั้นข้อมูล: Firestore หรือโหมดทดลอง
  firebase-config.js   ใส่ค่า config ของคุณที่นี่
firestore.rules        อนุญาตอ่าน/สร้างอย่างเดียว พร้อมตรวจขนาดข้อมูล
```
