# 🧪 TESTMAP — Plan de test complet (Backend)

> **Objectif** : valider l'application de bout en bout via Swagger ou curl.
> **Port backend** : `8080`
> **Prérequis** : Docker (PostgreSQL) + JDK 17 + Maven

---

## 📋 Sommaire

| Phase | Description | Points |
|-------|-------------|--------|
| [0. Démarrage](#0-démarrage) | Docker → Backend → Swagger | — |
| [1. Authentification](#1-authentification) | Login admin + user → JWT | — |
| [2. Livres (CRUD)](#2-livres-crud) | Lister, créer, modifier, supprimer | — |
| [3. Utilisateurs](#3-utilisateurs) | Lister, créer, modifier | — |
| [4. Emprunts](#4-emprunts) | Emprunter, retourner, historique | — |
| [5. Réservations](#5-réservations) | CRUD + RG-01→RG-06 | ⭐ 27 pts |
| [6. Scénarios avancés](#6-scénarios-avancés) | Edge cases, interactions | — |

---

## 0. Démarrage

### 0.1 — PostgreSQL (Docker)

```bash
cd bibiotheque
docker-compose up -d
```

Vérifier :
```bash
docker ps  # → un conteneur "bibdb" ou similaire en running
```

### 0.2 — Backend Spring Boot

```bash
cd bibiotheque-backend
./mvnw spring-boot:run
```

Vérifier dans les logs :
```
[seed] 5 comptes créés : A1 (Admin+User) et A2..A5 (User), mots de passe a1..a5.
[seed] 6 livres créés : B1..B6 (2 exemplaires chacun).
[seed] A1 a emprunté B1 (borrowId=1) ; B1 restant : 1 exemplaire(s).
Started BibliothequeApplication in X.XX seconds
```

### 0.3 — Swagger UI

Ouvrir dans le navigateur :
```
http://localhost:8080/swagger-ui.html
```

> ⚠️ **Important** : dans Swagger UI, clique sur **"Authorize"** (bouton en haut à droite) et colle le token JWT obtenu à l'étape 1. Format : `Bearer eyJhbGciOi...`

---

## 1. Authentification

### Données de seed (pré-enregistrées par DataSeeder)

| Utilisateur | Mot de passe | Rôles |
|------------|-------------|-------|
| `A1` | `a1` | Admin + User |
| `A2` | `a2` | User |
| `A3` | `a3` | User |
| `A4` | `a4` | User |
| `A5` | `a5` | User |

### 1.1 — Login Admin (A1)

```
POST /authenticate
Content-Type: application/json

{
  "username": "A1",
  "password": "a1"
}
```

**Attendu** : `200 OK` → `{ "user": {...}, "jwtToken": "eyJ..." }`

> 📌 **Copie le `jwtToken`** → tu en auras besoin pour TOUT le reste.

### 1.2 — Login User (A2)

```
POST /authenticate
Content-Type: application/json

{
  "username": "A2",
  "password": "a2"
}
```

**Attendu** : `200 OK` → `{ "user": {...}, "jwtToken": "eyJ..." }`

> 📌 **Copie ce 2ème token** aussi — tu en auras besoin pour les tests de réservation (un user normal).

### 1.3 — Login échoué (mauvais mot de passe)

```
POST /authenticate
Content-Type: application/json

{
  "username": "admin",
  "password": "wrongpassword"
}
```

**Attendu** : `401 Unauthorized`

---

## 2. Livres (CRUD)

> Tous les endpointsci-dessous nécessitent le **token Admin** (ou sont publics pour le GET all).
> Dans Swagger : Admin → **Authorize** → `Bearer <token_admin>`

### 2.1 — Lister tous les livres (PUBLIC — pas de token requis)

```
GET /admin/books
```

**Attendu** : `200 OK` → tableau de 3 livres (seed) :
```json
[
  { "bookId": 1, "bookName": "Le Petit Prince", "bookAuthor": "Antoine de Saint-Exupery", "bookGenre": "Conte", "noOfCopies": 5, "disponible": true },
  { "bookId": 2, "bookName": "1984", "bookAuthor": "George Orwell", "bookGenre": "Science-fiction", "noOfCopies": 3, "disponible": true },
  { "bookId": 3, "bookName": "Les Miserables", "bookAuthor": "Victor Hugo", "bookGenre": "Roman", "noOfCopies": 2, "disponible": true }
]
```

### 2.2 — Créer un livre (Admin)

```
POST /admin/books
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "bookName": "L'Étranger",
  "bookAuthor": "Albert Camus",
  "bookGenre": "Roman",
  "noOfCopies": 1,
  "disponible": true
}
```

**Attendu** : `200 OK` → livre créé avec `bookId: 4`

> 📌 **Note** le `bookId: 4` — on va l'utiliser pour les réservations.

### 2.3 — Modifier un livre (Admin)

```
PUT /admin/books/4
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "bookName": "L'Étranger (éd. revue)",
  "bookAuthor": "Albert Camus",
  "bookGenre": "Roman",
  "noOfCopies": 0,
  "disponible": false
}
```

**Attendu** : `200 OK` → `noOfCopies: 0`, `disponible: false`

> 📌 **Important** : on met **0 copies** pour pouvoir tester RG-01 (réserver un livre indisponible).

### 2.4 — Supprimer un livre (Admin)

```
DELETE /admin/books/4
Authorization: Bearer <token_admin>
```

**Attendu** : `200 OK` → `{ "deleted": true }`

### 2.5 — Accès refusé (User sans rôle Admin)

```
GET /admin/books/1
Authorization: Bearer <token_user>
```

**Attendu** : `403 Forbidden`

---

## 3. Utilisateurs

### 3.1 — Lister tous les utilisateurs (Admin)

```
GET /admin/users
Authorization: Bearer <token_admin>
```

**Attendu** : `200 OK` → tableau avec admin + user

### 3.2 — Créer un utilisateur (Admin)

```
POST /admin/users
Content-Type: application/json

{
  "username": "adherent3",
  "name": "Troisième Adhérent",
  "password": "pass123"
}
```

**Attendu** : `200 OK` → utilisateur créé avec `userId`

> 📌 **Note** le `userId` — on va l'utiliser comme `adherentId` pour les réservations.

### 3.3 — Modifier un utilisateur (Admin)

```
PUT /admin/users/3
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "name": "Adhérent 3 (modifié)",
  "username": "adherent3",
  "role": [{"roleId": 2, "roleName": "User"}]
}
```

**Attendu** : `200 OK`

### 3.4 — Voir un utilisateur (Admin)

```
GET /admin/users/3
Authorization: Bearer <token_admin>
```

**Attendu** : `200 OK`

---

## 4. Emprunts

> Tous les endpoints `/borrow/**` sont **publics** (pas de token requis dans la config actuelle).

### 4.1 — Emprunter un livre

```
POST /borrow
Content-Type: application/json

{
  "bookId": 1,
  "userId": 3
}
```

**Attendu** : `200 OK` → `"Troisième Adhérent has borrowed one copy of "Le Petit Prince"!"`

> 📌 **Vérification** : relève le `borrowId` dans la réponse (si elle est renvoyée) ou regarde les logs.

### 4.2 — Lister tous les emprunts

```
GET /borrow
```

**Attendu** : `200 OK` → tableau contenant l'emprunt créé

### 4.3 — Emprunts d'un utilisateur

```
GET /borrow/user/3
```

**Attendu** : `200 OK` → tableau avec l'emprunt de l'adhérent 3

### 4.4 — Retourner un livre

```
PUT /borrow
Content-Type: application/json

{
  "borrowId": 1,
  "bookId": 1,
  "userId": 3
}
```

**Attendu** : `200 OK` → emprunt avec `returnDate` rempli

> 📌 **Vérification** : après le retour, le `noOfCopies` du livre 1 doit être ré-incrémenté.

### 4.5 — Historique d'un livre

```
GET /borrow/book/1
```

**Attendu** : `200 OK` → tableau avec l'historique du livre 1

---

## 5. Réservations ⭐ (27 pts)

> Tous les endpoints nécessitent le **token JWT**.
> Dans Swagger : **Authorize** → `Bearer <token_user>`

### Données de test pour les réservations

On utilise le livre **"Les Miserables"** (`bookId: 3`, `noOfCopies: 2`, `disponible: true`).
Pour RG-01, on a besoin d'un livre **indisponible** → on va d'abord emprunter les 2 copies.

---

### Phase A — Préparer les données (rendre le livre 3 indisponible)

#### A.1 — Emprunter copie 1

```
POST /borrow
Content-Type: application/json

{
  "bookId": 3,
  "userId": 3
}
```

**Attendu** : `200 OK`

#### A.2 — Emprunter copie 2

```
POST /borrow
Content-Type: application/json

{
  "bookId": 3,
  "userId": 3
}
```

**Attendu** : `200 OK`

#### A.3 — Vérifier que le livre est maintenant indisponible

```
GET /admin/books/3
```

**Attendu** : `200 OK` → `"noOfCopies": 0, "disponible": false`

---

### Phase B — CRUD Réservations

#### B.1 — Créer une réservation (livre 3 = indisponible ✅)

```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 3,
  "adherentId": 3
}
```

**Attendu** : `201 Created`
```json
{
  "reservationId": 1,
  "livreId": 3,
  "livreName": "Les Miserables",
  "adherentId": 3,
  "adherentName": "Troisième Adhérent",
  "dateReservation": "2026-08-21T...",
  "dateExpiration": "2026-08-28T...",
  "statut": "EN_ATTENTE"
}
```

> 📌 **Note** le `reservationId: 1`

#### B.2 — Lister toutes les réservations

```
GET /api/reservations
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → tableau avec la réservation créée

#### B.3 — Filtrer par adherentId

```
GET /api/reservations?adherentId=3
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → tableau filtré

#### B.4 — Filtrer par statut

```
GET /api/reservations?statut=EN_ATTENTE
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → tableau filtré

#### B.5 — Voir une réservation par ID

```
GET /api/reservations/1
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → détail de la réservation

#### B.6 — Réservation inexistante

```
GET /api/reservations/99999
Authorization: Bearer <token_user>
```

**Attendu** : `404 Not Found`

---

### Phase C — RG-01 → RG-06 (Règles de gestion)

#### C.1 — ❌ RG-01 : Réserver un livre DISPONIBLE → 409

```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 1,
  "adherentId": 3
}
```

**Attendu** : `409 Conflict` → `"RG-01 : le livre \"Le Petit Prince\" est disponible, impossible de le réserver."`

#### C.2 — ❌ RG-02 : 2ème réservation sur le MÊME livre → 409

```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 3,
  "adherentId": 3
}
```

**Attendu** : `409 Conflict` → `"RG-02 : l'adherent a déjà une réservation active sur ce livre."`

#### C.3 — ✅ RG-02 OK : réservation sur un AUTRE livre indisponible

D'abord rendre le livre 2 ("1984") indisponible :
```
POST /borrow
Content-Type: application/json

{
  "bookId": 2,
  "userId": 3
}
```

Puis réserver :
```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 2,
  "adherentId": 3
}
```

**Attendu** : `201 Created` → réservation sur le livre 2

> 📌 **Note** le `reservationId: 2`

#### C.4 — ❌ RG-03 : 4ème réservation active (max 3) → 409

Créer une 3ème réservation sur un autre livre indisponible :

D'abord emprunter le livre 1 ("Le Petit Prince") pour le rendre indisponible :
```
POST /borrow
Content-Type: application/json

{
  "bookId": 1,
  "userId": 3
}
```

Puis réserver :
```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 1,
  "adherentId": 3
}
```

**Attendu** : `201 Created` → réservation 3 (maintenant 3 actives)

Maintenant, essayer une 4ème :
```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 3,
  "adherentId": 3
}
```

> ⚠️ **Attention** : RG-02 bloque ici (déjà une réservation active sur le livre 3). Il faut un 4ème livre indisponible. Crée un livre temporaire :

```
POST /admin/books
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "bookName": "Livre Test",
  "bookAuthor": "Auteur Test",
  "bookGenre": "Test",
  "noOfCopies": 1,
  "disponible": true
}
```

Puis emprunte-le :
```
POST /borrow
Content-Type: application/json

{
  "bookId": 5,
  "userId": 3
}
```

Puis essaie de réserver (4ème active) :
```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 5,
  "adherentId": 3
}
```

**Attendu** : `409 Conflict` → `"RG-03 : l'adherent a déjà 3 réservations actives."`

#### C.5 — ❌ Validation 400 : champs manquants

```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": null
}
```

**Attendu** : `400 Bad Request` → `"adherentId est obligatoire."`

```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "adherentId": null
}
```

**Attendu** : `400 Bad Request` → `"livreId est obligatoire."`

#### C.6 — ❌ 404 : livre inexistant

```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 99999,
  "adherentId": 3
}
```

**Attendu** : `404 Not Found` → `"Livre avec l'id 99999 introuvable."`

#### C.7 — ❌ RG-05 : Annulation d'une réservation non annulable

D'abord, on honore la réservation 2 (passer DISPONIBLE → HONOREE) :
```
PUT /api/reservations/2/honorer
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → `"statut": "HONOREE"`

Puis essaie d'annuler cette réservation honorée :
```
PATCH /api/reservations/2/annuler
Authorization: Bearer <token_user>
```

**Attendu** : `409 Conflict` → `"RG-06 : une réservation au statut HONOREE ne peut plus changer d'état."`

#### C.8 — ❌ RG-06 : Statut terminal non modifiable

Essaie de passer un `ANNULEE` en `EN_ATTENTE` :
```
PATCH /api/reservations/1/annuler
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → passe à `ANNULEE`

Puis essaie d'annuler encore :
```
PATCH /api/reservations/1/annuler
Authorization: Bearer <token_user>
```

**Attendu** : `409 Conflict` → `"RG-06 : une réservation au statut ANNULEE ne peut plus changer d'état."`

#### C.9 — ✅ Annulation valide (EN_ATTENTE → ANNULEE)

Créer une nouvelle réservation :
```
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token_user>

{
  "livreId": 5,
  "adherentId": 3
}
```

Puis annule-la :
```
PATCH /api/reservations/4/annuler
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → `"statut": "ANNULEE"`

#### C.10 — ✅ Changement manuel de statut

Passer une réservation EN_ATTENTE → DISPONIBLE :
```
PUT /api/reservations/3/disponible
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → `"statut": "DISPONIBLE"`

Puis honorer :
```
PUT /api/reservations/3/honorer
Authorization: Bearer <token_user>
```

**Attendu** : `200 OK` → `"statut": "HONOREE"`

---

### Phase D — Suppression

#### D.1 — Supprimer une réservation

```
DELETE /api/reservations/1
Authorization: Bearer <token_user>
```

**Attendu** : `204 No Content`

#### D.2 — Supprimer une réservation inexistante

```
DELETE /api/reservations/1
Authorization: Bearer <token_user>
```

**Attendu** : `404 Not Found`

---

### Phase E — Vérification Swagger

Dans Swagger UI (`http://localhost:8080/swagger-ui.html`) :

1. Vérifie que les **5 endpoints Réservation** sont listés :
   - `POST /api/reservations` → `201, 400, 404, 409`
   - `GET /api/reservations` → `200`
   - `GET /api/reservations/{id}` → `200, 404`
   - `PATCH /api/reservations/{id}/annuler` → `200, 404, 409`
   - `DELETE /api/reservations/{id}` → `204, 404`

2. Teste chaque endpoint directement depuis Swagger (bouton "Try it out")

---

## 6. Scénarios avancés

### 6.1 — Interaction Emprunt → Réservation (sync auto DISPONIBLE)

Le livre 3 ("Les Miserables") a une réservation `EN_ATTENTE` (réservation 4).

Si tu retournes un des emprunts du livre 3 :
```
PUT /borrow
Content-Type: application/json

{
  "borrowId": 1,
  "bookId": 3,
  "userId": 3
}
```

**Attendu** : la réservation `EN_ATTENTE` la plus ancienne du livre 3 passe **automatiquement** à `DISPONIBLE`.

> 📌 Vérifie avec :
> ```
> GET /api/reservations?adherentId=3
> ```
> La réservation sur le livre 3 doit avoir `"statut": "DISPONIBLE"`

### 6.2 — Scénario complet "bout en bout"

1. Login admin → token admin
2. Créer un livre avec 1 copie (`noOfCopies: 1`)
3. Emprunter ce livre → `noOfCopies` passe à 0, `disponible: false`
4. Login user → token user
5. Réserver ce livre → `201 Created`, statut `EN_ATTENTE`
6. Retourner l'emprunt → réservation passe à `DISPONIBLE` (sync auto)
7. Honorer la réservation → `HONOREE`

### 6.3 — Multi-utilisateurs

```
POST /admin/users
Content-Type: application/json

{
  "username": "user2",
  "name": "Deuxième User",
  "password": "pass123"
}
```

Puis login avec ce user et tente des réservations concurrentes sur le même livre.

---

## 📊 Récapitulatif des codes HTTP attendus

| Opération | HTTP | Statut |
|-----------|------|--------|
| Login OK | 200 | ✅ |
| Login KO | 401 | ❌ |
| Lister livres (public) | 200 | ✅ |
| Créer livre (admin) | 200 | ✅ |
| Emprunter livre indisponible | 409 | ❌ |
| Réserver livre disponible (RG-01) | 409 | ❌ |
| Réserver livre indisponible | 201 | ✅ |
| 2ème réservation même livre (RG-02) | 409 | ❌ |
| 4ème réservation active (RG-03) | 409 | ❌ |
| POST sans livreId (400) | 400 | ❌ |
| POST livre inexistant (404) | 404 | ❌ |
| Annuler réservation EN_ATTENTE | 200 | ✅ |
| Annuler réservation ANNULEE (RG-06) | 409 | ❌ |
| Annuler réservation HONOREE (RG-06) | 409 | ❌ |
| GET réservation inexistante | 404 | ❌ |
| DELETE réservation | 204 | ✅ |
| DELETE réservation inexistante | 404 | ❌ |
| Retour emprunt → réservation DISPONIBLE | 200 | ✅ |

---

*Fin du TESTMAP — Bon testing ! 🚀*
