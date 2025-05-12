const express = require('express');
const session = require('express-session'); // Importa a biblioteca de sessões
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Conectando ao MongoDB
mongoose.connect('mongodb://localhost:27017/', {})
    .then(() => {
        console.log('Conectado ao MongoDB');
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

// Definindo o schema do usuário
const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    estoque: { type: Array, default: [] },
});

// Definindo o modelo do usuário
const Usuario = mongoose.model('Usuario', userSchema);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Configurando EJS como mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // O diretório onde você armazenará suas views

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da sessão
app.use(session({
    secret: '564906', // Troque por uma chave secreta única
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Rota para a página de login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Rota para processar o formulário de login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body; // Certifique-se de que 'senha' seja capturada corretamente

    if (!email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    try {
        const user = await Usuario.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Comparar a senha inserida com a senha armazenada
        const isMatch = await bcrypt.compare(senha, user.senha);
        if (!isMatch) {
            return res.status(400).json({ error: 'Senha incorreta' });
        }

        // Login bem-sucedido
                req.session.userId = user._id;
                req.session.userName = user.nome;
                req.session.userEmail = user.email;

                // Redirecionar para a dashboard após login bem-sucedido
                res.redirect('/dashboard');
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro no servidor' });
            }
        });


// Rota para a página de registro
app.get('/registrar', (req, res) => {
    res.sendFile(__dirname + '/public/registrar.html');
});

// Rota para registrar um novo usuário
app.post('/registrar', async (req, res) => {
    const { nome, email, senha } = req.body; // Corrigir para 'senha', já que o campo correto é 'senha'

    if (!nome || !email || !senha) {
        return res.status(400).send('Preencha todos os campos.');
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds); // Corrigir para 'senha'

        const novoUsuario = new Usuario({
            nome,
            email,
            senha: hashedPassword, // Usando a senha criptografada
        });

        await novoUsuario.save(); // Salvando o novo usuário no MongoDB

        console.log('Usuário registrado:', novoUsuario); // Log do usuário registrado

        res.redirect('/login'); // Redireciona para a página de login após o registro
    } catch (err) {
        return res.status(500).send('Erro ao registrar o usuário: ' + err.message);
    }
});


// Rota para a dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    const userName = req.session.userName;
    const userEmail = req.session.userEmail;
    res.render('dashboard', { userName, userEmail });
});

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao fazer logout.');
        }
        res.redirect('/login'); // Redireciona para a página de login após o logout
    });
});

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Usuário autenticado, continua para a rota
    } else {
        res.redirect('/login'); // Redireciona para a página de login
    }
}





const Comercio = require('./models/comercio'); // Importe o modelo de Comércio


