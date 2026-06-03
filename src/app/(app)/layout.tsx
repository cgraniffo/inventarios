import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav, NavMobile } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const email = user.email ?? "";

  return (
    <div className="flex min-h-screen">
      <Nav email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <NavMobile email={email} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
