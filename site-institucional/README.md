# Pulso Lab — Site institucional

Site estático (HTML/CSS/JS puro, sem build) da **Pulso Lab** — a empresa-mãe.
O Prospecta (app Next.js na pasta `web/` da raiz) é um **produto** da Pulso Lab.

- **Domínio:** pulsolab.tech
- **Páginas:** `index.html` (landing) e `servicos.html` (soluções em detalhe)
- **Tema:** dark neon único, fiel ao design system da marca
- **Conteúdo:** baseado na apresentação oficial da Pulso Lab (out/2026), em
  formato dor → solução

### Estrutura da landing

1. Hero: promessa + painel com um fluxo automatizado de exemplo
2. Dores → solução (6 dores reais dos clientes, cada uma com a solução Pulso)
3. Por que agora (dados de mercado, com fontes)
4. Jornada: presença → autoridade → confiança → venda
5. Soluções (WhatsApp, presença & conteúdo, CRM, IA, produto, integrações)
6. Diferencial: "Todo mundo entrega ideia. A gente entrega feito."
7. Como entrar: produtos de entrada → mentoria → assessoria
8. Produto Pulso (Prospecta), Sobre (Ana Fernandes + Ada Lovelace) e CTA

## Estrutura

```
site-institucional/
├── index.html            Landing page
├── servicos.html         Página de serviços detalhados
├── netlify.toml          Config do deploy (base = site-institucional)
├── robots.txt / sitemap.xml
└── assets/
    ├── css/tokens.css     Tokens da marca (cores, fontes, espaçamento)
    ├── css/styles.css     Estilos do site
    ├── js/main.js         Menu mobile, header ao rolar, animações
    └── img/favicon.svg    Símbolo Órbita
```

## ⚠️ Antes de publicar — trocar os placeholders

Busque por `TODO`, `AGENDAR_AQUI` e `5500000000000` nos arquivos
`index.html` e `servicos.html` e substitua:

| Placeholder | Trocar por | Onde |
|---|---|---|
| `AGENDAR_AQUI` | Link do Calendly/Cal.com | botão principal "Agendar diagnóstico" (1 em cada página) |
| `5500000000000` | Nº do WhatsApp (formato internacional, só dígitos — ex: `5511999999999`) | botão WhatsApp e rodapé |
| `contato@pulsolab.tech` | E-mail real, se for outro | CTA e rodapé |
| `instagram.com/pulsolab` | @ real do Instagram | rodapé |

> Enquanto o link de agendamento não existir, o botão "Agendar" aponta para
> `AGENDAR_AQUI` (placeholder). O WhatsApp e o e-mail funcionam como fallback
> assim que os contatos reais forem preenchidos.

## Rodar localmente

É estático — basta abrir o `index.html` no navegador, ou servir a pasta:

```bash
cd site-institucional
python3 -m http.server 8080
# abre http://localhost:8080
```

## Publicar na Netlify (deploy SEPARADO do Prospecta)

O Prospecta já tem seu próprio deploy (via `netlify.toml` da raiz). O site
institucional é um **site Netlify diferente**, apontando para a mesma pasta
deste repo:

1. Na Netlify: **Add new site → Import from Git** → selecione este repositório.
2. Em **Site configuration → Build & deploy → Build settings**:
   - **Base directory:** `site-institucional`
   - **Build command:** *(vazio)*
   - **Publish directory:** `site-institucional` (ou `.` com a base acima)
3. **Domain management:** adicione `pulsolab.tech` (e `www.pulsolab.tech`).
4. Aponte o Prospecta para um subdomínio (ex: `app.pulsolab.tech`) no site dele.

Sugestão de DNS:
- `pulsolab.tech` → site institucional (este)
- `app.pulsolab.tech` → Prospecta (app Next.js)
