import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import {
  api,
  limparCsrf,
  mensagemErro,
  observarSessao,
  obterCsrf,
} from "../api/client";
import type { ErroApi, Funcionario } from "../types";
type Status =
  "carregando" | "anonimo" | "autenticado" | "troca-obrigatoria" | "erro";
interface Auth {
  status: Status;
  usuario: Funcionario | null;
  erro: string;
  aviso: string;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  carregar: () => Promise<void>;
  senhaAlterada: () => void;
}
const Contexto = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("carregando");
  const [usuario, setUsuario] = useState<Funcionario | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const consultaSessao = useRef<AbortController | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const carregar = useCallback(async () => {
    consultaSessao.current?.abort();
    const controller = new AbortController();
    consultaSessao.current = controller;
    setStatus("carregando");
    setErro("");
    try {
      const { data } = await api.get<Funcionario>("/auth/me", {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (
        !data ||
        typeof data.id !== "number" ||
        typeof data.nome !== "string" ||
        !["PROFESSOR", "CORDENADOR", "ADMINISTRADOR"].includes(data.nivel)
      )
        throw new Error(
          "O servidor retornou uma identidade inválida. Verifique a configuração da API.",
        );
      setUsuario(data);
      setStatus("autenticado");
    } catch (error: unknown) {
      if (controller.signal.aborted || axios.isCancel(error)) return;
      setUsuario(null);
      if (axios.isAxiosError<ErroApi>(error) && error.response?.status === 401)
        setStatus("anonimo");
      else if (
        axios.isAxiosError<ErroApi>(error) &&
        error.response?.data?.codigo === "TROCA_SENHA_OBRIGATORIA"
      )
        setStatus("troca-obrigatoria");
      else {
        setErro(mensagemErro(error));
        setStatus("erro");
      }
    }
  }, []);
  useEffect(() => {
    void carregar();
    return () => consultaSessao.current?.abort();
  }, [carregar]);
  useEffect(
    () =>
      observarSessao((evento) => {
        setUsuario(null);
        setStatus(evento);
        if (
          evento === "anonimo" &&
          ["autenticado", "troca-obrigatoria"].includes(statusRef.current)
        )
          setAviso("Sua sessão terminou. Entre novamente.");
      }),
    [],
  );
  async function entrar(login: string, senha: string) {
    consultaSessao.current?.abort();
    const { data } = await api.post<{
      autenticado: boolean;
      trocaSenhaObrigatoria: boolean;
    }>("/login", new URLSearchParams({ username: login, password: senha }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    limparCsrf();
    setAviso("");
    if (!data.autenticado)
      throw new Error("Resposta de autenticação inválida.");
    if (data.trocaSenhaObrigatoria) {
      setUsuario(null);
      setStatus("troca-obrigatoria");
    } else await carregar();
    // O próximo envio busca um token novo. A identidade não depende da disponibilidade desse GET.
    void obterCsrf().catch(() => undefined);
  }
  async function sair() {
    consultaSessao.current?.abort();
    try {
      await api.post("/logout");
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401)
        throw error;
    }
    limparCsrf();
    setUsuario(null);
    setAviso("");
    setStatus("anonimo");
  }
  function senhaAlterada() {
    consultaSessao.current?.abort();
    limparCsrf();
    setUsuario(null);
    setAviso("Senha alterada. Entre novamente com sua nova senha.");
    setStatus("anonimo");
  }
  return (
    <Contexto.Provider
      value={{
        status,
        usuario,
        erro,
        aviso,
        entrar,
        sair,
        carregar,
        senhaAlterada,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}
export function useAuth() {
  const auth = useContext(Contexto);
  if (!auth) throw new Error("AuthProvider ausente.");
  return auth;
}
