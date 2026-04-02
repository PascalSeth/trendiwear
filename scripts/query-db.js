require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function runQuery() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const userId = 'd4f8afb0-475b-4ef1-8660-302f7e622291';
    const res = await client.query('SELECT id, "productId", "userId" FROM "CartItem" WHERE "userId" = $1', [userId]);
    
    console.log(`Found ${res.rows.length} cart items for this user:`);
    res.rows.forEach(row => {
      console.log(`CartItemID: ${row.id} | ProductID: ${row.productId}`);
    });

    const anyRes = await client.query('SELECT id, "productId", "userId" FROM "CartItem" WHERE id = $1', ['37a55f00-98f6-4394-a3e7-2e6c3fba5840']);
    if (anyRes.rows.length > 0) {
        console.log('--- ID FOUND IN CartItem table! ---');
        console.log(JSON.stringify(anyRes.rows[0], null, 2));
    } else {
        console.log('--- ID NOT FOUND IN CartItem table ---');
    }

    const prodRes = await client.query('SELECT id, name FROM "Product" WHERE id = $1', ['37a55f00-98f6-4394-a3e7-2e6c3fba5840']);
    if (prodRes.rows.length > 0) {
        console.log('--- ID FOUND IN Product table! ---');
        console.log(JSON.stringify(prodRes.rows[0], null, 2));
    }

  } catch (err) {
    console.error('Error running query:', err);
  } finally {
    await client.end();
  }
}

runQuery();
