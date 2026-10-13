# Testwright — run it with Docker

This starts the same app in Docker. There is no sign-in. The frontend is the Vite dev server, and the API is FastAPI.

Use `docker compose` with a space. That is Compose v2, which current Docker installs include.

## What you need

- Docker with Compose v2
- An OpenAI API key that can call `gpt-4o` and `text-embedding-ada-002`
- A Weaviate Cloud cluster. `WEAVIATE_URL` is the REST host, for example `https://your-cluster.weaviate.cloud`. Do not add `/v1`.

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

Create this file before the first build. The backend image copies it in, and Compose also passes these values into the container. `VITE_BACKEND_URL` is not used by the dev frontend. The app calls `http://localhost:8002`, which is `API_BASE_URL` in `frontend/src/services/api.js`.

## 2. Start

```bash
docker compose up --build
```

The first start can take a minute. The frontend waits until the backend health check passes.

To run it in the background:

```bash
docker compose up --build -d
```

## 3. Open the app

- App: http://localhost:3002
- API: http://localhost:8002
- API docs: http://localhost:8002/docs
- Health: http://localhost:8002/health

## What is running

| Service | Container | Address | Image |
| --- | --- | --- | --- |
| Backend | `testwright-backend-dev` | http://localhost:8002 | Python 3.11 |
| Frontend | `testwright-frontend-dev` | http://localhost:3002 | Node 20 |

Both containers run as non-root users. They share the network `testwright-network`.

## Using it

- **Knowledge Management** — upload a PDF, DOCX, or image, then index it. Images must be under 4MB. Indexed documents are shared in one public knowledge base.
- **Test Case Generator** — write a request and generate test cases or user stories. Turn RAG on to use indexed documents.
- **ETL Test Generator** — describe sources, targets, and rules, then generate a script or Excel file.

## After you change code

Frontend files in `frontend/src` and `frontend/public` update in the running app.

Backend files are mounted from `api/`, but the API process does not reload. Restart it after a backend change:

```bash
docker compose restart backend
```

If you change `api/requirements.txt` or `frontend/package.json`, rebuild that service:

```bash
docker compose build backend
docker compose build frontend
docker compose up -d
```

After you edit `.env`, recreate the containers so they pick up the new values:

```bash
docker compose up -d
```

## Stop

```bash
docker compose down
```

## Useful commands

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose exec backend bash
docker compose exec frontend sh
```

## If something fails

- **Port already in use:** free port 8002 and port 3002, then start again. The app is wired to those ports. Changing only the published port in `docker-compose.yml` leaves the browser calling `http://localhost:8002`.
- **Build cannot find `.env`:** create `.env` in the project root from `.env.example` before `docker compose up --build`.
- **OpenAI or Weaviate errors:** check the key and the REST host, then `docker compose up -d` so the containers pick up the edited file.
- **A dependency change did not apply:** rebuild that service with `docker compose build --no-cache backend` or `docker compose build --no-cache frontend`.
