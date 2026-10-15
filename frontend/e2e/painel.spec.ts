import { expect, test, type Page } from "@playwright/test";
// Apenas fixtures de teste. A aplicação final não contém dados fictícios.
async function apiDeTeste(
  page: Page,
  nivel = "PROFESSOR",
  pendente = false,
  autenticado = true,
) {
  let logado = autenticado;
  let troca = pendente;
  const funcionario = {
    id: 1,
    nome: "Maria Silva",
    login: "maria",
    cargo: "Equipe educacional",
    nivel,
    ativo: true,
  };
  const outro = {
    ...funcionario,
    id: 2,
    nome: "João Souza",
    login: "joao",
    nivel: "PROFESSOR",
  };
  let relatorios = [1, 2].map((id) => ({
    id,
    id_funcionario: id,
    nome_aluno: id === 1 ? "Ana Oliveira" : "Pedro Santos",
    turma: "Inglês · A",
    motivo: "Acompanhamento educacional",
    periodo: "MATUTINO",
    desc_situacao: "Descrição do registro para teste de interface.",
    providencia: "Orientação registrada para teste.",
    data_criacao: "14/10/2026 08:00:00",
  }));
  await page.route(/^http:\/\/127\.0\.0\.1:\d+\/api\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, "");
    const method = request.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (method === "GET" && path === "/csrf")
      return json({ headerName: "X-CSRF-TOKEN", token: "csrf-apenas-teste" });
    if (
      ["POST", "PUT", "DELETE"].includes(method) &&
      request.headers()["x-csrf-token"] !== "csrf-apenas-teste"
    )
      return json({ codigo: "CSRF_INVALIDO" }, 403);
    if (path === "/login") {
      const dados = new URLSearchParams(request.postData() || "");
      if (
        dados.get("username") !== "maria" ||
        dados.get("password") !== "SenhaValida123!"
      )
        return json(
          {
            codigo: "CREDENCIAIS_INVALIDAS",
            mensagem: "Login ou senha inválidos.",
          },
          401,
        );
      logado = true;
      return json({ autenticado: true, trocaSenhaObrigatoria: troca });
    }
    if (!logado) return json({ codigo: "NAO_AUTENTICADO" }, 401);
    if (path === "/logout") {
      logado = false;
      return route.fulfill({ status: 204 });
    }
    if (path === "/funcionarios/minha-senha") {
      troca = false;
      logado = false;
      return route.fulfill({ status: 204 });
    }
    if (troca) return json({ codigo: "TROCA_SENHA_OBRIGATORIA" }, 403);
    if (path === "/auth/me") return json(funcionario);
    if (path.startsWith("/funcionarios/")) {
      if (nivel !== "ADMINISTRADOR")
        return json({ codigo: "ACESSO_NEGADO" }, 403);
      if (method === "GET") return json([funcionario, outro]);
      if (method === "POST")
        return json({ ...outro, ...request.postDataJSON() }, 201);
      return route.fulfill({ status: 204 });
    }
    if (path === "/relatorio/gerar") {
      const novo = {
        ...request.postDataJSON(),
        id: 3,
        id_funcionario: 1,
        data_criacao: "14/10/2026 09:00:00",
      };
      relatorios.push(novo);
      return json(novo, 201);
    }
    if (path.startsWith("/relatorio/editar/")) {
      const id = Number(path.split("/").pop());
      const indice = relatorios.findIndex((r) => r.id === id);
      relatorios[indice] = { ...relatorios[indice], ...request.postDataJSON() };
      return json(relatorios[indice]);
    }
    if (path.startsWith("/relatorio/deletar/")) {
      relatorios = relatorios.filter(
        (r) => r.id !== Number(path.split("/").pop()),
      );
      return route.fulfill({ status: 204 });
    }
    if (/^\/relatorio\/\d+$/.test(path))
      return json(
        relatorios.find((r) => r.id === Number(path.split("/").pop())),
      );
    return json(
      nivel === "PROFESSOR"
        ? relatorios.filter((r) => r.id_funcionario === 1)
        : relatorios,
    );
  });
}

test("login personalizado e dashboard com informações da API", async ({
  page,
}) => {
  await apiDeTeste(page, "PROFESSOR", false, false);
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Que bom ter você aqui." }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/discoveron-login.png", fullPage: true });
  await page.getByLabel("Login", { exact: true }).fill("maria");
  await page.getByLabel("Senha", { exact: true }).fill("SenhaValida123!");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Olá, Maria." }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/discoveron-dashboard.png",
    fullPage: true,
  });
});

