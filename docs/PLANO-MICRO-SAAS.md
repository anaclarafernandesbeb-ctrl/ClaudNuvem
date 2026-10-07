# Plano do Micro SaaS de Prospecção Inteligente

> Nome provisório: **Prospecta**
> Público: empreendedores e pequenas empresas B2B (1 a 20 pessoas) que vendem serviços ou produtos para outras empresas e não têm um time de SDR (pré-vendas).

---

## 1. O problema

O pequeno empreendedor sabe que precisa prospectar, mas:

- **não sabe para quem vender**: o cliente ideal (ICP) está só na cabeça dele;
- **perde horas montando listas** no Google Maps, no LinkedIn e no Instagram;
- **escreve mensagens genéricas**, que ninguém responde;
- **esquece de fazer o follow-up**, e a maioria das vendas sai da 2ª à 5ª tentativa de contato;
- **as ferramentas existentes** (Apollo, Outreach, Meetime, Ramper) são caras, complexas ou feitas para times de vendas grandes.

## 2. Proposta de valor

> "Diga o que você vende e para quem. Em 10 minutos você tem uma lista de empresas qualificadas, com mensagens personalizadas e follow-ups agendados."

O produto se apoia em três pilares:

1. **Encontrar**: gera listas de leads a partir do ICP, usando dados públicos (Google Maps/Places, CNPJ, site da empresa).
2. **Personalizar**: a IA lê o site e o perfil público de cada lead e escreve uma abordagem específica.
3. **Automatizar**: cadências de e-mail com follow-up automático, que param sozinhas quando o lead responde, e um painel simples mostrando quem responder hoje.

## 3. Cliente ideal (ICP do próprio SaaS)

| Segmento | Exemplo | Por que é um bom começo |
|---|---|---|
| Agências pequenas (marketing, design, dev) | Agência com 3 pessoas que vende sites para clínicas | Vendem B2B e já entendem o valor da prospecção |
| Prestadores de serviço B2B | Contador, consultor de RH, empresa de limpeza comercial | Clientes locais, fáceis de achar no Maps |
| Distribuidores e indústrias pequenas | Distribuidor de embalagens para restaurantes | Ticket recorrente e listas por região e segmento |
| Freelancers de alto ticket | Consultor, copywriter, gestor de tráfego | Muitos e com dor intensa, mas pagam menos |

**Recomendação:** começar com **um nicho só**, por exemplo agências e gestores de tráfego que vendem para negócios locais. Isso deixa os templates, o marketing e a conversão muito mais afiados. Os outros nichos entram depois.

## 4. MVP: o que entra e o que fica de fora

### Entra no MVP (de 6 a 8 semanas)

1. **Onboarding com ICP guiado**: um formulário conversacional ("O que você vende? Para quem? Em que cidade ou região? Qual o ticket?"). A IA transforma as respostas em filtros de busca e numa "tese de valor".
2. **Gerador de listas**
   - Busca no Google Places por categoria e região.
   - Enriquecimento com site, telefone e avaliações, mais CNPJ, porte e CNAE quando houver correspondência.
   - Extração do e-mail público de contato do site da empresa.
   - **Score de fit** (de 0 a 100), calculado pela IA com base no ICP.
3. **Pesquisa e personalização com IA**: para cada lead, um resumo de 3 linhas sobre a empresa, um "gancho" (algo específico observado) e um rascunho de mensagem no tom do usuário.
4. **Cadências de e-mail**
   - De 3 a 5 passos com intervalos configuráveis.
   - Envio pela conta do próprio usuário (Gmail ou Outlook via OAuth), o que melhora a entrega e reduz o risco.
   - Parada automática quando o lead responde.
   - Limite diário de envios e aquecimento gradual.
5. **Caixa de respostas classificada**: a IA marca cada resposta como interessado, não agora, sem interesse ou fora do escritório, e sugere a réplica.
6. **Mini CRM em kanban**: Novo → Contatado → Respondeu → Reunião → Ganho/Perdido.
7. **Painel do dia**: "Hoje: 12 envios agendados, 3 respostas para tratar, 2 follow-ups manuais".
8. **WhatsApp assistido**: um botão que abre o WhatsApp Web com a mensagem pronta. O envio é manual, com um clique (veja os riscos na seção 9).

### Fica de fora do MVP (vai para depois)

- Envio automático em massa pelo WhatsApp (há risco de banimento e de descumprir a LGPD).
- Raspagem de LinkedIn (viola os termos de uso).
- Discador e ligações.
- Integrações com CRMs grandes (HubSpot, Pipedrive), que podem entrar via webhook ou Zapier na v2.
- Times com várias pessoas e permissões.
- Aplicativo mobile.

