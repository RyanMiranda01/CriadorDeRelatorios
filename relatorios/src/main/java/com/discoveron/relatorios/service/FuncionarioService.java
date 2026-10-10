package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.dto.funcionarios.FuncionarioCadastroDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosEditarDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosRespostaDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import com.discoveron.relatorios.validacao.funcionarios.ValidarFuncionarioExistente;
import com.discoveron.relatorios.validacao.funcionarios.ValidarFuncionariosExistentesPorId;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final ValidarFuncionarioExistente validarFuncionarioExistente;
    private final ValidarFuncionariosExistentesPorId validarFuncionariosExistentesPorId;


    public FuncionarioService(FuncionarioRepository funcionarioRepository, ValidarFuncionarioExistente validarFuncionarioExistente, ValidarFuncionariosExistentesPorId validarFuncionariosExistentesPorId) {
        this.funcionarioRepository = funcionarioRepository;
        this.validarFuncionarioExistente = validarFuncionarioExistente;
        this.validarFuncionariosExistentesPorId = validarFuncionariosExistentesPorId;
    }


    public FuncionariosRespostaDTO cadastrarFuncionario(@Valid FuncionarioCadastroDTO funcionarioCadastroDTO) {


        validarFuncionarioExistente.validarFuncionarioExistente(funcionarioCadastroDTO);
        Funcionarios funcionarios = new Funcionarios();
        funcionarios.setNome(funcionarioCadastroDTO.nome());
        funcionarios.setCargo(funcionarioCadastroDTO.cargo());
        funcionarios.setNivel(funcionarioCadastroDTO.nivel());
        funcionarios.setSenha(funcionarioCadastroDTO.senha());
        funcionarios.setLogin(funcionarioCadastroDTO.login());
        funcionarios.setAtivo(true);
        Funcionarios novoFuncionario = funcionarioRepository.save(funcionarios);

        FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(novoFuncionario);
        return funcionariosRespostaDTO;

    }


    public void editarFuncionario(@Valid FuncionariosEditarDTO funcionariosEditarDTO, Long id) {

        Funcionarios funcionarios = validarFuncionariosExistentesPorId.validarFuncionariosId(id);
        funcionarios.setCargo(funcionariosEditarDTO.cargo());
        funcionarios.setNivel(funcionariosEditarDTO.nivel());
        funcionarios.setNome(funcionariosEditarDTO.nome());
        funcionarios.setAtivo(funcionariosEditarDTO.ativo());
        funcionarioRepository.save(funcionarios);

    }

    public List<FuncionariosRespostaDTO> listarFuncionario() {
        List<Funcionarios> listaFuncionarios = funcionarioRepository.findAll();
        List<FuncionariosRespostaDTO> listaFuncionarioDTO = new ArrayList<>();

        for (Funcionarios funcionarios : listaFuncionarios) {
            FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);
            listaFuncionarioDTO.add(funcionariosRespostaDTO);
        }

        return listaFuncionarioDTO;
    }

    public List<FuncionariosRespostaDTO> listarPorNome(String nome) {

        List<Funcionarios> listaFuncionarios = funcionarioRepository.findByNomeContainingIgnoreCase(nome);
        List<FuncionariosRespostaDTO> listaFuncionarioDTO = new ArrayList<>();

        for (Funcionarios funcionarios : listaFuncionarios) {
            FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);
            listaFuncionarioDTO.add(funcionariosRespostaDTO);
        }

        if(listaFuncionarioDTO.isEmpty()){
            throw new ResponseStatusException(HttpStatus.OK, "Lista vazia");
        }

        return listaFuncionarioDTO;

    }

    public FuncionariosRespostaDTO buscarPorId(Long id) {
        Funcionarios funcionarios = validarFuncionariosExistentesPorId.validarFuncionariosId(id);
        FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);

        return funcionariosRespostaDTO;
    }

    public void resetarSenha(Long id) {
        Funcionarios funcionarios = validarFuncionariosExistentesPorId.validarFuncionariosId(id);
        funcionarios.setSenha(funcionarios.getLogin());
        funcionarioRepository.save(funcionarios);
    }


    public void criarNovaSenha(Long id, String senha) {
        Funcionarios funcionarios = validarFuncionariosExistentesPorId.validarFuncionariosId(id);
        funcionarios.setSenha(senha);
        funcionarioRepository.save(funcionarios);
    }
}
