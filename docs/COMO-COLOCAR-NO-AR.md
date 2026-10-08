# Como colocar a Prospecta no ar

Guia passo a passo, sem precisar programar. Você cria as contas e cola as chaves nos lugares indicados. A parte técnica já está pronta neste repositório.

> **Regra de ouro:** chaves e senhas nunca vão no chat nem em arquivos do repositório. Elas vão só nos painéis da Netlify, do GitHub e do Supabase, como indicado abaixo.

Ordem recomendada (cerca de 1h30 no total):

1. [Supabase](#1-supabase-banco-de-dados-e-login): banco de dados e login
2. [GitHub](#2-github-carregar-as-empresas-da-receita): carregar as empresas da Receita Federal
3. [Anthropic](#3-anthropic-a-ia): a IA
4. [Netlify](#4-netlify-colocar-o-site-no-ar): colocar o site no ar
5. [Resend](#5-resend-e-mails): e-mails de login e de lembrete
6. [Asaas](#6-asaas-cobrança): cobrança por Pix, boleto e cartão
7. [Teste final](#7-teste-final)

---

## 1. Supabase (banco de dados e login)

1. Crie uma conta em **supabase.com** e clique em **New project**.
   - Nome: `prospecta`. Região: **South America (São Paulo)**.
   - Crie uma senha forte para o banco e **guarde-a** (num gerenciador de senhas).
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Copie todo o conteúdo do arquivo [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql), cole e clique em **Run**. Deve aparecer "Success".
4. Vá em **Authentication → URL Configuration**:
   - **Site URL**: o endereço do site (você terá esse endereço no passo 4; volte aqui depois).
   - **Redirect URLs**: adicione `https://SEU-SITE/auth/callback`.
5. Anote três informações (**Project Settings → API Keys** e **Connect**):
   - **Project URL**, que vira `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key**, que vira `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key**, que vira `SUPABASE_SECRET_KEY` (é secreta: nunca compartilhe)
6. Em **Connect → Session pooler**, copie a "connection string" e troque `[YOUR-PASSWORD]` pela senha do banco. Ela vira o `DATABASE_URL` do passo 2.

## 2. GitHub (carregar as empresas da Receita)

O GitHub roda, todo mês, um robô que baixa os dados abertos do CNPJ e grava no seu banco só as empresas que interessam.

1. Neste repositório, vá em **Settings → Secrets and variables → Actions**.
2. Aba **Secrets → New repository secret**:
   - `DATABASE_URL`: a connection string do passo 1.6
   - `CRON_SECRET`: invente um texto longo e aleatório (ex.: 40 letras e números)
3. Aba **Variables → New repository variable**:
   - `UFS`: seu(s) estado(s), ex.: `SP` ou `SP,MG`
   - `DIAS`: `120` (empresas abertas nos últimos 120 dias)
   - `CNAES`: deixe vazio para todas as atividades, ou limite por prefixos, ex.: `56,96,86`
   - `APP_URL`: o endereço do site, sem barra no final (preencha depois do passo 4)
4. Vá em **Actions → Importar dados do CNPJ → Run workflow**. A primeira carga leva de 30 a 90 minutos. Depois disso, ela roda sozinha todo dia 15.

> **Espaço no plano grátis do Supabase (500 MB):** um estado grande, como SP, com 120 dias e todas as atividades, pode passar desse limite. Se o robô der erro de espaço, diminua `DIAS` para `60` ou preencha `CNAES` com as atividades do seu nicho.

## 3. Anthropic (a IA)

1. Crie uma conta em **console.anthropic.com**.
2. Em **Billing**, adicione um cartão e coloque créditos (US$ 5 bastam para começar).
3. Em **API Keys → Create Key**, crie a chave. Ela vira `ANTHROPIC_API_KEY`.
4. Recomendado: em **Limits**, defina um teto mensal de gastos.

## 4. Netlify (colocar o site no ar)

1. Crie uma conta em **netlify.com** e entre com o GitHub.
2. **Add new site → Import an existing project → GitHub** e escolha este repositório.
   - As configurações de build já vêm do arquivo `netlify.toml`. Não precisa mudar nada.
   - Em **Branch to deploy**, use `main`, depois de aprovar o pull request.
3. Antes de publicar, abra **Site configuration → Environment variables** e cadastre as variáveis do arquivo [`web/.env.example`](../web/.env.example):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_SITE_URL`: o endereço do site (ex.: `https://prospecta.netlify.app`)
   - `ANTHROPIC_API_KEY`
   - `CRON_SECRET`: o mesmo texto do GitHub
   - As do Asaas e do Resend entram nos passos 5 e 6
4. Clique em **Deploy**. Quando terminar, copie o endereço do site e preencha o **Site URL** e o **Redirect URL** do Supabase (passo 1.4), além do `APP_URL` do GitHub (passo 2.3).
5. Domínio próprio (opcional): registre em **registro.br** (~R$ 40/ano) e conecte em **Domain management** na Netlify.

## 5. Resend (e-mails)

O Supabase só envia poucos e-mails de login por hora no plano grátis. Para clientes reais, use o Resend.

1. Crie uma conta em **resend.com** e verifique o seu domínio (**Domains → Add domain**). Isso exige um domínio próprio (passo 4.5).
2. Crie uma chave em **API Keys**. Ela vira `RESEND_API_KEY` na Netlify, com `RESEND_FROM` = `Prospecta <lembretes@seudominio.com.br>`.
3. **E-mails de login:** no Supabase, em **Authentication → Emails → SMTP Settings**, ative o SMTP personalizado com os dados do Resend (host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave).
4. **Lembretes diários:** o GitHub chama o app todo dia útil às 8h (arquivo `.github/workflows/lembretes.yml`).

## 6. Asaas (cobrança)

1. Crie uma conta em **asaas.com**. Para receber pagamentos, você vai precisar dos dados da sua empresa (CNPJ ou MEI).
2. **Comece pelo ambiente de testes:** crie também uma conta em **sandbox.asaas.com** e use `ASAAS_API_URL=https://api-sandbox.asaas.com/v3`.
3. Em **Integrações → Chave de API**, gere a chave. Ela vira `ASAAS_API_KEY` na Netlify.
4. Em **Integrações → Webhooks**, crie um webhook:
   - URL: `https://SEU-SITE/api/asaas/webhook`
   - Token de autenticação: invente um texto longo e cadastre o mesmo como `ASAAS_WEBHOOK_TOKEN` na Netlify
   - Eventos: cobranças (confirmada, recebida, vencida) e assinaturas (removida, inativada)
5. Quando os testes funcionarem, troque a chave e o `ASAAS_API_URL` pelos de produção (`https://api.asaas.com/v3`).

> Depois de mudar variáveis na Netlify, faça um novo deploy: **Deploys → Trigger deploy**.

## 7. Teste final

- [ ] Abrir o site, clicar em **Começar grátis** e entrar pelo link do e-mail
- [ ] Preencher **Meu cliente ideal** e ver a contagem de empresas disponíveis
- [ ] Clicar em **Montar lista de hoje** e ver as empresas com nota de fit
- [ ] Abrir uma empresa, clicar em **Escrever mensagem com IA** e abrir no WhatsApp
- [ ] Clicar em **Já enviei** e ver o follow-up agendado
- [ ] Colar uma resposta de teste em **Recebeu uma resposta?**
- [ ] Assinar o plano Solo no ambiente de testes do Asaas e ver o plano mudar
- [ ] Pedir a remoção de um CNPJ em `/remover`
- [ ] Revisar a página `/privacidade` com um advogado e preencher os dados da sua empresa

---

## Custos mensais (estimativa)

| Serviço | Para começar | Com clientes |
|---|---|---|
| Netlify | Grátis | Grátis a ~US$ 19 |
| Supabase | Grátis (500 MB) | US$ 25 (8 GB) |
| Resend | Grátis (3.000 e-mails) | US$ 20 |
| Anthropic (IA) | US$ 5 em créditos | ~R$ 3 por cliente/mês |
| Asaas | Sem mensalidade | Taxa por cobrança |
| Domínio .com.br | ~R$ 40/ano | ~R$ 40/ano |
