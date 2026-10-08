import { carregarConta } from "@/lib/conta";
import { PLANOS, type Plano } from "@/lib/planos";
import { FormAssinar } from "./FormAssinar";

export default async function Planos() {
  const { plano, perfil } = await carregarConta();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seu plano</h1>
        <p className="text-texto-suave">
          Você está no plano <b>{PLANOS[plano].nome}</b>.
          {perfil?.plano_status === "atrasado" && " Há um pagamento em atraso: regularize para manter seu plano."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PLANOS) as Plano[]).map((id) => {
          const p = PLANOS[id];
          const atual = id === plano;
          return (
            <div key={id} className={`cartao space-y-4 ${atual ? "border-2 border-laranja" : ""}`}>
              <div>
                <h2 className="text-xl font-semibold">{p.nome}</h2>
                <p className="font-display text-4xl font-bold">
                  R$ {p.preco}
                  {p.preco > 0 && <span className="text-base text-texto-suave">/mês</span>}
                </p>
              </div>
              <ul className="space-y-1 text-texto-suave">
                {p.itens.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
              {atual ? (
                <p className="font-semibold text-laranja-escuro">Plano atual</p>
              ) : id !== "gratis" ? (
                <FormAssinar plano={id} rotulo={`Assinar ${p.nome}`} />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-texto-suave">
        Pagamento por Pix, boleto ou cartão, processado pelo Asaas. O plano é liberado assim que
        o pagamento é confirmado. Para cancelar, fale com o suporte.
      </p>
    </div>
  );
}
