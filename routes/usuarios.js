const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/cadastro", (req, res, next) => {
  mysql.getConnection((err, conn) => {
    if (err) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "SELECT * FROM usuario WHERE email = ?",
      [req.body.email],
      (error, results) => {
        if (error) {
          return res.status(500).send({ error: error });
        }
        if (results.length > 0) {
          res.status(401).send({ mensagem: "Usuário já cadastrado " });
        } else {
          //! Erro aqui
          bcrypt.hash(req.body.password, 10, (errBcrypt, hash) => {
            console.log(hash);
            if (errBcrypt) {
              return res.status(500).send({ error: errBcrypt });
            }
            console.log("Senha criada e encriptada com sucesso");
            conn.query(
              `INSERT INTO usuario (email, senha) VALUES (?,?)`,
              [req.body.email, hash],
              (error, results) => {
                conn.release();
                if (error) {
                  return res.status(500).send({ error: error });
                }
                response = {
                  mensagem: "Usuário criado com sucesso",
                  usuarioCriado: {
                    id: results.insertId,
                    email: req.body.email,
                  },
                };
                return res.status(201).send(response);
              }
            );
          });
        }
      }
    );
  });
});

router.post("/login", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    const query = `SELECT * FROM usuario WHERE email = ?`;
    conn.query(query, [req.body.email], (error, results, fields) => {
      conn.release();
      if (error) {
        return res.status(500).send({ error: error });
      }
      if (results.length < 1) {
        return res.status(401).send({ mensagem: "Falha na Autenticação 1" });
      }
      bcrypt.compare(req.body.password, results[0].senha, (err, result) => {
        if (err) {
          return res.status(401).send({ mensagem: "Falha na Autenticação 2" });
        }
        if (result) {
          const token = jwt.sign(
            {
              id_usuario: results[0].id_usuario,
              email: results[0].email,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1h",
            }
          );

          return res.status(200).send({
            mensagem: "Autenticado com sucesso",
            token: token,
          });
        }
        return res.status(401).send({ mensagem: "Falha na Autenticação 3" });
      });
    });
  });
});

module.exports = router;