test("coordenador consulta todos mas não pode editar relatório de terceiro", async ({
  page,
}) => {
  await apiDeTeste(page, "CORDENADOR");
  await page.goto("/relatorios");
  await expect(page.getByText("Pedro Santos", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Editar relatório 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Editar relatório 2", exact: true }),
  ).toHaveCount(0);
  await page.goto("/relatorios/2/editar");
  await expect(
    page.getByText("Você só pode editar seus próprios relatórios."),
  ).toBeVisible();
});

test("novo relatório envia os campos reais sem selecionar autor", async ({
  page,
}) => {
  await apiDeTeste(page);
  await page.goto("/relatorios/novo");
  await page.getByLabel("Nome do aluno").fill("Aluno do teste de cadastro");
  await page.getByLabel("Turma", { exact: true }).fill("Turma de teste");
  await page.getByLabel("Motivo", { exact: true }).fill("Registro de teste");
  await page.getByLabel("Descrição da situação").fill("Situação de teste");
  await page.getByLabel("Providências adotadas").fill("Providência de teste");
  const request = page.waitForRequest(
    (req) =>
      req.url().endsWith("/api/relatorio/gerar") && req.method() === "POST",
  );
  await page.getByRole("button", { name: "Criar relatório" }).click();
  expect((await request).postDataJSON()).not.toHaveProperty("funcionarios_id");
  await expect(page.getByText("Relatório criado com sucesso.")).toBeVisible();
  await expect(
    page.getByText("Aluno do teste de cadastro", { exact: true }),
  ).toBeVisible();
});

test("exclusão exige confirmação e atualiza a lista", async ({ page }) => {
  await apiDeTeste(page);
  await page.goto("/relatorios");
  await page.getByRole("button", { name: "Excluir relatório 1" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir relatório", exact: true })
    .click();
  await expect(page.getByText("Relatório excluído com sucesso.")).toBeVisible();
  await expect(
    page.getByText("Seu próximo registro começa aqui"),
  ).toBeVisible();
});

test("administrador cadastra equipe e confirma reset de senha", async ({
  page,
}) => {
  await apiDeTeste(page, "ADMINISTRADOR");
  await page.goto("/funcionarios");
  await page.getByRole("button", { name: "Novo funcionário" }).click();
  await page.getByLabel("Nome completo").fill("Funcionário teste");
  await page.getByLabel("Cargo", { exact: true }).fill("Professor");
  await page.getByLabel("Login", { exact: true }).fill("funcionario-teste");
  await page.getByLabel("Senha inicial").fill("SenhaValida123!");
  await page
    .getByRole("button", { name: "Cadastrar funcionário", exact: true })
    .click();
  await expect(
    page.getByText("Dados do funcionário salvos com sucesso."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resetar senha de João Souza" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Resetar senha", exact: true })
    .click();
  await expect(
    page.getByText(
      "Senha redefinida. As sessões foram expiradas e a troca será obrigatória no próximo acesso.",
    ),
  ).toBeVisible();
});

test("troca obrigatória bloqueia dashboard e termina no login", async ({
  page,
}) => {
  await apiDeTeste(page, "PROFESSOR", true);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/trocar-senha/);
  await page
    .getByLabel("Nova senha", { exact: true })
    .fill("UmaNovaSenhaValida123!");
  await page.getByLabel("Confirme a nova senha").fill("UmaNovaSenhaValida123!");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/login/);
  await expect(
    page.getByText("Senha alterada. Entre novamente com sua nova senha."),
  ).toBeVisible();
});

test("layout móvel não transborda e menu mantém navegação", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await apiDeTeste(page);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Olá, Maria." }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/discoveron-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Minha conta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Minha conta" }),
  ).toBeVisible();
});

test("edição própria salva os campos e preserva autor", async ({ page }) => {
  await apiDeTeste(page);
  await page.goto("/relatorios/1/editar");
  await page
    .getByLabel("Motivo", { exact: true })
    .fill("Motivo atualizado no teste");
  const request = page.waitForRequest(
    (req) =>
      req.url().endsWith("/api/relatorio/editar/1") && req.method() === "PUT",
  );
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  expect((await request).postDataJSON()).not.toHaveProperty("funcionarios_id");
  await expect(
    page.getByText("Relatório atualizado com sucesso."),
  ).toBeVisible();
  await expect(
    page.getByText("Motivo atualizado no teste", { exact: true }),
  ).toBeVisible();
});

test("visualiza, baixa PDF real e imprime somente o documento", async ({
  page,
}) => {
  await apiDeTeste(page);
  await page.goto("/relatorios/1");
  await page.getByRole("link", { name: "Ver PDF", exact: true }).click();
  await expect(page).toHaveURL(/relatorios\/1\/pdf/);
  await expect(page.getByTitle("PDF do relatório #1")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Baixar PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("relatorio-1.pdf");
  const { readFile } = await import("node:fs/promises");
  const arquivo = await readFile((await download.path())!);
  expect(arquivo.subarray(0, 5).toString()).toBe("%PDF-");
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.imprimiu = "sim";
    };
  });
  await page.getByRole("button", { name: "Imprimir", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-imprimiu", "sim");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-document")).toBeVisible();
  await expect(page.locator(".pdf-toolbar")).toBeHidden();
  await expect(page.locator(".print-document")).toContainText("Ana Oliveira");
});
