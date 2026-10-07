import { carregarConta } from "@/lib/conta";
import { ETAPAS } from "@/lib/util";
import { CartaoLead, type LeadComEmpresa } from "@/components/CartaoLead";

export default async function Leads() {
  const { supabase } = await carregarConta();
  const { data } = await supabase
    .from("leads")
    .select("*, companies(*)")
    .order("created_at", { ascending: false })
    .limit(500);
  const leads = (data ?? []) as LeadComEmpresa[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Seus leads</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ETAPAS.map((etapa) => {
          const daEtapa = leads.filter((l) => l.status === etapa.status);
          return (
            <section key={etapa.status} className="w-72 shrink-0 space-y-3">
              <h2 className="flex items-center justify-between text-lg font-semibold">
                {etapa.nome}
                <span className="rounded-full bg-borda px-2 text-sm">{daEtapa.length}</span>
              </h2>
              {daEtapa.map((l) => (
                <CartaoLead key={l.id} lead={l} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
