import "server-only";

// Business Discovery: dados públicos de perfis comerciais e de criador a partir do @.
// Precisa de META_ACCESS_TOKEN (token de usuário com instagram_basic + pages_show_list)
// e IG_USER_ID (o ID da sua conta comercial do Instagram ligada a uma Página do Facebook).
const VERSAO = process.env.META_GRAPH_VERSION || "v23.0";

export type DadosPublicos = {
  nome: string | null;
  bio: string | null;
  site: string | null;
  seguidores: number | null;
  seguindo: number | null;
  publicacoes: number | null;
  legendas: string | null;
};

export function businessDiscoveryConfigurado() {
  return Boolean(process.env.META_ACCESS_TOKEN && process.env.IG_USER_ID);
}

type Resposta = {
  business_discovery?: {
    name?: string;
    biography?: string;
    website?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    media?: { data: { caption?: string; like_count?: number; comments_count?: number; timestamp?: string }[] };
  };
  error?: { message: string };
};

/** null quando o perfil é pessoal, não existe ou a API não está configurada. */
export async function buscarPerfilPublico(username: string): Promise<DadosPublicos | null> {
  if (!businessDiscoveryConfigurado()) return null;
  const campos =
    `business_discovery.username(${username})` +
    `{name,biography,website,followers_count,follows_count,media_count,` +
    `media.limit(6){caption,like_count,comments_count,timestamp}}`;
  const url =
    `https://graph.facebook.com/${VERSAO}/${process.env.IG_USER_ID}` +
    `?fields=${encodeURIComponent(campos)}&access_token=${process.env.META_ACCESS_TOKEN}`;
  try {
    const resposta = await fetch(url, { cache: "no-store" });
    const corpo = (await resposta.json()) as Resposta;
    const bd = corpo.business_discovery;
    if (!resposta.ok || !bd) return null;
    const legendas = (bd.media?.data ?? [])
      .map((m) => {
        const data = m.timestamp ? m.timestamp.slice(0, 10) : "?";
        const texto = (m.caption ?? "").replace(/\s+/g, " ").slice(0, 400);
        return `[${data} · ${m.like_count ?? 0} curtidas · ${m.comments_count ?? 0} comentários] ${texto}`;
      })
      .join("\n");
    return {
      nome: bd.name ?? null,
      bio: bd.biography ?? null,
      site: bd.website ?? null,
      seguidores: bd.followers_count ?? null,
      seguindo: bd.follows_count ?? null,
      publicacoes: bd.media_count ?? null,
      legendas: legendas || null,
    };
  } catch {
    return null;
  }
}
