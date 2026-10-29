"use client";

import { useActionState } from "react";
import { salvarOferta, type EstadoOferta } from "./actions";
import type { OfertaIg } from "@/lib/instagram";

const TONS = ["amigável", "próximo e acolhedor", "direto ao ponto", "descontraído", "profissional"];

export function FormOferta({ oferta }: { oferta: OfertaIg | null }) {
  const [estado, acao, salvando] = useActionState<EstadoOferta, FormData>(salvarOferta, {});

  return (
    <form action={acao} className="cartao space-y-5">
      {oferta && <input type="hidden" name="id" value={oferta.id} />}

      <div className="grid gap-5 md:grid-cols-[1fr_200px]">
        <div>
          <label className="rotulo" htmlFor="nome">Nome do produto</label>
          <input id="nome" name="nome" required className="campo" defaultValue={oferta?.nome}
            placeholder="Ex.: Mentoria IA para Infoprodutores" />
        </div>
        <div>
          <label className="rotulo" htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" className="campo" defaultValue={oferta?.tipo ?? "infoproduto"}>
            <option value="infoproduto">Infoproduto / curso</option>
            <option value="mentoria">Mentoria</option>
            <option value="micro_saas">Micro SaaS</option>
            <option value="servico">Serviço</option>
          </select>
        </div>
      </div>

      <div>
        <label className="rotulo" htmlFor="preco">Preço</label>
        <input id="preco" name="preco" required className="campo" defaultValue={oferta?.preco}
          placeholder="Ex.: R$ 497 à vista ou 12x de R$ 49,70" />
      </div>

      <div>
        <label className="rotulo" htmlFor="transformacao">Qual transformação a pessoa compra?</label>
        <textarea id="transformacao" name="transformacao" rows={2} required className="campo"
          defaultValue={oferta?.transformacao}
          placeholder="Ex.: sair do zero e fazer as primeiras 10 vendas do seu curso em 30 dias usando IA" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="para_quem">Para quem é</label>
          <textarea id="para_quem" name="para_quem" rows={3} required className="campo"
            defaultValue={oferta?.para_quem}
            placeholder="Ex.: experts e criadoras com 2 mil a 30 mil seguidores que querem lançar o primeiro produto" />
        </div>
        <div>
          <label className="rotulo" htmlFor="para_quem_nao">Para quem NÃO é (opcional)</label>
          <textarea id="para_quem_nao" name="para_quem_nao" rows={3} className="campo"
            defaultValue={oferta?.para_quem_nao ?? ""}
            placeholder="Ex.: quem busca dinheiro rápido ou não quer aparecer" />
        </div>
      </div>

      <div>
        <label className="rotulo" htmlFor="provas">Provas: depoimentos, números, cases (opcional)</label>
        <textarea id="provas" name="provas" rows={3} className="campo" defaultValue={oferta?.provas ?? ""}
          placeholder="Ex.: Júlia fez R$ 8 mil no primeiro lançamento; 120 alunas; nota 4,9" />
        <p className="mt-1 text-xs text-texto-suave">A IA usa isso para responder objeções. Só coloque o que é verdade.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="garantia">Garantia (opcional)</label>
          <input id="garantia" name="garantia" className="campo" defaultValue={oferta?.garantia ?? ""}
            placeholder="Ex.: 7 dias incondicional" />
        </div>
        <div>
          <label className="rotulo" htmlFor="bonus_urgencia">Bônus ou urgência real (opcional)</label>
          <input id="bonus_urgencia" name="bonus_urgencia" className="campo" defaultValue={oferta?.bonus_urgencia ?? ""}
            placeholder="Ex.: turma fecha dia 30; bônus de 1 call individual" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="convite">Como você quer convidar?</label>
          <select id="convite" name="convite" className="campo" defaultValue={oferta?.convite ?? "call"}>
            <option value="call">Call de 15 minutos</option>
            <option value="isca">Material gratuito (isca)</option>
            <option value="checkout">Direto para o checkout</option>
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="isca">Link da agenda ou da isca (opcional)</label>
          <input id="isca" name="isca" className="campo" defaultValue={oferta?.isca ?? ""}
            placeholder="Ex.: calendly.com/ana/15min ou aula gratuita" />
        </div>
      </div>

      <div>
        <label className="rotulo" htmlFor="checkout_url">Link de checkout (opcional)</label>
        <input id="checkout_url" name="checkout_url" type="url" className="campo" defaultValue={oferta?.checkout_url ?? ""}
          placeholder="https://pay.cakto.com.br/..." />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="tom">Tom das mensagens</label>
          <select id="tom" name="tom" className="campo" defaultValue={oferta?.tom ?? "amigável"}>
            {TONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="assinatura">Seu primeiro nome (opcional)</label>
          <input id="assinatura" name="assinatura" className="campo" defaultValue={oferta?.assinatura ?? ""}
            placeholder="Ex.: Ana" />
        </div>
      </div>

      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      <button className="btn-primario" disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar oferta"}
      </button>
    </form>
  );
}
