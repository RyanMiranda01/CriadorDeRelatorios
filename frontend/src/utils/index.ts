import type { Funcionario, Relatorio } from "../types";
export function podeAlterar(usuario: Funcionario, relatorio: Relatorio) {
  return (
    usuario.nivel === "ADMINISTRADOR" || usuario.id === relatorio.id_funcionario
  );
}
export function dataParaApi(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
export function dataRelatorio(data: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(
    data,
  );
  return match
    ? new Date(
        +match[3],
        +match[2] - 1,
        +match[1],
        +match[4],
        +match[5],
        +match[6],
      ).getTime()
    : 0;
}
export function ordenarRecentes(lista: Relatorio[]) {
  return [...lista].sort(
    (a, b) =>
      dataRelatorio(b.data_criacao) - dataRelatorio(a.data_criacao) ||
      b.id - a.id,
  );
}
