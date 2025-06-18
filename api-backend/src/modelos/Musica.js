const mongoose = require('mongoose');

const musicaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor, informe o título da música'],
    trim: true
  },
  artista: {
    type: String,
    required: [true, 'Por favor, informe o artista'],
    trim: true
  },
  letra: {
    type: String,
    required: [true, 'Por favor, forneça a letra da música']
  },
  duracao: {
    type: Number,
    required: [true, 'Por favor, informe a duração da música em segundos']
  },
  capa: {
    type: String,
    default: '/capas/padrao.jpg'
  },
  arquivo: {
    type: String,
    required: [true, 'Por favor, forneça o arquivo de áudio']
  },
  genero: {
    type: String,
    required: [true, 'Por favor, informe o gênero musical'],
    enum: ['Pop', 'Rock', 'Sertanejo', 'MPB', 'Funk', 'Rap', 'Outro']
  },
  dificuldade: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  popularidade: {
    type: Number,
    default: 0
  },
  interpretacoes: [{
    usuario: {
      type: mongoose.Schema.ObjectId,
      ref: 'Usuario',
      required: true
    },
    arquivo: {
      type: String,
      required: true
    },
    pontuacao: {
      type: Number,
      default: 0
    },
    curtidas: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Usuario'
    }],
    comentarios: [{
      usuario: {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuario'
      },
      texto: String,
      data: {
        type: Date,
        default: Date.now
      }
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

// Índices para melhorar performance das buscas
musicaSchema.index({ titulo: 'text', artista: 'text' });

// Método para calcular popularidade
musicaSchema.methods.atualizarPopularidade = function() {
  const totalInterpretacoes = this.interpretacoes.length;
  const totalCurtidas = this.interpretacoes.reduce((acc, interp) => 
    acc + interp.curtidas.length, 0);
  const totalComentarios = this.interpretacoes.reduce((acc, interp) => 
    acc + interp.comentarios.length, 0);

  this.popularidade = (totalInterpretacoes * 2) + totalCurtidas + totalComentarios;
  return this.popularidade;
};

const Musica = mongoose.model('Musica', musicaSchema);

module.exports = Musica;
