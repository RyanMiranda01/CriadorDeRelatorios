package com.discoveron.relatorios.dto.relatorio;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record RelatoriosRespostasDTO(
        Long id,
        String nome_aluno,
        Long id_funcionario,
        String turma,
        String motivo,
        Periodo periodo,
        String desc_situacao,
        String providencia,
        String data_criacao

) {
    public RelatoriosRespostasDTO(Relatorios relatorios){
        this(
                relatorios.getId(),
                relatorios.getNomeAluno(),
                relatorios.getFuncionarios().getId(),
                relatorios.getTurma(),
                relatorios.getMotivo(),
                relatorios.getPeriodo(),
                relatorios.getDesc_situacao(),
                relatorios.getProvidencia(),
                relatorios.getData_criacao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
    }
}
