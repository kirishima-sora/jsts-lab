import express, { Request, Response } from 'express';
import mysql, { Pool, PoolConnection } from 'mysql2/promise';
// import mysql, { Connection } from 'mysql2/promise';
import 'dotenv/config';
import pino from 'pino';

// 標準出力
const logger = pino();

const app = express();

// データベース接続設定
const dbConfig = {
    host: process.env.HOST as string,
    port: parseInt(process.env.PORT as string, 10),
    user: process.env.USER as string,
    password: process.env.PASSWORD as string,
    database: process.env.DATABASE as string,
    connectionLimit: 1
};

// コネクションプールの作成
const pool: Pool = mysql.createPool(dbConfig);

// リクエストを受けるポート
const PORT = 3000;

// テストAPI
app.get('/implicit-test', async (req, res) => {
    let connection: PoolConnection | undefined;
    // let connection: Connection | undefined;
    const {prefecture, prefectural_capital} = req.query;

    try {
        connection = await pool.getConnection();
        // connection = await mysql.createConnection(dbConfig);
        logger.info('Pool get successfully');

        await connection.beginTransaction();
        logger.info('Transaction started');

        await connection.execute(
            `INSERT INTO prefectures (
                prefecture,
                prefectural_capital
            ) VALUES (?, ?)`,
            [prefecture, prefectural_capital]
        );

        // トランザクションの結果を返却
        res.status(200).json({
            message: 'Query OK',
            prefecture,
            prefectural_capital
        });

    } catch (err: any) {
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({ error: 'Database query failed' });
        logger.error({
            msg: 'Error executing query',
            errMessage: err.message,
            errStack: err.stack
        });

    } finally {
        if (connection) {
            connection.release();
            // connection.end();
        }
    }
});

app.use((req: Request, res: Response) => {
    logger.error('Not Found:', req.originalUrl);
    res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
