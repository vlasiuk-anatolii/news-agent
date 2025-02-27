import express, { Request, Response } from 'express';
import { retrieveFromVectorDB, storeInVectorDB } from './database.js';
import { extractArticleContent } from './extractor.js';

const app = express();
app.use(express.json());

const extractURL = (query: string): string | null => query.match(/https?:\/\/[^\s]+/)?.[0] || null;

app.post('/agent', async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body as { query: string };

    try {
        let context = '';
        const lastMonthOnly = /last month|recent/.test(query);
        const url = extractURL(query);

        if (url) {
            console.log(`🔍 URL detected: ${url}`);
            const article = await extractArticleContent(url);
            if (!article) {
                res.status(400).json({ error: "Failed to fetch article content." });
                return console.warn(`⚠️ Failed to fetch article content for ${url}`);
            }
            await storeInVectorDB(article);
            context = article.content;

            res.json({
                answer: "An answer from LLM based on the article",
                sources: [{
                    title: article.title,
                    url,
                    date: new Date().toISOString()
                }]
            });
            return;
        }
        
        console.log(`🔍 Searching in vector DB: ${query}`);
        const rawResults = await retrieveFromVectorDB(query, 5, lastMonthOnly);
        const results = rawResults.filter((result): result is { title: string; url: string; date: string; content?: string } => result !== null);
        context = results.map(r => r.content).join('\n');

        res.json({
            answer: 'An answer from LLM',
            sources: results.map(({ title, url, date }) => ({ title, url, date }))
        });
        return; 
    } catch (error) {
        console.error("❌ Query Processing Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const currentPort = process.env.PORT || "3000";
app.listen(currentPort, () => {
    console.log(`🚀 Server running on http://localhost:${currentPort}`);
});
