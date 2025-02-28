import dotenv from 'dotenv';
dotenv.config();

import { IndexList, Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const INDEX_NAME = "news-articles";
const EMBEDDING_MODEL = "text-embedding-3-small"//"text-embedding-ada-002";

if (!PINECONE_API_KEY || !OPENAI_API_KEY) {
    throw new Error("Missing required API keys");
}

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function initializeIndex() {
    try {
        const indexList: IndexList = await pc.listIndexes();
        const indexExists = indexList.indexes?.some(index => index.name === INDEX_NAME);

        if (!indexExists) {
            await pc.createIndex({
                name: INDEX_NAME,
                dimension: 1536,
                metric: 'cosine',
                spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
            });
            console.log('✅ Index created successfully:', INDEX_NAME);
        } else {
            console.log(`ℹ️ Index '${INDEX_NAME}' already exists.`);
        }
    } catch (error) {
        console.error('❌ Error initializing index:', error);
    }
}

interface Article {
    url: string;
    content: string;
    title?: string;
    date?: string;
}

async function getEmbedding(text: string) {
    try {
        const response = await openai.embeddings.create({ input: text, model: EMBEDDING_MODEL });
        return response.data[0]?.embedding ?? [];
    } catch (error) {
        console.error("❌ Error generating embedding:", error);
        return [];
    }
}

export async function storeInVectorDB(article: Article): Promise<void> {
    try {
        if (!article.url || !article.content) {
            console.warn("⚠️ Article is missing URL or content:", article);
            return;
        }

        const index = pc.index(INDEX_NAME);
        const embedding = await getEmbedding(article.content);
        if (!embedding.length) {
            console.error("❌ Invalid embedding received");
            return;
        }

        await index.upsert([
            {
                id: article.url,
                values: embedding,
                metadata: {
                    title: article.title || "Untitled",
                    url: article.url,
                    date: article.date || new Date().toISOString(),
                    content: article.content,
                }
            }
        ]);

        console.log(`✅ Article stored: ${article.title || "Untitled"}`);
    } catch (error) {
        console.error("❌ Error storing article in vector DB:", error);
    }
}

export async function retrieveFromVectorDB(query: string, topK = 5, lastMonthOnly = false) {
    try {
        const queryEmbedding = await getEmbedding(query);
        if (!queryEmbedding.length) return [];

        const index = pc.index(INDEX_NAME);
        const filter = lastMonthOnly ? { date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString() } } : undefined;

        const searchResults = await index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
            filter,
        });

        if (!searchResults.matches?.length) {
            console.warn("⚠️ No matches found.");
            return [];
        }

        return searchResults.matches.map(match => ({
            title: match.metadata?.title || "Untitled",
            url: match.metadata?.url || "#",
            date: match.metadata?.date || "Unknown",
        })).filter(Boolean);
    } catch (error) {
        console.error("❌ Error retrieving from vector DB:", error);
        return [];
    }
}

initializeIndex();