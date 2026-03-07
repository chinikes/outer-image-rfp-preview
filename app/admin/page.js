"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const tables = [
  { slug: "team-bios", label: "Team Bios", icon: "👤", description: "Team member profiles and certifications" },
  { slug: "client-references", label: "Client References", icon: "🏢", description: "Past project references and contacts" },
  { slug: "portfolio", label: "Portfolio", icon: "📁", description: "Project summaries and case studies" },
  { slug: "rate-schedules", label: "Rate Schedules", icon: "💰", description: "Service rates and line items" },
  { slug: "boilerplate", label: "Boilerplate Content", icon: "📄", description: "Standard proposal text blocks" },
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Check session on load
  if (!authenticated && typeof window !== "undefined" && sessionStorage.getItem("admin_auth") === "true") {
    setAuthenticated(true);
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the admin password to manage portal content.</p>
        <div className="flex gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : "Enter"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Manage the content library that powers AI-generated proposals.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tables.map((t) => (
          <button
            key={t.slug}
            onClick={() => router.push(`/admin/${t.slug}`)}
            className="text-left p-5 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all bg-white"
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-bold text-gray-900">{t.label}</div>
            <div className="text-xs text-gray-500 mt-1">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
