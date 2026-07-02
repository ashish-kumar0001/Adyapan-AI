import { Mail, ShieldCheck, UserCog } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AdminProfilePage() {
  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#17211c]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <Sidebar active="profile" role="admin" />
        <main className="min-w-0 flex-1 space-y-6">
          <div>
            <p className="text-sm font-semibold text-[#b7791f]">Admin profile</p>
            <h1 className="mt-2 text-3xl font-semibold">Admin Lead</h1>
          </div>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Admin account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail aria-hidden="true" className="text-[#b7791f]" size={18} />
                  <span>admin@adyapan.ai</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck aria-hidden="true" className="text-[#b7791f]" size={18} />
                  <span>Role: Admin</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserCog aria-hidden="true" className="text-[#b7791f]" size={18} />
                  <span>Access: User and profile operations</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational permissions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {["View users", "View profiles", "Moderate roles", "Monitor health"].map((permission) => (
                  <div key={permission} className="rounded-lg border border-[#e4e8df] p-4 font-medium">
                    {permission}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
