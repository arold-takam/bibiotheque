#!/usr/bin/env bash
# Job d'initialisation (bonus) : insère le compte administrateur et quelques
# livres au premier démarrage, de sorte qu'un `docker compose up` sur une
# machine vierge donne une application immédiatement utilisable.
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
DB_NAME="bibliotheque"
ROOT_PASS="${MYSQL_ROOT_PASSWORD:-mysql}"

MYSQL=(mysql -h "$DB_HOST" -u root -p"$ROOT_PASS" "$DB_NAME" --batch --skip-column-names)

echo "[seed] Attente de la table 'users' (créée par Hibernate au démarrage du backend)..."
ready=0
for _ in $(seq 1 90); do
  if [ -n "$("${MYSQL[@]}" -e "SHOW TABLES LIKE 'users';" 2>/dev/null)" ]; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" != "1" ]; then
  echo "[seed] ERREUR : table 'users' introuvable après 3 minutes." >&2
  exit 1
fi
echo "[seed] Table 'users' prête."

# Idempotence : si admin existe déjà, on ne réinsère rien.
if [ "$("${MYSQL[@]}" -e "SELECT COUNT(*) FROM users WHERE username='admin';" 2>/dev/null)" = "1" ]; then
  echo "[seed] admin déjà présent, rien à faire."
  exit 0
fi

echo "[seed] Insertion des rôles Admin/User..."
"${MYSQL[@]}" -e "INSERT IGNORE INTO role (role_name) VALUES ('Admin'), ('User');"

echo "[seed] Insertion du compte administrateur (admin / admin123)..."
"${MYSQL[@]}" -e "INSERT INTO users (user_id, username, name, password) VALUES (1, 'admin', 'Administrateur', '\$2b\$10\$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696');"
"${MYSQL[@]}" -e "INSERT INTO USER_ROLE (USER_ID, ROLE_ID) VALUES (1, (SELECT role_id FROM role WHERE role_name='Admin'));"

echo "[seed] Insertion de trois livres de démonstration..."
"${MYSQL[@]}" -e "INSERT INTO Books (book_id, book_name, book_author, book_genre, no_of_copies) VALUES (1, 'Le Petit Prince', 'Antoine de Saint-Exupéry', 'Conte', 5), (2, '1984', 'George Orwell', 'Science-fiction', 3), (3, 'Les Misérables', 'Victor Hugo', 'Roman', 2);"

# GenerationType.AUTO peut créer une table hibernate_sequence : si elle existe,
# on avance son compteur pour éviter une collision d'identifiants.
if [ -n "$("${MYSQL[@]}" -e "SHOW TABLES LIKE 'hibernate_sequence';" 2>/dev/null)" ]; then
  "${MYSQL[@]}" -e "UPDATE hibernate_sequence SET next_val = 100 WHERE next_val < 100;"
  echo "[seed] hibernate_sequence avancée à 100."
fi

echo "[seed] Provisionnement terminé."
