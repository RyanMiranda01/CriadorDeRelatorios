import { api } from "../api/client";
import type {
  Funcionario,
  FuncionarioCadastro,
  FuncionarioEdicao,
  Relatorio,
  RelatorioDados,
} from "../types";
export type FiltroRelatorio =
  | { tipo: "todos" }
  | { tipo: "aluno" | "funcionario" | "periodo"; valor: string }
  | { tipo: "data"; inicio: string; fim: string };
export const relatoriosApi = {
  async listar(
    filtro: FiltroRelatorio = { tipo: "todos" },
    signal?: AbortSignal,
  ) {
    let caminho = "/relatorio/listar";
    let params: Record<string, string> | undefined;
    if (filtro.tipo === "data") {
      caminho = "/relatorio/listardatas";
      params = { inicio: filtro.inicio, fim: filtro.fim };
    } else if (filtro.tipo !== "todos")
      caminho = `/relatorio/${filtro.tipo}/${encodeURIComponent(filtro.valor)}`;
    return (await api.get<Relatorio[]>(caminho, { params, signal })).data;
  },
  async obter(id: number, signal?: AbortSignal) {
    return (await api.get<Relatorio>(`/relatorio/${id}`, { signal })).data;
  },
  async criar(dados: RelatorioDados) {
    return (await api.post<Relatorio>("/relatorio/gerar", dados)).data;
  },
  async editar(id: number, dados: RelatorioDados) {
    return (await api.put<Relatorio>(`/relatorio/editar/${id}`, dados)).data;
  },
  async excluir(id: number) {
    await api.delete(`/relatorio/deletar/${id}`);
  },
};
export const funcionariosApi = {
  async listar(nome: string, signal?: AbortSignal) {
    return (
      await api.get<Funcionario[]>(
        nome ? "/funcionarios/listarPorNome" : "/funcionarios/listarFunc",
        { params: nome ? { nome } : undefined, signal },
      )
    ).data;
  },
  async criar(dados: FuncionarioCadastro) {
    return (await api.post<Funcionario>("/funcionarios/cadastro", dados)).data;
  },
  async editar(id: number, dados: FuncionarioEdicao) {
    await api.put(`/funcionarios/editarFunc/${id}`, dados);
  },
  async resetar(id: number) {
    await api.put(`/funcionarios/resetarSenha/${id}`);
  },
};
