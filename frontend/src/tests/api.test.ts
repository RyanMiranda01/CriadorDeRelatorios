import axios, {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const originalAdapter = axios.defaults.adapter;
let chamadas: InternalAxiosRequestConfig[];
let negar: { status: number; codigo: string } | undefined;
const adapter: AxiosAdapter = async (config) => {
  chamadas.push(config);
  const response = {
    config,
    headers: {},
    status: 200,
    statusText: "OK",
    data:
      config.url === "/csrf"
        ? { headerName: "X-Teste-CSRF", token: "token-teste" }
        : {},
  };
  if (negar && config.url !== "/csrf")
    throw new AxiosError("Erro", "ERR_BAD_REQUEST", config, undefined, {
      ...response,
      status: negar.status,
      data: { codigo: negar.codigo },
    });
  return response;
};
beforeEach(() => {
  chamadas = [];
  negar = undefined;
  axios.defaults.adapter = adapter;
  vi.resetModules();
});
afterEach(() => {
  axios.defaults.adapter = originalAdapter;
});
it("transporta cookies e envia o cabeçalho CSRF obtido do servidor", async () => {
  const { api } = await import("../api/client");
  await api.post(
    "/login",
    new URLSearchParams({ username: "teste", password: "somente-teste" }),
  );
  expect(chamadas.map((c) => c.url)).toEqual(["/csrf", "/login"]);
  expect(chamadas.every((c) => c.withCredentials)).toBe(true);
  expect(chamadas[1].headers.get("X-Teste-CSRF")).toBe("token-teste");
});
it("token inválido não repete a escrita e renova CSRF na próxima tentativa", async () => {
  const { api } = await import("../api/client");
  negar = { status: 403, codigo: "CSRF_INVALIDO" };
  await expect(
    api.put("/funcionarios/minha-senha", { novaSenha: "UmaSenhaValida123!" }),
  ).rejects.toThrow();
  expect(chamadas.filter((c) => c.method === "put")).toHaveLength(1);
  negar = undefined;
  await api.put("/funcionarios/minha-senha", {
    novaSenha: "UmaSenhaValida123!",
  });
  expect(chamadas.filter((c) => c.url === "/csrf")).toHaveLength(2);
});
it("401 dispara término da sessão, mas erro de credenciais não dispara", async () => {
  const { api, observarSessao } = await import("../api/client");
  const listener = vi.fn();
  observarSessao(listener);
  negar = { status: 401, codigo: "CREDENCIAIS_INVALIDAS" };
  await expect(api.post("/login")).rejects.toThrow();
  expect(listener).not.toHaveBeenCalled();
  negar = { status: 401, codigo: "SESSAO_EXPIRADA" };
  await expect(api.get("/auth/me")).rejects.toThrow();
  expect(listener).toHaveBeenCalledWith("anonimo");
});
it("403 distingue troca obrigatória de falta de permissão", async () => {
  const { api, observarSessao } = await import("../api/client");
  const listener = vi.fn();
  observarSessao(listener);
  negar = { status: 403, codigo: "ACESSO_NEGADO" };
  await expect(api.get("/funcionarios/listarFunc")).rejects.toThrow();
  expect(listener).not.toHaveBeenCalled();
  negar = { status: 403, codigo: "TROCA_SENHA_OBRIGATORIA" };
  await expect(api.get("/auth/me")).rejects.toThrow();
  expect(listener).toHaveBeenCalledWith("troca-obrigatoria");
});
