# EVIDENCE-TESTS — http://localhost:8080 — 28/08/2026 11:47

Comptes seed : A1 (Admin+User, mdp a1), A2..A5 (User, mdp a2..a5). Livres B1..B6 (B1: 1 exemplaire — A1 l'a emprunté). Codes observés par curl réel.

## 1. Authentification

| Verdict | Requête | Cas | Code | Extrait |
| MISMATCH | `POST http://localhost:8080/authenticate` | Login A1 (Admin+User) | **401** (att. 200) | `` |
| MISMATCH | `POST http://localhost:8080/authenticate` | Login A2 (User) | **401** (att. 200) | `` |
| OK | `POST http://localhost:8080/authenticate` | SAD mdp faux | **401** (att. 401) | `` |
| OK | `POST http://localhost:8080/authenticate` | SAD user inconnu | **401** (att. 401) | `` |
| MISMATCH | `POST http://localhost:8080/authenticate` | SAD body vide | **401** (att. 400) | `` |

## 2. Livres (/admin/books)

| Verdict | Requête | Cas | Code | Extrait |
| MISMATCH | `GET http://localhost:8080/admin/books` | GET liste (public) | **401** (att. 200) | `` |
| OK | `POST http://localhost:8080/admin/books` | SAD create sans token | **401** (att. 401) | `` |
| OK | `POST http://localhost:8080/admin/books` | HAPPY create B7 (Admin) | **200** (att. 200) | `{"bookId":12,"bookName":"B7","bookAuthor":"Auteur B7","bookGenre":"Divers","noOfCopies":2,"disponible":true}` |
| MISMATCH | `POST http://localhost:8080/admin/books` | SAD create sans bookName | **200** (att. 400) | `{"bookId":13,"bookName":null,"bookAuthor":"Y","bookGenre":"Z","noOfCopies":1,"disponible":true}` |
| OK | `POST http://localhost:8080/admin/books` | SAD create par A2 (User) | **403** (att. 403) | `{"timestamp":"2026-08-28T10:47:18.448+00:00","status":403,"error":"Forbidden","message":"","path":"/admin/books"}` |
| OK | `PUT http://localhost:8080/admin/books/9999` | SAD update livre 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:18.633945181","status":404,"error":"Not Found","message":"Book with id 9999 does not exist."}` |
| OK | `DELETE http://localhost:8080/admin/books/9999` | SAD delete livre 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:18.849594373","status":404,"error":"Not Found","message":"Book with id 9999 does not exist."}` |

## 3. Utilisateurs (/admin/users)

| Verdict | Requête | Cas | Code | Extrait |
| OK | `GET http://localhost:8080/admin/users` | GET liste users (A1) | **200** (att. 200) | `[{"userId":1,"username":"A1","name":"A1","password":"$2a$10$IdvXfgFYZqmz8hklxmJ9jObelKdPBeqeOI7vm.AaSYZHR2C7/AAUq","role":[{"roleId":1,"roleName":"Admin"},{"roleId":2,"roleName":"User"}]},{"userId":2,"username":"A2","nam` |
| OK | `GET http://localhost:8080/admin/users` | SAD GET users par A2 (User) | **403** (att. 403) | `{"timestamp":"2026-08-28T10:47:19.651+00:00","status":403,"error":"Forbidden","message":"","path":"/admin/users"}` |
| OK | `GET http://localhost:8080/admin/users/9999` | SAD GET user 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:20.364628536","status":404,"error":"Not Found","message":"User with id 9999 does not exist."}` |

## 4. Emprunts (/borrow)

| Verdict | Requête | Cas | Code | Extrait |
| OK | `GET http://localhost:8080/borrow/user/1` | HAPPY emprunts A1 (A1->B1 preload) | **200** (att. 200) | `[]` |
| MISMATCH | `GET http://localhost:8080/borrow/user/999` | SAD emprunts user 999 | **200** (att. 404) | `[]` |
| MISMATCH | `POST http://localhost:8080/borrow` | HAPPY A2 emprunte B2 | **409** (att. 200) | `{"timestamp":"2026-08-28T10:47:22.988161457","status":409,"error":"Conflict","message":"Le livre \"B2\" est indisponible!"}` |
| OK | `POST http://localhost:8080/borrow` | SAD re-emprunt B2 (plus de dispo) | **409** (att. 409) | `{"timestamp":"2026-08-28T10:47:23.374239906","status":409,"error":"Conflict","message":"Le livre \"B2\" est indisponible!"}` |
| OK | `POST http://localhost:8080/borrow` | SAD emprunt livre 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:23.559674768","status":404,"error":"Not Found","message":"Book with id 9999 does not exist."}` |
| OK | `PUT http://localhost:8080/borrow` | HAPPY A2 rend B2 | **200** (att. 200) | `{"borrowId":9,"bookId":6,"userId":2,"issueDate":"28-08-2026","returnDate":"28-08-2026","dueDate":"04-09-2026"}` |
| MISMATCH | `PUT http://localhost:8080/borrow` | SAD re-rendre meme borrow | **200** (att. 409) | `{"borrowId":9,"bookId":6,"userId":2,"issueDate":"28-08-2026","returnDate":"28-08-2026","dueDate":"04-09-2026"}` |
| OK | `PUT http://localhost:8080/borrow` | SAD rend borrow 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:24.208616260","status":404,"error":"Not Found","message":"Livre emprunte avec l'id 9999 introuvable."}` |

## 5. Reservations (/api/reservations) — module 27 pts

| Verdict | Requête | Cas | Code | Extrait |
| MISMATCH | `POST http://localhost:8080/api/reservations` | RG-01 SAD: A2 reserve B3 (dispo) | **201** (att. 409) | `{"reservationId":1,"livreId":8,"livreName":"B3","adherentId":2,"adherentName":"A2","dateReservation":"28-08-2026","dateExpiration":"04-09-2026","statut":"EN_ATTENTE"}` |
| OK | `POST http://localhost:8080/api/reservations` | RG-01 SAD: A2 reserve B1 (dispo 1 ex) | **409** (att. 409) | `{"timestamp":"2026-08-28T10:47:26.368636981","status":409,"error":"Conflict","message":"RG-01 : le livre \"B1\" est disponible, impossible de le réserver."}` |
| OK | `POST http://localhost:8080/borrow` | SETUP: A2 emprunte dernier ex B1 | **200** (att. 200) | `A2 has borrowed one copy of "B1"!` |
| MISMATCH | `POST http://localhost:8080/api/reservations` | RG-01 HAPPY: A3 reserve B1 (indispo) | **409** (att. 201) | `{"timestamp":"2026-08-28T10:47:27.004782861","status":409,"error":"Conflict","message":"RG-01 : le livre \"B1\" est disponible, impossible de le réserver."}` |
| OK | `POST http://localhost:8080/api/reservations` | RG-02 SAD: A3 double B1 | **409** (att. 409) | `{"timestamp":"2026-08-28T10:47:28.315722824","status":409,"error":"Conflict","message":"RG-01 : le livre \"B1\" est disponible, impossible de le réserver."}` |
| OK | `POST http://localhost:8080/api/reservations` | SAD sans livreId | **400** (att. 400) | `{"timestamp":"2026-08-28T10:47:28.593949997","status":400,"error":"Bad Request","message":"livreId est obligatoire."}` |
| OK | `POST http://localhost:8080/api/reservations` | SAD sans adherentId | **400** (att. 400) | `{"timestamp":"2026-08-28T10:47:28.793400430","status":400,"error":"Bad Request","message":"adherentId est obligatoire."}` |
| OK | `POST http://localhost:8080/api/reservations` | SAD livre 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:28.995957523","status":404,"error":"Not Found","message":"Livre avec l'id 9999 introuvable."}` |
| OK | `GET http://localhost:8080/api/reservations` | HAPPY GET liste | **200** (att. 200) | `[{"reservationId":1,"livreId":8,"livreName":"B3","adherentId":2,"adherentName":"A2","dateReservation":"28-08-2026","dateExpiration":"04-09-2026","statut":"EN_ATTENTE"}]` |
| OK | `GET http://localhost:8080/api/reservations?adherentId=3` | HAPPY GET filtre adherent 3 | **200** (att. 200) | `[]` |
| OK | `GET http://localhost:8080/api/reservations/` | HAPPY GET resa  | **200** (att. 200) | `[{"reservationId":1,"livreId":8,"livreName":"B3","adherentId":2,"adherentName":"A2","dateReservation":"28-08-2026","dateExpiration":"04-09-2026","statut":"EN_ATTENTE"}]` |
| OK | `GET http://localhost:8080/api/reservations/9999` | SAD GET resa 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:30.314464052","status":404,"error":"Not Found","message":"Réservation avec l'id 9999 introuvable."}` |
| MISMATCH | `PATCH http://localhost:8080/api/reservations//annuler` | RG-05 HAPPY: annule EN_ATTENTE | **401** (att. 200) | `` |
| MISMATCH | `PATCH http://localhost:8080/api/reservations//annuler` | RG-06 SAD: re-annule ANNULEE | **401** (att. 409) | `` |
| OK | `PATCH http://localhost:8080/api/reservations/9999/annuler` | SAD annule resa 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:31.072507126","status":404,"error":"Not Found","message":"Réservation avec l'id 9999 introuvable."}` |
| MISMATCH | `DELETE http://localhost:8080/api/reservations/` | HAPPY DELETE resa active | **405** (att. 204) | `{"timestamp":"2026-08-28T10:47:33.664+00:00","status":405,"error":"Method Not Allowed","message":"","path":"/api/reservations/"}` |
| OK | `DELETE http://localhost:8080/api/reservations/9999` | SAD DELETE resa 9999 | **404** (att. 404) | `{"timestamp":"2026-08-28T10:47:33.920322906","status":404,"error":"Not Found","message":"Réservation avec l'id 9999 introuvable."}` |

## 6. Securite transversale

| Verdict | Requête | Cas | Code | Extrait |
| OK | `GET http://localhost:8080/admin/users` | SAD admin sans token | **401** (att. 401) | `` |
| OK | `GET http://localhost:8080/admin/users` | SAD token invalide | **401** (att. 401) | `` |
| OK | `POST http://localhost:8080/admin/books` | SAD A2 ecrit /admin/books | **403** (att. 403) | `{"timestamp":"2026-08-28T10:47:34.934+00:00","status":403,"error":"Forbidden","message":"","path":"/admin/books"}` |

---
**TOTAL partie 2 : 20 PASS / 8 FAIL**
