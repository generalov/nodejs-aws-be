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

async function execute(fn) {
  const client = new Client(DB_OPTIONS);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    client.end();
  }
}

function usingTransaction(fn) {
  return async (client) => {
    let res;
    try {
      await client.query(`BEGIN`);
      res = await fn(client);
      await client.query(`COMMIT`);
    } catch (err) {
      await client.query(`ROLLBACK`);
      throw err;
    }
    return res;
  };
}

export async function findAll() {
  return execute(async (client) => {
    const { rows: productList } = await client.query(
      `SELECT p.id, s.count, p.price, p.title, p.description
                 FROM products p
                          INNER JOIN stocks s ON (p.id = s.product_id)
                 ORDER BY p.title`
    );
    return productList;
  });
}

export async function getById(productId) {
  return execute(async (client) => {
    const { rows: productList } = await client.query(
      `SELECT p.id, s.count, p.price, p.title, p.description
                 FROM products p
                          INNER JOIN stocks s ON (p.id = s.product_id)
                 WHERE p.id = $1`,
      [productId]
    );
    return productList.length === 1 ? productList[0] : null;
  });
}

export async function create({ title, description, price, count }) {
  const rows = [{ title, description, price, count }];
  return (await bulkCreate(rows))[0];
}

export async function bulkCreate(rows) {
  const titleCol = rows.map(({ title }) => title);
  const descriptionCol = rows.map(({ description }) => description);
  const priceCol = rows.map(({ price }) => price);
  const countCol = rows.map(({ count }) => count);

  return execute(
    usingTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO products (title, description, price)
                     SELECT *
                     FROM UNNEST($1::text[], $2::text[], $3::decimal[])
                     RETURNING id`,
        [titleCol, descriptionCol, priceCol]
      );
      const productIdCol = result.rows.map(({ id }) => id);
      await client.query(
        `INSERT INTO stocks (product_id, count)
                     SELECT *
                     FROM UNNEST($1::uuid[], $2::int[])`,
        [productIdCol, countCol]
      );
      return productIdCol;
    })
  );
}
