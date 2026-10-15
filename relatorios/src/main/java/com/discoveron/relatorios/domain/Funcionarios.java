package com.discoveron.relatorios.domain;


import com.discoveron.relatorios.dto.funcionarios.FuncionarioCadastroDTO;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "funcionarios")
public class Funcionarios {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    @Enumerated(EnumType.STRING)
    private Nivel nivel;
    private String cargo;
    private String senha;
    @Column(unique = true)
    private String login;
    private boolean ativo;
    @Column(name = "troca_senha_obrigatoria", nullable = false)
    private boolean trocaSenhaObrigatoria;

    public Funcionarios(@Valid FuncionarioCadastroDTO funcionarioCadastroDTO) {
        this.nome = funcionarioCadastroDTO.nome();
        this.cargo = funcionarioCadastroDTO.cargo();
        this.nivel = funcionarioCadastroDTO.nivel();
        this.login = funcionarioCadastroDTO.login();
        this.setAtivo(true);
    }
}