## 5. Arquitetura e stack sugerida

A ideia é usar uma stack que uma pessoa só consegue manter, com custo baixo no início.

```
┌────────────────────┐      ┌─────────────────────────┐
│  Front (Next.js)   │─────▶│  API / Server Actions   │
│  Tailwind+shadcn   │      │  (Next.js na Vercel)    │
└────────────────────┘      └──────────┬──────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
┌──────────────────┐      ┌───────────────────────┐     ┌──────────────────────┐
│ Supabase         │      │ Fila de jobs          │     │ Provedores externos  │
│ Postgres + Auth  │◀────▶│ (Inngest ou Trigger.  │────▶│ Google Places API    │
│ + RLS + Storage  │      │  dev): busca, enrique-│     │ BrasilAPI / CNPJ     │
└──────────────────┘      │  cimento, IA, envios  │     │ Claude API (IA)      │
                          └───────────────────────┘     │ Gmail/Outlook OAuth  │
                                                        │ Stripe / Asaas       │
                                                        └──────────────────────┘
```

| Camada | Escolha | Motivo |
|---|---|---|
| Front e back | Next.js + TypeScript | Um repositório só e deploy simples |
| Banco e autenticação | Supabase (Postgres + RLS) | Multi-tenant com segurança por linha e plano gratuito generoso |
| Jobs assíncronos | Inngest ou Trigger.dev | Cadências, retries e agendamento sem precisar de servidor próprio |
| IA | Claude API: `claude-haiku-4-5` para classificar e pontuar, `claude-sonnet-5-5` para escrever as mensagens | Custo baixo por lead e boa qualidade em português |
| E-mail | Gmail API e Microsoft Graph (envio pela conta do usuário) | Entregabilidade e conformidade |
| Pagamentos | Stripe ou Asaas (Pix + cartão + boleto) | O público brasileiro prefere Pix |
| Observabilidade | Sentry + PostHog | Erros e funil de produto |

**Alternativa no-code e low-code para validar mais rápido:** Lovable ou Bubble no front, Supabase no banco e n8n ou Make nos fluxos. Serve para colocar os 10 primeiros clientes pagantes antes de investir em código próprio.

## 6. Modelo de dados (essencial)

```
workspaces      (id, nome, plano, limites, created_at)
users           (id, workspace_id, email, papel)
icps            (id, workspace_id, descricao, segmentos[], regioes[], ticket, tese_valor)
lead_searches   (id, workspace_id, icp_id, query, status, total_encontrado)
companies       (id, workspace_id, nome, cnpj, site, telefone, cidade, uf, cnae, porte, rating, fonte)
contacts        (id, company_id, nome, cargo, email, email_status, origem_dado, base_legal)
leads           (id, workspace_id, company_id, contact_id, icp_id, fit_score, resumo_ia, gancho_ia, etapa)
sequences       (id, workspace_id, nome, passos jsonb, limite_diario)
enrollments     (id, lead_id, sequence_id, passo_atual, proximo_envio_em, status)
messages        (id, enrollment_id, canal, direcao, assunto, corpo, enviado_em, aberto_em, respondido_em)
replies         (id, message_id, classificacao_ia, sugestao_resposta)
opt_outs        (id, workspace_id, email_ou_dominio, motivo, created_at)   -- obrigatório pela LGPD
usage_events    (id, workspace_id, tipo, quantidade, custo_estimado)        -- billing e limites
```

## 7. Precificação (hipótese a validar)

| Plano | Preço/mês | Leads enriquecidos/mês | Caixas de e-mail | Destaques |
|---|---|---|---|---|
| **Teste grátis** | R$ 0 (7 dias) | 50 | 1 | Experimenta o fluxo completo |
| **Essencial** | R$ 97 | 300 | 1 | Cadências e CRM kanban |
| **Pro** | R$ 197 | 1.000 | 2 | Classificação de respostas e templates por nicho |
| **Agência** | R$ 397 | 3.000 | 5 | Vários ICPs e relatórios para clientes |

**Custo variável estimado por lead** (Places + enriquecimento + IA): de R$ 0,05 a R$ 0,15. Com isso, a margem bruta fica acima de 80% nos planos pagos. Confirme esse custo nas primeiras semanas pela tabela `usage_events`.

## 8. Roadmap

