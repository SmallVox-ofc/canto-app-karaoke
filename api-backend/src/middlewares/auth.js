const jwt = require('jsonwebtoken');
const Usuario = require('../modelos/Usuario');

const auth = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Autenticação necessária'
      });
    }

    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo-padrao');
    
    // Buscar usuário
    const usuario = await Usuario.findOne({
      _id: decoded.id
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Adicionar usuário ao objeto da requisição
    req.token = token;
    req.usuario = usuario;
    
    next();
  } catch (erro) {
    res.status(401).json({
      sucesso: false,
      mensagem: 'Por favor, faça login novamente',
      erro: erro.message
    });
  }
};

module.exports = auth;
