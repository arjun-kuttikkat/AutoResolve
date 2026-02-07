"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Active Cases", href: "/dashboard" },
  { label: "Customers", href: "/dashboard/customers" },
  { label: "Inbox Sync", href: "/dashboard" },
  { label: "Negotiation Playbooks", href: "/dashboard" },
  { label: "Escalations", href: "/dashboard" },
  { label: "Billing & Usage", href: "/dashboard" },
  { label: "Settings", href: "/dashboard" }
];

const customers = [
  {
    id: "1",
    name: "Nova Air",
    email: "support@novaair.com",
    disputes: 4,
    status: "Negotiating",
    recovered: "$2.1k"
  },
  {
    id: "2",
    name: "Silk & Oak",
    email: "billing@silkoak.co",
    disputes: 2,
    status: "Escalated",
    recovered: "$890"
  },
  {
    id: "3",
    name: "Orbit Rentals",
    email: "ops@orbitrentals.io",
    disputes: 6,
    status: "Follow-up",
    recovered: "$3.4k"
  },
  {
    id: "4",
    name: "Meridian Labs",
    email: "accounts@meridianlabs.com",
    disputes: 1,
    status: "Resolved",
    recovered: "$1.2k"
  }
];

export default function CustomersPage() {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-radial">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="pointer-events-none absolute left-0 top-[-20%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(92,147,255,0.45),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(56,232,210,0.35),transparent_70%)] blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-none gap-6 px-8 py-8 xl:grid-cols-[280px_1fr]">
        <aside className="glass-panel hidden h-[calc(100vh-4rem)] flex-col justify-between rounded-[32px] border border-panelBorder/80 p-6 shadow-glow xl:flex">
          <div className="space-y-8">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="AutoResolve"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">
                    AutoResolve
                  </p>
                  <p className="text-xs text-muted">Autonomous Negotiation</p>
                </div>
              </Link>
              <div className="rounded-2xl border border-panelBorder/70 bg-white/70 p-3">
                <p className="text-xs text-muted">Connected inbox</p>
                <p className="text-sm font-semibold">ops@autoresolve.ai</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard/customers"
                    ? pathname === "/dashboard/customers"
                    : pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-2 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-slate-950 shadow-soft"
                        : "text-muted hover:bg-white/70 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-6">
          <header className="glass-panel flex flex-wrap items-center justify-between gap-6 rounded-[32px] border border-panelBorder/80 p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-panelBorder/80 bg-white/70 p-2 text-muted transition hover:bg-white hover:text-slate-900"
                  aria-label="Back to dashboard"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Link>
                <div>
                  <div className="chip bg-brandSoft text-brand">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    Customers
                  </div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                    Customer list
                  </h1>
                  <p className="max-w-xl text-sm text-muted">
                    Manage merchants and dispute history.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-2xl border border-panelBorder/80 bg-white/70 px-4 py-2 text-sm text-muted shadow-soft transition hover:bg-white"
              >
                Back to home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px] hover:shadow-lg"
              >
                Back to Dashboard
              </Link>
            </div>
          </header>

          <section className="glass-panel rounded-[32px] border border-panelBorder/80 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                All customers
              </p>
              <button className="rounded-2xl border border-panelBorder/80 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white">
                Add customer
              </button>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-panelBorder/70 text-left text-xs uppercase tracking-[0.2em] text-muted">
                    <th className="pb-4 font-semibold">Customer</th>
                    <th className="pb-4 font-semibold">Email</th>
                    <th className="pb-4 font-semibold">Disputes</th>
                    <th className="pb-4 font-semibold">Status</th>
                    <th className="pb-4 font-semibold">Recovered</th>
                    <th className="pb-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panelBorder/50">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group transition hover:bg-white/50"
                    >
                      <td className="py-4">
                        <p className="font-semibold text-slate-900">
                          {customer.name}
                        </p>
                      </td>
                      <td className="py-4 text-sm text-muted">
                        {customer.email}
                      </td>
                      <td className="py-4">
                        <span className="chip bg-white text-slate-700">
                          {customer.disputes}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`chip ${
                            customer.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-700"
                              : customer.status === "Escalated"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-white text-slate-700"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-semibold text-emerald-600">
                        {customer.recovered}
                      </td>
                      <td className="py-4 text-right">
                        <button className="rounded-xl border border-panelBorder/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-white">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
