import { Notice } from "./ui";
export default function ShareLimit() {
  return <Notice kind="warn"><b>ข้อจำกัดของโหมด Local:</b> ข้อมูลอยู่ใน LocalStorage ของเบราว์เซอร์นี้ ลิงก์จึงเปิดได้เฉพาะในเครื่องนี้ หากจะส่งให้ผู้อื่น ให้ส่งออกเป็น <b>Share Package</b> (ไฟล์ snapshot) แล้วให้ผู้รับเปิดไฟล์ในหน้าลิงก์ ข้อมูลสำคัญจะไม่ถูกใส่ใน URL URL ที่เปิดข้ามเครื่องได้จริงต้องมี Remote Share Provider (เซิร์ฟเวอร์) ในอนาคต</Notice>;
}
