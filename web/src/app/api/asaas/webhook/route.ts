import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Configure no painel do Asaas: Integrações > Webhooks, apontando para /api/asaas/webhook,
// com o mesmo token da variável ASAAS_WEBHOOK_TOKEN.
export async function POST(request: NextRequest) {
  if (request.headers.get("asaas-access-token") !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const evento = await request.json().catch(() => null);
  const tipo: string | undefined = evento?.event;
  const assinaturaId: string | undefined = evento?.payment?.subscription ?? evento?.subscription?.id;
  if (!tipo || !assinaturaId) return NextResponse.json({ ok: true });

  const admin = criarClienteAdmin();
  const { data: perfil } = await admin
    .from("profiles")
    .select("id, plano, plano_pendente")
    .eq("asaas_subscription_id", assinaturaId)
    .maybeSingle();
  if (!perfil) return NextResponse.json({ ok: true });

  if (tipo === "PAYMENT_CONFIRMED" || tipo === "PAYMENT_RECEIVED") {
    await admin
      .from("profiles")
      .update({ plano: perfil.plano_pendente ?? perfil.plano, plano_status: "ativo" })
      .eq("id", perfil.id);
  } else if (tipo === "PAYMENT_OVERDUE") {
    await admin.from("profiles").update({ plano_status: "atrasado" }).eq("id", perfil.id);
  } else if (tipo === "SUBSCRIPTION_DELETED" || tipo === "SUBSCRIPTION_INACTIVATED") {
    await admin
      .from("profiles")
      .update({ plano: "gratis", plano_status: "ativo", asaas_subscription_id: null, plano_pendente: null })
      .eq("id", perfil.id);
  }
  return NextResponse.json({ ok: true });
}
