# News Agent API

## Overview
The News Agent API is a Node.js-based service using Express.js to fetch and process article content, store it in a vector database, and retrieve relevant results using an LLM (Large Language Model). The API supports:

- Extracting content from a given URL.
- Storing article data in a vector database.
- Searching for relevant results based on user queries.
- Providing LLM-generated responses.

## Installation
### Prerequisites
- Node.js (>= v18.0.0)
- NPM or Yarn
- Pinecone API Key (for vector database)
- OpenAI API Key (for LLM responses)

### Setup
1. Clone the repository:
   ```sh
   git clone git@github.com:vlasiuk-anatolii/news-agent.git
   cd news-agent
   ```
2. Install dependencies:
   ```sh.md
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```env
   PORT=3000
   PINECONE_API_KEY=your_pinecone_api_key
   OPENAI_API_KEY=your_openai_api_key
   
   ```
4. Run the application:
   ```sh
   npm run build
   npm run start
   ```

## API Endpoints
### `POST /agent`
Processes a query and returns relevant information.
#### Request Body:
```json
{
  "query": "latest news about AI"
}
```
#### Response:
```json
{
  "answer": "An answer from LLM",
  "sources": [
    {
      "title": "AI Breakthroughs in 2025",
      "url": "https://example.com",
      "date": "2025-02-26",
    }
  ]
}
```

## Potential Improvements
### **Quality Enhancements**
- **Improve LLM responses**: Fine-tune prompts to enhance the accuracy of generated responses.
- **Better content filtering**: Enhance the article extraction mechanism to eliminate irrelevant content.
- **Implement caching**: Store frequently accessed queries to reduce redundant API calls.

### **Cost/Token Optimization**
- **Use embeddings sparingly**: Minimize vector database storage by pruning outdated or irrelevant data.
- **Compress content**: Reduce token usage by summarizing articles before storing them.
- **Batch API calls**: Reduce requests to OpenAI by combining multiple queries into single requests where possible.

### **Performance Improvements (Latency Reduction)**
- **Parallel Processing**: Process URL extraction and database storage asynchronously to improve response times.
- **Load balancing**: Deploy the service in a distributed manner to handle increased load.
- **Optimize Vector Search**: Use indexing techniques like HNSW for faster search in the vector database.

## License
This project is licensed under the MIT License.

