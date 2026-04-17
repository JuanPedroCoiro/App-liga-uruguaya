from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import Base, engine
from app.routers import teams, players, matches, stats, auth, favorites

app = FastAPI()

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # puerto por defecto de Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(teams.router)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(stats.router)
app.include_router(auth.router)
app.include_router(favorites.router)

@app.get("/")
def root():
    return {"message": "API Liga Uruguaya funcionando"}