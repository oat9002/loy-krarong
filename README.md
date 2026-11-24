# ลอยกระทง 🪷

เว็บลอยกระทงสำหรับสองคน — เห็นกระทงของกันและกันแบบ realtime ใส่คำอธิษฐานและรูปได้

- ไม่มี build step เป็น HTML/CSS/JS ล้วน อยู่ในโฟลเดอร์ `public/`
- ใช้ Firebase Firestore (แพลนฟรี Spark พอ) เก็บข้อมูลและซิงก์แบบ realtime
- รูปถูกย่อในเบราว์เซอร์แล้วเก็บใน Firestore เลย ไม่ต้องใช้ Firebase Storage
- มีห้องเดียว ใครเปิดเว็บก็เห็นสายน้ำเดียวกัน
- กดชื่อมุมซ้ายบนเพื่อตั้งชื่อเอง (เช่น "ออม ♡ ต้น") ทุกคนเห็นชื่อเดียวกันทันที
- ตำแหน่งกระทงคำนวณจากเวลาที่ลอย ทั้งสองเครื่องจึงเห็นกระทงอยู่ตรงเดียวกัน

## ลองเล่นในเครื่อง

```bash
npx serve public     # หรือ python3 -m http.server -d public
```

ถ้ายังไม่ได้ตั้งค่า Firebase จะเป็น "โหมดทดลอง" ซิงก์ได้เฉพาะแท็บในเบราว์เซอร์เดียวกัน
(เปิดสองแท็บเพื่อลองดู)

## เปิดใช้จาก iPad / มือถือ (ไม่ต้องใช้คอม)

GitHub Actions จะ deploy ขึ้น Firebase Hosting ให้อัตโนมัติ ตั้งค่าครั้งเดียว:

1. Firebase Console → **Firestore Database** → **Create database** (ถ้ายังไม่ได้สร้าง)
2. Firebase Console → **Hosting** → **Get started** → กด Next จนจบ
3. Firebase Console → ⚙️ **Project settings → Service accounts** → **Generate new private key**
   ได้ไฟล์ `.json` มา เปิดในแอป Files แล้วคัดลอกข้อความทั้งหมด
4. GitHub → repo นี้ → **Settings → Secrets and variables → Actions → New repository secret**
   ชื่อ `FIREBASE_SERVICE_ACCOUNT` วางข้อความจากข้อ 3 → **Add secret**
5. GitHub → **Actions** → *Deploy to Firebase* → **Run workflow**
6. เปิด <https://loy-kratong-2ea09.web.app>

หลังจากนี้ทุกครั้งที่แก้โค้ด เว็บจะ deploy ใหม่เองอัตโนมัติ (ลบไฟล์ key ในเครื่องทิ้งได้เลยหลังใส่ secret)

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

5. เปิด `https://<project>.web.app` แล้วส่งลิงก์ให้แฟนได้เลย

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
