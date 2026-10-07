import Link from "next/link";
import { diasDesde, nomeEmpresa, type Empresa } from "@/lib/util";

export type LeadComEmpresa = {
  id: string;
  status: string;
  fit_score: number | null;
  motivo: string | null;
  followup_passo: number;
  proximo_followup_em: string | null;
  companies: Empresa;
};

export function CartaoLead({ lead, destaque }: { lead: LeadComEmpresa; destaque?: string }) {
  const e = lead.companies;
  const dias = diasDesde(e.data_abertura);
  return (
    <Link href={`/leads/${lead.id}`} className="cartao block transition hover:border-marinho">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{nomeEmpresa(e)}</p>
          <p className="text-sm text-texto-suave">
            {[dias !== null ? `Aberta há ${dias} dias` : null, e.bairro, e.municipio_nome]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {lead.fit_score !== null && (
          <span className="shrink-0 rounded-full bg-laranja px-3 py-1 text-sm font-bold text-marinho">
            Fit {lead.fit_score}
          </span>
        )}
      </div>
      {lead.motivo && <p className="mt-2 text-sm">{lead.motivo}</p>}
      {destaque && <p className="mt-2 text-sm font-semibold text-laranja-escuro">{destaque}</p>}
    </Link>
  );
}
