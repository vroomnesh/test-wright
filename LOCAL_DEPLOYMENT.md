# Testwright — run it on your machine

This is how to start Testwright locally. There is no sign-in. Open the app in a browser after both processes are running.

## What you need

- Python 3.9 or newer
- Node.js 18 or newer
- An OpenAI API key that can call `gpt-4o` and `text-embedding-ada-002`
- A Weaviate Cloud cluster (the free tier is enough). `WEAVIATE_URL` is the REST host, for example `https://your-cluster.weaviate.cloud`

## 1. Environment file

From the project folder:

```bash
cp .env.example .env
```

Put your own values in `.env`:

```env
WEAVIATE_API_KEY=your_weaviate_api_key_here
WEAVIATE_URL=your_weaviate_url_here

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_CHAT_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

VITE_BACKEND_URL=http://localhost:8002
```

`VITE_BACKEND_URL` is not used by the dev frontend. The app calls `http://localhost:8002`, which is `API_BASE_URL` in `frontend/src/services/api.js`. Restart the backend after you change `.env`.

## 2. Backend

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python start.py
```

On Windows, create the virtual environment with `python -m venv .venv` if `python3` is not available.

The API is at http://localhost:8002. Interactive docs are at http://localhost:8002/docs.

## 3. Frontend

From the project folder, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app is at http://localhost:3002.

## Using it

- **Knowledge Management** — upload a PDF, DOCX, or image, then index it. Images must be under 4MB. Indexed documents are shared in one public knowledge base.
- **Test Case Generator** — write a request and generate test cases or user stories. Turn RAG on to use indexed documents.
- **ETL Test Generator** — describe sources, targets, and rules, then generate a script or Excel file.

## If something fails

- **Port already in use:** something else is on 8002 or 3002. Stop that process, or change `FASTAPI_PORT` in `.env` and the `port` in `frontend/vite.config.js`. A new frontend port also has to be added to the CORS list in `api/main.py`. A new backend port also has to be set as `API_BASE_URL` in `frontend/src/services/api.js`.
- **Backend cannot see the API key:** `.env` must sit in the project root, with no spaces around `=`.
- **OpenAI errors:** confirm `OPENAI_API_KEY`, and that `OPENAI_CHAT_MODEL` is a model your key can call. Image upload needs a vision model such as `gpt-4o`.
- **Weaviate errors:** use the REST host, not the gRPC host, and do not add `/v1`.
- **Frontend install problems:** use Node 18+, then `rm -rf node_modules && npm install`.
