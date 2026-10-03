export const metadata = { title: "ลิงก์แชร์", robots: { index: false, follow: false } };
export default function PublicLayout({ children }) {
  return <div className="min-h-screen bg-mist"><main className="mx-auto max-w-2xl p-5">{children}</main></div>;
}
