# DiscoverON | Gestão de Relatórios

Painel interno em React e TypeScript, integrado ao Spring Boot existente por
sessão, cookie e CSRF. Não contém dados fictícios de produção, JWT, módulo de
alunos, notas ou integração com DKSoft.

## Executar localmente

Use Node.js 24 (ou uma versão compatível com Vite 7) e Java 21 para o servidor.

1. Inicie `RelatoriosApplication` pelo IntelliJ com o MySQL configurado.
2. No diretório `frontend`, execute:

```bash
npm ci
npm run dev
```

Abra `http://localhost:5173`. O Spring permanece em `http://localhost:8080`.
Use o administrador real já cadastrado no banco. O front-end não cria usuários
ou senhas padrão e não contém credenciais do ambiente.

Se o Spring usa outro endereço, copie `.env.example` para `.env.local` e altere
`BACKEND_URL`. Reinicie o Vite depois da alteração. O endereço é lido pelo proxy,
não expõe credenciais nem requer acesso direto do navegador ao Spring.

## Integração e permissões

- O navegador chama `/api/...`; o proxy do Vite remove `/api` e encaminha ao Spring.
- Axios envia cookies. O cookie HttpOnly não é lido pelo JavaScript.
- O token vem de `GET /csrf`, com nome do cabeçalho informado pelo servidor.
- Login envia formulário para `POST /login`. Após autenticar, o token é renovado.
- Ao recarregar, `GET /auth/me` recupera a identidade. Não há autenticação no localStorage.
- `401` encerra o estado autenticado. `403` só muda de página quando o código é
  `TROCA_SENHA_OBRIGATORIA`; falta de permissão e CSRF possuem tratamento próprio.
- Escritas com erro não são repetidas automaticamente. CSRF inválido limpa o
  token para uma nova tentativa explícita, evitando duplicidade de operações.
- Troca obrigatória envia somente `novaSenha`, expira a sessão e retorna ao login.
- Professor e coordenador só recebem ações de alteração para registros próprios;
  administrador pode gerenciar todos. As verificações reais permanecem no servidor.
- Cadastro de relatório omite autor para todos os perfis e deixa a sessão definir.
- A tela de funcionários é exclusiva de administrador e confirma o reset.
- As listagens não têm paginação no servidor. Os filtros usam um critério por vez.
- O dashboard calcula indicadores reais a partir dos relatórios autorizados.
- Sem acesso à listagem de funcionários, responsáveis de terceiros são apresentados
  pelo identificador recebido; não são inventados nomes.

## Organização

`api` concentra transporte, CSRF e erros; `services` define chamadas do contrato;
`contexts` mantém a sessão; `hooks` controla consultas canceláveis; `components`
contém layout e elementos reutilizáveis; `pages` contém as telas; `types` e `utils`
centralizam tipos, datas e permissões. Rotas e guards estão em `App.tsx`.

Os formulários usam React Hook Form e Zod. As respostas de validação do servidor
são exibidas nos campos de relatórios e funcionários. Senhas respeitam 12–64
caracteres e 72 bytes em UTF-8, como o backend.

## Identidade visual

O nome é DiscoverON | Gestão de Relatórios. A interface utiliza azul, branco e
cinzas com tokens semânticos em `src/styles/index.css`, preparados para um tema
escuro futuro. O tema escuro ainda não está ativo.

Não foi possível confirmar a paleta, tipografia e qualidade do logo oficial pelo
acesso ao site de referência. A assinatura atual é texto estilizado, não o arquivo
oficial nem uma reprodução certificada do logo. O componente `Brand` pode receber
o arquivo autorizado posteriormente. Não há dependência de fontes ou imagens externas.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Os testes de componentes e transporte simulam respostas HTTP. Para testes com
Chromium:

```bash
npx playwright install chromium --only-shell
npm run test:e2e
```

O Playwright inicia e encerra seu próprio Vite na porta 5174, separada do desenvolvimento
na porta 5173. Use `E2E_PORT` para escolher outra porta de teste. Os testes E2E interceptam apenas chamadas
`/api/...` e usam fixtures restritas a `e2e/`. Isso verifica interface, formulários,
permissões visuais e responsividade, mas não comprova integração com MySQL real.
Os testes Java de segurança ficam no projeto `relatorios`.

## Impressão e PDF

Na listagem, use a ação “Ver PDF do relatório”. Nos detalhes, há os botões
“Ver PDF” e “Imprimir”. A página `/relatorios/:id/pdf` permite visualizar,
baixar o arquivo e imprimir. Navegadores sem visualizador integrado podem
usar o download para abrir no leitor de PDF.

O documento é gerado no navegador com jsPDF, a partir da consulta autorizada
`GET /relatorio/{id}`. Não existe um novo endpoint público de exportação.
Coordenador pode visualizar e imprimir os relatórios que pode consultar, mesmo
quando não pode editá-los. Professor continua limitado aos próprios relatórios.
A troca obrigatória e a ausência de sessão bloqueiam a página normalmente.

O PDF tem formato A4, paginação, fonte DejaVu Sans incorporada para acentos em
português, todos os campos do relatório e responsável conforme os dados disponíveis.
A licença da fonte está em `src/assets/fonts/LICENSE-DejaVu.txt`. A geração é
carregada sob demanda e não envia dados para serviços externos. As URLs de
visualização são liberadas ao sair da página. A impressão usa texto e estilos
próprios, sem menu lateral nem botões; também permite salvar em PDF pelo navegador.

## Publicação em uma mesma origem

`npm run build` gera `dist/`. O proxy de desenvolvimento não faz parte do build.
Em produção, sirva os arquivos e encaminhe `/api/` ao Spring, removendo esse prefixo.
Exemplo de rotas para Nginx (ajuste endereços e caminhos do seu ambiente):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
location / {
    root /caminho/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

Use HTTPS e configure os atributos do cookie para o ambiente de produção.
Não publique o MySQL nem a porta interna do Spring diretamente. O projeto não
foi publicado externamente; a configuração acima é uma orientação de implantação.
