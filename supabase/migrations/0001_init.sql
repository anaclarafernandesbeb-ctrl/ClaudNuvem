-- Prospecta: estrutura inicial do banco de dados
-- Rode este arquivo uma vez no SQL Editor do Supabase.

-- ============================================================
-- Dados públicos (carregados pelo script etl/importar_cnpj.py)
-- ============================================================

create table if not exists public.cnaes (
  codigo text primary key,          -- 7 dígitos, ex.: 6920601
  descricao text not null
);

create table if not exists public.companies (
  cnpj text primary key,            -- 14 dígitos
  razao_social text,
  nome_fantasia text,
  cnae_principal text,
  natureza_juridica text,
  porte text,
  pessoa_fisica boolean not null default false, -- MEI / empresário individual: dado de pessoa física (LGPD)
  data_abertura date,
  uf text,
  municipio_codigo text,
  municipio_nome text,
  bairro text,
  logradouro text,
  numero text,
  cep text,
  telefone text,
  email text,
  atualizado_em timestamptz not null default now()
);

create index if not exists companies_busca_idx
  on public.companies (uf, municipio_nome, data_abertura desc);
create index if not exists companies_cnae_idx
  on public.companies (cnae_principal text_pattern_ops);

-- Pedidos de remoção feitos pelas próprias empresas (página /remover)
create table if not exists public.global_optouts (
  cnpj text primary key,
  contato text,
  motivo text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Dados dos usuários
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plano text not null default 'gratis' check (plano in ('gratis', 'solo', 'pro')),
  plano_status text not null default 'ativo',
  asaas_customer_id text,
  asaas_subscription_id text,
  plano_pendente text,
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

create table if not exists public.icps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null default 'Meu cliente ideal',
  o_que_vende text not null,
  para_quem text not null,
  diferencial text,
  tom text not null default 'amigável',
  assinatura text,                  -- como o usuário assina as mensagens
  ufs text[] not null default '{}',
  cidades text[] not null default '{}',   -- em MAIÚSCULAS e sem acento, como na Receita
  cnae_prefixos text[] not null default '{}',
  idade_max_dias int not null default 180,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  icp_id uuid references public.icps (id) on delete set null,
  company_cnpj text not null references public.companies (cnpj),
  status text not null default 'novo'
    check (status in ('novo', 'enviado', 'respondeu', 'reuniao', 'ganho', 'perdido')),
  fit_score int,
  motivo text,
  mensagem_whatsapp text,
  email_assunto text,
  email_corpo text,
  data_lista date not null default current_date,
  enviado_em timestamptz,
  followup_passo int not null default 0,
  proximo_followup_em timestamptz,
  notas text,
  created_at timestamptz not null default now(),
  unique (user_id, company_cnpj)
);

create index if not exists leads_user_lista_idx on public.leads (user_id, data_lista);
create index if not exists leads_followup_idx on public.leads (proximo_followup_em)
  where proximo_followup_em is not null;

-- Lista de bloqueio de cada usuário ("não quero mais contato")
create table if not exists public.suppressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cnpj text not null,
  created_at timestamptz not null default now(),
  unique (user_id, cnpj)
);

-- ============================================================
-- Segurança (Row Level Security): cada um vê só o que é seu
-- ============================================================

alter table public.cnaes enable row level security;
alter table public.companies enable row level security;
alter table public.global_optouts enable row level security;
alter table public.profiles enable row level security;
alter table public.icps enable row level security;
alter table public.leads enable row level security;
alter table public.suppressions enable row level security;

drop policy if exists "cnaes leitura" on public.cnaes;
create policy "cnaes leitura" on public.cnaes for select using (true);

drop policy if exists "empresas leitura" on public.companies;
create policy "empresas leitura" on public.companies
  for select to authenticated using (true);

-- profiles: o usuário só lê. Plano é alterado apenas pelo servidor (service role).
drop policy if exists "perfil leitura" on public.profiles;
create policy "perfil leitura" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "icps dono" on public.icps;
create policy "icps dono" on public.icps
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "leads dono" on public.leads;
create policy "leads dono" on public.leads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "bloqueio dono" on public.suppressions;
create policy "bloqueio dono" on public.suppressions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- global_optouts: sem políticas = só o servidor (service role) lê e grava.

-- ============================================================
-- Busca de candidatos para a lista do dia
-- ============================================================

create or replace function public.candidatos_do_dia(p_icp_id uuid, p_limite int)
returns setof public.companies
language sql
stable
security definer set search_path = public
as $$
  select c.*
  from public.companies c
  join public.icps i on i.id = p_icp_id and i.user_id = auth.uid()
  where c.uf = any (i.ufs)
    and (cardinality(i.cidades) = 0 or c.municipio_nome = any (i.cidades))
    and (
      cardinality(i.cnae_prefixos) = 0
      or exists (select 1 from unnest(i.cnae_prefixos) p where c.cnae_principal like p || '%')
    )
    and c.data_abertura >= current_date - i.idade_max_dias
    and (c.telefone is not null or c.email is not null)
    and not exists (select 1 from public.leads l where l.user_id = auth.uid() and l.company_cnpj = c.cnpj)
    and not exists (select 1 from public.suppressions s where s.user_id = auth.uid() and s.cnpj = c.cnpj)
    and not exists (select 1 from public.global_optouts g where g.cnpj = c.cnpj)
  order by c.data_abertura desc
  limit least(p_limite, 200);
$$;

revoke all on function public.candidatos_do_dia(uuid, int) from public, anon;
grant execute on function public.candidatos_do_dia(uuid, int) to authenticated;
