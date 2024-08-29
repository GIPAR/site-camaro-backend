const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "firstdb"
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.post('/signup', (req, res) => {
    const { name, id, password } = req.body;
    const userSql = 'INSERT INTO usuario (id_usuario, nome, senha) VALUES (?, ?, ?)';
    const userValues = [id, name, password];

    db.query(userSql, userValues, (err, result) => {
        if (err) {
            console.error('Erro ao criar usuário:', err.message);
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'Usuário criado com sucesso' });
    });
});

app.post('/login', (req, res) => {
    const { id, password } = req.body;
    const loginSql = 'SELECT * FROM usuario WHERE id_usuario = ? AND senha = ?';
    db.query(loginSql, [id, password], (err, result) => {
        if (err) {
            console.error('Erro ao autenticar usuário:', err.message);
            return res.status(500).json({ message: err.message });
        }

        if (result.length > 0) {
            res.status(200).json({ message: 'Login bem-sucedido', user: result[0] });
        } else {
            res.status(401).json({ message: 'ID ou senha incorretos' });
        }
    });
});

app.post('/pedido', (req, res) => {
    const { id_usuario, nome_loja, telefone_loja, categoria_loja, endereco_entrega, produtos } = req.body;
    console.log('Recebido pedido:', req.body);

    const verificarLojaSql = 'SELECT id_loja FROM loja WHERE nome = ? AND telefone = ? AND categoria = ?';
    const verificarLojaValues = [nome_loja, telefone_loja, categoria_loja];

    db.query(verificarLojaSql, verificarLojaValues, (err, results) => {
        if (err) {
            console.error('Erro ao verificar loja:', err.message);
            return res.status(500).json({ message: err.message });
        }

        let idLojaGerado;
        if (results.length > 0) {
            // Loja já existe, use o ID existente
            idLojaGerado = results[0].id_loja;
            inserirPedido(id_usuario, idLojaGerado, endereco_entrega, produtos, res);
        } else {
            // Inserir nova loja
            const lojaSql = 'INSERT INTO loja (nome, telefone, categoria) VALUES (?, ?, ?)';
            const lojaValues = [nome_loja, telefone_loja, categoria_loja];

            db.query(lojaSql, lojaValues, (err, result) => {
                if (err) {
                    console.error('Erro ao inserir loja:', err.message);
                    return res.status(500).json({ message: err.message });
                }
                idLojaGerado = result.insertId;
                inserirPedido(id_usuario, idLojaGerado, endereco_entrega, produtos, res);
            });
        }
    });
});

function inserirPedido(id_usuario, id_loja, endereco_entrega, produtos, res) {
    const pedidoSql = 'INSERT INTO pedido (id_usuario, id_loja, data_hora, status, endereco_entrega) VALUES (?, ?, NOW(), ?, ?)';
    const pedidoValues = [id_usuario, id_loja, 'Pendente', endereco_entrega];

    db.query(pedidoSql, pedidoValues, (err, result) => {
        if (err) {
            console.error('Erro ao inserir pedido:', err.message);
            return res.status(500).json({ message: err.message });
        }

        const pedidoId = result.insertId;
        console.log('Pedido inserido com ID:', pedidoId);

        const inserirProdutosEItens = produtos.map(produto => {
            return new Promise((resolve, reject) => {
                const verificarProdutoSql = 'SELECT id_produto FROM produtos WHERE nome = ? AND id_loja = ?';
                db.query(verificarProdutoSql, [produto.nome, id_loja], (err, results) => {
                    if (err) {
                        return reject(err);
                    }

                    let idProdutoGerado;
                    if (results.length > 0) {
                        // Produto já existe, use o ID existente
                        idProdutoGerado = results[0].id_produto;
                        resolve([pedidoId, idProdutoGerado, produto.quantidade]);
                    } else {
                        // Inserir novo produto
                        const produtoSql = 'INSERT INTO produtos (nome, id_loja) VALUES (?, ?)';
                        db.query(produtoSql, [produto.nome, id_loja], (err, result) => {
                            if (err) {
                                return reject(err);
                            }
                            idProdutoGerado = result.insertId;
                            resolve([pedidoId, idProdutoGerado, produto.quantidade]);
                        });
                    }
                });
            });
        });

        Promise.all(inserirProdutosEItens)
            .then(itemPedidoValues => {
                const itemPedidoSql = 'INSERT INTO item_pedido (id_pedido, id_produto, quantidade) VALUES ?';
                db.query(itemPedidoSql, [itemPedidoValues], (err, result) => {
                    if (err) {
                        console.error('Erro ao inserir itens do pedido:', err.message);
                        return res.status(500).json({ message: err.message });
                    }

                    res.status(201).json({ pedidoId, message: 'Pedido e itens do pedido adicionados com sucesso' });
                });
            })
            .catch(err => {
                console.error('Erro ao inserir produtos e itens do pedido:', err.message);
                res.status(500).json({ message: err.message });
            });
    });
}

app.get('/pedido/:id', (req, res) => {
    const pedidoId = req.params.id;
    const pedidoSql = `
        SELECT p.id_pedido, p.data_hora, p.status, p.endereco_entrega, 
               u.nome AS nome_usuario, l.nome AS nome_loja, 
               GROUP_CONCAT(i.nome SEPARATOR ', ') AS produtos
        FROM pedido p
        JOIN usuario u ON p.id_usuario = u.id_usuario
        JOIN loja l ON p.id_loja = l.id_loja
        JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
        JOIN produtos i ON ip.id_produto = i.id_produto
        WHERE p.id_pedido = ?
        GROUP BY p.id_pedido;
    `;

    db.query(pedidoSql, [pedidoId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        res.status(200).json(result[0]);
    });
});

app.get('/lojas', (req, res) => {
    const sql = 'SELECT id_loja, nome, telefone, categoria FROM loja';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar lojas:', err.message);
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json(results);
    });
});

app.listen(3001, () => {
    console.log('Server running on port 3001');
});
