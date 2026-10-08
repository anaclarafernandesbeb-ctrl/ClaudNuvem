import Link from "next/link";
import { Logo } from "@/components/Logo";

const MENU = [
  ["/hoje", "Hoje"],
  ["/leads", "Leads"],
  ["/perfil", "Meu cliente ideal"],
  ["/planos", "Plano"],
];

export default function AreaLogada({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-borda bg-papel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <Logo href="/hoje" />
          <nav className="flex flex-1 flex-wrap gap-4 text-sm font-semibold">
            {MENU.map(([href, nome]) => (
              <Link key={href} href={href} className="hover:text-laranja-escuro">
                {nome}
              </Link>
            ))}
          </nav>
          <form action="/sair" method="post">
            <button className="text-sm text-texto-suave underline">Sair</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
