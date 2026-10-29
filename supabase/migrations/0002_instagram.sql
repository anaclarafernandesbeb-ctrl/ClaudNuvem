-- Prospecta v3: prospecção no Instagram (infoprodutos e micro SaaS)
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0001_init.sql.

-- A oferta que alimenta o Motor de Conversão
create table if not exists public.ofertas_ig (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null default 'infoproduto' check (tipo in ('infoproduto', 'mentoria', 'micro_saas', 'servico')),
  preco text not null,                 -- texto livre: "R$ 497 ou 12x de R$ 49"
  transformacao text not null,         -- o resultado que a pessoa compra
  para_quem text not null,
  para_quem_nao text,
  provas text,                         -- depoimentos, números, cases
  garantia text,
  bonus_urgencia text,                 -- vagas, bônus, prazo (urgência legítima)
  checkout_url text,
  convite text not null default 'call' check (convite in ('call', 'isca', 'checkout')),
  isca text,                           -- material grátis ou link da call
  tom text not null default 'amigável',
  assinatura text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cada @ que a usuária quer abordar, com o Raio-X da IA
create table if not exists public.perfis_ig (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,              -- sem @, minúsculo
  origem text not null default 'manual' check (origem in ('manual', 'planilha', 'inbound')),
  -- dados públicos (Business Discovery ou colados pela usuária)
  nome text,
  bio text,
  site text,
  seguidores int,
  seguindo int,
  publicacoes int,
  legendas text,
  dados_em timestamptz,
  -- Raio-X
  estagio text,
  sinais text[] not null default '{}',
  dor text,
  fit int,
  temperatura text check (temperatura in ('fria', 'morna', 'quente')),
  gancho text,
  tipo_gancho text,
  nicho text,
  resumo text,
  analisado_em timestamptz,
  -- funil
  status text not null default 'novo'
    check (status in ('novo', 'abordado', 'respondeu', 'call', 'venda', 'perdido')),
  etapa int not null default 1 check (etapa between 1 and 5),
  rascunho text,
  enviado_em timestamptz,
  followup_passo int not null default 0,
  proximo_followup_em timestamptz,
  notas text,
  created_at timestamptz not null default now(),
  unique (user_id, username)
);

create index if not exists perfis_ig_lista_idx on public.perfis_ig (user_id, status, fit desc);
create index if not exists perfis_ig_followup_idx on public.perfis_ig (user_id, proximo_followup_em)
  where proximo_followup_em is not null;

-- Histórico da conversa (o que foi enviado e o que o lead respondeu)
create table if not exists public.mensagens_ig (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  perfil_id uuid not null references public.perfis_ig (id) on delete cascade,
  autor text not null check (autor in ('eu', 'lead')),
  texto text not null,
  etapa int,
  classificacao text,
  created_at timestamptz not null default now()
);

create index if not exists mensagens_ig_perfil_idx on public.mensagens_ig (perfil_id, created_at);

-- Quem pediu para não ser mais contatado
create table if not exists public.bloqueios_ig (
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, username)
);

alter table public.ofertas_ig enable row level security;
alter table public.perfis_ig enable row level security;
alter table public.mensagens_ig enable row level security;
alter table public.bloqueios_ig enable row level security;

drop policy if exists "ofertas_ig dono" on public.ofertas_ig;
create policy "ofertas_ig dono" on public.ofertas_ig
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "perfis_ig dono" on public.perfis_ig;
create policy "perfis_ig dono" on public.perfis_ig
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mensagens_ig dono" on public.mensagens_ig;
create policy "mensagens_ig dono" on public.mensagens_ig
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "bloqueios_ig dono" on public.bloqueios_ig;
create policy "bloqueios_ig dono" on public.bloqueios_ig
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
