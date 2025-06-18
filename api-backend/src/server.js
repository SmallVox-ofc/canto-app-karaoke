const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const rotasUsuario = require('./rotas/usuario.rotas');
const rotasMusica = require('./rotas/musica.rotas');
const rotasPresente = require('./rotas/presente.rotas');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/app-canto', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch((erro) => {
  console.error('Erro ao conectar ao MongoDB:', erro);
});

// Rotas
app.use('/api/usuarios', rotasUsuario);
app.use('/api/musicas', rotasMusica);
app.use('/api/presentes', rotasPresente);

// Tratamento de Erros
app.use((erro, req, res, next) => {
  console.error(erro.stack);
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor',
    erro: process.env.NODE_ENV === 'development' ? erro.message : undefined
  });
});

// Iniciar Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
