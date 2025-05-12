const mongoose = require('mongoose');

const mercadoriaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    quantidade: {
        type: Number,
        required: true,
        min: 0
    },
    valor: {
        type: Number,
        required: true,
        min: 0
    },
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
});

const Mercadoria = mongoose.model('Mercadoria', mercadoriaSchema);

module.exports = Mercadoria;
