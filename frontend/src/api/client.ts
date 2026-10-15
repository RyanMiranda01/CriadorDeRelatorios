import axios from "axios";
import type { ErroApi } from "../types";
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: "application/json" },
});
const transporteCsrf = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: "application/json" },
});
interface Csrf {
  headerName: string;
  token: string;
}
let token: Promise<Csrf> | undefined;
export function limparCsrf() {
  token = undefined;
}
export function obterCsrf(): Promise<Csrf> {
  token ??= transporteCsrf
    .get<Csrf>("/csrf")
    .then(({ data }) => {
      if (!data.headerName || !data.token)
        throw new Error("Resposta de segurança inválida.");
      return data;
    })
    .catch((error: unknown) => {
      token = undefined;
      throw error;
    });
  return token;
}
export type EventoSessao = "anonimo" | "troca-obrigatoria";
const ouvintes = new Set<(evento: EventoSessao) => void>();
export function observarSessao(ouvinte: (evento: EventoSessao) => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}
api.interceptors.request.use(async (config) => {
  if (["post", "put", "patch", "delete"].includes(config.method || "")) {
    const csrf = await obterCsrf();
    config.headers.set(csrf.headerName, csrf.token);
  }
  return config;
});
api.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    if (axios.isAxiosError<ErroApi>(erro)) {
      const status = erro.response?.status;
      const codigo = erro.response?.data?.codigo;
      if (codigo === "CSRF_INVALIDO") limparCsrf();
      if (status === 401 && erro.config?.url !== "/login") {
        limparCsrf();
        ouvintes.forEach((ouvinte) => ouvinte("anonimo"));
      }
      if (status === 403 && codigo === "TROCA_SENHA_OBRIGATORIA")
        ouvintes.forEach((ouvinte) => ouvinte("troca-obrigatoria"));
    }
    return Promise.reject(erro);
  },
);
export function mensagemErro(erro: unknown): string {
  if (axios.isAxiosError<ErroApi>(erro)) {
    const data = erro.response?.data;
    if (data?.codigo === "CSRF_INVALIDO")
      return "A verificação de segurança expirou. Tente novamente.";
    if (!erro.response)
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    return (
      data?.mensagem ||
      ({
        400: "Verifique os dados informados.",
        401: "Sua sessão terminou. Entre novamente.",
        403: "Você não tem permissão para esta operação.",
        404: "Registro não encontrado.",
        409: "Os dados conflitam com um registro existente.",
        500: "O servidor não conseguiu concluir a operação.",
      }[erro.response.status] ??
        "Não foi possível concluir a operação.")
    );
  }
  return erro instanceof Error
    ? erro.message
    : "Não foi possível concluir a operação.";
}
export function camposErro(erro: unknown) {
  return axios.isAxiosError<ErroApi>(erro)
    ? (erro.response?.data?.campos ?? {})
    : {};
}
