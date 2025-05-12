const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const comercioSchema = new Schema({
    nomeComercio: { type: String, required: true },
    endereco: { type: String, required: true },
    responsavel: { type: String, required: true },
    telefone: { type: String, required: true },
    mercadorias: [
        {
            nome: { type: String, required: true },
            quantidade: { type: Number, required: true },
            valor: { type: Number, required: true }
        }
    ],
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true } // Referência ao ID do usuário
});

module.exports = mongoose.model('Comercio', comercioSchema);
