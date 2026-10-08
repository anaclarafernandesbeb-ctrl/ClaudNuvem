import "server-only";

// Produção: https://api.asaas.com/v3 · Testes: https://api-sandbox.asaas.com/v3
const BASE = (process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3").replace(/\/$/, "");

async function asaas<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Prospecta",
      access_token: process.env.ASAAS_API_KEY!,
      ...init?.headers,
    },
    cache: "no-store",
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = corpo?.errors?.[0]?.description || `Erro ${resposta.status} no Asaas`;
    throw new Error(erro);
  }
  return corpo as T;
}

export async function criarCliente(nome: string, email: string, cpfCnpj: string) {
  return asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({ name: nome, email, cpfCnpj: cpfCnpj.replace(/\D/g, "") }),
  });
}

export async function criarAssinatura(
  clienteId: string,
  valor: number,
  descricao: string,
  referencia: string,
) {
  const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return asaas<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: clienteId,
      billingType: "UNDEFINED", // a pessoa escolhe Pix, boleto ou cartão
      value: valor,
      nextDueDate: amanha,
      cycle: "MONTHLY",
      description: descricao,
      externalReference: referencia,
    }),
  });
}

export async function linkPrimeiraCobranca(assinaturaId: string) {
  const cobrancas = await asaas<{ data: { invoiceUrl: string }[] }>(
    `/subscriptions/${assinaturaId}/payments`,
  );
  return cobrancas.data[0]?.invoiceUrl ?? null;
}

export async function cancelarAssinatura(assinaturaId: string) {
  return asaas(`/subscriptions/${assinaturaId}`, { method: "DELETE" });
}
