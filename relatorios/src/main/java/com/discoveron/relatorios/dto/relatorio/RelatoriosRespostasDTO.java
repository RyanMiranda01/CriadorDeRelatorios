package com.discoveron.relatorios.dto.relatorio;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record RelatoriosRespostasDTO(
        String nome_aluno,
        Funcionarios nome_funcionario,
        String turma,
        String motivo,
        Periodo periodo,
        String desc_situacao,
        String providencia,
        String data_criacao

) {
    public RelatoriosRespostasDTO(Relatorios relatorios){
        this(relatorios.getNomeAluno(),
                relatorios.getFuncionarios(),
                relatorios.getTurma(),
                relatorios.getMotivo(),
                relatorios.getPeriodo(),
                relatorios.getDesc_situacao(),
                relatorios.getProvidencia(),
                relatorios.getData_criacao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
    }
}
