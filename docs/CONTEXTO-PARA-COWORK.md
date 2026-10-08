# Prospecta: contexto para continuar no Cowork

> Cole este arquivo, ou peça para o Claude lê-lo, no início da conversa no Cowork. Ele resume tudo o que já foi feito e o que falta.
> **Atenção:** este arquivo não tem nenhuma chave nem senha. As chaves ficam só nos painéis da Netlify, do Supabase e do GitHub.

## O que é o projeto

**Prospecta, o Copiloto de Prospecção.** É um micro SaaS para pequenos negócios B2B. Todo dia ele entrega uma lista curta de empresas recém-abertas da região do usuário, vindas dos dados abertos do CNPJ da Receita Federal. A IA dá a cada empresa uma nota de fit e escreve a mensagem de abordagem para WhatsApp e e-mail. O app também lembra dos follow-ups.

- Plano e pesquisa: `docs/PLANO-MICRO-SAAS.md` e `docs/PESQUISA-E-PROPOSTA-V2.md`
- Guia de configuração: `docs/COMO-COLOCAR-NO-AR.md`
- Pitch de vendas (slides): https://claude.ai/artifact/HKCWZz8JPuWNTneNDXdT9w

## Onde está cada coisa

| Item | Onde |
|---|---|
| Código | GitHub: `anaclarafernandesbeb-ctrl/ClaudNuvem` (branch `main`) |
| Site no ar | https://negociofechadoprospeccao.netlify.app |
| Hospedagem | Netlify, site **negociofechadoprospeccao** (o site `prospecta-copiloto` não é usado e pode ser apagado) |
| Banco de dados e login | Supabase, projeto **prospecta** (região São Paulo) |
| IA | Anthropic (console.anthropic.com), modelo `claude-haiku-4-5` |
| Estado escolhido | **MG** |

## Estrutura do código

| Pasta | Conteúdo |
|---|---|
| `web/` | App Next.js 16 (TypeScript, Tailwind, Supabase SSR, SDK da Anthropic) |
| `supabase/migrations/0001_init.sql` | Tabelas, RLS e a função `candidatos_do_dia` |
| `etl/importar_cnpj.py` | Importador mensal dos dados abertos do CNPJ |
| `.github/workflows/` | `importar-cnpj.yml` (todo dia 15) e `lembretes.yml` (dias úteis, 8h) |
| `netlify.toml` | Build em `web/` e o plugin `@netlify/plugin-nextjs` |

## Status

### ✅ Concluído
- [x] Planejamento, pesquisa de mercado e pitch
- [x] MVP programado e com o PR juntado na `main`
- [x] Site publicado na Netlify com o runtime do Next.js (funções e edge functions)
- [x] SQL do banco rodado no Supabase
- [x] Variáveis na Netlify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `ASAAS_API_URL` (sandbox)
- [x] Supabase → Authentication → URL Configuration apontando para o site

### ⏳ Falta fazer
1. **GitHub → Settings → Secrets and variables → Actions**
   - Secret `DATABASE_URL`: a connection string do *Session pooler* do Supabase, com a senha do banco
   - Secret `CRON_SECRET`: o mesmo valor que está na Netlify (copiar de lá ou gerar um novo e atualizar os dois lugares)
   - Variable `UFS` = `MG`
   - Variable `DIAS` = `120`
   - Variable `APP_URL` = `https://negociofechadoprospeccao.netlify.app`
2. **GitHub → Actions:** ativar os workflows e rodar **Importar dados do CNPJ** (Run workflow). Leva de 30 a 90 minutos.
3. **Testar o app:** login por link no e-mail → cadastrar "Meu cliente ideal" → "Montar lista de hoje" → "Escrever mensagem com IA".
   - Conferir se a `ANTHROPIC_API_KEY` funciona. A chave cadastrada começa com `sk-ant-usr-`, e as chaves de API costumam começar com `sk-ant-api03-`. Se a IA der erro, criar uma nova em https://console.anthropic.com/settings/keys.
4. **Antes de vender:** domínio próprio, Resend (e-mails de login e lembretes, com SMTP no Supabase), Asaas em produção, revisão jurídica da página `/privacidade`.

### 💡 Próximas funcionalidades combinadas
- Upload de planilha própria de leads (CSV/Excel)
- Leads do Google Meu Negócio pela Places API oficial (guardar só o `place_id`)
- Cruzamento entre Google e Receita para juntar nota e site com a data de abertura e o porte

## Observações técnicas
- O primeiro deploy saiu sem funções. O PR #2 corrigiu isso declarando `@netlify/plugin-nextjs` no `netlify.toml`.
- O Supabase grátis envia poucos e-mails de login por hora. Para clientes reais, configure SMTP com o Resend.
- O Supabase grátis tem 500 MB. Se a importação de MG estourar o limite, reduza `DIAS` (ex.: 60) ou filtre por `CNAES`.
