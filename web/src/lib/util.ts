export type Empresa = {
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnae_principal: string | null;
  porte: string | null;
  pessoa_fisica: boolean;
  data_abertura: string | null;
  uf: string | null;
  municipio_nome: string | null;
  bairro: string | null;
  telefone: string | null;
  email: string | null;
};

export type StatusLead = "novo" | "enviado" | "respondeu" | "reuniao" | "ganho" | "perdido";

export const ETAPAS: { status: StatusLead; nome: string }[] = [
  { status: "novo", nome: "Novo" },
  { status: "enviado", nome: "Contatado" },
  { status: "respondeu", nome: "Respondeu" },
  { status: "reuniao", nome: "Reunião" },
  { status: "ganho", nome: "Ganho" },
  { status: "perdido", nome: "Perdido" },
];

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

/** "São Paulo" -> "SAO PAULO" (formato da Receita). */
export function normalizarCidade(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function nomeEmpresa(e: Pick<Empresa, "nome_fantasia" | "razao_social">) {
  return e.nome_fantasia || e.razao_social || "Empresa sem nome";
}

export function diasDesde(data: string | null) {
  if (!data) return null;
  const ms = Date.now() - new Date(data + "T00:00:00").getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Telefone da Receita (DDD + número) -> link do WhatsApp com a mensagem. */
export function linkWhatsApp(telefone: string | null, texto: string) {
  const digitos = (telefone || "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto)}`;
}

export function linkEmail(email: string | null, assunto: string, corpo: string) {
  if (!email) return null;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

export function formatarTelefone(telefone: string | null) {
  const d = (telefone || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone || "";
}

export function formatarCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/** Data de hoje no fuso de Brasília, no formato AAAA-MM-DD. */
export function hojeBrasil() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** Dias até o próximo follow-up depois de cada passo enviado (0 = primeira mensagem). */
export const INTERVALO_FOLLOWUP = [2, 3, 5];
