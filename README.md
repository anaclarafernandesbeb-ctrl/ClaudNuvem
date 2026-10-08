# Prospecta: Copiloto de Prospecção

Micro SaaS que entrega, todo dia, empresas recém-abertas que combinam com o cliente ideal do usuário, com mensagem pronta (WhatsApp/e-mail) escrita por IA e lembretes de follow-up.

- **Colocar no ar:** [docs/COMO-COLOCAR-NO-AR.md](docs/COMO-COLOCAR-NO-AR.md)
- **Plano e pesquisa:** [docs/PLANO-MICRO-SAAS.md](docs/PLANO-MICRO-SAAS.md) · [docs/PESQUISA-E-PROPOSTA-V2.md](docs/PESQUISA-E-PROPOSTA-V2.md)

## Estrutura

| Pasta | O que tem |
|---|---|
| `web/` | App Next.js (site, login, lista do dia, leads, planos), hospedado na Netlify |
| `supabase/migrations/` | Banco de dados (tabelas, segurança por usuário, busca de candidatas) |
| `etl/` | Importador mensal dos dados abertos do CNPJ (Receita Federal) |
| `.github/workflows/` | Robôs: importação mensal do CNPJ e lembretes diários |

## Desenvolvimento

```bash
cd web
cp .env.example .env.local   # preencha as chaves
npm install
npm run dev
```
