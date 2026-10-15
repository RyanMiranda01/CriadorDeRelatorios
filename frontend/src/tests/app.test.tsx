import { act, screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { AuthProvider } from "../contexts/AuthContext";
import App from "../App";
import type { Funcionario, Relatorio } from "../types";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  observar: vi.fn(),
  obter: vi.fn(),
}));
vi.mock("../api/client", () => ({
  api: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
    delete: mocks.delete,
  },
  limparCsrf: vi.fn(),
  obterCsrf: mocks.obter,
  observarSessao: mocks.observar,
  camposErro: () => ({}),
  mensagemErro: () => "Erro de teste",
}));
let evento: (tipo: "anonimo" | "troca-obrigatoria") => void;
let usuario: Funcionario;
let registros: Relatorio[];
function erro(status: number, codigo?: string) {
  return new AxiosError("Erro", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: {} as never,
    data: { codigo },
  });
}
function montar(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  usuario = {
    id: 1,
    nome: "Maria de Teste",
    nivel: "PROFESSOR",
    login: "maria",
    cargo: "Professora",
    ativo: true,
  };
  registros = [];
  mocks.obter.mockResolvedValue({ headerName: "header", token: "token" });
  mocks.observar.mockImplementation((callback) => {
    evento = callback;
    return () => {};
  });
  mocks.get.mockImplementation(async (url: string) => {
    if (url === "/auth/me") return { data: usuario };
    if (url.startsWith("/funcionarios")) return { data: [usuario] };
    return { data: registros };
  });
  mocks.post.mockResolvedValue({
    data: { autenticado: true, trocaSenhaObrigatoria: false },
  });
  mocks.put.mockResolvedValue({});
  mocks.delete.mockResolvedValue({});
});
it("redireciona rota protegida sem autenticação para login", async () => {
  mocks.get.mockRejectedValue(erro(401));
  montar("/relatorios");
  expect(
    await screen.findByRole("heading", { name: "Que bom ter você aqui." }),
  ).toBeInTheDocument();
});
it("login envia formulário e carrega identidade da sessão", async () => {
  mocks.get.mockRejectedValueOnce(erro(401));
  montar("/login");
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Login"), "maria");
  await user.type(screen.getByLabelText("Senha"), "UmaSenhaValida123!");
  await user.click(screen.getByRole("button", { name: /Entrar no painel/ }));
  await screen.findByRole("heading", { name: "Olá, Maria." });
  expect(mocks.post).toHaveBeenCalledWith(
    "/login",
    expect.any(URLSearchParams),
    expect.any(Object),
  );
});
it("professor não abre a área de funcionários", async () => {
  montar("/funcionarios");
  expect(
    await screen.findByText("Esta área é exclusiva de administradores."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Funcionários" }),
  ).not.toBeInTheDocument();
});
it("coordenador vê todos, mas só recebe ações para o próprio", async () => {
  usuario.nivel = "CORDENADOR";
  registros = [1, 2].map((id) => ({
    id,
    id_funcionario: id,
    nome_aluno: `Aluno teste ${id}`,
    turma: "Turma",
    motivo: "Motivo",
    periodo: "MATUTINO",
    desc_situacao: "Descrição",
    providencia: "Providência",
    data_criacao: "14/10/2026 08:00:00",
  }));
  montar("/relatorios");
  await screen.findByText("Aluno teste 2");
  expect(
    screen.getByRole("link", { name: "Editar relatório 1" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Editar relatório 2" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Excluir relatório 2" }),
  ).not.toBeInTheDocument();
});
it("cadastro de relatório envia conteúdo sem autor", async () => {
  montar("/relatorios/novo");
  const user = userEvent.setup();
  await screen.findByLabelText("Nome do aluno");
  for (const [label, valor] of [
    ["Nome do aluno", "Aluno teste"],
    ["Turma", "Turma teste"],
    ["Motivo", "Motivo teste"],
    ["Descrição da situação", "Descrição teste"],
    ["Providências adotadas", "Providência teste"],
  ])
    await user.type(screen.getByLabelText(label), valor);
  await user.click(screen.getByRole("button", { name: "Criar relatório" }));
  await waitFor(() =>
    expect(mocks.post).toHaveBeenCalledWith(
      "/relatorio/gerar",
      expect.objectContaining({
        nome_aluno: "Aluno teste",
        periodo: "MATUTINO",
      }),
    ),
  );
  const payload = mocks.post.mock.calls.find(
    ([url]) => url === "/relatorio/gerar",
  )![1];
  expect(payload).not.toHaveProperty("funcionarios_id");
});
it("troca obrigatória usa a sessão e volta ao login", async () => {
  mocks.get.mockRejectedValue(erro(403, "TROCA_SENHA_OBRIGATORIA"));
  montar("/dashboard");
  const user = userEvent.setup();
  await user.type(
    await screen.findByLabelText("Nova senha"),
    "UmaSenhaValida123!",
  );
  await user.type(
    screen.getByLabelText("Confirme a nova senha"),
    "UmaSenhaValida123!",
  );
  await user.click(screen.getByRole("button", { name: /Salvar nova senha/ }));
  expect(
    await screen.findByText(
      "Senha alterada. Entre novamente com sua nova senha.",
    ),
  ).toBeInTheDocument();
  expect(mocks.put).toHaveBeenCalledWith("/funcionarios/minha-senha", {
    novaSenha: "UmaSenhaValida123!",
  });
});
it("sessão expirada interrompe a navegação protegida", async () => {
  montar("/minha-conta");
  await screen.findByRole("heading", { name: "Minha conta" });
  act(() => evento("anonimo"));
  expect(
    await screen.findByText("Sua sessão terminou. Entre novamente."),
  ).toBeInTheDocument();
});
it("administrador precisa confirmar reset de senha", async () => {
  usuario.nivel = "ADMINISTRADOR";
  montar("/funcionarios");
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", {
      name: "Resetar senha de Maria de Teste",
    }),
  );
  expect(mocks.put).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Resetar senha" }));
  await waitFor(() =>
    expect(mocks.put).toHaveBeenCalledWith("/funcionarios/resetarSenha/1"),
  );
});

it("PDF sem autorização não mostra documento nem permite impressão", async () => {
  mocks.get.mockImplementation(async (url: string) => {
    if (url === "/auth/me") return { data: usuario };
    throw erro(404);
  });
  montar("/relatorios/2/pdf");
  await screen.findByText("Erro de teste");
  expect(screen.queryByTitle("PDF do relatório #2")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
  expect(
    screen.queryByRole("link", { name: "Baixar PDF" }),
  ).not.toBeInTheDocument();
});
