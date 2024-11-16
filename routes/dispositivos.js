const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;

// RETORNA TODOS OS DISPOSITIVOS
router.get("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query("SELECT * FROM dispositivo;", (error, result, fields) => {
      if (error) {
        return res.status(500).send({ error: error });
      }
      const response = {
        quantidade: result.length,
        dispositivos: result.map((disp) => {
          return {
            id: disp.id,
            nome: disp.nome,
            IP: disp.IP,
            permissao_acesso: disp.permissao_acesso,
            tipo: disp.tipo,
            request: {
              tipo: "GET",
              descricao: "Retorna todos os dispositivos",
              url: "http://localhost:3001/dispositivos/" + disp.id,
            },
          };
        }),
      };
      return res.status(200).send(response);
    });
  });
});

// INSERE UM DISPOSITIVO
router.post("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "INSERT INTO dispositivo (nome, IP, permissao_acesso, tipo) VALUES (?, ?, ?, ?)",
      [req.body.nome, req.body.IP, req.body.permissao_acesso, req.body.tipo],
      (error, result, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: error, response: null });
        }
        const response = {
          mensagem: "Dispositivo inserido com sucesso",
          dispositivoCriado: {
            id_dispositivo: result.insertId,
            nome: req.body.nome,
            IP: req.body.IP,
            permissao_acesso: req.body.permissao_acesso,
            tipo: req.body.tipo,
            request: {
              tipo: "GET",
              descricao: "Visualizar o dispositivo criado",
              url: "http://localhost:3001/dispositivos/" + result.insertId,
            },
          },
        };
        res.status(201).send(response);
      }
    );
  });
});

// RETORNA OS DADOS DE UM DISPOSITIVO ESPECÍFICO
router.get("/:id_dispositivo", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "SELECT * FROM dispositivo WHERE id = ?;",
      [req.params.id_dispositivo],
      (error, result, fields) => {
        if (error) {
          return res.status(500).send({ error: error });
        }

        if (result.length == 0) {
          return res.status(404).send({
            mensagem: "Não foi encontrado dispositivo com este ID",
          });
        }
        const response = {
          dispositivo: {
            id_dispositivo: result[0].id,
            nome: result[0].nome,
            IP: result[0].IP,
            permissao_acesso: result[0].permissao_acesso,
            tipo: result[0].tipo,
            request: {
              tipo: "GET",
              descricao: "Detalhes do dispositivo",
              url: "http://localhost:3001/dispositivos/" + result[0].id,
            },
          },
        };
        return res.status(200).send(response);
      }
    );
  });
});

// ALTERA UM DISPOSITIVO
router.patch("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      `UPDATE dispositivo 
                SET nome = ?, 
                    IP = ?, 
                    permissao_acesso = ?, 
                    tipo = ? 
             WHERE id = ?`,
      [
        req.body.nome,
        req.body.IP,
        req.body.permissao_acesso,
        req.body.tipo,
        req.body.id_dispositivo,
      ],
      (error, result, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: error, response: null });
        }
        const response = {
          mensagem: "Dispositivo atualizado com sucesso",
          dispositivoAtualizado: {
            id_dispositivo: req.body.id_dispositivo,
            nome: req.body.nome,
            IP: req.body.IP,
            permissao_acesso: req.body.permissao_acesso,
            tipo: req.body.tipo,
            request: {
              tipo: "PATCH",
              descricao: "Detalhes do dispositivo atualizado",
              url:
                "http://localhost:3001/dispositivos/" + req.body.id_dispositivo,
            },
          },
        };
        res.status(202).send(response);
      }
    );
  });
});

// EXCLUI UM DISPOSITIVO
router.delete("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      `DELETE FROM dispositivo WHERE id = ?`,
      [req.body.id_dispositivo],
      (error, result, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: error, response: null });
        }
        const response = {
          mensagem: "Dispositivo removido com sucesso"
        };
        res.status(202).send(response);
      }
    );
  });
});

module.exports = router;
