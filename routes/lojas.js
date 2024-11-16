const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;

// RETORNA TODAS AS LOJAS
router.get("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query("SELECT * FROM loja;", (error, result, fields) => {
      if (error) {
        return res.status(500).send({ error: error });
      }
      const response = {
        quantidade: result.length,
        lojas: result.map((loja) => {
          return {
            id: loja.id,
            nome: loja.nome,
            telefone: loja.telefone,
            categoria: loja.categoria,
            posicao_x: loja.posicao_x,
            posicao_y: loja.posicao_y,
            request: {
              tipo: "GET",
              description: "Retorna todas as lojas",
              url: "http://localhost:3001/lojas/" + loja.id,
            },
          };
        }),
      };
      return res.status(200).send(response);
    });
  });
});

// INSERE UMA LOJA
router.post("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "INSERT INTO loja (nome, telefone, categoria, posicao_x, posicao_y) VALUES (?, ?, ?, ?, ?)",
      [
        req.body.nome,
        req.body.telefone,
        req.body.categoria,
        req.body.posicao_x,
        req.body.posicao_y,
      ],
      (error, result, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: error, response: null });
        }
        const response = {
          mensagem: "loja inserida com sucesso",
          lojaCriada: {
            id: result.insertId,
            nome: req.body.nome,
            telefone: req.body.telefone,
            categoria: req.body.categoria,
            posicao_x: req.body.posicao_x,
            posicao_y: req.body.posicao_y,
            request: {
              tipo: "GET",
              description: "Insere uma loja",
              url: "http://localhost:3001/lojas",
            },
          },
        };
        res.status(201).send(response);
      }
    );
  });
});

// RETORNA OS DADOS DE UMA LOJA ESPECÍFICA
router.get("/:id_loja", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "SELECT * FROM loja WHERE id = ?;",
      [req.params.id_loja],
      (error, result, fields) => {
        if (error) {
          return res.status(500).send({ error: error });
        }

        if (result.length == 0) {
          return res.status(404).send({
            mensagem: "Não foi encontrado loja com este ID",
          });
        }
        const response = {
          loja: {
            id: result[0].id,
            nome: result[0].nome,
            telefone: result[0].telefone,
            categoria: result[0].categoria,
            posicao_x: result[0].posicao_x,
            posicao_y: result[0].posicao_y,
            request: {
              tipo: "GET",
              descricao: "Retorna os detalhes de uma loja específica",
              url: "http://localhost:3001/lojas/" + result[0].id,
            },
          },
        };
        return res.status(200).send(response);
      }
    );
  });
});

// ALTERA UMA LOJA
router.patch("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      `UPDATE loja 
                SET nome        = ?,
                    telefone    = ?,
                    categoria   = ?,
                    posicao_x   = ?,
                    posicao_y   = ?
             WHERE  id  = ?`,
      [
        req.body.nome,
        req.body.telefone,
        req.body.categoria,
        req.body.posicao_x,
        req.body.posicao_y,
        req.body.id,
      ],
      (error, result, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: error, response: null });
        }
        const response = {
          mensagem: "Loja atualizada com sucesso",
          lojaAtualizada: {
            id: result.id,
            nome: req.body.nome,
            telefone: req.body.telefone,
            categoria: req.body.categoria,
            posicao_x: req.body.posicao_x,
            posicao_y: req.body.posicao_y,
            request: {
              tipo: "PATCH",
              description: "Atualiza uma loja",
              url: "http://localhost:3001/lojas/" + req.body.id_loja,
            },
          },
        };
        res.status(202).send(response);
      }
    );
  });
});

// EXCLUIR UMA LOJA
router.delete("/", (req, res, next) => {

  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "DELETE FROM loja WHERE id = ?",
      [req.body.id_loja],
      (error, result, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: error, response: null });
        }
        const response = {
          mensagem: "Loja excluída com sucesso"
        };
        res.status(202).send(response);
      }
    );
  });
});

module.exports = router;
