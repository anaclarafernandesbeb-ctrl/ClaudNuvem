export type Plano = "gratis" | "solo" | "pro";

export const PLANOS: Record<
  Plano,
  { nome: string; preco: number; leadsPorDia: number; perfis: number; itens: string[] }
> = {
  gratis: {
    nome: "Grátis",
    preco: 0,
    leadsPorDia: 3,
    perfis: 1,
    itens: ["3 leads por dia", "Mensagens com IA"],
  },
  solo: {
    nome: "Solo",
    preco: 67,
    leadsPorDia: 10,
    perfis: 1,
    itens: ["10 leads por dia", "Follow-ups automáticos", "Kanban de vendas"],
  },
  pro: {
    nome: "Pro",
    preco: 147,
    leadsPorDia: 25,
    perfis: 3,
    itens: ["25 leads por dia", "3 perfis de cliente", "Tudo do Solo"],
  },
};

export function planoValido(valor: unknown): valor is Plano {
  return valor === "gratis" || valor === "solo" || valor === "pro";
}
