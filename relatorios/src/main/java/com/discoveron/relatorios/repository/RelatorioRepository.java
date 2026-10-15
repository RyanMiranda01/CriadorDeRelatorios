package com.discoveron.relatorios.repository;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RelatorioRepository extends JpaRepository<Relatorios, Long> {

    @Query("""
    SELECT r FROM Relatorios r
    WHERE r.data_criacao >= :inicio
      AND r.data_criacao < :fim
    ORDER BY r.data_criacao
    """)
    List<Relatorios> buscarPorData(
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );

    List<Relatorios> findByPeriodo(Periodo periodo);

    List<Relatorios> findByFuncionarios(Funcionarios funcionarios);

    List<Relatorios> findByFuncionarios_NomeContainingIgnoreCase(String funcionariosNome);

    List<Relatorios> findByNomeAlunoContainingIgnoreCase(String aluno);

    List<Relatorios> findByFuncionarios_Id(Long funcionarioId);

    List<Relatorios> findByPeriodoAndFuncionarios_Id(Periodo periodo, Long funcionarioId
    );

    List<Relatorios> findByNomeAlunoContainingIgnoreCaseAndFuncionarios_Id(String aluno, Long funcionarioId);

    @Query("""
    SELECT r FROM Relatorios r
    WHERE r.data_criacao >= :inicio
      AND r.data_criacao < :fim
      AND r.funcionarios.id = :funcionarioId
    ORDER BY r.data_criacao
    """)
    List<Relatorios> buscarPorDataEFuncionario(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("funcionarioId") Long funcionarioId);

    List<Relatorios> findByFuncionarios_NomeContainingIgnoreCaseAndFuncionarios_Id(String nome, Long funcionarioId);
}
