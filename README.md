# Slip Manager

ระบบจัดการการชำระเงินและตรวจสลิปส่วนตัว (Next.js App Router, local-first)

## เริ่มใช้งาน
```bash
npm install
npm run dev        # http://localhost:3000  (/ -> /app)
npm test           # 29 tests (parser, verification, payment, share, database, backup)
```
ครั้งแรกจะเจอหน้า "ตั้งค่าฐานข้อมูล" แล้วเลือกสร้างข้อมูลตัวอย่างหรือเริ่มระบบเปล่า
ต้องต่อเน็ตครั้งแรกเพื่อโหลดฟอนต์ Google และไฟล์ภาษาไทยของ Tesseract (แล้วถูก cache)

## โครงสร้าง
- `src/core/` logic ล้วน ไม่ผูกกับ UI/เบราว์เซอร์ (ทดสอบได้): parser, verification, payment, shareLogic, crypto, health, backup
- `src/db/` LocalStorage + IndexedDB + migrations (DB_VERSION = 2)
- `src/repositories/` → `src/services/` → `src/hooks/` → `src/components/` + `src/app/`
- `src/app/api/slip/{ocr,verify}` Route Handler เป็น proxy ฝั่งเซิร์ฟเวอร์

## External API (ไม่บังคับ)
คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ OCR_API_URL / OCR_API_KEY / VERIFY_API_URL / VERIFY_API_KEY
(ห้ามขึ้นต้นด้วย NEXT_PUBLIC_) จากนั้นเลือก Provider ในหน้า ตั้งค่า > บริการภายนอก
รูปแบบที่ proxy คาดหวังจากผู้ให้บริการ OCR: ตอบ JSON `{ "text": "...", "confidence": 0-100 }`
ปรับ mapping ใน `src/app/api/slip/*/route.js` ให้ตรงกับผู้ให้บริการจริง

## ข้อจำกัดที่ควรรู้
- ผลตรวจสลิปเป็นระดับ Document Verification เท่านั้น ไม่ยืนยันว่าเงินเข้าบัญชี สถานะ PAID ต้องให้เจ้าของกดยืนยันเอง
- ลิงก์แชร์ในโหมด Local เปิดได้เฉพาะเบราว์เซอร์เครื่องเจ้าของ ส่งให้คนอื่นด้วย Share Package (ไฟล์ JSON, เข้ารหัส AES-GCM ถ้ามีรหัสผ่าน) ถ้าต้องการ URL ข้ามเครื่องต้องทำ RemoteShareProvider
- สลิปรองรับ JPG/PNG/WebP (ยังไม่รองรับ PDF) · preprocessing: resize, grayscale, contrast, threshold (ยังไม่มี crop/แก้การหมุน)
- ยังไม่ได้ทำ: ธีมมืด, Export Excel/PDF, ภาษาอื่นนอกจากไทย
