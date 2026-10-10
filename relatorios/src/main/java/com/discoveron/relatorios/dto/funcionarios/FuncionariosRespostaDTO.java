package com.discoveron.relatorios.dto.funcionarios;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Nivel;

public record FuncionariosRespostaDTO(
        Long id,
        String nome,
        Nivel nivel,
        String cargo,
        String login,
        boolean ativo

) {
    public FuncionariosRespostaDTO(Funcionarios funcionario){
        this(funcionario.getId(), funcionario.getNome(), funcionario.getNivel(), funcionario.getCargo(), funcionario.getLogin(), funcionario.isAtivo());
    }
}
