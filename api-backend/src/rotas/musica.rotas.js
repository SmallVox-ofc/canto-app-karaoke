const express = require('express');
const Musica = require('../modelos/Musica');
const Usuario = require('../modelos/Usuario');
const auth = require('../middlewares/auth');

const router = express.Router();

// Listar músicas (com filtros e paginação)
router.get('/', async (req, res) => {
  try {
    const { genero, busca, pagina = 1, limite = 20 } = req.query;
    const filtro = {};

    // Aplicar filtros
    if (genero) filtro.genero = genero;
    if (busca) {
      filtro.$or = [
        { titulo: { $regex: busca, $options: 'i' } },
        { artista: { $regex: busca, $options: 'i' } }
      ];
    }

    const musicas = await Musica.find(filtro)
      .sort({ popularidade: -1 })
      .skip((pagina - 1) * limite)
      .limit(parseInt(limite))
      .select('titulo artista capa genero dificuldade popularidade');

    const total = await Musica.countDocuments(filtro);

    res.json({
      sucesso: true,
      musicas,
      paginacao: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar músicas',
      erro: erro.message
    });
  }
});

// Obter detalhes de uma música
router.get('/:id', async (req, res) => {
  try {
    const musica = await Musica.findById(req.params.id)
      .populate('interpretacoes.usuario', 'nome avatar')
      .populate('interpretacoes.curtidas', 'nome avatar')
      .populate('interpretacoes.comentarios.usuario', 'nome avatar');

    if (!musica) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Música não encontrada'
      });
    }

    res.json({
      sucesso: true,
      musica
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar música',
      erro: erro.message
    });
  }
});

// Adicionar interpretação
router.post('/:id/interpretar', auth, async (req, res) => {
  try {
    const { arquivo } = req.body;
    const musica = await Musica.findById(req.params.id);

    if (!musica) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Música não encontrada'
      });
    }

    // Adicionar nova interpretação
    musica.interpretacoes.push({
      usuario: req.usuario.id,
      arquivo
    });

    // Atualizar popularidade
    musica.atualizarPopularidade();
    await musica.save();

    // Adicionar pontos ao usuário
    const usuario = await Usuario.findById(req.usuario.id);
    usuario.pontos += 100; // Pontos base por interpretação
    usuario.calcularNivel();
    await usuario.save();

    res.json({
      sucesso: true,
      mensagem: 'Interpretação adicionada com sucesso',
      pontos: 100,
      novoNivel: usuario.nivel
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao adicionar interpretação',
      erro: erro.message
    });
  }
});

// Curtir/Descurtir interpretação
router.post('/:musicaId/interpretacoes/:interpId/curtir', auth, async (req, res) => {
  try {
    const musica = await Musica.findById(req.params.musicaId);
    if (!musica) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Música não encontrada'
      });
    }

    const interpretacao = musica.interpretacoes.id(req.params.interpId);
    if (!interpretacao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Interpretação não encontrada'
      });
    }

    const indexCurtida = interpretacao.curtidas.indexOf(req.usuario.id);
    
    if (indexCurtida === -1) {
      // Curtir
      interpretacao.curtidas.push(req.usuario.id);
      
      // Adicionar pontos ao criador da interpretação
      if (interpretacao.usuario.toString() !== req.usuario.id) {
        const usuarioCriador = await Usuario.findById(interpretacao.usuario);
        usuarioCriador.pontos += 10;
        usuarioCriador.calcularNivel();
        await usuarioCriador.save();
      }
    } else {
      // Descurtir
      interpretacao.curtidas.splice(indexCurtida, 1);
    }

    musica.atualizarPopularidade();
    await musica.save();

    res.json({
      sucesso: true,
      curtido: indexCurtida === -1
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao processar curtida',
      erro: erro.message
    });
  }
});

// Comentar em uma interpretação
router.post('/:musicaId/interpretacoes/:interpId/comentar', auth, async (req, res) => {
  try {
    const { texto } = req.body;
    const musica = await Musica.findById(req.params.musicaId);
    
    if (!musica) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Música não encontrada'
      });
    }

    const interpretacao = musica.interpretacoes.id(req.params.interpId);
    if (!interpretacao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Interpretação não encontrada'
      });
    }

    interpretacao.comentarios.push({
      usuario: req.usuario.id,
      texto
    });

    // Adicionar pontos ao criador da interpretação
    if (interpretacao.usuario.toString() !== req.usuario.id) {
      const usuarioCriador = await Usuario.findById(interpretacao.usuario);
      usuarioCriador.pontos += 5;
      usuarioCriador.calcularNivel();
      await usuarioCriador.save();
    }

    musica.atualizarPopularidade();
    await musica.save();

    res.json({
      sucesso: true,
      mensagem: 'Comentário adicionado com sucesso'
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao adicionar comentário',
      erro: erro.message
    });
  }
});

module.exports = router;
