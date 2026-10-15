package com.discoveron.relatorios.repository;

import com.discoveron.relatorios.domain.Funcionarios;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FuncionarioRepository extends JpaRepository<Funcionarios, Long> {

    List<Funcionarios> findByNomeContainingIgnoreCase(String nome);

    boolean existsByNome(String nome);

    boolean existsByLogin(@NotBlank String nome);

    Optional<Funcionarios> findByLogin(String login);
}
