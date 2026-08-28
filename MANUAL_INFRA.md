# 🛠️ MANUAL_INFRA — Prendre l'infra en main

> **But** : lancer et tester le projet, sans dépendre de l'agent.

---

## 0. Prérequis

| Outil | Commande de vérif |
|---|---|
| Docker Desktop démarré | `docker version` |
| docker compose v2 | `docker compose version` |
| JDK 17+ | `java -version` |
| Node 20 | `node -v` |

---

## 1. Démarrer — Docker Compose (recommandé)

```bash
cd bibiotheque
docker compose down -v
docker compose up --build -d
docker compose ps  # → 3 conteneurs UP
```

| Service | Conteneur | URL | Rôle |
|---------|-----------|-----|------|
| db | bibliotheque-db | 5432 | PostgreSQL 15 |
| backend | bibliotheque-backend | :8080 | API + Swagger |
| frontend | bibliotheque-frontend | :4200 | Angular UI |

### Arrêter
```bash
docker compose down        # stop (garde la base)
docker compose down -v     # stop + supprime la base (seed se recrée)
```

---

## 2. Tester Swagger

1. Ouvrir : **http://localhost:8080/swagger-ui.html**
2. Login : `POST /authenticate` → `{"username":"A1","password":"a1"}`
3. Copier le `jwtToken` → bouton **Authorize** → `Bearer eyJ...`
4. Tester les 5 endpoints Réservation :
   - `POST /api/reservations` → 201/400/404/409
   - `GET /api/reservations` → 200
   - `GET /api/reservations/{id}` → 200/404
   - `PATCH /api/reservations/{id}/annuler` → 200/404/409
   - `DELETE /api/reservations/{id}` → 204/404

### Règles de gestion

| Règle | Action | Attendu |
|-------|--------|---------|
| RG-01 | Réserver livre **disponible** (B1) | **409** |
| RG-01' | Réserver livre **indisponible** (B2) | **201** |
| RG-02 | 2e résa sur même livre | **409** |
| RG-03 | Dépasser 3 réservations actives | **409** |
| RG-04 | Vérifier `dateExpiration = dateReservation + 7j` | calcul serveur |
| RG-05 | Annuler résa EN_ATTENTE | **200** |
| RG-06 | Annuler résa ANNULEE | **409** |

---

## 3. Tester l'UI

1. Ouvrir **http://localhost:4200**
2. Login avec :
   - `A1/a1` (Admin+User)
   - `A2/a2`, `A3/a3`, `A4/a4`, `A5/a5` (User)
3. Navigation : **Reservations** → liste, formulaire, annulation

---

## 4. Seed données

| Réf. | Livre | État | Copies |
|------|-------|------|--------|
| L1 | B1 | Disponible | 2 |
| L2 | B2 | Emprunté (A3+A4) | 0 |
| L3 | B3 | Emprunté (A3+A4) | 0 |
| L4 | B4 | Emprunté (A3+A4) | 0 |
| L5 | B5 | Emprunté (A3+A4) | 0 |
| L6 | B6 | Disponible | 2 |

---

## 5. Vérifier la base

```bash
docker exec -it bibliotheque-db psql -U bibliotheque -d bibliotheque -c '\\dt'
docker exec -it bibliotheque-db psql -U bibliotheque -d bibliotheque -c 'SELECT username FROM users;'
docker exec -it bibliotheque-db psql -U bibliotheque -d bibliotheque -c 'SELECT book_name, no_of_copies, disponible FROM books;'
```

---

## 6. Tests

```bash
# Backend
cd bibiotheque/bibliotheque-backend && ./mvnw test

# Frontend
cd bibiotheque/bibliotheque-frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

---

## 🔍 Problèmes courants

| Symptôme | Fix |
|----------|-----|
| backend down | `docker compose logs backend` |
| Swagger 302 | Utiliser `/swagger-ui/index.html` |
| bookId != 1..6 | `docker compose down -v && up` (purger la base) |
| CORS | Backend attend `localhost:8080` |
| Font inlining error | Lien Google Fonts retiré de `index.html` |

---
*Manuel généré pour le projet `bibliotheque` — Session 3*
