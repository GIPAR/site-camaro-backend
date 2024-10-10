const express = require('express');
const router = express.Router();
const mysql = require("../mysql").pool;

// RETORNA TODOS OS PRODUTOS
router.get('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error})}
        conn.query(
            'SELECT * FROM produto;', 
            (error, resultado, fields) => {
                if (error) {return res.status(500).send({ error: error})}
                return res.status(200).send({response: resultado});
            }
        )
    });
});

// INSERE UM PRODUTO
router.post('/', (req, res, next) => {

    const produto = {
        nome: req.body.nome,
        preco: req.body.preco,
    };

    mysql.getConnection((error, conn) => { // <-- Fechamento correto do parêntese
        if (error) { return res.status(500).send({ error: error }); }
        conn.query(
            'INSERT INTO PRODUTO (nome, descricao) VALUES (?, ?)',
            [req.body.nome, req.body.descricao],
            (error, resultado, field) => {
                conn.release();
                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null
                    });
                }
                res.status(201).send({
                    mensagem: 'Produto inserido com sucesso',
                    id_produto: resultado.insertId
                });
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
            (error, resultado, fields) => {
                if (error) {return res.status(500).send({ error: error})}
                return res.status(200).send({response: resultado});
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
            (error, resultado, field) => {
                conn.release();
                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null
                    });
                }
                res.status(202).send({
                    mensagem: 'Produto editado com sucesso',
                    id_produto: resultado.insertId
                });
            }
        );
    });
});

// EXCLUIR UM PRODUTO
router.delete('/', (req, res, next) => {
    mysql.getConnection((error, conn) => { // <-- Fechamento correto do parêntese
        if (error) { return res.status(500).send({ error: error }); }
        conn.query(
            `DELETE FROM produto WHERE id = ?`,
            [ req.body.id_produto ],
            (error, resultado, field) => {
                conn.release();
                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null
                    });
                }
                res.status(202).send({
                    mensagem: 'Produto removido com sucesso',
                    id_produto: resultado.insertId
                });
            }
        );
    });
})


module.exports = router;