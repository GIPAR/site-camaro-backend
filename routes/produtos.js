const express = require('express');
const router = express.Router();
const mysql = require("../mysql").pool;

// RETORNA TODOS OS PRODUTOS
router.get('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error})}
        conn.query(
            'SELECT * FROM produto;', 
            (error, result, fields) => {
                if (error) {return res.status(500).send({ error: error})}
                const response = {
                    quantidade: result.length,
                    produtos: result.map(prod => {
                        return {
                            id_produto: prod.id,
                            nome: prod.nome,
                            descricao: prod.descricao,
                            request: {
                                tipo: 'GET',
                                description: 'Retorna todos os produtos',
                                url: 'http://localhost:3000/produtos/' + prod.id
                            }
                        }
                    })
                }
                return res.status(200).send(response);
            }
        )
    });
});

// INSERE UM PRODUTO
router.post('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }); }
        conn.query(
            'INSERT INTO PRODUTO (nome, descricao) VALUES (?, ?)',
            [req.body.nome, req.body.descricao],
            (error, result, field) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error, response: null}) }
                const response = {
                    mensagem: "produto inserido com sucesso",
                    produtoCriado: {
                        id_produto: result.id_produto,
                        nome: req.body.nome,
                        descricao: req.body.descricao,
                        request: {
                            tipo: 'GET',
                            description: 'Insere um produto',
                            url: 'http://localhost:3000/produtos'
                        }
                    }
                }   
                res.status(201).send(response);
            }
        );
    });
});

// RETORNA OS DADOS DE UM PRODUTO ESPECÍFICO
router.get('/:id_produto', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error})}
        conn.query(
            'SELECT * FROM produto WHERE id = ?;', 
            [req.params.id_produto],
            (error, result, fields) => {
                if (error) {return res.status(500).send({ error: error})}

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado produto com este ID'
                    })
                }
                const response = {
                    produtoCriado: {
                        id_produto: result[0].id,
                        nome: result[0].nome,
                        descricao: result[0].descricao,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna os detalhes de um produto específico',
                            url: 'http://localhost:3000/produtos/' +  result[0].id
                        }
                    }
                }
                return res.status(200).send(response);
            }
        )
    });
});

// ALTERA UM PRODUTO
router.patch('/', (req, res, next) => {
    mysql.getConnection((error, conn) => { // <-- Fechamento correto do parêntese
        if (error) { return res.status(500).send({ error: error }); }
        conn.query(
            `UPDATE PRODUTO 
                SET nome        = ?,
                    descricao   = ? 
             WHERE  id  = ?`,
            [
                req.body.nome, 
                req.body.descricao,
                req.body.id_produto
            ],
            (error, result, field) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error, response: null }) }
                const response = {
                    mensagem: 'Produto atualizado com sucesso',
                    produtoAtualizado: {
                        id_produto: result.id,
                        nome: req.body.nome,
                        descricao: req.body.descricao,
                        request: {
                            tipo: 'PATCH',
                            description: '',
                            url: 'http://localhost:3000/produtos/' + req.body.id_produto
                        }
                    }
                }
                res.status(202).send(response);
            }
        );
    });
});

// EXCLUIR UM PRODUTO
router.delete('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }); }
        conn.query(
            `DELETE FROM produto WHERE id = ?`,
            [ req.body.id_produto ],
            (error, result, field) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error, response: null }) }
                const response = {
                    mensagem: 'Produto removido com sucesso',
                    request: {
                        tipo: 'DELETE',
                        descricao: 'Exclusão de produto',
                        url: 'http://localhost:3000/produtos',

                    }
                }
                res.status(202).send(response);
            }
        );
    });
})


module.exports = router;