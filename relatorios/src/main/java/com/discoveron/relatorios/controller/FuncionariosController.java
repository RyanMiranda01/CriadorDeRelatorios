package com.discoveron.relatorios.controller;



import com.discoveron.relatorios.dto.funcionarios.FuncionarioCadastroDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosEditarDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosRespostaDTO;
import com.discoveron.relatorios.dto.funcionarios.TrocarSenhaDTO;
import com.discoveron.relatorios.service.FuncionarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/funcionarios")
public class FuncionariosController {

    private final FuncionarioService funcionarioService;

    public FuncionariosController(FuncionarioService funcionarioService) {
        this.funcionarioService = funcionarioService;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<FuncionariosRespostaDTO> cadastrarFuncionario(@Valid @RequestBody FuncionarioCadastroDTO funcionarioCadastroDTO){
        FuncionariosRespostaDTO funcionariosRespostaDTO = funcionarioService.cadastrarFuncionario(funcionarioCadastroDTO);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(funcionariosRespostaDTO);
    }



    @PutMapping("/editarFunc/{id}")
    public ResponseEntity<Void> editarFuncionario(@Valid @RequestBody FuncionariosEditarDTO funcionariosEditarDTO, @PathVariable Long id){
        funcionarioService.editarFuncionario(funcionariosEditarDTO, id);

        return ResponseEntity
                .noContent().build();
    }

    @GetMapping("/listarFunc")
    public ResponseEntity<List<FuncionariosRespostaDTO>> listarFuncionario(){
        List<FuncionariosRespostaDTO> listaFunc = funcionarioService.listarFuncionario();

        return ResponseEntity.ok(listaFunc);
    }

    @GetMapping("/listarPorNome")
    public ResponseEntity<List<FuncionariosRespostaDTO>> listarPorNome(@RequestParam String nome){
        List<FuncionariosRespostaDTO> listaPorNome = funcionarioService.listarPorNome(nome);

        return ResponseEntity.ok(listaPorNome);
    }

    @GetMapping("/buscarPorId/{id}")
    public ResponseEntity<FuncionariosRespostaDTO> buscarPorId(@PathVariable Long id){
        FuncionariosRespostaDTO funcionariosRespostaDTO = funcionarioService.buscarPorId(id);

        return ResponseEntity.ok(funcionariosRespostaDTO);
    }

    @PutMapping("/resetarSenha/{id}")
    public ResponseEntity<String> resetarSenha(@PathVariable Long id){
        funcionarioService.resetarSenha(id);

        return  ResponseEntity.ok("Senha resetada!!");
    }

    @PutMapping("/criarNovaSenha/{id}")
    public ResponseEntity<String> criarNovaSenha(@PathVariable Long id, @Valid @RequestBody TrocarSenhaDTO dados){
        funcionarioService.criarNovaSenha(id, dados.novaSenha());

        return ResponseEntity.ok("Senha cadastrada com sucesso!");
    }

    @PutMapping("/minha-senha")
    public ResponseEntity<Void> trocarPropriaSenha(
            Authentication authentication,
            @Valid @RequestBody TrocarSenhaDTO dados
    ) {
        funcionarioService.trocarPropriaSenha(
                authentication.getName(),
                dados
        );

        return ResponseEntity.noContent().build();
    }
}
