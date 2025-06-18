const mongoose = require('mongoose');

const presenteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, informe o nome do presente'],
    trim: true
  },
  descricao: {
    type: String,
    required: [true, 'Por favor, forneça uma descrição']
  },
  icone: {
    type: String,
    required: [true, 'Por favor, forneça um ícone para o presente']
  },
  valor: {
    type: Number,
    required: [true, 'Por favor, informe o valor em moedas'],
    min: [1, 'O valor mínimo é 1 moeda']
  },
  tipo: {
    type: String,
    required: true,
    enum: ['basico', 'especial', 'raro', 'lendario'],
    default: 'basico'
  },
  pontosBonus: {
    type: Number,
    default: 0
  },
  disponivel: {
    type: Boolean,
    default: true
  },
  historico: [{
    remetente: {
      type: mongoose.Schema.ObjectId,
      ref: 'Usuario',
      required: true
    },
    destinatario: {
      type: mongoose.Schema.ObjectId,
      ref: 'Usuario',
      required: true
    },
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

// Método para calcular pontos bônus baseado no tipo
presenteSchema.pre('save', function(next) {
  if (this.isModified('tipo') || this.isNew) {
    switch (this.tipo) {
      case 'basico':
        this.pontosBonus = 10;
        break;
      case 'especial':
        this.pontosBonus = 50;
        break;
      case 'raro':
        this.pontosBonus = 200;
        break;
      case 'lendario':
        this.pontosBonus = 1000;
        break;
      default:
        this.pontosBonus = 0;
    }
  }
  next();
});

const Presente = mongoose.model('Presente', presenteSchema);

module.exports = Presente;
