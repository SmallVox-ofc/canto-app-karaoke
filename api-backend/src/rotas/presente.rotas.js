const express = require('express');
const Presente = require('../modelos/Presente');
const Usuario = require('../modelos/Usuario');
const auth = require('../middlewares/auth');

const router = express.Router();

// Listar presentes disponíveis
router.get('/', async (req, res) => {
  try {
    const presentes = await Presente.find({ disponivel: true })
      .select('nome descricao icone valor tipo pontosBonus');

    res.json({
      sucesso: true,
      presentes
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar presentes',
      erro: erro.message
    });
  }
});

// Enviar presente
router.post('/enviar', auth, async (req, res) => {
  try {
    const { presenteId, destinatarioId } = req.body;

    // Verificar se presente existe
    const presente = await Presente.findById(presenteId);
    if (!presente || !presente.disponivel) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Presente não encontrado ou indisponível'
      });
    }

    // Verificar se destinatário existe
    const destinatario = await Usuario.findById(destinatarioId);
    if (!destinatario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Destinatário não encontrado'
      });
    }

    // Verificar se usuário tem moedas suficientes
    const remetente = await Usuario.findById(req.usuario.id);
    if (remetente.moedas < presente.valor) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Saldo insuficiente de moedas'
      });
    }

    // Processar transação
    remetente.moedas -= presente.valor;
    destinatario.moedas += Math.floor(presente.valor * 0.7); // 70% do valor vai para o destinatário
    destinatario.pontos += presente.pontosBonus;
    
    // Atualizar nível do destinatário
    destinatario.calcularNivel();

    // Registrar no histórico do presente
    presente.historico.push({
      remetente: req.usuario.id,
      destinatario: destinatarioId
    });

    // Salvar alterações
    await Promise.all([
      remetente.save(),
      destinatario.save(),
      presente.save()
    ]);

    res.json({
      sucesso: true,
      mensagem: 'Presente enviado com sucesso',
      saldoAtual: remetente.moedas,
      destinatario: {
        nome: destinatario.nome,
        novoNivel: destinatario.nivel,
        pontosGanhos: presente.pontosBonus
      }
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao enviar presente',
      erro: erro.message
    });
  }
});

// Histórico de presentes recebidos
router.get('/recebidos', auth, async (req, res) => {
  try {
    const presentes = await Presente.find({
      'historico.destinatario': req.usuario.id
    })
    .populate('historico.remetente', 'nome avatar')
    .select('nome icone valor tipo historico');

    const historico = presentes.flatMap(presente => 
      presente.historico
        .filter(h => h.destinatario.toString() === req.usuario.id)
        .map(h => ({
          presente: {
            nome: presente.nome,
            icone: presente.icone,
            valor: presente.valor,
            tipo: presente.tipo
          },
          remetente: h.remetente,
          data: h.data
        }))
    ).sort((a, b) => b.data - a.data);

    res.json({
      sucesso: true,
      historico
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar histórico de presentes',
      erro: erro.message
    });
  }
});

// Histórico de presentes enviados
router.get('/enviados', auth, async (req, res) => {
  try {
    const presentes = await Presente.find({
      'historico.remetente': req.usuario.id
    })
    .populate('historico.destinatario', 'nome avatar')
    .select('nome icone valor tipo historico');

    const historico = presentes.flatMap(presente => 
      presente.historico
        .filter(h => h.remetente.toString() === req.usuario.id)
        .map(h => ({
          presente: {
            nome: presente.nome,
            icone: presente.icone,
            valor: presente.valor,
            tipo: presente.tipo
          },
          destinatario: h.destinatario,
          data: h.data
        }))
    ).sort((a, b) => b.data - a.data);

    res.json({
      sucesso: true,
      historico
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao buscar histórico de presentes',
      erro: erro.message
    });
  }
});

// Adicionar moedas (compra)
router.post('/comprar-moedas', auth, async (req, res) => {
  try {
    const { quantidade } = req.body;
    
    if (!quantidade || quantidade < 1) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Quantidade inválida de moedas'
      });
    }

    const usuario = await Usuario.findById(req.usuario.id);
    usuario.moedas += quantidade;
    await usuario.save();

    res.json({
      sucesso: true,
      mensagem: 'Moedas adicionadas com sucesso',
      saldoAtual: usuario.moedas
    });
  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao processar compra de moedas',
      erro: erro.message
    });
  }
});

module.exports = router;
