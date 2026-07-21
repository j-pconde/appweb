import { PrismaMariaDb } from "@prisma/adapter-mariadb";
//import { PrismaClient } from "../generated/prisma/client";
import { PrismaClient } from "../node_modules/.prisma/client"; 

// 1. Inicializa o adaptador com os dados do seu container Docker/MariaDB
// const adapter = new PrismaMariaDb({
//   host: process.env.DB_HOST ?? "127.0.0.1",
//   port: Number(process.env.DB_PORT ?? 3306),
//   user: process.env.DB_USER ?? "root",
//   password: process.env.DB_PASSWORD ?? "",
//   database: process.env.DB_NAME ?? "app",
// });

const adapter = new PrismaMariaDb({
  host: "localhost", //"127.0.0.1",
  port: 3306,
  user: "root",
  password: "010203", // <-- Coloque aqui a senha do root que está no seu .env / Docker
  database: "LOJA", // <-- Coloque aqui o nome do banco (ex: loja_local ou app)
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 2. Limpeza do banco (na ordem correta de dependência das chaves estrangeiras)
  console.log("⏳ Limpando o banco de dados...");
  //await prisma.orderItem.deleteMany({});
  //await prisma.order.deleteMany({});
  //await prisma.productVariant.deleteMany({});
  //await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  //await prisma.user.deleteMany({});
  console.log("🔄 Banco limpo com sucesso.");

  // 3. Cadastro de Categorias
  console.log("📦 Cadastrando categorias...");
  const categoriaSaias = await prisma.category.create({
    data: {
      name: "Saias",
      slug: "saias",
    },
  });

  // 4. Cadastro de Produtos
  console.log("👗 Cadastrando produtos...");
  const saiaMidi = await prisma.product.create({
    data: {
      name: "Saia Midi Sensorial",
      slug: "saia-midi-sensorial",
      description: "Saia midi confeccionada em tecido premium marrante sensorial, modelagem minimalista e caimento perfeito.",
      price: 149.90, // Preço sugerido para atacado/varejo
      categoryId: categoriaSaias.id,
      images: "",
    },
  });

  // 5. Cadastro de Variações do Produto (Tamanhos e Estoque)
  console.log("📏 Cadastrando variações de estoque...");
  await prisma.productVariant.createMany({
    data: [
      {
        productId: saiaMidi.id,
        size: "P",
        color: "liso",
        sku: "SAIA-MIDI-SENS-P",
        stock: 50,
      },
      {
        productId: saiaMidi.id,
        size: "M",
        color: "liso",
        sku: "SAIA-MIDI-SENS-M",
        stock: 50,
      },
      {
        productId: saiaMidi.id,
        size: "G",
        color: "liso",
        sku: "SAIA-MIDI-SENS-G",
        stock: 48, // Fechando o lote do pedido de 148 peças
      },
    ],
  });

  console.log("✅ Seed finalizado! Banco de dados populado com sucesso.");
}

// 6. Execução segura com gerenciamento de conexão do Prisma
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro ao rodar o seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });