const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, informe seu nome'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor, informe seu email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Por favor, forneça um email válido']
  },
  senha: {
    type: String,
    required: [true, 'Por favor, informe uma senha'],
    minlength: [8, 'A senha deve ter pelo menos 8 caracteres'],
    select: false
  },
  avatar: {
    type: String,
    default: '/avatares/padrao.jpg'
  },
  nivel: {
    type: Number,
    default: 1
  },
  pontos: {
    type: Number,
    default: 0
  },
  moedas: {
    type: Number,
    default: 0
  },
  seguidores: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Usuario'
  }],
  seguindo: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Usuario'
  }],
  musicasFavoritas: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Musica'
  }],
  gravacoes: [{
    musica: {
      type: mongoose.Schema.ObjectId,
      ref: 'Musica'
    },
    arquivo: String,
    curtidas: Number,
    comentarios: [{
      usuario: {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuario'
      },
      texto: String,
      data: Date
    }],
    data: {
      type: Date,
      default: Date.now
    }
  }],
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

// Criptografar senha antes de salvar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  
  this.senha = await bcrypt.hash(this.senha, 12);
  next();
});

// Método para verificar senha
usuarioSchema.methods.verificarSenha = async function(senhaInformada, senhaArmazenada) {
  return await bcrypt.compare(senhaInformada, senhaArmazenada);
};

// Método para calcular nível baseado em pontos
usuarioSchema.methods.calcularNivel = function() {
  this.nivel = Math.floor(Math.log10(this.pontos + 1) + 1);
  return this.nivel;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
