package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FuncionarioCadastroDTO(
        @NotBlank
        String nome,
        @NotBlank
        String login,
        @NotBlank
        String senha,
        @NotNull
        Nivel nivel,
        @NotBlank
        String cargo
) {
}
