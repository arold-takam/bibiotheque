# 🛠️ MANUAL_INFRA — Prendre l'infra en main (test Swagger + UI)

> **But** : lancer et tester **toi-même** le projet, sans dépendre de l'agent.
> Deux modes : **Docker Compose** (recommandé, 1 commande) et **manuel** (sans
> Docker). Toutes les urls, comptes et commandes de test sont éprouvées.

---

## 0. Prérequis

| Outil | Commande de vérif |
|---|---|
| Docker Desktop **démarré** | `docker version` |
| `docker compose` (v2) | `docker compose version` |
| JDK 17+ | `java -version` |
| Node 20 | `node -v` |
| `curl` | `curl --version` |

---

## 1. Démarrer — MODE DOCKER (recommandé, 3 conteneurs)

Depuis la racine du projet (`bibiotheque/`) :

```bash
docker compose up --build -d
```

Attends que **3 conteneurs** soient `Up` :

```bash
docker compose ps
```

| Service    | Conteneur            | URL locale | Rôle |
|-----------|----------------------|-----------|------|
| db        | bibliotheque-db      | 5432      | PostgreSQL 15 |
| backend   | bibliotheque-backend | :8080     | API Spring Boot + Swagger |
| frontend  | bibliotheque-frontend| :4200     | UI Angular (nginx) |

Arrêter / purger :

```bash
docker compose down        # stop (garde la base)
docker compose down -v     # stop + supprime la base (le seed se recrée au redémarrage)
```

> 🔁 En cas de doute : `docker compose down -v && docker compose up --build -d`.

---

## 2. Méthode MANUELLE (sans Docker) — 3 terminaux

**Base** (dans un terminal) :
```bash
docker compose up -d db          # SEULEMENT la base, en arrière-plan
```

**Backend** (2e terminal, depuis `bibliotheque-backend/`) :
```bash
./mvnw spring-boot:run           # boot en ~1 min ; le port 8080 doit écouter
```

**Frontend** (3e terminal, depuis `bibliotheque-frontend/`) :
```bash
npm install                      (une 1ère fois)
npm start                        # ng serve -> http://localhost:4200
```

---

## 3. Tester l'API dans **Swagger**

1. Ouvre Swagger : **http://localhost:8080/swagger-ui.html**
2. Va sur **`POST /authenticate`** → *Try it out* :

```json
{ "username": "A1", "password": "a1" }
```

3. Copier le **`jwtToken`** renvoyé (ex. `eyJhbGciOi...`).
4. En haut à droite : bouton **Authorize** → colle :
   ```
   Bearer eyJhbGciOi...
   ```
5. Explore les 5 endpoints **Réservation** :
   - `POST /api/reservations` → 201/400/404/409
   - `GET /api/reservations` → 200
   - `GET /api/reservations/{id}` → 200/404
   - `PATCH /api/reservations/{id}/annuler` → 200/404/409
   - `DELETE /api/reservations/{id}` → 204/404

---

### 3.1 — Les règles de gestion à tester (RG)

| Règle | Action | Réponse attendue |
|---|---|---|
| RG-01 | Réserver un livre **disponible** (ex. B2) | **409** (livre indisponible requis) |
| RG-01' | Réserver un livre **indisponible** | **201** Créé |
| RG-02 | Réserver 2× le même livre actif | **409** |
| RG-03 | Dépasser **3** réservations actives | **409** |
| RG-04 | Voir `dateExpiration = dateReservation + 7j` | calcul serveur |
| RG-05 | Annuler une résa `ANNULEE` | **409** |
| RG-06 | Changer une résa `ANNULEE/EXPIREE/HONOREE` | **409** |

---

## 4. Tester l'API en **curl** (rapide, sans Swagger)

```bash
# 1. Connexion A1 (Admin+User)
TOKEN=$(curl -s -X POST http://localhost:8080/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"A1","password":"a1"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["jwtToken"])')

# 2. Liste des livres (B1..B6 ; B1 doit être à 1 exemplaire)
curl -s http://localhost:8080/admin/books -H "Authorization: Bearer $TOKEN"

# 3. Emprunts de A1 (doit montrer A1 -> B1, le borrowId 1)
curl -s http://localhost:8080/borrow/user/1 -H "Authorization: Bearer $TOKEN"

# 4. Emprunter un livre (ex. bookId 2 si B2)
curl -s -X POST http://localhost:8080/borrow \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"bookId":2,"userId":1}'

# 5. Rendre ce livre (le borrowId = celui retourné à l'étape 4)
curl -s -X PUT http://localhost:8080/borrow \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"borrowId":2,"bookId":2,"userId":1}'
```

---

## 5. Tester l'**UI** (navigateur)

1. Ouvre **http://localhost:4200**.
2. Connecte-toi avec **un des comptes seed** :

| User | mdp | Rôle |
|---|---|---|
| A1 | a1 | Admin + User |
| A2 | a2 | User |
| A3 | a3 | User |
| A4 | a4 | User |
| A5 | a5 | User |

3. **Parcours Admin (A1)** : Gérer les livres (CRUD) → créer/modifier/supprimer un livre.
4. **Parcours User** : Emprunter un livre → Rendre → voir son historique.
5. **Déconnexion** (header) → confirmer le retour à la page de login.

---

## 6. Vérifier la base (optionnel)

```bash
docker exec -it bibliotheque-db psql -U bibliotheque -d bibliotheque -c '\dt'
docker exec -it bibliotheque-db psql -U bibliotheque -d bibliotheque -c 'SELECT username FROM users;'
```

---

## 🔍 Si un problème

| Symptôme | Diagnostic / Fix |
|---|---|
| backend down | `docker compose logs backend` (recherche `seed` et `Started`) |
| Swagger 302 sur `/swagger-ui.html` | normal → **http://localhost:8080/swagger-ui/index.html** |
| bookId ≠ 1..6 | la table était pré-existante ; **répurge** : `docker compose down -v && up` |
| CORS au front | les en-têtes ne sont pas configurés → backend attend `localhost:8080` |

---
*Manuel généré pour le projet `bibiotheque` (KFOKAM48 — Séance 1+2).*