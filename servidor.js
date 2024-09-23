const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gipar",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});

// Rota para criar novo usuário (signup)
app.post("/signup", (req, res) => {
  const { email, password, name, phone } = req.body;
  const userSql =
    "INSERT INTO usuario (email, senha, nome, telefone) VALUES (?, ?, ?, ?)";
  const userValues = [email, password, name, phone];

  db.query(userSql, userValues, (err, result) => {
    if (err) {
      console.error("Erro ao criar usuário:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(201).json({ message: "Usuário criado com sucesso" });
  });
});

// Rota de login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const loginSql = "SELECT * FROM usuario WHERE email = ? AND senha = ?";
  db.query(loginSql, [email, password], (err, result) => {
    if (err) {
      console.error("Erro ao autenticar usuário:", err.message);
      return res.status(500).json({ message: err.message });
    }

    if (result.length > 0) {
      res.status(200).json({ message: "Login bem-sucedido", user: result[0] });
    } else {
      res.status(401).json({ message: "Email ou senha incorretos" });
    }
  });
});

// Rota para adicionar uma nova loja
app.post("/loja", (req, res) => {
  const { nome, telefone, categoria, posicao_x, posicao_y } = req.body;
  const lojaSql =
    "INSERT INTO loja (nome, telefone, categoria, posicao_x, posicao_y) VALUES (?, ?, ?, ?, ?)";
  const lojaValues = [nome, telefone, categoria, posicao_x, posicao_y];

  db.query(lojaSql, lojaValues, (err, result) => {
    if (err) {
      console.error("Erro ao adicionar loja:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res
      .status(201)
      .json({
        message: "Loja adicionada com sucesso",
        lojaId: result.insertId,
      });
  });
});

// Rota para buscar todas as lojas
app.get("/lojas", (req, res) => {
  const lojasSql = "SELECT * FROM loja";
  db.query(lojasSql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar lojas:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json(results);
  });
});

// Rota para adicionar um novo produto
app.post("/produto", (req, res) => {
  const { nome, descricao, id_loja } = req.body;
  const produtoSql =
    "INSERT INTO produto (nome, descricao, id_loja) VALUES (?, ?, ?)";
  const produtoValues = [nome, descricao, id_loja];

  db.query(produtoSql, produtoValues, (err, result) => {
    if (err) {
      console.error("Erro ao adicionar produto:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res
      .status(201)
      .json({
        message: "Produto adicionado com sucesso",
        produtoId: result.insertId,
      });
  });
});

// Rota para buscar todos os produtos
app.get("/produtos", (req, res) => {
  const produtosSql = "SELECT * FROM produto";
  db.query(produtosSql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar produtos:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json(results);
  });
});

// Rota para adicionar um novo dispositivo
app.post("/dispositivo", (req, res) => {
  const { nome, descricao, latitude, longitude, altura } = req.body;
  const dispositivoSql =
    "INSERT INTO dispositivo (nome, descricao, latitude, longitude, altura) VALUES (?, ?, ?, ?, ?)";
  const dispositivoValues = [nome, descricao, latitude, longitude, altura];

  db.query(dispositivoSql, dispositivoValues, (err, result) => {
    if (err) {
      console.error("Erro ao adicionar dispositivo:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res
      .status(201)
      .json({
        message: "Dispositivo adicionado com sucesso",
        dispositivoId: result.insertId,
      });
  });
});

// Rota para buscar todos os dispositivos
app.get("/dispositivos", (req, res) => {
  const dispositivosSql = "SELECT * FROM dispositivo";
  db.query(dispositivosSql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar dispositivos:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json(results);
  });
});

// Rota para inserir pedido (já existente)
app.post("/pedido", (req, res) => {
  const {
    id_usuario,
    nome_loja,
    telefone_loja,
    categoria_loja,
    endereco_entrega,
    produtos,
  } = req.body;
  console.log("Recebido pedido:", req.body);

  const verificarLojaSql =
    "SELECT id FROM loja WHERE nome = ? AND telefone = ? AND categoria = ?";
  const verificarLojaValues = [nome_loja, telefone_loja, categoria_loja];

  db.query(verificarLojaSql, verificarLojaValues, (err, results) => {
    if (err) {
      console.error("Erro ao verificar loja:", err.message);
      return res.status(500).json({ message: err.message });
    }

    let idLojaGerado;
    if (results.length > 0) {
      // Loja já existe, use o ID existente
      idLojaGerado = results[0].id;
      inserirPedido(id_usuario, idLojaGerado, endereco_entrega, produtos, res);
    } else {
      // Inserir nova loja
      const lojaSql =
        "INSERT INTO loja (nome, telefone, categoria, posicao_x, posicao_y) VALUES (?, ?, ?, ?, ?)";
      const lojaValues = [nome_loja, telefone_loja, categoria_loja, "0", "0"];

      db.query(lojaSql, lojaValues, (err, result) => {
        if (err) {
          console.error("Erro ao inserir loja:", err.message);
          return res.status(500).json({ message: err.message });
        }
        idLojaGerado = result.insertId;
        inserirPedido(
          id_usuario,
          idLojaGerado,
          endereco_entrega,
          produtos,
          res
        );
      });
    }
  });
});

// Função auxiliar para inserir um novo pedido
function inserirPedido(id_usuario, id_loja, endereco_entrega, produtos, res) {
  const pedidoSql =
    "INSERT INTO pedido (id_usuario, id_loja, data_hora, status, endereco_entrega) VALUES (?, ?, NOW(), ?, ?)";
  const pedidoValues = [id_usuario, id_loja, "Pendente", endereco_entrega];

  db.query(pedidoSql, pedidoValues, (err, result) => {
    if (err) {
      console.error("Erro ao inserir pedido:", err.message);
      return res.status(500).json({ message: err.message });
    }

    const pedidoId = result.insertId;
    console.log("Pedido inserido com ID:", pedidoId);

    const inserirProdutosEItens = produtos.map((produto) => {
      return new Promise((resolve, reject) => {
        const verificarProdutoSql = "SELECT id FROM produto WHERE nome = ?";
        db.query(verificarProdutoSql, [produto.nome], (err, results) => {
          if (err) {
            return reject(err);
          }

          let idProdutoGerado;
          if (results.length > 0) {
            // Produto já existe, use o ID existente
            idProdutoGerado = results[0].id;
            resolve([pedidoId, idProdutoGerado, produto.quantidade]);
          } else {
            // Inserir novo produto
            const produtoSql =
              "INSERT INTO produto (nome, descricao) VALUES (?, ?)";
            db.query(
              produtoSql,
              [produto.nome, produto.descricao],
              (err, result) => {
                if (err) {
                  return reject(err);
                }
                idProdutoGerado = result.insertId;
                resolve([pedidoId, idProdutoGerado, produto.quantidade]);
              }
            );
          }
        });
      });
    });

    Promise.all(inserirProdutosEItens)
      .then((itemPedidoValues) => {
        const itemPedidoSql =
          "INSERT INTO item_pedido (id_pedido, id_produto, quantidade) VALUES ?";
        db.query(itemPedidoSql, [itemPedidoValues], (err, result) => {
          if (err) {
            console.error("Erro ao inserir itens do pedido:", err.message);
            return res.status(500).json({ message: err.message });
          }

          res
            .status(201)
            .json({
              pedidoId,
              message: "Pedido e itens do pedido adicionados com sucesso",
            });
        });
      })
      .catch((err) => {
        console.error(
          "Erro ao inserir produtos e itens do pedido:",
          err.message
        );
        res.status(500).json({ message: err.message });
      });
  });
}

// Inicializar o servidor
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
