# Testwright

Testwright is a local app I built for the writing that sits around a software release: test cases from a requirements document, user stories from a rule list, and checks for a data pipeline. A QA analyst usually starts from a PDF spec, a process diagram, or a spreadsheet of business rules. A data engineer starts from a source-to-target mapping. The app takes those inputs and drafts the tests.

## What you can do

**Knowledge Management.** This is the document store a test cycle normally depends on: requirement specs, interface descriptions, and diagrams. A PDF, DOCX, or an image under 4MB can be uploaded. The app extracts the text, shows the chunks, and indexes them so a later question can find the relevant pages. Images go through a vision model, which is how a database diagram or a flowchart becomes searchable text. Documents can be renamed or deleted from the same screen.

**Test Case Generator.** This is the main workflow, and it uses retrieval-augmented generation (RAG). The request reads the way it would be handed to a tester: the feature, the rules, the amounts, the roles. The app embeds that request, retrieves the closest chunks from the indexed documents, and asks the model to write cases from both. The retrieved pages supply the real field names, screens, and process steps. The request decides which behavior is in scope, so a banking spec already in the knowledge base does not replace a refund or enrollment question typed into the form.

RAG can be turned off. The same screen then writes cases from the request alone, which is the right mode for a self-contained rule list with no spec behind it.

User stories can be generated first. Those stories, including their acceptance criteria, are sent with the request when the test cases are written, so the cases follow the stories instead of a looser reading of the original sentence. The preview is the table to review. Download Excel saves that same table.

The number of cases follows the request. A short rule list stays small. A long list of rules, boundaries, and acceptance criteria grows past twenty. Twenty is not a target.

**ETL Test Generator.** Pipeline testing is a different job from UI testing. The question is whether a transformation did what the mapping says: a rename, a cast, a calculation, a filter, a null check, a duplicate check. Manual Entry takes the source, the target, the test type, and the rules. The script is a test of that rule: it builds the expected rows, reads the same columns from the target, and asserts they match. File Upload reads the kind of mapping sheet a warehouse project already keeps and writes one workbook of cases for those columns. Test types cover data validation, transformation, integrity, performance, error handling, and incremental load.

## How generation works

RAG is the path from a document to a test case. Documents are split into chunks of 250 tokens with an overlap of 50, so a rule that crosses a page boundary still lands in one chunk. Each chunk is embedded and stored in Weaviate. A request is embedded with the same model, and the nearest chunks come back as context for the chat model.

The request stays in charge of the answer. Retrieved text is there for names, screens, and steps that belong to that request. When user stories were generated first, those stories are part of the request, and the cases are written against their acceptance criteria. Each distinct rule, role, threshold, rejection, and boundary gets its own case.

Model output comes back as CSV, often wrapped in commentary or cut off once a reply gets long. The parser keeps the real test-case rows, and if a reply stops early the generator asks for the rest and appends those rows. The Excel file is built from the rows on screen, so the download matches the preview.

ETL prompts ask for an assertion in the language named on the form, usually Python with Spark. The script uses the real source and target names from that form.

## Models

Two OpenAI models do the language work. Weaviate stores the vectors and returns the nearest chunks. It does not write the cases.

**`gpt-4o`** is the chat model (`OPENAI_CHAT_MODEL`). It writes the user stories, the test cases, and the ETL scripts. It also reads uploaded images: a diagram or chart is sent as an image, and the model returns the tables, fields, and relationships as text that can be indexed. A test-case reply can run to 16,384 tokens, which is this model's completion limit. If a long table is cut off there, the app asks for the remaining rows and appends them.

**`text-embedding-ada-002`** is the embedding model (`OPENAI_EMBEDDING_MODEL`). It does not write cases. It turns a passage into a vector so similar text lands near each other. Every document chunk is embedded with it before storage, and the test-case request is embedded with the same model at search time. Both sides use this model so the vectors line up.

**Weaviate** is the vector database. Chunks live in a collection named `Business`, with the chunk text, document id, chunk index, user id, and the vector `text-embedding-ada-002` already produced. The collection uses no Weaviate vectorizer, so Weaviate does not call OpenAI itself. The vector index is `hfresh`, which is the index this cluster accepts. Search is `near_vector`: the request vector is compared with the stored vectors, and the closest chunks are the RAG context for `gpt-4o`.

## Stack

The interface is React 19, Vite, and Material UI 7. The API is FastAPI. Pydantic models define the requests. PDF text comes from pdfplumber, Word text from python-docx, and the workbooks from pandas and openpyxl.

The frontend calls `http://localhost:8002`. That address is `API_BASE_URL` in `frontend/src/services/api.js`.

## Run it

