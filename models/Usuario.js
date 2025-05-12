const mongoose = require('mongoose');

// Definindo o schema do estoque
const estoqueSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true // Certifique-se de que o nome da mercadoria é obrigatório
    },
    quantidade: {
        type: Number,
        required: true, // Certifique-se de que a quantidade é obrigatória
        default: 0 // Um valor padrão de 0 para evitar problemas
    },
    valor: {
        type: Number,
        required: true // Certifique-se de que o valor é obrigatório
    }
});

// Definindo o schema do usuário
const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true // Torne o nome obrigatório
    },
    email: {
        type: String,
        required: true, // Torne o email obrigatório
        unique: true // Impede emails duplicados
    },
    senha: {
        type: String,
        required: true // Torne a senha obrigatória
    },
    estoque: [estoqueSchema] // Usando o esquema de estoque
});

// Criando o modelo
const Usuario = mongoose.model('Usuario', usuarioSchema); // Corrigido para usuarioSchema

// Exportando o modelo para uso em outros arquivos
module.exports = Usuario;
