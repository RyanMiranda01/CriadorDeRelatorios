import { describe, expect, it } from "vitest";
import { dataParaApi, ordenarRecentes, podeAlterar } from "../utils";
import { relatorioSchema } from "../pages/Relatorios";
import { senhaSchema } from "../pages/Login";
import type { Funcionario, Relatorio, Nivel } from "../types";
const base: Relatorio = {
  id: 1,
  nome_aluno: "Aluno de teste",
  turma: "Turma de teste",
  motivo: "Motivo",
  periodo: "MATUTINO",
  desc_situacao: "Descrição",
  providencia: "Providência",
  id_funcionario: 1,
  data_criacao: "31/12/2025 12:00:00",
};
const usuario = (nivel: Nivel): Funcionario => ({
  id: 1,
  nome: "Teste",
  login: "teste",
  cargo: "Equipe",
  ativo: true,
  nivel,
});
describe("permissões por propriedade", () => {
  it.each(["PROFESSOR", "CORDENADOR"] as const)(
    "%s só altera os próprios",
    (nivel) => {
      expect(podeAlterar(usuario(nivel), base)).toBe(true);
      expect(podeAlterar(usuario(nivel), { ...base, id_funcionario: 2 })).toBe(
        false,
      );
    },
  );
  it("administrador altera qualquer relatório", () =>
    expect(
      podeAlterar(usuario("ADMINISTRADOR"), { ...base, id_funcionario: 2 }),
    ).toBe(true));
});
it("ordena a data brasileira cronologicamente sem alterar a lista original", () => {
  const registros = [
    base,
    { ...base, id: 2, data_criacao: "01/01/2026 09:00:00" },
  ];
  expect(ordenarRecentes(registros).map((r) => r.id)).toEqual([2, 1]);
  expect(registros[0].id).toBe(1);
  expect(dataParaApi("2026-10-14")).toBe("14/10/2026");
});
it("valida o limite de bytes e não aceita senha curta", () => {
  expect(senhaSchema.safeParse("á".repeat(40)).success).toBe(false);
  expect(senhaSchema.safeParse("curta").success).toBe(false);
  expect(senhaSchema.safeParse("UmaSenhaValida123!").success).toBe(true);
});
it("o formulário de relatório usa os campos reais e não envia autor", () => {
  const dados = relatorioSchema.parse({ ...base, funcionarios_id: 999 });
  expect(dados).not.toHaveProperty("funcionarios_id");
  expect(dados).not.toHaveProperty("id");
  expect(relatorioSchema.safeParse({ ...dados, nome_aluno: "" }).success).toBe(
    false,
  );
});
