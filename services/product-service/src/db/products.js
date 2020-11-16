import { Client } from "pg";

const DB_OPTIONS = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000,
};

export async function findAll() {
  const client = new Client(DB_OPTIONS);
  await client.connect();

  try {
    const { rows: productList } = await client.query(`
      SELECT p.id, s.count, p.price, p.title, p.description
      FROM products p INNER JOIN stocks s ON (p.id = s.product_id)
      ORDER BY p.title
    `);
    return productList;
  } finally {
    client.end();
  }
}

export async function getById(productId) {
  const client = new Client(DB_OPTIONS);
  await client.connect();

  try {
    const { rows: productList } = await client.query(
      `SELECT p.id, s.count, p.price, p.title, p.description
      FROM products p INNER JOIN stocks s ON (p.id = s.product_id)
      WHERE p.id = $1`,
      [productId]
    );
    return productList.length === 1 ? productList[0] : null;
  } finally {
    client.end();
  }
}

export async function create({ title, description, price, count }) {
  const client = new Client(DB_OPTIONS);

  await client.connect();
  try {
    await client.query("BEGIN");
    try {
      const result = await client.query(
        `INSERT INTO products (title, description, price) VALUES ($1, $2, $3) RETURNING id`,
        [title, description, price]
      );
      const productId = result.rows[0].id;
      await client.query(
        `INSERT INTO stocks (product_id, count) VALUES ($1, $2)`,
        [productId, count]
      );
      await client.query("COMMIT");
      return productId;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  } finally {
    client.end();
  }
}
