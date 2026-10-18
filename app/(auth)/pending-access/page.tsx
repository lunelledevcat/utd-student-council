import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "รอการอนุมัติสิทธิ์" };

export default async function PendingAccessPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role) redirect("/dashboard");
  return (
    <div className="space-y-5">
      <div aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-pink-soft text-3xl">✿</div>
      <div>
        <h1 className="text-2xl font-bold text-strong">รอผู้ดูแลอนุมัติสิทธิ์</h1>
        <p className="mt-2 text-muted">
          คุณเข้าสู่ระบบด้วย <span className="font-medium text-ink">{s.email}</span> ได้แล้ว แต่ยังไม่ได้รับสิทธิ์ใช้งานหลังบ้าน
          กรุณาแจ้งครูที่ปรึกษาหรือผู้ดูแลระบบให้กำหนดสิทธิ์ แล้วเข้าสู่ระบบใหม่อีกครั้ง
        </p>
      </div>
      <form action="/auth/signout" method="post">
        <button type="submit" className="rounded-full border-2 border-brand px-6 py-2.5 font-medium hover:bg-brand hover:text-on-brand">ออกจากระบบ</button>
      </form>
    </div>
  );
}
