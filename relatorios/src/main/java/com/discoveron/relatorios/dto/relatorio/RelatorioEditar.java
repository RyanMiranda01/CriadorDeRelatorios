package com.discoveron.relatorios.dto.relatorio;

import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RelatorioEditar(
        @NotBlank
        @Size(max = 255)
        String nome_aluno,
        @NotBlank
        @Size(max = 255)
        String turma,
        @NotBlank
        @Size(max = 255)
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
