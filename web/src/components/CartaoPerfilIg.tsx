import Link from "next/link";
import { formatarNumero, type PerfilIg } from "@/lib/instagram";

const CORES: Record<string, string> = {
  quente: "bg-laranja text-marinho",
  morna: "bg-laranja/30 text-marinho",
  fria: "bg-borda text-marinho",
};

export function CartaoPerfilIg({ perfil, destaque }: { perfil: PerfilIg; destaque?: string }) {
  return (
    <Link href={`/instagram/${perfil.id}`} className="cartao block transition hover:border-marinho">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">@{perfil.username}</p>
          <p className="truncate text-sm text-texto-suave">
            {[perfil.nome, perfil.nicho, perfil.seguidores !== null ? `${formatarNumero(perfil.seguidores)} seguidores` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {perfil.temperatura && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${CORES[perfil.temperatura]}`}>
              {perfil.temperatura}
            </span>
          )}
          {perfil.fit !== null && (
            <span className="rounded-full bg-marinho px-3 py-1 text-xs font-bold text-creme">Fit {perfil.fit}</span>
          )}
        </div>
      </div>
      {perfil.resumo && <p className="mt-2 text-sm">{perfil.resumo}</p>}
      {destaque && <p className="mt-2 text-sm font-semibold text-laranja-escuro">{destaque}</p>}
    </Link>
  );
}
