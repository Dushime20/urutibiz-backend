# ✅ Deployment Checklist

Use this checklist to ensure a successful deployment.

## Pre-Deployment

- [ ] SSH into your server: `ssh root@vmi2982276`
- [ ] Navigate to backend: `cd /opt/urutibiz/urutibiz-backend`
- [ ] Verify .env file exists: `ls -la .env`
- [ ] Check Docker is running: `docker ps`
- [ ] Check disk space: `df -h`

## Setup Firebase Credentials

- [ ] Run setup script: `bash setup-firebase-credentials.sh`
- [ ] Verify file created: `ls -la firebase-credentials.json`
- [ ] Check permissions: Should be `-rw-------` (600)
- [ ] Validate JSON: `cat firebase-credentials.json | jq .`

## Build & Deploy

- [ ] Run deployment script: `bash rebuild-and-deploy.sh`
- [ ] Wait for build to complete (may take 2-5 minutes)
- [ ] Check for build errors in output
- [ ] Verify all containers started

## Verify Deployment

### Check Containers
- [ ] Run: `docker ps`
- [ ] Verify `urutibiz-postgres` is running
- [ ] Verify `urutibiz-redis` is running
- [ ] Verify `urutibiz-api` is running

### Check Logs
- [ ] View API logs: `docker logs urutibiz-api`
- [ ] Look for: `✅ Firebase Admin initialized`
- [ ] Look for: `✅ Database connection established`
- [ ] Look for: `✅ Server listening on port 10000`
- [ ] Confirm NO Firebase PEM errors
- [ ] Confirm NO database connection errors

### Test Services

#### PostgreSQL
- [ ] Test connection: `docker exec urutibiz-postgres pg_isready -U urutibiz_user`
- [ ] Should return: `accepting connections`

#### Redis
- [ ] Test connection: `docker exec urutibiz-redis redis-cli ping`
- [ ] Should return: `PONG`

#### API Health
- [ ] Test endpoint: `curl http://localhost:10000/health`
- [ ] Should return: `200 OK` or health status JSON

### Check Service Health
- [ ] Run: `docker-compose -f docker-compose.production.yml ps`
- [ ] All services should show `Up (healthy)`

## Post-Deployment

### Monitor Logs
- [ ] Watch logs for 2-3 minutes: `docker-compose -f docker-compose.production.yml logs -f`
- [ ] Look for any errors or warnings
- [ ] Verify normal operation

### Test API Endpoints
- [ ] Test login endpoint
- [ ] Test a few key API routes
- [ ] Verify database queries work
- [ ] Check file uploads work

### Performance Check
- [ ] Check CPU usage: `docker stats --no-stream`
- [ ] Check memory usage
- [ ] Verify response times are acceptable

## Security Verification

- [ ] Verify firebase-credentials.json has 600 permissions
- [ ] Confirm firebase-credentials.json is in .gitignore
- [ ] Check no sensitive data in logs
- [ ] Verify .env is not committed to git

## Backup & Recovery

- [ ] Document current configuration
- [ ] Note container IDs and versions
- [ ] Backup database if needed
- [ ] Document rollback procedure

## Documentation

- [ ] Update deployment notes
- [ ] Document any issues encountered
- [ ] Note any custom configurations
- [ ] Share access with team if needed

## Troubleshooting (If Issues Occur)

### Firebase Errors
- [ ] Check file exists: `ls -la firebase-credentials.json`
- [ ] Validate JSON: `cat firebase-credentials.json | jq .`
- [ ] Check mounted in container: `docker exec urutibiz-api ls -la /app/firebase-credentials.json`
- [ ] Review logs: `docker logs urutibiz-api | grep -i firebase`

### Database Errors
- [ ] Check postgres running: `docker ps | grep postgres`
- [ ] Check postgres logs: `docker logs urutibiz-postgres`
- [ ] Test network: `docker exec urutibiz-api ping postgres`
- [ ] Verify credentials in .env

### Port Conflicts
- [ ] Check port usage: `netstat -tulpn | grep 10000`
- [ ] Change PORT in .env if needed
- [ ] Restart containers after change

### Container Won't Start
- [ ] Check logs: `docker logs urutibiz-api`
- [ ] Check disk space: `df -h`
- [ ] Check memory: `free -h`
- [ ] Try manual start: `docker-compose -f docker-compose.production.yml up api`

## Rollback Plan (If Needed)

If deployment fails and you need to rollback:

- [ ] Stop new containers: `docker-compose -f docker-compose.production.yml down`
- [ ] Start old containers: `docker start <old-container-id>`
- [ ] Verify old version works
- [ ] Document what went wrong
- [ ] Review logs before retry

## Success Criteria

All of these should be ✅:

- [ ] No Firebase PEM errors in logs
- [ ] No database connection errors
- [ ] All 3 containers running (postgres, redis, api)
- [ ] API health endpoint responds
- [ ] Can login to application
- [ ] Can perform basic operations
- [ ] No critical errors in logs
- [ ] Response times acceptable
- [ ] Memory usage normal
- [ ] CPU usage normal

## Final Sign-Off

- [ ] Deployment completed successfully
- [ ] All tests passed
- [ ] Team notified
- [ ] Documentation updated
- [ ] Monitoring in place

---

## Quick Reference Commands

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# Restart API only
docker-compose -f docker-compose.production.yml restart api

# Stop everything
docker-compose -f docker-compose.production.yml down

# Start everything
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# Shell into API
docker exec -it urutibiz-api sh

# Check database
docker exec -it urutibiz-postgres psql -U urutibiz_user -d urutibiz_db
```

---

## Notes

Date: _______________
Deployed by: _______________
Issues encountered: _______________
Resolution: _______________
