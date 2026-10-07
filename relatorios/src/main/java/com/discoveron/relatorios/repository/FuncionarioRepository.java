package com.discoveron.relatorios.repository;

import com.discoveron.relatorios.domain.Funcionarios;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FuncionarioRepository extends JpaRepository<Funcionarios, Long> {

    Funcionarios findByNome(String nome);
}