You need Python 3.9 or newer, Node.js 18 or newer, an OpenAI key that can call `gpt-4o` and `text-embedding-ada-002`, and a Weaviate Cloud cluster. `WEAVIATE_URL` is the REST host, for example `https://your-cluster.weaviate.cloud`. Leave off `/v1`. The app adds `https://` if you omit the scheme.

Full notes are in [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md). Docker is in [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

```bash
cp .env.example .env
```

```env
WEAVIATE_API_KEY=your_weaviate_api_key_here
WEAVIATE_URL=your_weaviate_url_here

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_CHAT_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

VITE_BACKEND_URL=http://localhost:8002
```

`VITE_BACKEND_URL` is unused by the dev frontend. Restart the backend after you change `.env`. `FASTAPI_PORT` defaults to 8002 and `FASTAPI_DEBUG` defaults to true, which reloads the API while you edit it.

Backend, from the project folder:

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python start.py
```

On Windows, `python -m venv .venv` is fine if `python3` is not the command. The API is at http://localhost:8002 and the docs are at http://localhost:8002/docs.

Frontend, from the project folder in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app is at http://localhost:3002. Health is at http://localhost:8002/health.

Docker, after `.env` exists:

```bash
docker compose up --build
```

That stack is the Vite dev server and FastAPI in containers named `testwright-backend-dev` and `testwright-frontend-dev`. Frontend edits show up immediately. Backend edits need `docker compose restart backend`. After an `.env` change, `docker compose up -d` recreates the containers. Stop with `docker compose down`.

## Using the screens

1. Open Knowledge Management, upload a PDF, DOCX, or image, check the extracted text, and index it.
2. Open Test Case Generator and write the request. Leave RAG on when the cases should use an indexed spec. Turn it off for a self-contained rule list. Generate user stories first when the cases should follow those acceptance criteria.
3. Review the preview, then download Excel.
4. Open ETL Test Generator for a pipeline rule. Manual Entry takes the source, target, test type, language, and rules. File Upload takes a mapping workbook. Test types are Data Validation, Data Transformation, Data Integrity, Performance Testing, Error Handling, and Incremental Load Testing.

## API

The running app uses the user id `public`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Status |
| GET | `/health` | Health |
| POST | `/api/documents/upload` | Extract text from a PDF or DOCX |
| POST | `/api/documents/index` | Store those chunks in Weaviate |
| POST | `/api/images/upload` | Read an image with the vision model |
| POST | `/api/images/index` | Store the image text |
| POST | `/api/rag/generate` | User stories, or test cases as markdown |
| POST | `/api/rag/preview-test-cases` | Test cases for the preview table |
| POST | `/api/rag/download-excel` | Workbook of the preview rows |
| POST | `/api/etl/generate-script` | ETL test script |
| POST | `/api/etl/download-excel` | ETL cases from the manual form |
| POST | `/api/etl/upload-excel` | Read a mapping sheet |
| POST | `/api/etl/generate-excel-from-upload` | ETL cases from that sheet |
| GET | `/knowledge/{user_id}` | List indexed documents |
| GET | `/knowledge/{user_id}/{doc_id}/details` | Chunks for one document |
| PUT | `/knowledge/{user_id}/{doc_id}/rename` | Rename a document |
| DELETE | `/knowledge/{user_id}/{doc_id}` | Delete a document |

Interactive docs are at http://localhost:8002/docs while the API is running.

## Layout

```
api/                  FastAPI app, services, and generation code
frontend/             React app
docker-compose.yml    Local containers
Dockerfile.backend
Dockerfile.frontend
LOCAL_DEPLOYMENT.md
DOCKER_DEPLOYMENT.md
```

`api/main.py` is the route layer. Document, image, knowledge, RAG, and ETL work live in `api/services/`. Chunking, retrieval, prompts, CSV parsing, and Excel writing live in `api/utils/backend_utils.py`. The screens are `frontend/src/components/`, and `frontend/src/services/api.js` is the client.

## If something fails

- **Port in use.** Free 8002 or 3002. A new frontend port also goes in the CORS list in `api/main.py`. A new backend port also becomes `API_BASE_URL` in `frontend/src/services/api.js` and `FASTAPI_PORT` in `.env`.
- **Missing API key.** `.env` sits in the project root, with no spaces around `=`.
- **OpenAI errors.** Check `OPENAI_API_KEY` and that `OPENAI_CHAT_MODEL` is a model the key can call. Images need a vision model such as `gpt-4o`.
- **Weaviate errors.** Use the REST host, not the gRPC host, and do not add `/v1`.
- **Uploads.** Images must be under 4MB. Documents are PDF or DOCX. ETL mapping files are Excel.
- **Frontend install.** Use Node 18 or newer, then `rm -rf node_modules && npm install` inside `frontend/`.
