package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Ativo;
import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotNull;

public record FuncionarioCadastroDTO(
        @NotNull
        String nome,
        @NotNull
        String login,
        @NotNull
        String senha,
        @NotNull
        Nivel nivel,
        @NotNull
        String cargo,
        @NotNull
        Ativo ativo
) {
}
