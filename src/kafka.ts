import { Kafka } from 'kafkajs';
import { extractArticleContent } from './extractor.js';
import { storeInVectorDB } from './database.js';

const KAFKA_BROKER = process.env.KAFKA_BROKER || "pkc-ewzgj.europe-west4.gcp.confluent.cloud:9092";
const KAFKA_USERNAME = process.env.KAFKA_USERNAME || "OXQDOMDXAEIPZDEG";
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD || "Rq9Jv5kKr4kfMTG0xkJZazgwOIKqduM+vbXjyxBK9EpE7FDLbcMRcbbx17TYEhZm";
const KAFKA_TOPIC = process.env.KAFKA_TOPIC_NAME || "news";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID_PREFIX || "test-task-";

console.log(`🟢 Connecting to Kafka on: ${KAFKA_BROKER}`);

const client = new Kafka({
    clientId: 'news-processor',
    brokers: [KAFKA_BROKER],
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: KAFKA_USERNAME,
      password: KAFKA_PASSWORD
    },
  });

  const consumer = client.consumer({ groupId: `${KAFKA_GROUP_ID}` });

  async function run() {
    await consumer.connect();
    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
    
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (message.value) {
            const messageStr = message.value.toString();
            const messageData = JSON.parse(messageStr);
            
            if (messageData.event === "new-article" && messageData.value && messageData.value.url) {
              const url = messageData.value.url;
              console.log(`📥 Received URL: ${url}`);
              await processArticle(url);
            } else {
              console.log('A different message format was received:', messageData);
            }
          } else {
            console.log('Received message without value');
          }
        },
      });
  }
  
run().catch(console.error);

export async function processArticle(url: string) {
    try {
        console.log(`🔍 We process the article: ${url}`);
        const article = await extractArticleContent(url);
        if (!article) {
            console.warn(`⚠️ Failed to get content from ${url}`);
            return;
        }

        await storeInVectorDB(article);
        console.log(`✅ Article saved to vector base: ${article.title}`);

    } catch (error) {
        console.error(`❌ Article processing error ${url}:`, error);
    }
}
