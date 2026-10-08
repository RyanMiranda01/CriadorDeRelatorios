package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.Ativo;
import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.dto.funcionarios.FuncionarioCadastroDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosEditarDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosRespostaDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;

    public FuncionarioService(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }


    public FuncionariosRespostaDTO cadastrarFuncionario(@Valid FuncionarioCadastroDTO funcionarioCadastroDTO) {

        Funcionarios funcionarios = new Funcionarios();
        funcionarios.setNome(funcionarioCadastroDTO.nome());
        funcionarios.setCargo(funcionarioCadastroDTO.cargo());
        funcionarios.setNivel(funcionarioCadastroDTO.nivel());
        funcionarios.setSenha(funcionarioCadastroDTO.senha());
        funcionarios.setLogin(funcionarioCadastroDTO.login());
        funcionarios.setAtivar(Ativo.ATIVAR);
        Funcionarios novoFuncionario = funcionarioRepository.save(funcionarios);

        FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(novoFuncionario);

        return funcionariosRespostaDTO;
    }

    public void editarFuncionario(@Valid FuncionariosEditarDTO funcionariosEditarDTO, Long id) {

        Funcionarios funcionarios = funcionarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado"));
        funcionarios.setNivel(funcionariosEditarDTO.nivel());
        funcionarios.setCargo(funcionariosEditarDTO.cargo());
        funcionarios.setNivel(funcionariosEditarDTO.nivel());
        funcionarios.setNome(funcionariosEditarDTO.nome());
        funcionarios.setAtivar(funcionariosEditarDTO.ativar());
        funcionarioRepository.save(funcionarios);

    }

    public List<FuncionariosRespostaDTO> listarFuncionario() {
        List<Funcionarios> listaFuncionarios = funcionarioRepository.findAll();
        List<FuncionariosRespostaDTO> listaFuncionarioDTO = new ArrayList<>();

        for(Funcionarios funcionarios : listaFuncionarios){
            FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);
            listaFuncionarioDTO.add(funcionariosRespostaDTO);
        }

        return listaFuncionarioDTO;
    }

    public List<FuncionariosRespostaDTO> listarPorNome(String nome) {

        List<Funcionarios> listaFuncionarios = funcionarioRepository.findByNomeContainingIgnoreCase(nome);
        List<FuncionariosRespostaDTO> listaFuncionarioDTO = new ArrayList<>();

        for(Funcionarios funcionarios : listaFuncionarios){
            FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);
            listaFuncionarioDTO.add(funcionariosRespostaDTO);
        }

        return listaFuncionarioDTO;

    }

    public FuncionariosRespostaDTO buscarPorId(Long id) {
        Funcionarios funcionarios = funcionarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Funcionario nao encontrado"));
        FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);

        return funcionariosRespostaDTO;
    }

    public void resetarSenha(Long id) {
        Funcionarios funcionarios = funcionarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado"));
        funcionarios.setSenha(funcionarios.getLogin());
        funcionarioRepository.save(funcionarios);
    }


    public void criarNovaSenha(Long id, String senha) {
        Funcionarios funcionarios = funcionarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Funcionario nao encontrado"));
        funcionarios.setSenha(senha);
    }
}
