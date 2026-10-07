package com.discoveron.relatorios.dto.relatorio;

import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RelatorioEditar(
        @NotBlank
        String nome_aluno,
        @NotBlank
        String turma,
        @NotBlank
        String motivo,
        @NotBlank
        String desc_situacao,
        @NotNull
        Periodo periodo,
        @NotBlank
        String providencia

) {
    public RelatorioEditar(Relatorios relatorios){
        this(relatorios.getNomeAluno(), relatorios.getTurma(),relatorios.getMotivo(), relatorios.getDesc_situacao(), relatorios.getPeriodo(),relatorios.getProvidencia());
    }


}
