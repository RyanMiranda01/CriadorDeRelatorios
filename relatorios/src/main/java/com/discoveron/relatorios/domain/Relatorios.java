package com.discoveron.relatorios.domain;

import com.discoveron.relatorios.dto.relatorio.RelatorioCadastroDTO;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "relatorios")
public class Relatorios {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nomeAluno;
    @ManyToOne
    @JoinColumn(name = "funcionarios_id")
    private Funcionarios funcionarios;
    private String turma;
    @Enumerated(EnumType.STRING)
    private Periodo periodo;
    private String motivo;
    private String desc_situacao;
    private String providencia;
    private LocalDateTime data_criacao = LocalDateTime.now();



    public Relatorios(@Valid RelatorioCadastroDTO relatorioCadastroDTO) {
        this.nomeAluno = relatorioCadastroDTO.nome_aluno();
        this.turma = relatorioCadastroDTO.turma();
        this.funcionarios = relatorioCadastroDTO.funcionarios_id();
        this.periodo = relatorioCadastroDTO.periodo();
        this.motivo = relatorioCadastroDTO.motivo();
        this.desc_situacao = relatorioCadastroDTO.desc_situacao();
        this.providencia = relatorioCadastroDTO.providencia();
    }
}
