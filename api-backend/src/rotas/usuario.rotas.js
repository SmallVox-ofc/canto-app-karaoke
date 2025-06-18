const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../modelos/Usuario');
const auth = require('../middlewares/auth');

const router = express.Router();

// Função auxiliar para gerar token JWT
const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'segredo-padrao', {
    expiresIn: '30d'
  });
};

// Cadastro de usuário
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se usuário já existe
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Este email já está cadastrado'
      });
    }

    // Criar novo usuário
    const usuario = await Usuario.create({
      nome,
      email,
      senha
    });

    // Gerar token
    const token = gerarToken(usuario._id);

    res.status(201).json({
      sucesso: true,
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        avatar: usuario.avatar,
        nivel: usuario.nivel,
        pontos: usuario.pontos,
        moedas: usuario.moedas
      }
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao cadastrar usuário',
      erro: erro.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verificar se usuário existe
    const usuario = await Usuario.findOne({ email }).select('+senha');
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const senhaCorreta = await usuario.verificarSenha(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = gerarToken(usuario._id);

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        avatar: usuario.avatar,
        nivel: usuario.nivel,
        pontos: usuario.pontos,
        moedas: usuario.moedas
      }
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao fazer login',
      erro: erro.message
    });
  }
});

// Obter perfil do usuário
router.get('/perfil', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .select('-senha')
      .populate('seguidores', 'nome avatar')
      .populate('seguindo', 'nome avatar')
      .populate('musicasFavoritas');

    res.json({
      sucesso: true,
      usuario
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar perfil',
      erro: erro.message
    });
  }
});

// Atualizar perfil
router.put('/perfil', auth, async (req, res) => {
  try {
    const atualizacoes = {
      nome: req.body.nome,
      avatar: req.body.avatar
    };

    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      atualizacoes,
      { new: true, runValidators: true }
    ).select('-senha');

    res.json({
      sucesso: true,
      usuario
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar perfil',
      erro: erro.message
    });
  }
});

// Seguir/Deixar de seguir usuário
router.post('/seguir/:id', auth, async (req, res) => {
  try {
    const usuarioAlvo = await Usuario.findById(req.params.id);
    const usuarioAtual = await Usuario.findById(req.usuario.id);

    if (!usuarioAlvo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    const jaSeguindo = usuarioAtual.seguindo.includes(req.params.id);

    if (jaSeguindo) {
      // Deixar de seguir
      usuarioAtual.seguindo = usuarioAtual.seguindo.filter(
        id => id.toString() !== req.params.id
      );
      usuarioAlvo.seguidores = usuarioAlvo.seguidores.filter(
        id => id.toString() !== req.usuario.id
      );
    } else {
      // Seguir
      usuarioAtual.seguindo.push(req.params.id);
      usuarioAlvo.seguidores.push(req.usuario.id);
    }

    await usuarioAtual.save();
    await usuarioAlvo.save();

    res.json({
      sucesso: true,
      seguindo: !jaSeguindo
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar seguidores',
      erro: erro.message
    });
  }
});

// Listar usuários online
router.get('/online', async (req, res) => {
  try {
    // Aqui você implementaria a lógica para buscar usuários online
    // Por exemplo, usando timestamp da última atividade
    const usuarios = await Usuario.find()
      .select('nome avatar nivel pontos')
      .limit(20);

    res.json({
      sucesso: true,
      usuarios
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar usuários online',
      erro: erro.message
    });
  }
});

module.exports = router;
