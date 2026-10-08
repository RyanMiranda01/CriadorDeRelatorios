package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Ativo;
import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Nivel;
import jakarta.validation.constraints.NotNull;

public record FuncionariosRespostaDTO(
        String nome,
        Nivel nivel,
        String cargo,
        String login,
        Ativo ativo

) {
    public FuncionariosRespostaDTO(Funcionarios funcionario){
        this(funcionario.getNome(), funcionario.getNivel(), funcionario.getCargo(), funcionario.getLogin(), funcionario.getAtivar());
    }
}
