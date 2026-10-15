# API de relatórios

Backend Java 21 com Spring Boot, MySQL, Flyway e autenticação por sessão.
O front-end React está em `../frontend`. Veja `../frontend/README.md` para executar o painel integrado.

## Acesso

| Operação | PROFESSOR | CORDENADOR | ADMINISTRADOR |
| --- | --- | --- | --- |
| Listar e filtrar relatórios | Próprios | Todos | Todos |
| Consultar relatório por ID | Próprios | Todos | Todos |
| Editar e excluir relatórios | Próprios | Próprios | Todos |
| Gerar relatório | Em seu nome | Em seu nome | Pode escolher o funcionário |
| Gerenciar funcionários e resetar senhas | Não | Não | Sim |

No cadastro de relatórios, `funcionarios_id` é opcional. Professor e
coordenador são identificados pela sessão; o administrador pode informar
outro funcionário ou omitir o campo para gerar em seu próprio nome.

## Login e senhas

- `GET /csrf` é público e retorna `headerName` e `token` com `Cache-Control:
  no-store`. Deve ser chamado antes do login, preservando o cookie recebido.
- `POST /login` recebe `username` e `password` como formulário
  (`application/x-www-form-urlencoded`), com o cabeçalho CSRF indicado.
  Responde `200` com `{"autenticado":true,"trocaSenhaObrigatoria":false}`
  ou com `trocaSenhaObrigatoria: true`. Não redireciona para páginas HTML.
- O formulário padrão de `GET /login` permanece disponível para testes manuais.
  Depois de entrar, a resposta é JSON; a navegação é feita pelo painel React.
- Após autenticar, obtenha um novo CSRF com a sessão autenticada: o token
  anterior ao login não deve ser reutilizado.
- `GET /auth/me` retorna `id`, `nome`, `nivel`, `cargo`, `login` e `ativo`
  do funcionário da sessão, sem senha ou hash e sem permitir cache.
  Sem autenticação retorna `401`; com troca obrigatória retorna `403` e
  código `TROCA_SENHA_OBRIGATORIA`. Isso permite recuperar o estado após reload.
- `POST /logout`, com CSRF, encerra a sessão e retorna `204`, sem redirecionar.
  Limpe a identidade no cliente e obtenha outro CSRF antes do próximo login.
- O navegador administra o cookie de sessão; o cliente não deve salvar a senha
  ou o identificador da sessão em `localStorage`, nem tentar ler cookies HttpOnly.
- `PUT /funcionarios/resetarSenha/{id}` é exclusivo do administrador.
  Define o login como senha temporária com hash, exige troca e expira as sessões.
- `PUT /funcionarios/minha-senha` identifica o usuário pela sessão, permite
  somente a troca pendente e recebe `{"novaSenha":"UmaNovaSenhaValida123!"}`.
  Após a troca, é necessário fazer login novamente.
- `PUT /funcionarios/criarNovaSenha/{id}` também é exclusivo do administrador.
  Agora recebe o mesmo JSON `{"novaSenha":"UmaNovaSenhaValida123!"}`,
  em vez de uma string solta. Essa senha administrativa é temporária e exige troca.
- Senhas novas devem ter de 12 a 64 caracteres e no máximo 72 bytes em UTF-8.
  O login também precisa caber em 72 bytes para permitir o reset por login.
- Enquanto houver troca pendente, apenas obter CSRF, trocar a própria senha
  e fazer logout são permitidos.
- Alterar nível ou desativar funcionário expira suas sessões após o commit.
  Sessões expiradas são recusadas na próxima requisição; operações já em
  execução não são canceladas. O registro de sessões é local a uma instância.

## Erros de segurança para o front-end

As respostas de segurança são JSON com `status`, `codigo`, `mensagem` e
`campos` (objeto vazio). O cliente deve usar o código, não comparar mensagens.

| HTTP | Código | Comportamento esperado |
| --- | --- | --- |
| 401 | `NAO_AUTENTICADO` | Limpar identidade e abrir login |
| 401 | `CREDENCIAIS_INVALIDAS` | Manter login e informar falha |
| 401 | `SESSAO_INVALIDA` | Limpar identidade e abrir login |
| 401 | `SESSAO_EXPIRADA` | Informar expiração e abrir login |
| 403 | `TROCA_SENHA_OBRIGATORIA` | Ir para troca de senha |
| 403 | `ACESSO_NEGADO` | Mostrar falta de permissão |
| 403 | `CSRF_INVALIDO` | Obter novo CSRF e pedir nova tentativa |

Não repita automaticamente operações de escrita nem faça redirecionamento
para login em todo `403`. Uma escrita anônima sem CSRF pode retornar `403`
antes da verificação de autenticação. Erros dos controllers continuam seguindo
o contrato `status`, `mensagem`, `campos` de `TratadorDeErros`.

Não foi adicionada liberação geral de CORS. O React usa o proxy de
mesma origem do Vite com prefixo público `/api`, removido antes de encaminhar
a chamada ao Spring, sem mudar os caminhos internos dos controllers.

## Banco e testes

Configure a conexão MySQL no ambiente. A aplicação mantém `ddl-auto=validate`;
as alterações de schema são feitas pelo Flyway. A migration V6 adiciona a
restrição de login único sem apagar funcionários. Antes de aplicá-la, confira
possíveis duplicidades:

```sql
SELECT login, COUNT(*)
FROM funcionarios
WHERE login IS NOT NULL
GROUP BY login
HAVING COUNT(*) > 1;
```

Preserve versões e conteúdo de migrations já executadas. Senhas antigas sem
hash precisam de reset; não há conversão automática. O primeiro administrador
precisa existir no banco com senha em hash antes de acessar os endpoints protegidos.

Testes de serviços e da cadeia de segurança, sem conexão ao banco:

```bash
./mvnw -Dtest=FuncionarioServiceTest,RelatoriosServiceTest,SessoesServiceTest,SecurityFlowTest test
```

O teste `RelatoriosApplicationTests` carrega a aplicação completa e depende de
um banco de teste configurado. Os testes de segurança usam repositórios simulados;
não substituem a validação das migrations e consultas no MySQL.
