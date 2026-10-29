export type OfertaIg = {
  id: string;
  nome: string;
  tipo: string;
  preco: string;
  transformacao: string;
  para_quem: string;
  para_quem_nao: string | null;
  provas: string | null;
  garantia: string | null;
  bonus_urgencia: string | null;
  checkout_url: string | null;
  convite: "call" | "isca" | "checkout";
  isca: string | null;
  tom: string;
  assinatura: string | null;
  ativo: boolean;
};

export type StatusIg = "novo" | "abordado" | "respondeu" | "call" | "venda" | "perdido";

export type PerfilIg = {
  id: string;
  username: string;
  origem: string;
  nome: string | null;
  bio: string | null;
  site: string | null;
  seguidores: number | null;
  seguindo: number | null;
  publicacoes: number | null;
  legendas: string | null;
  dados_em: string | null;
  estagio: string | null;
  sinais: string[];
  dor: string | null;
  fit: number | null;
  temperatura: "fria" | "morna" | "quente" | null;
  gancho: string | null;
  tipo_gancho: string | null;
  nicho: string | null;
  resumo: string | null;
  analisado_em: string | null;
  status: StatusIg;
  etapa: number;
  rascunho: string | null;
  enviado_em: string | null;
  followup_passo: number;
  proximo_followup_em: string | null;
  notas: string | null;
  created_at: string;
};

export type MensagemIg = {
  id: string;
  autor: "eu" | "lead";
  texto: string;
  etapa: number | null;
  classificacao: string | null;
  created_at: string;
};

export const ETAPAS_IG: { status: StatusIg; nome: string }[] = [
  { status: "novo", nome: "Novo" },
  { status: "abordado", nome: "Abordado" },
  { status: "respondeu", nome: "Respondeu" },
  { status: "call", nome: "Call / checkout" },
  { status: "venda", nome: "Venda" },
  { status: "perdido", nome: "Perdido" },
];

export const PLAYBOOK = [
  { etapa: 1, nome: "Abertura", objetivo: "Gancho real do perfil + pergunta curta. Sem pitch." },
  { etapa: 2, nome: "Diagnóstico", objetivo: "1 ou 2 perguntas sobre o momento e a dor." },
  { etapa: 3, nome: "Valor", objetivo: "Uma ideia ou mini-diagnóstico grátis." },
  { etapa: 4, nome: "Convite", objetivo: "Call de 15 min, isca ou checkout se estiver quente." },
  { etapa: 5, nome: "Fechamento", objetivo: "Urgência legítima e o link." },
];

/** Meta diária segura de DMs manuais. */
export const META_DMS_DIA = 20;

/** Dias até o próximo follow-up depois de cada passo (0 = abertura). Plano: D+2 e D+5. */
export const INTERVALO_FOLLOWUP_IG = [2, 3];

/** "@Fulana.Silva", "instagram.com/fulana.silva/" -> "fulana.silva" */
export function normalizarUsername(texto: string) {
  const limpo = texto
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#\s]/)[0]
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(limpo) ? limpo : null;
}

/** Abre a conversa no Instagram (app no celular, site no computador). */
export function linkDm(username: string) {
  return `https://ig.me/m/${username}`;
}

export function linkPerfil(username: string) {
  return `https://www.instagram.com/${username}/`;
}

export function formatarNumero(n: number | null) {
  if (n === null) return "?";
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(n);
}
