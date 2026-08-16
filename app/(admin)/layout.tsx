export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ color: "var(--pulse-text)" }}>
      {children}
    </div>
  );
}
