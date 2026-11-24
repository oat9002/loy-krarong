// ใส่ค่าจาก Firebase Console → Project settings → Your apps → Web app
// ถ้ายังไม่ใส่ (apiKey ยังเป็น "YOUR_API_KEY") เว็บจะทำงานใน "โหมดทดลอง"
// ซึ่งซิงก์กันได้เฉพาะแท็บในเบราว์เซอร์เครื่องเดียวกัน
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  appId: "YOUR_APP_ID",
};
