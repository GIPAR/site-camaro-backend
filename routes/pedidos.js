const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;

// RETORNA TODOS OS PEDIDOS
router.get("/", (req, res, next) => {
  const pedidosSql = `
        SELECT p.id, p.id_usuario, p.id_loja, p.id_dispositivo, p.data_hora, 
               p.status, p.endereco_entrega, u.nome AS nome_cliente
        FROM pedido p 
        INNER JOIN usuario u ON p.id_usuario = u.id
        ORDER BY p.id`;

  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error.message });
    }

    conn.query(pedidosSql, (err, results) => {
      conn.release(); // Ensure the connection is released
      if (err) {
        return res.status(500).send({ error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).send({
          mensagem: "Nenhum pedido encontrado",
        });
      }

      const response = {
        quantidade: results.length,
        pedidos: results.map((pedido) => ({
          id: pedido.id,
          id_usuario: pedido.id_usuario,
          id_loja: pedido.id_loja,
          id_dispositivo: pedido.id_dispositivo,
          data_hora: pedido.data_hora,
          status: pedido.status,
          endereco_entrega: pedido.endereco_entrega,
          nome_cliente: pedido.nome_cliente,
          request: {
            tipo: "GET",
            descricao: "Retorna os detalhes de um pedido específico",
            url: `http://localhost:3001/pedidos/${pedido.id}`,
          },
        })),
      };

      res.status(200).send(response);
    });
  });
});

// RETORNA OS DADOS DE UM PEDIDO
router.get("/:id_pedido", (req, res, next) => {
  const id_pedido = req.params.id_pedido; // Use consistent parameter naming
  const pedidoSql = `
        SELECT 
            p.id, 
            p.id_usuario, 
            p.id_loja, 
            p.id_dispositivo, 
            p.data_hora, 
            p.status, 
            p.endereco_entrega, 
            (
                SELECT GROUP_CONCAT(pr.nome) 
                FROM produto pr 
                INNER JOIN item_pedido ip 
                ON pr.id = ip.id_produto 
                WHERE ip.id_pedido = p.id
            ) AS produtos 
        FROM pedido p 
        WHERE p.id = ?`;

  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error.message });
    }

    conn.query(pedidoSql, [id_pedido], (err, result) => {
      conn.release(); // Release the connection
      if (err) {
        return res.status(500).send({ error: err.message });
      }

      if (result.length === 0) {
        return res.status(404).send({
          mensagem: "Pedido não encontrado",
        });
      }

      const response = {
        id: result[0].id,
        id_usuario: result[0].id_usuario,
        id_loja: result[0].id_loja,
        id_dispositivo: result[0].id_dispositivo,
        data_hora: result[0].data_hora,
        status: result[0].status,
        endereco_entrega: result[0].endereco_entrega,
        produtos: result[0].produtos ? result[0].produtos.split(",") : [],
        request: {
          tipo: "GET",
          descricao: "Retorna os detalhes do pedido",
          url: `http://localhost:3001/pedidos/${id_pedido}`,
        },
      };

      return res.status(200).send(response);
    });
  });
});

// INSERE UM PEDIDO
router.post("/", (req, res) => {
  const { id_usuario, id_loja, id_dispositivo, endereco_entrega, produtos } =
    req.body;

  if (!produtos || produtos.length === 0) {
    return res
      .status(400)
      .send({ mensagem: "O pedido deve conter pelo menos um produto." });
  }

  const pedidoSql = `
        INSERT INTO pedido (id_usuario, id_loja, id_dispositivo, data_hora, status, endereco_entrega) 
        VALUES (?, ?, ?, NOW(), ?, ?)`;

  const pedidoValues = [
    id_usuario,
    id_loja,
    id_dispositivo,
    "Pendente",
    endereco_entrega,
  ];

  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error.message });
    }

    conn.query(pedidoSql, pedidoValues, (err, result) => {
      if (err) {
        conn.release();
        console.error("Erro ao adicionar pedido:", err.message);
        return res.status(500).send({ error: err.message });
      }

      const id_pedido = result.insertId;

      // Chama a função auxiliar para inserir os produtos do pedido
      inserirProdutos(conn, id_pedido, produtos, res, () => {
        conn.release(); // Libera a conexão apenas após finalizar todas as operações
        res.status(201).send({
          mensagem: "Pedido efetuado com sucesso",
          pedidoId: id_pedido,
          request: {
            tipo: "GET",
            descricao: "Retorna os detalhes do pedido",
            url: `http://localhost:3001/pedidos/${id_pedido}`,
          },
        });
      });
    });
  });
});

// Função auxiliar para inserir os produtos de um pedido
function inserirProdutos(conn, id_pedido, produtos, res, callback) {
  const produtoSql = `
        INSERT INTO item_pedido (id_pedido, id_produto, quantidade) 
        VALUES ?`;

  const produtoValues = produtos.map((produto) => [
    id_pedido,
    produto.id,
    produto.quantidade,
  ]);

  conn.query(produtoSql, [produtoValues], (err) => {
    if (err) {
      console.error("Erro ao inserir produtos:", err.message);
      return res.status(500).send({ error: err.message });
    }
    console.log("Produtos inseridos com sucesso para o pedido:", id_pedido);
    callback(); // Finaliza a operação e chama a função de callback
  });
}


// EXCLUI UM PEDIDO
// Rota para deletar um pedido
router.delete("/", (req, res) => {
    const { id_pedido } = req.body;

    console.log("ID do pedido a ser deletado:", id_pedido);

    if (!id_pedido) {
        return res.status(400).send({ mensagem: "O campo 'id_pedido' é obrigatório." });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ error: error.message });
        }

        const itemPedidoSql = "DELETE FROM item_pedido WHERE id_pedido = ?";
        conn.query(itemPedidoSql, [id_pedido], (err) => {
            if (err) {
                conn.release();
                console.error("Erro ao deletar itens do pedido:", err.message);
                return res.status(500).send({ error: err.message });
            }

            const pedidoSql = "DELETE FROM pedido WHERE id = ?";
            conn.query(pedidoSql, [id_pedido], (err, result) => {
                conn.release();

                if (err) {
                    console.error("Erro ao deletar pedido:", err.message);
                    return res.status(500).send({ error: err.message });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).send({ mensagem: "Pedido não encontrado." });
                }

                res.status(200).send({
                    mensagem: "Pedido deletado com sucesso.",
                });
            });
        });
    });
});


module.exports = router;
