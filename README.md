# Land Monitoring System MVP

## Overview
This project is an automated land monitoring system designed for the CSIDC Hackathon. It uses satellite imagery and reference maps to detect encroachments and deviations in industrial land allotments.

## Tech Stack
-   **Frontend**: React (Vite) + Tailwind CSS
-   **Backend**: Python (FastAPI) + OpenCV

## Setup Instructions

### Backend
1.  Navigate to `backend/`.
2.  Create a virtual environment: `python -m venv venv`.
3.  Activate it: `venv\Scripts\activate` (Windows).
4.  Install dependencies: `pip install -r requirements.txt`.
5.  Run server: `uvicorn main:app --reload`.

### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Run dev server: `npm run dev`.