| Semana | Entrega |
|---|---|
| **0 (antes de codar)** | Validação: 15 entrevistas com o ICP, uma landing page com lista de espera e uma pré-venda de 5 a 10 assinaturas fundadoras com desconto vitalício |
| **1** | Setup (Next.js, Supabase, auth, multi-tenant e RLS), onboarding e cadastro de ICP |
| **2** | Busca no Google Places, deduplicação e tela de lista de leads |
| **3** | Enriquecimento (site, e-mail público, CNPJ) e fit score com IA |
| **4** | Resumo, gancho e rascunho de mensagem com IA, mais o editor de templates |
| **5** | Conexão Gmail/Outlook, motor de cadências (jobs), limites e opt-out |
| **6** | Caixa de respostas com classificação por IA e kanban |
| **7** | Billing (Stripe/Asaas), limites por plano e painel do dia |
| **8** | Beta fechado com os clientes fundadores, ajustes e lançamento |
| **9 a 12** | WhatsApp assistido melhorado, webhooks e Zapier, templates por nicho, relatórios |

## 9. Riscos e como reduzi-los

| Risco | Impacto | Mitigação |
|---|---|---|
| **LGPD** (dados pessoais em prospecção fria) | Alto | Priorizar dados **corporativos e públicos** (e-mail de contato da empresa), registrar a origem do dado e a base legal (legítimo interesse, com teste de balanceamento documentado), incluir opt-out em todo e-mail, manter lista global de supressão, ter política de privacidade e canal para o titular pedir remoção |
| **Banimento no WhatsApp** | Alto | Não automatizar envio frio por APIs não oficiais. Usar o envio assistido (um clique) e, para quem já é contato, a WhatsApp Business Cloud API oficial com templates aprovados |
| **Entregabilidade de e-mail** (cair no spam) | Alto | Enviar pela conta do próprio usuário, com limite diário, aquecimento, texto sem links em excesso e alerta quando o domínio não tiver SPF/DKIM/DMARC configurados |
| **Termos de uso do Google Places** | Médio | Usar a API oficial (paga), respeitar as regras de cache e armazenamento e não revender os dados crus |
| **Custo de IA ou de API maior que o esperado** | Médio | Cache por empresa, modelo menor para tarefas simples, limites por plano e monitoramento em `usage_events` |
| **Concorrência** (Apollo, Ramper, Meetime, Econodata) | Médio | Foco em nicho, simplicidade ("em 10 minutos"), preço em reais, suporte em português e WhatsApp assistido |
| **Churn**: o cliente usa, não vende e cancela | Alto | Onboarding que leva à primeira resposta na primeira semana, templates testados por nicho e métricas de resultado no painel |

## 10. Métricas que importam

- **Ativação**: % de contas que enviam a 1ª cadência em até 48h (meta: acima de 40%).
- **Aha moment**: % de contas que recebem a 1ª resposta positiva em até 7 dias.
- **Taxa de resposta média** das cadências (meta: de 5% a 10% em e-mail frio B2B bem segmentado).
- **Conversão do teste para pago** (meta: de 15% a 25%).
- **Churn mensal** (meta: abaixo de 6%).
- **MRR**, ticket médio e custo variável por conta.

## 11. Go-to-market (primeiros 100 clientes)

1. **Usar o próprio produto**: prospectar agências e consultores com o Prospecta, o que já serve de case.
2. **Conteúdo** no Instagram, LinkedIn e YouTube: "Como achei 50 clientes em potencial na minha cidade em 10 minutos", com antes e depois das mensagens.
3. **Comunidades** de agências, gestores de tráfego e empreendedores.
4. **Parcerias** com mentores e cursos de vendas e de agência, com comissão recorrente de 30%.
5. **Plano fundador**: preço vitalício para os 50 primeiros em troca de feedback e depoimento.

## 12. Próximos passos imediatos

- [ ] Escolher o **nicho inicial** (sugestão: agências e gestores de tráfego que vendem para negócios locais).
- [ ] Fazer **15 entrevistas** de problema (roteiro: como prospectam hoje, quanto tempo gastam, quais ferramentas já testaram e por que pararam).
- [ ] Publicar a **landing page** com lista de espera e oferta de fundador.
- [ ] Fazer um **protótipo manual** (concierge): gerar listas e mensagens com IA "na mão" para 5 clientes e cobrar por isso. Se eles pagarem e conseguirem reuniões, a tese está validada.
- [ ] Decidir entre **código próprio** (stack da seção 5) e **low-code** para o MVP.
- [ ] Criar as contas: Google Cloud (Places API), Supabase, Anthropic, Stripe ou Asaas.
- [ ] Redigir a política de privacidade e o registro de legítimo interesse (LGPD) com apoio jurídico.
