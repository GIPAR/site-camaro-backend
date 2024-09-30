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
    res.status(201).json({
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
  const { nome, descricao } = req.body;
  const produtoSql = "INSERT INTO produto (nome, descricao) VALUES (?, ?)";
  const produtoValues = [nome, descricao];

  db.query(produtoSql, produtoValues, (err, result) => {
    if (err) {
      console.error("Erro ao adicionar produto:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(201).json({
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
  const { nome, ip, permissao_acesso, tipo } = req.body;
  const dispositivoSql =
    "INSERT INTO dispositivo (nome, ip, permissao_acesso, tipo) VALUES (?, ?, ?, ?)";
  const dispositivoValues = [nome, ip, permissao_acesso, tipo];

  db.query(dispositivoSql, dispositivoValues, (err, result) => {
    if (err) {
      console.error("Erro ao adicionar dispositivo:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(201).json({
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

/*


*/
app.post("/pedido", (req, res) => {
  const {
    id_usuario,
    id_loja,
    id_dispositivo,
    endereco_entrega,
    produtos,
  } = req.body;
  console.log("Recebido pedido:", req.body);

  const pedidoSql =
    "INSERT INTO pedido (id_usuario, id_loja, id_dispositivo, data_hora, status, endereco_entrega) VALUES (?, ?, ?, NOW(), ?, ?)";
  const pedidoValues = [
    id_usuario,
    id_loja,
    id_dispositivo,
    "Pendente",
    endereco_entrega,
  ];

  db.query(pedidoSql, pedidoValues, (err, result) => {
    if (err) {
      console.error("Erro ao adicionar pedido:", err.message);
      return res.status(500).json({ message: err.message });
    }
    const id_pedido = result.insertId;
    inserirProdutos(id_pedido, produtos, res);
    res.status(201).json({
      message: "Pedido efetuado com sucesso",
      pedidoId: id_pedido,
    });
  });
});

// Função auxiliar para inserir um novo pedido
function inserirProdutos(id_pedido, produtos, res) {
  const produtoSql =
    "INSERT INTO item_pedido (id_pedido, id_produto, quantidade) VALUES ?";

  const produtoValues = produtos.map((produto) => [
    id_pedido,
    produto.id,
    produto.quantidade,
  ]);

  db.query(produtoSql, [produtoValues], (err) => {
    if (err) {
      console.error("Erro ao inserir produtos:", err.message);
      return res.status(500).json({ message: err.message });
    }
    console.log("Produtos inseridos com sucesso para o pedido:", id_pedido);
  });
}


/**
 * TODO: Adicionar joins para obter os dados dos produtos e das lojas
 */
app.get("/pedidos", (req, res) => {
  const pedidosSql = "SELECT * FROM pedido";
  db.query(pedidosSql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar produtos:", err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json(results);
  });
});

// Inicializar o servidor
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
