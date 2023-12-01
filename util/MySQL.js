import mysql from 'mysql2'

const sql_config = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_SCHEMA,
  port: process.env.DATABASE_PORT,
}

const sql_connection = mysql.createConnection(sql_config)
sql_connection.connect((err) => {
  if(err)console.log('error when connecting to db:', err);
});


export default sql_connection