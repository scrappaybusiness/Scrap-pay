"use client";

import { generateInviteCode, getAuthMe } from "@/lib/api";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { ShieldCheck, Copy, Key, LogOut, Users, Package, IndianRupee, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleToGrant, setRoleToGrant] = useState<"ADMIN" | "COLLECTOR">("ADMIN");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("bottelpay_token");
      if (!token) {
        router.push("/admin-secret-login");
        return;
      }
      try {
        const res = await getAuthMe(token);
        const userData = res.data as User;
        if (userData.role !== "SUPER_ADMIN" && userData.role !== "ADMIN") {
          throw new Error("Unauthorized");
        }
        setUser(userData);
      } catch (err) {
        localStorage.removeItem("bottelpay_token");
        localStorage.removeItem("bottelpay_user");
        router.push("/admin-secret-login");
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("bottelpay_token");
    localStorage.removeItem("bottelpay_user");
    router.push("/");
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    setGeneratedCode(null);
    try {
      const token = localStorage.getItem("bottelpay_token");
      if (!token) throw new Error("No token");
      const res = await generateInviteCode(token, roleToGrant);
      setGeneratedCode((res.data as any)?.code || "ERROR");
      toast.success("Invite code generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              }`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors">
                  <Package className="w-6 h-6 text-brand-600" />
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Orders Management</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage all customer pickup requests</p>
            </Link>

            <Link href="/admin/rates" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors">
                  <IndianRupee className="w-6 h-6 text-brand-600" />
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Scrap Rates</h3>
              <p className="text-sm text-gray-500 mt-1">Update today's scrap prices</p>
            </Link>

            <Link href="/collector" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors">
                  <Users className="w-6 h-6 text-brand-600" />
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Collector Portal</h3>
              <p className="text-sm text-gray-500 mt-1">Access the collector interface</p>
            </Link>
          </div>
        </div>

        {/* Generate Invite Code Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Management</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-brand-50 rounded-xl">
                <Key className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Generate Team Invite Code</h3>
                <p className="text-gray-500 mt-1">Create secure, one-time use codes for new team members.</p>
              </div>
            </div>

            {user.role === "SUPER_ADMIN" ? (
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role to Grant
                  </label>
                  <select
                    value={roleToGrant}
                    onChange={(e) => setRoleToGrant(e.target.value as "ADMIN" | "COLLECTOR")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="ADMIN">Admin (Full Access)</option>
                    <option value="COLLECTOR">Collector (Pickup Operations)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateCode}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 focus:ring-4 focus:ring-brand-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {generating ? "Generating..." : "Generate Code"}
                </button>

                {generatedCode && (
                  <div className="mt-6 p-6 border-2 border-dashed border-brand-200 bg-brand-50 rounded-xl space-y-4">
                    <p className="text-sm font-medium text-brand-800 text-center">
                      Share this code securely. It can only be used once.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 bg-white px-4 py-3 rounded-lg border border-brand-200 text-center shadow-inner">
                        <span className="font-mono text-2xl font-bold tracking-widest text-brand-700">
                          {generatedCode}
                        </span>
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="p-3 text-brand-600 hover:text-brand-700 bg-brand-100 hover:bg-brand-200 rounded-lg transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Only Super Admins can generate invite codes. Contact a Super Admin if you need to add a new team member.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
