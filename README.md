# Vedo WebApp

Web-based GUI for mesh processing with Vedo.

## Tech Stack

- **Frontend**: React + Three.js + Mantine
- **Backend**: FastAPI + Vedo

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /mesh/import` - Upload mesh
- `GET /mesh/{id}/analyze` - Analyze mesh
- `POST /mesh/{id}/transform` - Transform mesh
- `POST /mesh/{id}/fix` - Fix mesh issues
- `GET /mesh/{id}/export` - Export mesh

## License

MIT
