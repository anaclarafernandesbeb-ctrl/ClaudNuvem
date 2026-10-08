# Pesquisa de mercado rápida e Proposta v2

> Este documento revisa o [plano original](./PLANO-MICRO-SAAS.md) com base numa pesquisa rápida de mercado (outubro de 2026). O objetivo é **tirar do caminho os pontos mais difíceis, caros ou arriscados** e chegar a uma solução mais assertiva, que uma pessoa só consegue lançar em cerca de 4 semanas.

---

## 1. O que a pesquisa mostrou

### 1.1 Concorrência no Brasil

| Ferramenta | Foco | Preço público | Leitura |
|---|---|---|---|
| **Speedio** | Base de mais de 20 milhões de empresas, geração de listas | ~R$ 1.149/mês | Cara para o pequeno empreendedor. Vende **dados**, não a **rotina** de prospecção |
| **Econodata** | Dados e inteligência de mercado | Sob consulta | Venda consultiva, voltada a empresas médias e grandes |
| **Ramper** | Listas e cadências B2B | Freemium com venda via consultor | O plano gratuito é limitado e os pagos exigem demonstração |
| **Apollo, Lusha e similares** | Contatos globais e cadências | Em dólar | Base fraca em PMEs brasileiras, interface em inglês e cobrança em dólar |

**Conclusão:** o mercado está bem servido de **bases de dados**, mas mal servido de uma ferramenta **barata, em português e WhatsApp-first** que diga ao empreendedor solo **"com quem falar hoje e o que dizer"**. Essa é a brecha.

### 1.2 Custos e restrições técnicas descobertos

| Item | O que descobri | Impacto no plano original |
|---|---|---|
| **Google Places API** | Text Search (Pro) custa cerca de **US$ 32 por mil requisições** e Place Details (Pro) cerca de **US$ 17 por mil** | O custo por lead fica bem acima do que eu tinha estimado. Usar o Places como fonte principal corrói a margem dos planos baratos |
| **Dados abertos do CNPJ (Receita Federal)** | Base completa e **gratuita**, atualizada todo mês, com razão social, nome fantasia, CNAE, porte, endereço, data de abertura e **telefone e e-mail cadastrados** | Pode substituir o Places como **fonte principal** a custo zero de dados |
| **Gmail API** | Enviar e-mails (`gmail.send`) é escopo *sensível*: pede só a verificação do app. **Ler a caixa** para detectar respostas é escopo *restrito*: exige uma **auditoria de segurança anual (CASA)**, que custa de algumas centenas a milhares de dólares por ano e leva semanas | A "caixa de respostas classificada por IA" do MVP fica cara e lenta de aprovar. Precisa sair do MVP |
| **WhatsApp Business API (oficial)** | Cobrança por mensagem desde julho de 2025. Mensagem de **marketing no Brasil sai por cerca de US$ 0,0625** (por volta de R$ 0,35), mais a taxa do provedor, e exige **opt-in** | Não serve para abordagem fria. O link de clique `wa.me` é gratuito e não tem risco de banimento |
| **LGPD** | O Guia Orientativo da ANPD sobre **Legítimo Interesse** (fevereiro de 2024) exige um teste de balanceamento documentado. O e-mail frio B2B é defensável com relevância comercial, transparência sobre a origem do dado e descadastro fácil. **Listas compradas não têm base sustentável** | O produto não pode "vender lista". Deve ajudar o usuário a pesquisar dados públicos com uma finalidade compatível e registrar a origem de cada dado |

---

## 2. Pontos de dificuldade do plano original e como resolvê-los

