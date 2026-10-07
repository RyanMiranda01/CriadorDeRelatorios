package com.discoveron.relatorios.dto.relatorio;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record RelatorioCadastroDTO(
        @NotBlank
        String nome_aluno,
        @NotBlank
        String turma,
        @NotNull
        Funcionarios funcionarios_id,
        @NotBlank
        String motivo,
        @NotBlank
        String desc_situacao,
        @NotNull
        Periodo periodo,
        @NotBlank
        String providencia

) {
        public RelatorioCadastroDTO(Relatorios relatorios){
                this(relatorios.getNomeAluno(), relatorios.getTurma(), relatorios.getFuncionarios(),relatorios.getMotivo(), relatorios.getDesc_situacao(), relatorios.getPeriodo(),relatorios.getProvidencia());
        }


}
