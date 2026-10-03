"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Tag, 
  Truck, 
  Wallet, 
  UserPlus, 
  User, 
  Recycle,
  LogOut
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/scrap-rates", label: "Scrap Rates", icon: Tag },
  { href: "/my-pickups", label: "My Pickups", icon: Truck },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/referral", label: "Refer & Earn", icon: UserPlus },
  { href: "/profile", label: "Settings", icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  // Don't show sidebar on login or auth pages
  if (pathname.includes("/login") || pathname.includes("/team-invite") || pathname.includes("/admin-secret-login")) {
    return null;
  }

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-white border-r border-gray-200 shrink-0">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <Image src="/logo-horizontal-transparent.png" alt="Scrap Pay Partner Portal" width={180} height={60} className="w-auto h-12 object-contain" />
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto hide-scrollbar">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                isActive 
                  ? "bg-brand-50 text-brand-700 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 w-full transition-colors">
          <LogOut className="w-5 h-5 stroke-[2]" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
