package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Ativo;
import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotNull;

public record FuncionariosEditarDTO(
        @NotNull
        Nivel nivel,
        @NotNull
        String cargo,
        @NotNull
        String nome,
        @NotNull
        Ativo ativar
) {
}
