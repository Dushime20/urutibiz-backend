#!/bin/bash

echo "=== Testing Deployment Prerequisites ==="
echo ""

# Test 1: Check if PostgreSQL is reachable from host
echo "Test 1: PostgreSQL connectivity from host"
if nc -z localhost 5432 2>/dev/null; then
    echo "✅ PostgreSQL port 5432 is open"
else
    echo "❌ PostgreSQL port 5432 is not accessible"
fi
echo ""

# Test 2: Check if PostgreSQL is actually ready
echo "Test 2: PostgreSQL readiness"
if docker exec urutibiz-postgres pg_isready -U urutibiz_user -d urutibiz_db 2>/dev/null; then
    echo "✅ PostgreSQL is ready to accept connections"
else
    echo "❌ PostgreSQL is not ready"
fi
echo ""

# Test 3: Check if Redis is reachable
echo "Test 3: Redis connectivity"
if nc -z localhost 6379 2>/dev/null; then
    echo "✅ Redis port 6379 is open"
else
    echo "❌ Redis port 6379 is not accessible"
fi
echo ""

# Test 4: Check if Python service is healthy
echo "Test 4: Python service health"
if curl -f http://localhost:8001/health 2>/dev/null >/dev/null; then
    echo "✅ Python service is healthy"
else
    echo "❌ Python service is not responding"
fi
echo ""

# Test 5: Check network connectivity between containers
echo "Test 5: Container network connectivity"
if docker exec urutibiz-postgres pg_isready -h postgres -U urutibiz_user -d urutibiz_db 2>/dev/null; then
    echo "✅ Containers can communicate on Docker network"
else
    echo "❌ Container network issue detected"
fi
echo ""

# Test 6: Manually test database connection from API container
echo "Test 6: Database connection from API container"
docker run --rm --network urutibiz-backend_urutibiz-network \
    -e DB_HOST=postgres \
    -e DB_PORT=5432 \
    -e DB_NAME=urutibiz_db \
    -e DB_USER=urutibiz_user \
    -e PGPASSWORD="${DB_PASSWORD}" \
    postgres:15-alpine \
    psql -h postgres -U urutibiz_user -d urutibiz_db -c "SELECT 1 as test;" 2>&1 | head -5

echo ""
echo "=== Test Complete ==="
