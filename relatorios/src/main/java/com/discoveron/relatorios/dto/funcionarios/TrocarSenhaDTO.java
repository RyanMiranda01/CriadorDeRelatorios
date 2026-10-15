package com.discoveron.relatorios.dto.funcionarios;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TrocarSenhaDTO(
        @NotBlank
        @Size(min = 12, max = 64)
        String novaSenha
) {}