import axios from 'axios';
import * as cheerio from 'cheerio';

export async function extractArticleContent(url: string) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const title = $('title').text();
        const paragraphs = $('p').map((_, el) => $(el).text()).get();
        const content = paragraphs.join(' ');

        return { title, content, url, date: new Date().toISOString() };
    } catch (error) {
        console.error(`Error extracting content from ${url}:`, error);
        return null;
    }
}
