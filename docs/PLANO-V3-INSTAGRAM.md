# Prospecta v3: prospecção no Instagram para vender infoprodutos e micro SaaS

> Esta versão especializa o produto. Primeiro ele é usado pela própria Ana (@anafernandes.ia), em teste real. Depois de validado, vira um produto para outros infoprodutores e donos de micro SaaS.
> Custos detalhados: [`custos-prospecta-instagram.xlsx`](./custos-prospecta-instagram.xlsx).

## 1. A promessa

**"Transforme o Instagram numa máquina de conversas que viram vendas, sem disparo em massa e sem risco de bloqueio."**

O app não "dispara". Ele **pensa** pela usuária: escolhe quem abordar, entende o momento de cada perfil, escreve cada mensagem no tom certo, conduz a conversa até a venda e aprende com o que funciona.

## 2. Regras do jogo (Meta), que definem o desenho

| Permitido | Proibido (derruba a conta) |
|---|---|
| Ler dados públicos de um **perfil comercial ou de criador** a partir do @ (API oficial) | Raspar seguidores, hashtags ou perfis com robôs e extensões |
| **Responder automaticamente** quem comentou ou mandou DM, numa janela de 24h | **DM fria automática**, ou seja, disparo para quem nunca interagiu |
| A usuária enviar DMs manualmente com o texto pronto (link `ig.me/m/@perfil`) | Volume anormal de DMs por dia |

Por isso o produto tem **duas frentes**:
1. **Outbound assistido:** a IA prepara e a usuária envia, com cerca de 20 DMs por dia, volume seguro.
2. **Inbound automático:** comentário com palavra-chave → DM → qualificação → oferta, pelo ChatFyre, que já está conectado.

## 3. O Motor de Conversão (a "inteligência específica")

São cinco módulos de IA, cada um com uma função clara:

### 3.1 Raio-X do perfil, para saber quem abordar
A IA lê a bio, o link da bio, as últimas legendas e os números públicos de cada @ e devolve:
- **Estágio:** iniciante, crescendo, escalando ou já vende.
- **Sinais de compra:** acabou de lançar, link para curso ou checkout na bio, pede ajuda nos posts, engajamento alto com poucos seguidores, contrata serviços.
- **Dor provável**, ligada à sua oferta.
- **Nota de fit** (0 a 100) e **temperatura** (fria, morna ou quente).
- **Gancho de abertura:** um detalhe real do perfil para citar.

### 3.2 Playbook de conversa, para saber o que dizer em cada etapa
Uma conversa guiada em 5 etapas, adaptada a infoprodutos e micro SaaS:
1. **Abertura sem pitch:** o gancho do perfil mais uma pergunta curta.
2. **Diagnóstico:** de 1 a 2 perguntas sobre o momento e a dor.
3. **Valor:** uma ideia ou um mini-diagnóstico grátis, para gerar reciprocidade.
4. **Convite:** uma call de 15 minutos, a isca, ou o link de checkout se o lead estiver quente.
5. **Fechamento:** urgência legítima (vagas, bônus, prazo) e o link.

### 3.3 Leitor de respostas e tratamento de objeções
A usuária cola a resposta (ou ela chega pelo inbound) e a IA:
- classifica: interessado, objeção de preço, de tempo, de confiança, "vou pensar", ou sem interesse;
- sugere a **próxima melhor mensagem** e em que etapa do playbook o lead está;
- traz uma **biblioteca de objeções** com respostas baseadas na sua oferta, nos seus depoimentos e na sua garantia.

### 3.4 Placar de aprendizado, para descobrir o que converte
- Registra cada abertura, cada gancho e o resultado (respondeu, call, venda).
- Mostra quais aberturas e quais nichos convertem mais.
- A IA passa a **priorizar o que já funcionou** para você. Isso é o diferencial: o app fica mais certeiro a cada semana.

### 3.5 Cadência e disciplina
- Uma lista do dia com 20 perfis já analisados, ordenados por fit e temperatura.
- Follow-ups no 2º e no 5º dia, com mensagens novas.
- Uma meta diária e um painel do funil: abordados → responderam → call → venda.

## 4. Primeiro uso: a Ana testando (MVP próprio)

**Configuração da oferta (uma vez):** produto, preço, transformação prometida, para quem é e para quem não é, provas (depoimentos), garantia e link de checkout.

**Rotina diária, de 20 a 30 minutos:**
1. Adicionar @ de interesse: perfis que comentam em criadores do nicho, que seguem concorrentes, ou indicações.
2. Abrir a **lista do dia**, já analisada e ordenada.
3. Enviar as DMs em um clique e marcar "enviei".
4. Colar as respostas e seguir a sugestão da IA.
5. Ver o placar no fim da semana.

**O que muda no código** (a base atual é aproveitada em cerca de 70%):
- Uma nova fonte de leads: lista de @ (colar ou planilha), mais a consulta oficial do perfil (Business Discovery da API do Instagram).
- Uma nova tela, **Minha oferta**, que alimenta todo o Motor de Conversão.
- Novos prompts e tabelas: `perfis_instagram`, `conversas` (o histórico por etapa), `aprendizados` (o placar).
- A integração com o ChatFyre para os leads que chegam por comentário.
- Os botões passam a ser **Abrir DM no Instagram** e **Copiar**.
- A versão da Receita (CNPJ) continua disponível como fonte alternativa.

**Prazo:** de 2 a 3 semanas de desenvolvimento. Para uso próprio, **não precisa da revisão da Meta**: o app funciona em modo de desenvolvimento com a sua própria conta.

> A confirmar na implementação: o Business Discovery só funciona com uma conta comercial ou de criador ligada a uma Página do Facebook. É preciso verificar se a @anafernandes.ia já está assim.

## 5. Depois de validado: vender

- **Para quem:** infoprodutores, experts, mentoras e donos de micro SaaS que vendem pelo Instagram.
- **Preço inicial sugerido:** R$ 197 por mês, a testar entre R$ 147 e R$ 297. A planilha calcula a margem.
- **O que precisa antes de vender:** CNPJ (ME no Simples, porque software não pode ser MEI), contador, termos e privacidade revisados, revisão do app na Meta (de 1 a 4 semanas), domínio, Supabase Pro e Resend.
- **Prova de venda:** os seus próprios números do teste ("abordei X, fechei Y") viram o case do pitch.

## 6. Métricas do teste (o que medir nas primeiras 4 semanas)

| Métrica | Meta inicial |
|---|---|
| DMs enviadas por dia útil | 20 |
| Taxa de resposta | ≥ 15% |
| Respostas → call ou checkout | ≥ 30% |
| Calls ou checkouts → venda | ≥ 30% |
| Custo de IA por venda | < 5% do ticket |

## 7. Próximos passos

1. ✅ Concluir a base atual (GitHub e teste de login).
2. Ana: confirmar que a @anafernandes.ia é uma conta comercial ligada a uma Página do Facebook, e definir a oferta que vai testar.
3. Claude: implementar o Motor de Conversão (seções 3.1 a 3.5) e a fonte de leads do Instagram.
4. 4 semanas de teste com métricas reais.
5. Decidir se vai vender, com base nos números.
