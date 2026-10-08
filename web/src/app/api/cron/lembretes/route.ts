import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Chamado todo dia útil pelo GitHub Actions (.github/workflows/lembretes.yml).
export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ enviados: 0, aviso: "sem RESEND_API_KEY" });

  const admin = criarClienteAdmin();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Quem tem perfil de cliente ativo recebe o lembrete diário
  const { data: icps } = await admin.from("icps").select("user_id").eq("ativo", true);
  const usuarios = [...new Set((icps ?? []).map((i) => i.user_id as string))];

  const { data: vencidos } = await admin
    .from("leads")
    .select("user_id")
    .eq("status", "enviado")
    .lte("proximo_followup_em", new Date().toISOString());
  const followups = new Map<string, number>();
  for (const l of vencidos ?? []) followups.set(l.user_id, (followups.get(l.user_id) ?? 0) + 1);

  const { data: perfis } = await admin.from("profiles").select("id, email").in("id", usuarios);

  let enviados = 0;
  for (const p of perfis ?? []) {
    if (!p.email) continue;
    const qtd = followups.get(p.id) ?? 0;
    const texto =
      `Bom dia! Sua lista de empresas de hoje está esperando por você.` +
      (qtd > 0 ? ` E você tem ${qtd} follow-up(s) para enviar hoje.` : "") +
      `\n\nAbra a Prospecta: ${site}/hoje`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "Prospecta <onboarding@resend.dev>",
        to: p.email,
        subject: qtd > 0 ? `Sua lista do dia + ${qtd} follow-up(s)` : "Sua lista do dia está pronta",
        text: texto,
      }),
    });
    if (r.ok) enviados++;
  }
  return NextResponse.json({ enviados });
}
