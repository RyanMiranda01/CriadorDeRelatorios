package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FuncionariosEditarDTO(
        @NotNull
        Nivel nivel,
        @NotBlank
        @Size(max = 255)
        String cargo,
        @NotBlank
        @Size(max = 255)
        String nome,
        @NotNull(message = "Informe se o funcionario esta ativo!")
        Boolean ativo
) {
}
