"use client";

import { useActionState } from "react";
import {
  avaliarResposta,
  escreverMensagem,
  type EstadoMensagem,
  type EstadoResposta,
} from "./actions";

export function BotaoEscrever({ id, texto }: { id: string; texto: string }) {
  const [estado, acao, gerando] = useActionState<EstadoMensagem>(escreverMensagem.bind(null, id), {});
  return (
    <form action={acao} className="space-y-2">
      <button className="btn-primario" disabled={gerando}>
        {gerando ? "Escrevendo..." : texto}
      </button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
    </form>
  );
}

const ROTULOS: Record<string, string> = {
  interessado: "Interessado",
  nao_agora: "Não agora",
  sem_interesse: "Sem interesse",
  pediu_remocao: "Pediu para não ser contatado (bloqueado)",
  duvida: "Tem dúvidas",
};

export function AnalisarResposta({ id }: { id: string }) {
  const [estado, acao, analisando] = useActionState<EstadoResposta, FormData>(
    avaliarResposta.bind(null, id),
    {},
  );
  return (
    <form action={acao} className="space-y-3">
      <textarea name="resposta" rows={4} className="campo" placeholder="Cole aqui a resposta que você recebeu" />
      <button className="btn-secundario" disabled={analisando}>
        {analisando ? "Analisando..." : "Analisar resposta com IA"}
      </button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      {estado.resultado && (
        <div className="space-y-2 rounded-xl bg-creme p-4">
          <p className="text-sm font-semibold">
            {ROTULOS[estado.resultado.classificacao] ?? estado.resultado.classificacao}:{" "}
            <span className="font-normal">{estado.resultado.resumo}</span>
          </p>
          <p className="text-sm font-semibold">Sugestão de resposta:</p>
          <p className="whitespace-pre-wrap text-sm">{estado.resultado.sugestao}</p>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => navigator.clipboard.writeText(estado.resultado!.sugestao)}
          >
            Copiar sugestão
          </button>
        </div>
      )}
    </form>
  );
}

export function BotaoCopiar({ texto }: { texto: string }) {
  return (
    <button type="button" className="btn-secundario" onClick={() => navigator.clipboard.writeText(texto)}>
      Copiar
    </button>
  );
}
