"use client";

import { useActionState } from "react";
import { adicionarPerfis, analisarPendentes, type EstadoAcao } from "./actions";

export function FormAdicionar() {
  const [estado, acao, salvando] = useActionState<EstadoAcao, FormData>(adicionarPerfis, {});
  return (
    <form action={acao} className="space-y-3">
      <textarea name="usernames" rows={4} className="campo"
        placeholder={"Cole os @, um por linha ou separados por vírgula\n@fulana.mentora\n@studio.cursos"} />
      <div>
        <label className="rotulo" htmlFor="planilha">Ou envie uma planilha CSV</label>
        <input id="planilha" name="planilha" type="file" accept=".csv,.txt,text/csv" className="text-sm" />
        <p className="mt-1 text-xs text-texto-suave">Na planilha, os perfis precisam estar como @usuario ou link do Instagram.</p>
      </div>
      <button className="btn-secundario" disabled={salvando}>
        {salvando ? "Adicionando..." : "Adicionar perfis"}
      </button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      {estado.aviso && <p className="text-sm text-texto-suave">{estado.aviso}</p>}
    </form>
  );
}

export function BotaoAnalisar({ pendentes }: { pendentes: number }) {
  const [estado, acao, analisando] = useActionState<EstadoAcao>(analisarPendentes, {});
  return (
    <form action={acao} className="space-y-2">
      <button className="btn-primario" disabled={analisando || pendentes === 0}>
        {analisando ? "Lendo perfis e fazendo o Raio-X..." : `Analisar perfis (${Math.min(5, pendentes)} de ${pendentes})`}
      </button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      {estado.aviso && <p className="text-sm text-texto-suave">{estado.aviso}</p>}
    </form>
  );
}
