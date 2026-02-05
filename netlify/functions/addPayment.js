import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = JSON.parse(event.body);

  const { studentId, totalFees, paidAmount, paymentMode, date, balance } = data;

  try {
    await pool.query(
      "INSERT INTO payments(student_id, total_fees, paid_amount, payment_mode, date, balance) VALUES($1, $2, $3, $4, $5, $6)",
      [studentId, totalFees, paidAmount, paymentMode, date, balance]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Payment added" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}