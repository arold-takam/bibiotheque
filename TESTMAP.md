# 🧪 TESTMAP — Plan de test complet (Backend + Frontend)

> **Objectif** : valider l'application de bout en bout (Swagger/curl → UI).
> **Port backend** : `8080` — **Port frontend** : `4200`
> **Prérequis** : Docker (PostgreSQL) + JDK 17 + Node 20

---

## 📋 Sommaire

| Phase | Description | Points |
|-------|-------------|--------|
| [0. Démarrage](#0-démarrage) | Docker → Backend → Frontend | — |
| [1. Authentification](#1-authentification) | Login → JWT | — |
| [2. Seed données](#2-seed-données) | Vérif L1-L6, A1-A5 | — |
| [3. Livres (CRUD)](#3-livres-crud) | Lister, créer, modifier, supprimer | — |
| [4. Emprunts](#4-emprunts) | Emprunter, retourner | — |
| [5. Réservations API](#5-réservations-api) | CRUD + RG-01→RG-06 | 27 pts |
| [6. Réservations UI](#6-réservations-ui) | Écran complet | 38 pts |
| [7. Scénarios avancés](#7-scénarios-avancés) | Edge cases | — |

---

## 0. Démarrage

### 0.1 — Docker Compose (recommandé)
```bash
cd bibiotheque
docker compose down -v
docker compose up --build -d
docker compose ps  # → 3 conteneurs UP
```

### 0.2 — Vérifier le seed
```bash
docker compose logs backend | grep seed
```
Attendu :
```
[seed] 5 comptes créés : A1 (Admin+User) et A2..A5 (User), mots de passe a1..a5.
[seed] 6 livres créés : B1..B6 (2 exemplaires chacun, disponibles).
[seed] B2 : 2 copies empruntées (A3+A4), restant : 0, disponible=false
[seed] B3 : 2 copies empruntées (A3+A4), restant : 0, disponible=false
[seed] B4 : 2 copies empruntées (A3+A4), restant : 0, disponible=false
[seed] B5 : 2 copies empruntées (A3+A4), restant : 0, disponible=false
[seed] Seed terminé : L1(B1) dispo, L2-L5(B2-B5) empruntés, L6(B6) dispo.
```

---

## 1. Authentification

### Données de seed
| Utilisateur | Mot de passe | Rôles |
|------------|-------------|-------|
| `A1` | `a1` | Admin + User |
| `A2` | `a2` | User |
| `A3` | `a3` | User (emprunteur L2-L5) |
| `A4` | `a4` | User |
| `A5` | `a5` | User |

### Login
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"A1","password":"a1"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["jwtToken"])')
```

---

## 2. Seed données — Vérification

| Réf. | Livre | État | Copies | Disponible |
|------|-------|------|--------|-----------|
| L1 | B1 | **Disponible** | 2 | true |
| L2 | B2 | **Emprunté** (A3+A4) | 0 | false |
| L3 | B3 | **Emprunté** (A3+A4) | 0 | false |
| L4 | B4 | **Emprunté** (A3+A4) | 0 | false |
| L5 | B5 | **Emprunté** (A3+A4) | 0 | false |
| L6 | B6 | **Disponible** | 2 | true |

Vérification curl :
```bash
curl -s http://localhost:8080/admin/books -H "Authorization: Bearer $TOKEN"
# B1: copies=2, dispo=true
# B2-B5: copies=0, dispo=false
# B6: copies=2, dispo=true
```

---

## 3. Livres (CRUD)

```bash
# Lister
curl -s http://localhost:8080/admin/books -H "Authorization: Bearer $TOKEN"

# Créer
curl -s -X POST http://localhost:8080/admin/books \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"bookName":"Test","bookAuthor":"Auteur","bookGenre":"Test","noOfCopies":1,"disponible":true}'
```

---

## 4. Emprunts

```bash
# Emprunts A3 (détient L2-L5)
curl -s http://localhost:8080/borrow/user/3 -H "Authorization: Bearer $TOKEN"
```

---

## 5. Réservations API ⭐ (27 pts)

### 5.1 — RG-01 : Réserver un livre disponible → 409
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"livreId":6,"adherentId":1}'
# → 409 "RG-01 : le livre \"B1\" est disponible, impossible de le réserver."
```

### 5.2 — RG-01' : Réserver un livre indisponible → 201
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"livreId":7,"adherentId":1}'
# → 201 Created
```

### 5.3 — RG-02 : 2e réservation même livre → 409
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"livreId":7,"adherentId":1}'
# → 409 "RG-02 : l'adherent a déjà une réservation active sur ce livre."
```

### 5.4 — RG-03 : 4e réservation (max 3) → 409
Créer résa sur B3, B4, puis essayer B5 → 409.
```bash
# B3 → 201, B4 → 201, B5 → 409 "RG-03 : l'adherent a déjà 3 réservations actives."
```

### 5.5 — RG-05 : Annulation EN_ATTENTE → 200
```bash
curl -s -w "\nHTTP %{http_code}\n" -X PATCH http://localhost:8080/api/reservations/1/annuler \
  -H "Authorization: Bearer $TOKEN"
# → 200, statut: ANNULEE
```

### 5.6 — RG-06 : Annuler une ANNULEE → 409
```bash
curl -s -w "\nHTTP %{http_code}\n" -X PATCH http://localhost:8080/api/reservations/1/annuler \
  -H "Authorization: Bearer $TOKEN"
# → 409 "RG-06 : une réservation au statut ANNULEE ne peut plus changer d'état."
```

### 5.7 — 400 : Champ manquant
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"adherentId":1}'
# → 400 "livreId est obligatoire."
```

### 5.8 — 404 : Inexistant
```bash
curl -s -w "\nHTTP %{http_code}\n" http://localhost:8080/api/reservations/999 \
  -H "Authorization: Bearer $TOKEN"
# → 404 "Réservation avec l'id 999 introuvable."
```

---

## 6. Réservations UI ⭐ (38 pts)

Ouvrir http://localhost:4200 → Login A1/a1 → Réservations

### 6.1 — Liste
- [ ] Colonnes : Livre, Adhérent, Statut, Réservé le, Expire le, Action
- [ ] Filtre par statut (TOUS, EN_ATTENTE, DISPONIBLE, ANNULEE, EXPIREE, HONOREE)
- [ ] Badges couleur par statut

### 6.2 — 4 états
- [ ] **Chargement** : spinner visible pendant l'appel API
- [ ] **Données** : tableau rempli
- [ ] **Liste vide** : message "Aucune réservation"
- [ ] **Erreur** : message compréhensible + moyen de réessayer

### 6.3 — Formulaire
- [ ] 2 `<select>` : livre + adhérent (données de l'API)
- [ ] Bouton inactif tant que les 2 champs pas renseignés
- [ ] Après succès : liste rafraîchie sans rechargement

### 6.4 — Erreurs métier
- [ ] 409 (livre disponible) : message serveur affiché
- [ ] 409 (réservation existante) : message serveur affiché
- [ ] 409 (quota 3) : message serveur affiché
- [ ] 400 (champ manquant) : message serveur affiché
- [ ] 404 (inexistant) : message adapté
- [ ] Serveur injoignable : "Le serveur est injoignable."

### 6.5 — Annulation
- [ ] Bouton par ligne, visible seulement si EN_ATTENTE/DISPONIBLE
- [ ] Confirmation avant appel (confirm())
- [ ] Succès : statut mis à jour dans la liste
- [ ] 409 : message serveur affiché

### 6.6 — Architecture
- [ ] Service dédié (`ReservationService`)
- [ ] Composants découpés (container + liste + formulaire)
- [ ] Interface en français

---

## 7. Scénarios avancés

### 7.1 — Interaction Emprunt → Réservation
Si un exemplaire de B2 revient → la réservation EN_ATTENTE la plus ancienne passe DISPONIBLE.

### 7.2 — Scénario complet bout-en-bout
1. Login A1 → créer réservation B2 → 201
2. Vérifier dans la liste → EN_ATTENTE
3. Annuler → ANNULEE
4. Login A3 → voir emprunts

---

## ✅ Résumé des tests curl (validés)

| Test | Résultat |
|------|----------|
| RG-01: réserver disponible | ✅ 409 |
| RG-01: réserver indisponible | ✅ 201 |
| RG-02: 2e résa même livre | ✅ 409 |
| RG-03: 4e résa (max 3) | ✅ 409 |
| RG-05: annuler EN_ATTENTE | ✅ 200 |
| RG-06: annuler ANNULEE | ✅ 409 |
| 400: champ manquant | ✅ message OK |
| 404: inconnu | ✅ message OK |
| DELETE | ✅ 204 |
| Swagger | ✅ 5 endpoints |
| Angular tests | ✅ 26/26 |
| Maven tests | ✅ BUILD SUCCESS |

---
*Dernière mise à jour : 28 août 2026*
