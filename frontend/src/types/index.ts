export type Nivel = "PROFESSOR" | "CORDENADOR" | "ADMINISTRADOR";
export type Periodo = "MATUTINO" | "VESPERTINO" | "NOTURNO";
export interface Funcionario {
  id: number;
  nome: string;
  login: string;
  cargo: string;
  nivel: Nivel;
  ativo: boolean;
}
export interface Relatorio {
  id: number;
  nome_aluno: string;
  id_funcionario: number;
  turma: string;
  motivo: string;
  periodo: Periodo;
  desc_situacao: string;
  providencia: string;
  data_criacao: string;
}
export interface RelatorioDados {
  nome_aluno: string;
  turma: string;
  motivo: string;
  periodo: Periodo;
  desc_situacao: string;
  providencia: string;
}
export interface FuncionarioCadastro {
  nome: string;
  login: string;
  senha: string;
  cargo: string;
  nivel: Nivel;
}
export interface FuncionarioEdicao {
  nome: string;
  cargo: string;
  nivel: Nivel;
  ativo: boolean;
}
export interface ErroApi {
  status?: number;
  codigo?: string;
  mensagem?: string;
  campos?: Record<string, string>;
}
export const niveis: Record<Nivel, string> = {
  PROFESSOR: "Professor",
  CORDENADOR: "Coordenador",
  ADMINISTRADOR: "Administrador",
};
export const periodos: Record<Periodo, string> = {
  MATUTINO: "Matutino",
  VESPERTINO: "Vespertino",
  NOTURNO: "Noturno",
};
