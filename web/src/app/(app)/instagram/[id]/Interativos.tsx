"use client";

import { useActionState, useState } from "react";
import {
  escreverDm,
  marcarEnviado,
  registrarResposta,
  salvarDadosEAnalisar,
  salvarRascunho,
  type EstadoIg,
  type EstadoResposta,
} from "./actions";
import type { PerfilIg } from "@/lib/instagram";

export function BotaoEscrever({ id, texto }: { id: string; texto: string }) {
  const [estado, acao, gerando] = useActionState<EstadoIg>(escreverDm.bind(null, id), {});
  return (
    <form action={acao} className="space-y-2">
      <button className="btn-primario" disabled={gerando}>{gerando ? "Escrevendo..." : texto}</button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
    </form>
  );
}

/** Rascunho editável + copiar, abrir a DM e confirmar o envio. */
export function EnvioDm({ id, rascunho, linkDm }: { id: string; rascunho: string; linkDm: string }) {
  const [texto, setTexto] = useState(rascunho);
  const [copiado, setCopiado] = useState(false);
  return (
    <form className="space-y-3">
      <textarea name="rascunho" rows={5} className="campo" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <p className="text-xs text-texto-suave">{texto.length} caracteres</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primario"
          onClick={async () => {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            window.open(linkDm, "_blank", "noopener,noreferrer");
          }}
        >
          Copiar e abrir DM no Instagram
        </button>
        <button type="button" className="btn-secundario" onClick={() => navigator.clipboard.writeText(texto).then(() => setCopiado(true))}>
          {copiado ? "Copiado ✓" : "Só copiar"}
        </button>
        <button formAction={marcarEnviado.bind(null, id)} className="btn-secundario border-marinho">✓ Já enviei</button>
        <button formAction={salvarRascunho.bind(null, id)} className="text-sm underline">Salvar alterações</button>
      </div>
      <p className="text-xs text-texto-suave">
        A mensagem é copiada e a conversa abre no Instagram: é só colar e enviar. Depois clique em
        “Já enviei” para registrar e agendar o próximo passo.
      </p>
    </form>
  );
}

const ROTULOS: Record<string, string> = {
  interessado: "Interessado",
  pergunta: "Fez uma pergunta",
  objecao_preco: "Objeção de preço",
  objecao_tempo: "Objeção de tempo",
  objecao_confianca: "Objeção de confiança",
  vou_pensar: "Vou pensar",
  comprou: "Comprou! 🎉",
  sem_interesse: "Sem interesse",
  pediu_parar: "Pediu para parar (bloqueado)",
};

export function LerResposta({ id }: { id: string }) {
  const [estado, acao, lendo] = useActionState<EstadoResposta, FormData>(registrarResposta.bind(null, id), {});
  return (
    <form action={acao} className="space-y-3">
      <textarea name="resposta" rows={4} className="campo" placeholder="Cole aqui o que a pessoa respondeu no Direct" />
      <button className="btn-secundario" disabled={lendo}>{lendo ? "Lendo a conversa..." : "Ler resposta e sugerir a próxima"}</button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      {estado.resultado && (
        <div className="space-y-2 rounded-xl bg-creme p-4 text-sm">
          <p className="font-semibold">
            {ROTULOS[estado.resultado.classificacao] ?? estado.resultado.classificacao}:{" "}
            <span className="font-normal">{estado.resultado.leitura}</span>
          </p>
          <p><b>Estratégia:</b> {estado.resultado.estrategia}</p>
          <p>A próxima mensagem já está no campo “Próxima mensagem” acima.</p>
          <details>
            <summary className="cursor-pointer underline">Ver uma versão alternativa</summary>
            <p className="mt-2 whitespace-pre-wrap">{estado.resultado.alternativa}</p>
            <button type="button" className="mt-1 underline" onClick={() => navigator.clipboard.writeText(estado.resultado!.alternativa)}>
              Copiar alternativa
            </button>
          </details>
        </div>
      )}
    </form>
  );
}

export function FormDados({ perfil }: { perfil: PerfilIg }) {
  const [estado, acao, analisando] = useActionState<EstadoIg, FormData>(salvarDadosEAnalisar.bind(null, perfil.id), {});
  return (
    <form action={acao} className="space-y-3">
      <div>
        <label className="rotulo" htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={3} className="campo" defaultValue={perfil.bio ?? ""}
          placeholder="Copie a bio do perfil e cole aqui" />
      </div>
      <div>
        <label className="rotulo" htmlFor="legendas">Uma ou duas legendas recentes (opcional)</label>
        <textarea id="legendas" name="legendas" rows={3} className="campo" defaultValue={perfil.legendas ?? ""} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input name="nome" className="campo" placeholder="Nome" defaultValue={perfil.nome ?? ""} />
        <input name="seguidores" className="campo" placeholder="Seguidores" defaultValue={perfil.seguidores ?? ""} />
        <input name="site" className="campo" placeholder="Link da bio" defaultValue={perfil.site ?? ""} />
      </div>
      <button className="btn-secundario" disabled={analisando}>{analisando ? "Analisando..." : "Salvar e fazer o Raio-X"}</button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      {estado.aviso && <p className="text-sm text-texto-suave">{estado.aviso}</p>}
    </form>
  );
}