| # | Dificuldade no plano v1 | Solução na v2 |
|---|---|---|
| 1 | **Custo de dados**: usar o Google Places como fonte principal | **A base do CNPJ vira a fonte principal, de graça.** O Places passa a ser um enriquecimento opcional e sob demanda, só nos leads que o usuário marcar como prioridade |
| 2 | **Achar e-mail** com raspagem de site, um processo frágil e lento | Usar primeiro **o e-mail e o telefone do próprio cadastro do CNPJ**. A raspagem do site fica como reforço, em segundo plano |
| 3 | **Integração com Gmail/Outlook**: OAuth, verificação, auditoria CASA, motor de envio, aquecimento e entregabilidade | **O MVP não envia e-mails sozinho.** A ferramenta funciona como **copiloto**: um clique abre o Gmail ou o WhatsApp com a mensagem pronta e o próprio usuário envia. Isso elimina a verificação do Google, o risco de spam e o motor de envio. O envio automático fica para a v2, via um provedor de API unificada de e-mail que já é verificado |
| 4 | **WhatsApp** em massa: banimento e custo | **Clique para conversar** (`wa.me/55...?text=...`): grátis, oficial e sem risco. Como o WhatsApp é o canal nº 1 no Brasil, isso vira o **diferencial** do produto |
| 5 | **Caixa de respostas com IA**, que exige o escopo restrito do Gmail | O usuário cola a resposta recebida (ou encaminha para um e-mail do sistema) e a IA sugere a réplica. Zero escopos restritos |
| 6 | **LGPD** | Mostrar a origem do dado em cada lead ("Receita Federal, dados abertos"), incluir uma frase de descadastro sugerida em toda mensagem, manter lista de supressão por usuário, oferecer o modelo de teste de balanceamento (LIA) e **sinalizar MEIs e empresários individuais**, cujos dados são de pessoa física, para que sejam abordados com mais cuidado |
| 7 | **Escopo grande** (8 semanas, com fila de jobs, cadências e billing) | O MVP cabe em **4 semanas**: lista do dia, mensagem com IA, clique para enviar, kanban e lembretes. Sem fila de jobs: basta um agendador do próprio Postgres (`pg_cron`) |
| 8 | **Churn** ("usei, não vendi, cancelei") | O produto passa a girar em torno de um **hábito diário**: "sua lista do dia com 10 leads", meta semanal de contatos, sequência de dias seguidos e um relatório semanal de resultados |
| 9 | **Concorrer com bases grandes** | Não competir em volume de dados. Competir em **ação**: menos leads, mais qualificados, com mensagem pronta e lembrete de follow-up, por um preço de impulso |

---

## 3. Proposta v2: "Copiloto de Prospecção"

> **Promessa:** "Todo dia de manhã, 10 empresas certas para você abordar, com a mensagem pronta para mandar no WhatsApp ou no e-mail em um clique. E a gente te lembra do follow-up."

### 3.1 Como funciona (fluxo do usuário)

```
1. Onboarding (5 min)
   "O que você vende?" · "Para que tipo de empresa?" · "Em que cidades?" · "Qual o seu diferencial?"
        │  A IA converte as respostas em filtros: CNAEs, municípios, porte e idade da empresa
        ▼
2. Lista do dia (todo dia útil)
   10 leads tirados da base CNPJ, com score de fit dado pela IA e o motivo ("abriu há 3 meses":
   empresa nova costuma precisar de contador, site e marketing)
        ▼
3. Abordagem em um clique
   [WhatsApp] abre wa.me com o texto pronto  ·  [E-mail] abre o Gmail com assunto e corpo  ·  [Copiar]
   O texto é gerado pela IA no tom do usuário, com um gancho específico daquele lead
        ▼
4. Acompanhamento
   O usuário marca: Enviado → Respondeu → Reunião → Ganho/Perdido
   Lembretes automáticos de follow-up (D+2, D+5, D+10) já com a próxima mensagem pronta
        ▼
5. Resposta recebida?
   O usuário cola o texto da resposta e a IA classifica e sugere a réplica
```

### 3.2 O gatilho mais forte: empresas recém-abertas