// Rota para exibir a página de registrar comércio
app.get('/registrar-comercio', isAuthenticated, async (req, res) => {
    try {
        // Encontrando o usuário pelo ID da sessão
        const usuario = await Usuario.findById(req.session.userId).populate('estoque');

        // Verificando se o usuário possui estoque
        const estoque = usuario && usuario.estoque ? usuario.estoque : [];

        // Renderizando a página com o estoque do usuário
        res.render('registrar-comercio', {
            userName: req.session.userName,
            userEmail: req.session.userEmail,
            estoque: estoque // Passando o estoque para a view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar registro de comércio');
    }
});


// Rota para registrar um comércio
app.post('/registrar-comercio', isAuthenticated, async (req, res) => {
    const { nomeComercio, endereco, responsavel, telefone, mercadoriaNome, mercadoriaQuantidade, mercadoriaValor } = req.body;

    const mercadorias = mercadoriaNome.map((nome, index) => ({
        nome,
        quantidade: Number(mercadoriaQuantidade[index]),
        valor: parseFloat(mercadoriaValor[index]) // Garantindo que seja um número
    }));

    try {
        // Criar e salvar novo comércio
        const novoComercio = new Comercio({
            nomeComercio,
            endereco,
            responsavel,
            telefone,
            mercadorias,
            usuarioId: req.session.userId
        });
        await novoComercio.save();

        // Atualizar o estoque do usuário
        const usuario = await Usuario.findById(req.session.userId);

        // Log para verificar o estoque antes da atualização
        console.log('Estoque antes da atualização:', usuario.estoque);

        // Atualiza as quantidades do estoque
        mercadorias.forEach(mercadoria => {
            const itemEstoque = usuario.estoque.find(e => e.nome === mercadoria.nome);
            if (itemEstoque) {
                // Converte a quantidade para número
                const quantidadeAtual = Number(itemEstoque.quantidade);
                const quantidadeRequerida = mercadoria.quantidade;

                // Verifica se a quantidade disponível é suficiente
                if (quantidadeAtual >= quantidadeRequerida) {
                    itemEstoque.quantidade = quantidadeAtual - quantidadeRequerida;
                    console.log(`Atualizando estoque: ${itemEstoque.nome} nova quantidade = ${itemEstoque.quantidade}`);
                } else {
                    console.log(`Quantidade insuficiente para ${itemEstoque.nome}. Disponível: ${quantidadeAtual}, Requerido: ${quantidadeRequerida}`);
                }
            } else {
                console.log(`Mercadoria ${mercadoria.nome} não encontrada no estoque.`);
            }
        });

        // Marca o campo "estoque" como modificado
        usuario.markModified('estoque');

        // Verifique se o estoque foi atualizado antes de salvar
        console.log('Estoque antes do save:', usuario.estoque);

        // Salva as alterações no MongoDB
        const usuarioAtualizado = await usuario.save();
        console.log('Usuário após save:', usuarioAtualizado);

        // Log para verificar o estoque após a atualização
        console.log('Estoque após atualização:', usuario.estoque);

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erro ao registrar o comércio:', error);
        res.status(500).send('Erro ao registrar o comércio');
    }
});




// Rota para consultar os comércios do usuário logado
app.get('/consultar-comercios', isAuthenticated, async (req, res) => {
    try {
        // Busca todos os comércios cadastrados pelo usuário logado
        const comercios = await Comercio.find({ usuarioId: req.session.userId });

        // Renderiza a página com os dados dos comércios encontrados
        res.render('consultar-comercios', { comercios });
    } catch (error) {
        console.error('Erro ao consultar os comércios:', error);
        res.status(500).send('Erro ao consultar os comércios');
    }
});


app.get('/meu-estoque', isAuthenticated, async (req, res) => {
    const usuario = await Usuario.findById(req.session.userId);
    res.render('meu-estoque', { estoque: usuario.estoque });
});


app.get('/acesso-master', async (req, res) => {
    try {
        const usuarios = await Usuario.find(); // Busca todos os usuários cadastrados
        res.render('acesso-master', { usuarios }); // Passa a lista de usuários para o EJS
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar usuários');
    }
});


app.post('/adicionar-mercadoria', async (req, res) => {
    try {
        const { usuarioId, nomeMercadoria, quantidade, valor } = req.body;

        // Encontre o usuário
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Verifique se os campos são arrays (para múltiplas mercadorias)
        if (Array.isArray(nomeMercadoria) && Array.isArray(quantidade) && Array.isArray(valor)) {
            // Adicione cada mercadoria ao estoque do usuário
            nomeMercadoria.forEach((nome, index) => {
                usuario.estoque.push({
                    nome: nome,
                    quantidade: Number(quantidade[index]),
                    valor: parseFloat(valor[index])
                });
            });
        } else {
            // Se houver apenas uma mercadoria, adicione-a diretamente
            usuario.estoque.push({
                nome: nomeMercadoria,
                quantidade: Number(quantidade),
                valor: parseFloat(valor)
            });
        }

        await usuario.save(); // Salva as alterações no banco de dados

        res.redirect('/pagina-estoque-sucesso'); // Redireciona para uma página de sucesso
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao adicionar mercadoria');
    }
});


// Rota para exibir o estoque atual do usuário
app.get('/meu-estoque-atual', isAuthenticated, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.session.userId).populate('estoque');
        const estoque = usuario && usuario.estoque ? usuario.estoque : [];

        // Log para verificar os itens do estoque
        console.log("Estoque:", estoque);

        res.render('meu-estoque-atual', {
            userName: req.session.userName,
            estoque: estoque
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar estoque atual');
    }
});


app.get('/pagina-estoque-sucesso', (req, res) => {
    res.render('pagina-estoque-sucesso'); // Renderiza a página de sucesso
});



// Editar Comércio
app.post('/editar-comercio', async (req, res) => {
    const { comercioId, nome, endereco, responsavel, telefone } = req.body;
    try {
        await Comercio.findByIdAndUpdate(comercioId, { nomeComercio: nome, endereco, responsavel, telefone });
        res.send('Comércio atualizado com sucesso!');
    } catch (error) {
        res.status(500).send('Erro ao atualizar comércio.');
    }
});


app.get('/estoque-usuario', async (req, res) => {
    const comercioId = req.query.comercioId;
    try {
    const usuario = await Usuario.findById(req.session.userId);
        if (usuario && usuario.estoque) {
            res.json(usuario.estoque);
        } else {
            res.status(404).json({ error: 'Estoque não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        res.status(500).json({ error: 'Erro ao buscar estoque' });
    }
});


// Rota para excluir mercadoria
// Rota para excluir mercadoria
app.post('/excluir-mercadoria', async (req, res) => {
    const { mercadoriaId, comercioId } = req.body;

    try {
        // Encontre o comércio pelo ID
        const comercio = await Comercio.findById(comercioId);

        // Verifique se o comércio foi encontrado
        if (!comercio) {
            return res.status(404).json({ message: 'Comércio não encontrado' });
        }

        // Filtrar a mercadoria para remover
        comercio.mercadorias = comercio.mercadorias.filter(mercadoria => mercadoria.id !== mercadoriaId);

        // Salvar as alterações no banco de dados
        await comercio.save();

        return res.status(200).json({ message: 'Mercadoria excluída com sucesso!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir a mercadoria' });
    }
});


