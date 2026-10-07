package com.discoveron.relatorios.controller;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.dto.relatorio.RelatorioCadastroDTO;
import com.discoveron.relatorios.dto.relatorio.RelatorioEditar;
import com.discoveron.relatorios.dto.relatorio.RelatoriosRespostasDTO;
import com.discoveron.relatorios.service.RelatoriosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/relatorio")
public class RelatorioController {

    private final RelatoriosService relatoriosService;

    public RelatorioController(RelatoriosService relatoriosService) {
        this.relatoriosService = relatoriosService;
    }

    @PostMapping("/gerar")
    public ResponseEntity<RelatorioCadastroDTO> salvarRelatorio(@Valid @RequestBody RelatorioCadastroDTO relatorioCadastroDTO){

        RelatorioCadastroDTO relatorioCadastroDTO1 = relatoriosService.cadastrarRelatorio(relatorioCadastroDTO);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(relatorioCadastroDTO1);
    }

    @PutMapping("/editar/{id}")
    public ResponseEntity<RelatoriosRespostasDTO> editarRelatorio(@PathVariable Long id,@Valid @RequestBody RelatorioEditar relatorioEditar){
        RelatoriosRespostasDTO relatoriosRespostasDTO = relatoriosService.editarRelatorio(id, relatorioEditar);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(relatoriosRespostasDTO);
    }

    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<Void> deletarRelatorio(@PathVariable Long id){
        relatoriosService.deletarRelatorio(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listar")
    public ResponseEntity<List<RelatoriosRespostasDTO>> listarRelatorios(){
        List<RelatoriosRespostasDTO> listaRelatorios = relatoriosService.listarRelatorios();

        return ResponseEntity.
                ok(listaRelatorios);
    }

    @GetMapping("/listardatas")
    public ResponseEntity<List<RelatoriosRespostasDTO>>  listarPorData(@RequestParam("inicio") String inicio, @RequestParam("fim") String fim){
        List<RelatoriosRespostasDTO> relatoriosRespostasDTOS = relatoriosService.listarPorData(inicio, fim);

        return ResponseEntity.ok(relatoriosRespostasDTOS);
    }

    @GetMapping("/periodo/{periodo}")
    public ResponseEntity<List<RelatoriosRespostasDTO>> listarPorPeriodo(@PathVariable Periodo periodo){
        List<RelatoriosRespostasDTO> listar = relatoriosService.listarPorPeriodo(periodo);

        return ResponseEntity.ok(listar);
    }

    @GetMapping("/funcionario/{nomeF}")
    public ResponseEntity<List<RelatoriosRespostasDTO>> listarPorFuncionario(@PathVariable String nomeF){
        List<RelatoriosRespostasDTO> lista =  relatoriosService.listarPorFuncionario(nomeF);

        return ResponseEntity.ok(lista);
    }

    @GetMapping("/aluno/{aluno}")
    public ResponseEntity<List<RelatoriosRespostasDTO>> listarPorAluno(@PathVariable String aluno){
        List<RelatoriosRespostasDTO> lista = relatoriosService.listarPorAluno(aluno);

        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RelatoriosRespostasDTO> buscarPorId(@PathVariable Long id){
        RelatoriosRespostasDTO relatoriosRespostasDTO = relatoriosService.buscarRelatorioId(id);

        return ResponseEntity.ok(relatoriosRespostasDTO);
    }

}