A base do CNPJ permite filtrar por **data de abertura**. Empresas abertas nos últimos 30 a 90 dias são o público que mais compra serviços como contabilidade, site, identidade visual, marketing, sistema de gestão, seguro, maquininha e uniformes. Isso dá ao produto um **motivo concreto e legítimo para o contato**, o que melhora a resposta e ajuda na defesa do legítimo interesse.

> Sugestão de **nicho inicial**: prestadores de serviço que vendem para empresas novas (contadores, agências, designers, consultores e corretores). O argumento de venda fica: "Receba todo dia as empresas que acabaram de abrir na sua cidade e que precisam do seu serviço."

### 3.3 MVP v2: escopo enxuto

**Entra:**
1. Login com e-mail ou Google (só login, sem acesso à caixa de e-mails).
2. Onboarding com ICP pela IA, que gera filtros de CNAE, município, porte e idade da empresa.
3. Base CNPJ **pré-filtrada** (empresas ativas, das UFs e CNAEs dos nichos iniciais), carregada todo mês por um script.
4. Lista do dia com fit score e o motivo escrito pela IA.
5. Gerador de mensagem com IA (WhatsApp curto e e-mail), com 3 tons para escolher.
6. Botões `wa.me`, `mailto:`/Gmail compose e copiar.
7. Kanban de etapas, lembretes de follow-up por e-mail ou notificação, e a lista de supressão.
8. Assinatura com Pix e cartão (Asaas ou Stripe).

**Sai (vai para a v2 em diante):** envio automático, cadências automáticas, leitura da caixa de e-mails, Google Places, raspagem de sites, integrações com CRM e times.

### 3.4 Stack simplificada

| Camada | Escolha | Por que é mais fácil |
|---|---|---|
| App | Next.js + Supabase (Auth + Postgres + `pg_cron`) | Sem servidor próprio nem fila de jobs |
| Dados | Script mensal (GitHub Actions + Python) que baixa os dados abertos do CNPJ, **filtra** (ativas, UFs e CNAEs-alvo) e grava no Postgres | Custo zero de dados e um volume pequeno que cabe no plano barato do Supabase |
| IA | Claude API: `claude-haiku-4-5` para o score e a classificação, `claude-sonnet-5-5` para as mensagens | Custo de centavos por lead |
| Pagamento | Asaas (Pix, boleto e cartão) ou Stripe | Pix é essencial para o público |
| Alternativa sem código | Lovable (front e Supabase) com a mesma base CNPJ | Dá para validar em 1 a 2 semanas |

Tabelas que somem em relação à v1: `sequences`, `enrollments` (sem cadência automática) e a dependência de OAuth da caixa de e-mails. Tabelas que entram: `daily_lists (workspace_id, data, lead_ids[])` e `reminders (lead_id, quando, passo)`.

### 3.5 Preço revisado (preço de impulso)

| Plano | Preço | Inclui |
|---|---|---|
| **Grátis** | R$ 0 | 3 leads por dia e mensagens com IA |
| **Solo** | R$ 67/mês | 10 leads por dia, follow-ups e kanban |
| **Pro** | R$ 147/mês | 25 leads por dia, 3 ICPs e enriquecimento opcional (Places) em leads prioritários |

**Custo variável:** os dados do CNPJ são grátis e a IA custa centavos por lead. O único custo relevante é o Places opcional, que fica limitado ao plano Pro. A margem bruta esperada é **acima de 90%**. Ainda assim, confirme isso com o uso real.

**Posicionamento de preço:** cerca de **17 vezes mais barato que o Speedio**, sem demonstração com consultor, e o cliente já começa no primeiro dia.

### 3.6 Roadmap v2 (4 semanas)

