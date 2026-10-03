import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
const thai = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-thai" });
export const metadata = { title: "Slip Manager", description: "ระบบจัดการการชำระเงินและตรวจสลิปส่วนตัว" };
export const viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }) {
  return <html lang="th"><body className={`${thai.variable} font-sans`}>{children}</body></html>;
}
