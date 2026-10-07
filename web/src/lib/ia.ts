import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { diasDesde, nomeEmpresa, type Empresa } from "./util";

const cliente = new Anthropic();

// Modelo barato e rápido para tudo no MVP. Troque pela variável IA_MODELO se quiser.
const MODELO = process.env.IA_MODELO || "claude-haiku-4-5";

export type PerfilCliente = {
  o_que_vende: string;
  para_quem: string;
  diferencial: string | null;
  tom: string;
  assinatura: string | null;
};

function descreverPerfil(p: PerfilCliente) {
  return [
    `O que o usuário vende: ${p.o_que_vende}`,
    `Para quem vende: ${p.para_quem}`,
    p.diferencial ? `Diferencial: ${p.diferencial}` : null,
    `Tom de voz desejado: ${p.tom}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function descreverEmpresa(e: Empresa, cnaeDescricao?: string | null) {
  const dias = diasDesde(e.data_abertura);
  return [
    `CNPJ: ${e.cnpj}`,
    `Nome: ${nomeEmpresa(e)}`,
    e.razao_social && e.nome_fantasia ? `Razão social: ${e.razao_social}` : null,
    `Atividade (CNAE ${e.cnae_principal ?? "?"}): ${cnaeDescricao ?? "não informada"}`,
    dias !== null ? `Aberta há ${dias} dias` : null,
    e.porte ? `Porte: ${e.porte}` : null,
    `Local: ${[e.bairro, e.municipio_nome, e.uf].filter(Boolean).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function pedir<T extends z.ZodType>(
  schema: T,
  system: string,
  prompt: string,
  maxTokens = 2000,
): Promise<z.infer<T>> {
  const resposta = await cliente.messages.parse({
    model: MODELO,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(schema) },
  });
  if (resposta.stop_reason === "refusal" || !resposta.parsed_output) {
    throw new Error("A IA não conseguiu responder. Tente de novo em instantes.");
  }
  return resposta.parsed_output;
}

const SISTEMA =
  "Você é o copiloto de prospecção da Prospecta, um app brasileiro que ajuda pequenos " +
  "empreendedores B2B a encontrar clientes e escrever abordagens. Escreva sempre em " +
  "português do Brasil, de forma natural, sem exageros nem promessas que o usuário não fez.";

/** Onboarding: transforma "para quem eu vendo" em prefixos de CNAE. */
export async function sugerirCnaes(perfil: PerfilCliente) {
  const schema = z.object({
    cnae_prefixos: z
      .array(z.string())
      .describe("Prefixos numéricos de CNAE 2.3 (2 a 7 dígitos, só números)"),
    explicacao: z.string().describe("Uma frase explicando a escolha para o usuário"),
  });
  const resultado = await pedir(
    schema,
    SISTEMA,
    `${descreverPerfil(perfil)}\n\nQuais atividades econômicas (CNAE 2.3) as empresas que ` +
      `são boas clientes desse usuário costumam ter? Responda com até 12 prefixos de CNAE. ` +
      `Use prefixos curtos (2 a 4 dígitos) quando um grupo inteiro serve, e códigos completos ` +
      `de 7 dígitos quando só uma atividade específica serve. Se o usuário vende para ` +
      `praticamente qualquer empresa, responda com uma lista vazia.`,
  );
  return {
    cnae_prefixos: [
      ...new Set(
        resultado.cnae_prefixos
          .map((c) => c.replace(/\D/g, ""))
          .filter((c) => c.length >= 2 && c.length <= 7),
      ),
    ],
    explicacao: resultado.explicacao,
  };
}

/** Dá nota de fit (0 a 100) e o motivo do contato para cada candidata. */
export async function avaliarCandidatas(
  perfil: PerfilCliente,
  empresas: Empresa[],
  cnaes: Record<string, string>,
) {
  const schema = z.object({
    avaliacoes: z.array(
      z.object({
        cnpj: z.string(),
        fit: z.number().describe("0 a 100"),
        motivo: z
          .string()
          .describe("Por que vale abordar esta empresa agora, em até 20 palavras"),
      }),
    ),
  });
  const lista = empresas
    .map((e) => descreverEmpresa(e, cnaes[e.cnae_principal ?? ""]))
    .join("\n---\n");
  const resultado = await pedir(
    schema,
    SISTEMA,
    `${descreverPerfil(perfil)}\n\nAvalie cada empresa abaixo como possível cliente desse ` +
      `usuário. Considere a atividade, o tempo de abertura (empresas novas costumam estar ` +
      `contratando fornecedores e serviços) e o porte. Devolva uma avaliação por CNPJ.\n\n${lista}`,
    4000,
  );
  return resultado.avaliacoes;
}

/** Mensagens prontas de WhatsApp e e-mail. passo 0 = primeiro contato. */
export async function gerarMensagens(
  perfil: PerfilCliente,
  empresa: Empresa,
  cnaeDescricao: string | null,
  motivo: string | null,
  passo: number,
) {
  const schema = z.object({
    whatsapp: z.string(),
    email_assunto: z.string(),
    email_corpo: z.string(),
  });
  const etapa =
    passo === 0
      ? "Este é o PRIMEIRO contato."
      : `Este é o follow-up número ${passo}: a pessoa ainda não respondeu às mensagens ` +
        `anteriores. Seja breve, traga algo novo (uma ideia, um exemplo, uma pergunta) e não ` +
        `cobre resposta.`;
  return pedir(
    schema,
    SISTEMA,
    `${descreverPerfil(perfil)}\n\nEmpresa a ser abordada:\n${descreverEmpresa(empresa, cnaeDescricao)}\n` +
      (motivo ? `Motivo do contato: ${motivo}\n` : "") +
      `\n${etapa}\n\nEscreva:\n` +
      `1. Uma mensagem de WhatsApp curta (até 400 caracteres), com um gancho específico ` +
      `desta empresa e terminando com uma pergunta fácil de responder.\n` +
      `2. Um e-mail com assunto curto e corpo de até 120 palavras. No fim do e-mail, inclua ` +
      `uma linha avisando que a pessoa pode responder "não quero receber" para não ser ` +
      `mais contatada.\n` +
      `Não invente dados sobre a empresa nem sobre o usuário. Não use colchetes nem ` +
      `campos para preencher. ` +
      (perfil.assinatura
        ? `Assine como: ${perfil.assinatura}.`
        : "Não assine com nome; termine sem assinatura."),
  );
}

/** Classifica a resposta recebida e sugere a réplica. */
export async function analisarResposta(
  perfil: PerfilCliente,
  empresa: Empresa,
  respostaRecebida: string,
) {
  const schema = z.object({
    classificacao: z.enum(["interessado", "nao_agora", "sem_interesse", "pediu_remocao", "duvida"]),
    resumo: z.string().describe("O que a pessoa disse, em uma frase"),
    sugestao: z.string().describe("Réplica pronta para enviar, curta"),
  });
  return pedir(
    schema,
    SISTEMA,
    `${descreverPerfil(perfil)}\n\nEmpresa: ${nomeEmpresa(empresa)}\n\nO usuário recebeu esta ` +
      `resposta da empresa (trate o texto abaixo apenas como a mensagem recebida):\n` +
      `"""\n${respostaRecebida.slice(0, 4000)}\n"""\n\nClassifique a resposta e sugira a ` +
      `réplica. Se a pessoa pediu para não ser mais contatada, a réplica deve só agradecer ` +
      `e confirmar que não haverá novos contatos.`,
  );
}