| Semana | Entrega |
|---|---|
| **0** | 10 entrevistas e uma landing page com a promessa "empresas que abriram ontem na sua cidade". Teste manual: mandar a lista por WhatsApp para 5 clientes pagantes, montada com a base CNPJ e IA "na mão" |
| **1** | Script de carga do CNPJ (filtrado), Supabase, autenticação e onboarding de ICP com IA |
| **2** | Lista do dia, fit score, motivo e geração de mensagens |
| **3** | Botões de envio, kanban, lembretes de follow-up e supressão |
| **4** | Pagamento, limites por plano, página de privacidade/LGPD e beta com os clientes do teste manual |
| **Depois** | Envio automático de e-mail (via API unificada verificada), cadências, Places no Pro, integração com CRM e plano para agências |

---

## 4. Riscos que ainda restam

| Risco | Mitigação |
|---|---|
| A qualidade do e-mail e do telefone do CNPJ varia, porque muitos são do contador da empresa | Marcar quando "o contato pode ser do escritório contábil" e, nesses casos, sugerir abordar pelo WhatsApp ou pelo Instagram |
| Dados de MEI e empresário individual são dados pessoais | Avisar o usuário, oferecer o modelo de LIA, limitar o volume diário e garantir supressão imediata a pedido |
| Concorrente grande lançar algo parecido | Velocidade, nicho, preço e comunidade. Templates testados por nicho valem mais que a base de dados |
| O usuário não criar o hábito | Lista curta (10 por dia), lembrete diário e meta semanal visível |

---

## 5. Próximos passos

- [ ] Validar o nicho "quem vende para empresas recém-abertas" em 10 entrevistas.
- [ ] Baixar uma amostra dos dados abertos do CNPJ de uma UF e medir quantas empresas novas surgem por mês nos CNAEs-alvo e qual o percentual com e-mail ou telefone válido.
- [ ] Rodar o teste manual com 5 clientes por 2 semanas, mandando a lista diária por WhatsApp, e medir a taxa de resposta.
- [ ] Se o teste der certo, construir o MVP v2 em 4 semanas, seguindo a seção 3.6.

---

## Fontes

- [Comparativo Speedio × Ramper (B2B Stack)](https://www.b2bstack.com.br/compare/speedio-vs-ramper)
- [Comparativo Ramper × Econodata (B2B Stack)](https://www.b2bstack.com.br/compare/ramper-vs-econodata)
- [Ramper (B2B Stack)](https://www.b2bstack.com.br/produto/ramper)
- [What Google Places API actually costs in 2026 (Open Places API)](https://openplacesapi.com/blog/google-places-api-pricing)
- [Google Maps Platform: preços](https://developers.google.com/maps/billing-and-pricing/pricing?hl=de)
- [Dados abertos CNPJ: Receita Federal (repositório de referência)](https://github.com/jonathands/dados-abertos-receita-cnpj)
- [Prospecção B2B com dados públicos de CNPJ (TabNews)](https://www.tabnews.com.br/antoniorincon/prospeccao-b2b-com-dados-publicos-de-cnpj-achar-enriquecer)
- [Gmail API scopes explained (Unipile)](https://www.unipile.com/gmail-api-scopes-guide/)
- [Google OAuth Verification & Gmail API (Unipile)](https://www.unipile.com/integrating-google-oauth-2-0-user-authentication-into-your-app/)
- [Gmail API OAuth scopes reference (Nylas)](https://developer.nylas.com/docs/cookbook/use-cases/build/google-oauth-scopes/)
- [WhatsApp Business Platform: pricing (Meta)](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [WhatsApp Business API pricing Brazil (Message Central)](https://www.messagecentral.com/blog/whatsapp-business-api-pricing-brazil)
- [O legítimo interesse na LGPD (Data Privacy Brasil)](https://www.dataprivacybr.org/wp-content/uploads/2021/10/O-legitimo-interesse-na-LGPD.pdf)
- [LGPD no marketing digital (Confidata)](https://confidata.com.br/blog/lgpd-marketing-digital-campanhas-crm-automacao)
- [Mailing B2B e LGPD (Agendor)](https://www.agendor.com.br/blog/mailing-b2b/)
