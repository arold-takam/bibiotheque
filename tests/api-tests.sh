#!/bin/bash
# ═══ API TESTS — Backend Spring Boot ═══
# Usage: bash tests/api-tests.sh

API="http://localhost:8080"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $name (HTTP $actual)"
    ((PASS++))
  else
    echo "  ❌ $name — expected $expected, got $actual"
    ((FAIL++))
  fi
}

echo "═══ 1. AUTH ═══"
TOKEN=$(curl -s -X POST $API/authenticate -H "Content-Type: application/json" -d '{"username":"A1","password":"a1"}' | grep -oP '"jwtToken":"\K[^"]+')
if [ -n "$TOKEN" ]; then echo "  ✅ Login A1 OK"; PASS=$((PASS+1)); else echo "  ❌ Login A1 FAIL"; FAIL=$((FAIL+1)); fi

TOKEN_A2=$(curl -s -X POST $API/authenticate -H "Content-Type: application/json" -d '{"username":"A2","password":"a2"}' | grep -oP '"jwtToken":"\K[^"]+')
if [ -n "$TOKEN_A2" ]; then echo "  ✅ Login A2 OK"; PASS=$((PASS+1)); else echo "  ❌ Login A2 FAIL"; FAIL=$((FAIL+1)); fi

check "Login échoué" "401" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/authenticate -H 'Content-Type: application/json' -d '{"username":"A1","password":"wrong"}')"

echo ""
echo "═══ 2. SEED ═══"
BOOKS=$(curl -s $API/admin/books -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
[ "$BOOKS" -ge 6 ] && { echo "  ✅ Livres seed: $BOOKS livres"; ((PASS++)); } || { echo "  ❌ Livres seed: $BOOKS < 6"; ((FAIL++)); }

echo ""
echo "═══ 3. RG-01: réserver dispo → 409 ═══"
check "RG-01 dispo→409" "409" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":6,"adherentId":2}')"

echo ""
echo "═══ 4. RG-01: réserver indispo → 201 ═══"
# Use B3 (id=8) if B2 already reserved by previous tests
RESA_CHECK=$(curl -s "$API/api/reservations?adherentId=2" -H "Authorization: Bearer $TOKEN_A2" | python3 -c "import sys,json; rs=[r for r in json.load(sys.stdin) if r['livreName']=='B2' and r['statut'] in ('EN_ATTENTE','DISPONIBLE')]; print('reserved' if rs else 'free')")
BOOK_ID=7
if [ "$RESA_CHECK" = "reserved" ]; then BOOK_ID=8; fi
check "RG-01 indispo→201" "201" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":'$BOOK_ID',"adherentId":2}')"

echo ""
echo "═══ 5. RG-02: doublon même livre → 409 ═══"
check "RG-02 doublon→409" "409" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":7,"adherentId":2}')"

echo ""
echo "═══ 6. RG-03: 4e résa → 409 ═══"
curl -s -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":8,"adherentId":2}' > /dev/null
curl -s -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":9,"adherentId":2}' > /dev/null
check "RG-03 quota→409" "409" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":10,"adherentId":2}')"

echo ""
echo "═══ 7. RG-05: annuler EN_ATTENTE → 200 ═══"
RESA_ID=$(curl -s "$API/api/reservations?adherentId=2" -H "Authorization: Bearer $TOKEN_A2" | python3 -c "import sys,json; rs=[r for r in json.load(sys.stdin) if r['statut']=='EN_ATTENTE']; print(rs[0]['reservationId'] if rs else '')")
[ -n "$RESA_ID" ] && check "RG-05 annuler→200" "200" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH $API/api/reservations/$RESA_ID/annuler -H "Authorization: Bearer $TOKEN_A2")" || echo "  ⏭️ Skip RG-05 (no EN_ATTENTE)"

echo ""
echo "═══ 8. RG-06: annuler ANNULEE → 409 ═══"
[ -n "$RESA_ID" ] && check "RG-06 annuler ANNULEE→409" "409" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH $API/api/reservations/$RESA_ID/annuler -H "Authorization: Bearer $TOKEN_A2")" || echo "  ⏭️ Skip RG-06"

echo ""
echo "═══ 9. 400: champ manquant ═══"
check "400 champ vide" "400" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{}')"

echo ""
echo "═══ 10. 404: id inexistant ═══"
check "404 id 999" "404" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A2" -d '{"livreId":999,"adherentId":2}')"

echo ""
echo "═══ 11. SWAGGER ═══"
check "Swagger" "302" "$(curl -s -o /dev/null -w '%{http_code}' $API/swagger-ui.html)"

echo ""
echo "════════════════════════════════"
echo "  TOTAL: $((PASS+FAIL)) tests | ✅ $PASS passed | ❌ $FAIL failed"
echo "════════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
