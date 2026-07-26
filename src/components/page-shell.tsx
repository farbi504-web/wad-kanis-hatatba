import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 page-fade">{children}</main>
      <Footer />
    </div>
  );
}
