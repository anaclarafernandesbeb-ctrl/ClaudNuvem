"use client";

import { useActionState } from "react";
import { salvarPerfil, type EstadoPerfil } from "./actions";
import { UFS } from "@/lib/util";
import type { Icp } from "@/lib/conta";

const TONS = ["amigável", "profissional", "descontraído", "direto ao ponto"];

export function FormPerfil({ icp }: { icp: Icp | null }) {
  const [estado, acao, salvando] = useActionState<EstadoPerfil, FormData>(salvarPerfil, {});

  return (
    <form action={acao} className="cartao space-y-5">
      {icp && <input type="hidden" name="id" value={icp.id} />}
      <div>
        <label className="rotulo" htmlFor="o_que_vende">O que você vende?</label>
        <textarea id="o_que_vende" name="o_que_vende" rows={2} required className="campo"
          defaultValue={icp?.o_que_vende}
          placeholder="Ex.: gestão de Instagram e anúncios para negócios locais" />
      </div>
      <div>
        <label className="rotulo" htmlFor="para_quem">Para que tipo de empresa?</label>
        <textarea id="para_quem" name="para_quem" rows={2} required className="campo"
          defaultValue={icp?.para_quem}
          placeholder="Ex.: clínicas de estética, salões de beleza e restaurantes recém-abertos" />
      </div>
      <div>
        <label className="rotulo" htmlFor="diferencial">Qual o seu diferencial? (opcional)</label>
        <input id="diferencial" name="diferencial" className="campo" defaultValue={icp?.diferencial ?? ""}
          placeholder="Ex.: pacote de lançamento com resultado em 30 dias" />
      </div>

      <fieldset>
        <legend className="rotulo">Em quais estados?</legend>
        <div className="flex flex-wrap gap-2">
          {UFS.map((uf) => (
            <label key={uf} className="flex items-center gap-1 rounded-full border border-borda px-3 py-1 text-sm has-checked:border-laranja has-checked:bg-laranja/10">
              <input type="checkbox" name="ufs" value={uf} defaultChecked={icp?.ufs.includes(uf)} />
              {uf}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-texto-suave">
          Só aparecem empresas dos estados que já foram carregados no sistema.
        </p>
      </fieldset>

      <div>
        <label className="rotulo" htmlFor="cidades">Cidades (opcional, separadas por vírgula)</label>
        <input id="cidades" name="cidades" className="campo" defaultValue={icp?.cidades.join(", ")}
          placeholder="Ex.: Campinas, Valinhos" />
        <p className="mt-1 text-xs text-texto-suave">Em branco = o estado inteiro.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="idade_max_dias">Empresas abertas há no máximo</label>
          <select id="idade_max_dias" name="idade_max_dias" className="campo" defaultValue={icp?.idade_max_dias ?? 180}>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
            <option value={180}>6 meses</option>
            <option value={365}>1 ano</option>
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="tom">Tom das mensagens</label>
          <select id="tom" name="tom" className="campo" defaultValue={icp?.tom ?? "amigável"}>
            {TONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="rotulo" htmlFor="assinatura">Como você assina as mensagens? (opcional)</label>
        <input id="assinatura" name="assinatura" className="campo" defaultValue={icp?.assinatura ?? ""}
          placeholder="Ex.: Ana, da Studio Pulso" />
      </div>

      <div>
        <label className="rotulo" htmlFor="cnaes">Atividades (CNAE)</label>
        <input id="cnaes" name="cnaes" className="campo" defaultValue={icp?.cnae_prefixos.join(", ")}
          placeholder="Deixe em branco para a IA escolher" />
        <p className="mt-1 text-xs text-texto-suave">
          Deixe em branco e a IA escolhe as atividades certas a partir do que você escreveu.
          Para pedir uma nova sugestão, apague este campo e salve.
        </p>
      </div>

      <div>
        <label className="rotulo" htmlFor="nome">Nome deste perfil</label>
        <input id="nome" name="nome" className="campo" defaultValue={icp?.nome ?? "Meu cliente ideal"} />
      </div>

      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      <button className="btn-primario" disabled={salvando}>
        {salvando ? "Salvando e consultando a IA..." : "Salvar perfil"}
      </button>
    </form>
  );
}
