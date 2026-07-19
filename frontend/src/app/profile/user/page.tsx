"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ProfileView } from "@/components/account-hub/ProfileView";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function UserProfilePage() {
  // Guard the page so that only authenticated users can access
  useRequireAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-white">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[180px] pointer-events-none" />
        
        <ProfileView />
      </main>
      <Footer />
    </div>
  );
}
