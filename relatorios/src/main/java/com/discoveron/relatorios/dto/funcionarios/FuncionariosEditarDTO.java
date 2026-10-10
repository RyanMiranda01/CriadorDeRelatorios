package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FuncionariosEditarDTO(
        @NotNull
        Nivel nivel,
        @NotBlank
        String cargo,
        @NotBlank
        String nome,
        @NotNull
        boolean ativo
) {
}
