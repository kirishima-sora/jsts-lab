import express from 'express';
import fs from 'fs';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// ログ出力ファイル指定
const logFileStream = fs.createWriteStream('/app/app.log', { flags: 'a' });
const logger = require('pino')(logFileStream);

const app = express();

// リクエストを受けるポート
const PORT = 3000;

// Feederテスト用
app.get('/feeder-test', async (req, res) => {
    interface FeederTestQueryParams {
        prefecture?: string;
        prefectural_capital?: string;
    }

    const {prefecture, prefectural_capital} = req.query as FeederTestQueryParams;
    // Prisma Clientのインスタンス化
    const prisma = new PrismaClient();

    try {
        // 左側のprefectureとprefectural_capitalはDBのカラム名と一致させる
        // createはデータのINSERT
        await prisma.Prefectures.create({
            data: {
                prefecture: prefecture,
                prefectural_capital: prefectural_capital,
            },
        });
        logger.info({
            msg: 'Insert OK',
            prefecture: prefecture,
            prefectural_capital: prefectural_capital
        });

        // findManyはSELECT
        const select_result = await prisma.Prefectures.findMany();
        logger.info({
            msg: 'Select OK',
            result: select_result
        });

        res.status(200).json({ message: 'OK'});
        return;

    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: 'Database query failed' });
        logger.error({
            msg: 'Error executing query',
            errMessage: err.message,
            errStack: err.stack
        });
        return;

    } finally {
        await prisma.$disconnect();
    }
});

app.use((req, res) => {
    logger.error('Not Found:', req.originalUrl);
    res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
