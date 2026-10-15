package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FuncionarioCadastroDTO(
        @NotBlank
        @Size(max = 255)
        String nome,
        @NotBlank
        @Size(max = 255)
        String login,
        @NotBlank
        @Size(min = 12, max = 64)
        String senha,
        @NotNull
        Nivel nivel,
        @NotBlank
        @Size(max = 255)
        String cargo
) {
}
