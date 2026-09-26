# Barber Shop Service-Specific Runbooks

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Quick Navigation

- [Shell MFE Runbook](#shell-mfe-runbook)
- [Services MFE Runbook](#services-mfe-runbook)
- [Booking MFE Runbook](#booking-mfe-runbook)
- [API Gateway Runbook](#api-gateway-runbook)
- [Database Runbook](#database-runbook)

---

## Shell MFE Runbook

**Responsibility:** Host application, routing, header/footer, language selection

### Critical Issues

#### Issue: Homepage Not Loading

**Symptoms:**
- 404 errors on `/`
- Blank white screen
- JavaScript errors in console

**Immediate Actions:**
1. Check CDN status
   ```bash
   aws cloudfront get-distribution-config --id E123ABC
   ```

2. Clear CloudFront cache
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E123ABC \
     --paths "/*"
   ```

3. Check Shell instance health
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn arn:aws:elasticloadbalancing:...
   ```

4. If instance unhealthy, SSH and check logs
   ```bash
   ssh -i ~/.ssh/prod.pem ec2-user@shell-instance-1
   tail -50 /var/log/barber-shop/shell.log
   ```

**Escalation:**
- If unresolved after 5 min → Page frontend team lead
- If unresolved after 10 min → Page platform lead

#### Issue: Language Toggle Not Working

**Symptoms:**
- Language changes but page doesn't translate
- Arabic text shows backwards
- RTL layout broken

**Investigation:**
```bash
# Check language context
curl -H "Accept-Language: ar-EG" https://barber-shop.com/

# Check localStorage/sessionStorage
# In browser console:
localStorage.getItem('barber-shop-language')
document.documentElement.lang

# Check translation file
ls -la /opt/barber-shop/shell/i18n/
```

**Fix:**
1. Invalidate translation cache
   ```bash
   curl -X POST https://barber-shop.com/api/cache/invalidate?type=translations
   ```

2. If issue persists, restart Shell service
   ```bash
   aws ssm start-session --target i-shell-1 --document-name "AWS-RunShellScript" \
     --parameters 'command=["sudo systemctl restart barber-shop-shell"]'
   ```

#### Issue: Remote MFE Not Loading (Services/Booking)

**Symptoms:**
- Services or Booking section shows loading spinner indefinitely
- Console error: "Failed to load remote module"

**Investigation:**
```bash
# Check if remote URLs are accessible
curl -I https://barber-shop.com/services/remoteEntry.js
curl -I https://barber-shop.com/booking/remoteEntry.js

# Check browser network tab for 404s on .js files
# If 404, remote MFE deployment issue
```

**Fix:**
1. Verify remote MFE deployment status
2. Check ALB target groups
3. If deployed but not loading, clear Shell cache
   ```bash
   aws cloudfront create-invalidation --distribution-id E123ABC --paths "/shell/*"
   ```

---

## Services MFE Runbook

**Responsibility:** Services listing, search, filtering, service details, offers

### Critical Issues

#### Issue: Services List Empty or Slow Loading

**Symptoms:**
- Page loads but no services displayed
- Loading spinner for > 5 seconds
- API timeout errors

**Investigation:**
```bash
# Test API directly
curl https://barber-shop.com/api/services

# Check database
mysql -h database.rds.amazonaws.com -u admin -p database_name \
  -e "SELECT COUNT(*) FROM services;"

# Check API latency
aws cloudwatch get-metric-statistics \
  --namespace BarberShop \
  --metric-name APILatency \
  --dimensions Name=Endpoint,Value=/api/services \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Maximum
```

**Fix:**

**Option 1: Database slow query**
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log LIMIT 10;

-- Analyze services query
EXPLAIN SELECT * FROM services WHERE active = 1;

-- Add index if missing
CREATE INDEX idx_services_active ON services(active);
```

**Option 2: API rate limiting**
```bash
# Check current connections
aws elbv2 describe-target-health --target-group-arn arn:aws:...

# Scale up if needed
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name services-asg \
  --desired-capacity 5
```

**Option 3: Cache issue**
```bash
# Invalidate Services MFE cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC \
  --paths "/services/*"
```

#### Issue: Search Not Working

**Symptoms:**
- Search field unresponsive
- Search results always empty
- Timeout errors

**Investigation:**
```bash
# Test search endpoint
curl "https://barber-shop.com/api/services/search?q=haircut"

# Check search index
# Elasticsearch health
curl -s http://elasticsearch:9200/_cluster/health | jq .

# Check if index exists
curl -s http://elasticsearch:9200/_cat/indices

# Check search logs
grep -i "search\|error" /var/log/barber-shop/services.log | tail -50
```

**Fix:**
1. Rebuild search index
   ```bash
   aws ssm start-session --target i-services-1 \
     --document-name "AWS-RunShellScript" \
     --parameters 'command=["npm run rebuild-search-index"]'
   ```

2. Or temporarily disable search
   ```bash
   # Set feature flag to disable search
   featureFlagManager.disableFlag('enhancedSearch');
   ```

---

## Booking MFE Runbook

**Responsibility:** Multi-step booking form, payment processing, confirmation

### Critical Issues

#### Issue: Booking Form Not Submitting

**Symptoms:**
- Submit button unresponsive or greyed out
- "Booking failed" error message
- No confirmation page after submission

**Investigation:**
```bash
# Check payment gateway connectivity
curl -I https://api.stripe.com/v1/charges

# Check API response time
aws cloudwatch get-metric-statistics \
  --namespace BarberShop \
  --metric-name APILatency \
  --dimensions Name=Endpoint,Value=/api/bookings \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Check booking creation errors
grep -i "booking\|payment\|error" /var/log/barber-shop/booking.log | tail -100
```

**Fix:**

**Option 1: Payment gateway down**
```bash
# Enable fallback payment method
featureFlagManager.updateFlag('paymentFallback', { enabled: true });
```

**Option 2: Form validation issue**
```bash
# Check browser console for validation errors
# Reload form
location.reload();

# Or clear form cache
localStorage.removeItem('barber-shop-booking-form');
```

**Option 3: API overloaded**
```bash
# Scale booking service
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name booking-asg \
  --desired-capacity 8
```

#### Issue: Users Can't Confirm Booking

**Symptoms:**
- Booking appears to succeed but no confirmation email
- User sees confirmation page but booking not saved

**Investigation:**
```bash
# Check if booking was created
mysql -h database.rds.amazonaws.com -u admin -p database_name \
  -e "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;"

# Check email queue
SELECT * FROM email_queue WHERE type = 'booking_confirmation' ORDER BY created_at DESC LIMIT 10;

# Check notification service logs
tail -100 /var/log/barber-shop/notifications.log
```

**Fix:**
1. If booking in DB but email not sent
   ```sql
   -- Retry email sending
   UPDATE email_queue SET status = 'pending' WHERE id = 'email-123';
   ```

2. If booking not in DB
   ```bash
   # Check API logs for creation errors
   grep -i "insert\|error" /var/log/barber-shop/booking-api.log | tail -50
   ```

---

## API Gateway Runbook

**Responsibility:** Request routing, authentication, rate limiting, response formatting

### Critical Issues

#### Issue: API Gateway Returning 502/503

**Symptoms:**
- All API calls fail with Bad Gateway / Service Unavailable
- Status code 502 or 503
- Timeout errors

**Investigation:**
```bash
# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...

# Check instance CPU/memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Check application logs
tail -100 /var/log/barber-shop/api.log
```

**Fix:**

**Option 1: Instance crashed**
```bash
# Restart unhealthy instance
aws ec2 reboot-instances --instance-ids i-api-1
```

**Option 2: High load**
```bash
# Scale up instances
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name api-asg \
  --desired-capacity 10

# Or reduce rate limiting temporarily
# Update rate limit in config
```

#### Issue: Requests Timing Out (> 60s)

**Symptoms:**
- API calls timing out after 60+ seconds
- Some endpoints faster than others
- Intermittent timeouts

**Investigation:**
```bash
# Check slow query log
mysql -h database.rds.amazonaws.com -u admin -p database_name \
  -e "SELECT * FROM mysql.slow_log WHERE query_time > 30 LIMIT 20;"

# Check long-running processes
SHOW PROCESSLIST;

# Check API request traces
aws xray get-service-graph --start-time $(date -d '10 minutes ago' +%s) --end-time $(date +%s)
```

**Fix:**
1. Kill long-running queries
   ```sql
   SHOW PROCESSLIST;
   KILL QUERY 12345;
   ```

2. Add query timeout
   ```sql
   SET SESSION max_execution_time=5000; -- 5 seconds
   ```

3. Optimize slow queries
   ```sql
   EXPLAIN SELECT ... FROM services WHERE ...;
   -- Add index if needed
   CREATE INDEX idx_services_name ON services(name);
   ```

---

## Database Runbook

**Responsibility:** Data persistence, backup/restore, replication

### Critical Issues

#### Issue: Database Unavailable (Cannot Connect)

**Symptoms:**
- "Connection refused" errors
- All database queries failing
- API returning connection errors

**Investigation:**
```bash
# Test connection
mysql -h database.rds.amazonaws.com -u admin -p database_name -e "SELECT 1;"

# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier barber-shop-prod \
  --query "DBInstances[0].[DBInstanceStatus, DBInstanceIdentifier]"

# Check security group
aws ec2 describe-security-groups \
  --filters "Name=group-id,Values=sg-12345" \
  --query "SecurityGroups[0].IpPermissions"
```

**Fix:**
1. If instance stopped
   ```bash
   aws rds start-db-instance --db-instance-identifier barber-shop-prod
   ```

2. If reboot needed
   ```bash
   aws rds reboot-db-instance --db-instance-identifier barber-shop-prod
   ```

3. If security group issue
   ```bash
   # Add EC2 instance to allowed IPs
   aws ec2 authorize-security-group-ingress \
     --group-id sg-12345 \
     --protocol tcp --port 3306 \
     --source-security-group-id sg-api-instances
   ```

#### Issue: Database Running Out of Disk Space

**Symptoms:**
- Slow queries (disk I/O bottleneck)
- Replication lag
- "Disk full" errors

**Investigation:**
```bash
# Check disk usage
df -h
du -sh /var/lib/mysql/*

# Check largest tables
SELECT TABLE_NAME, ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS "Size in MB" 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'barber_shop'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

**Fix:**
1. Archive old data
   ```sql
   -- Archive bookings older than 1 year
   INSERT INTO bookings_archive SELECT * FROM bookings WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
   DELETE FROM bookings WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
   ```

2. Resize storage
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier barber-shop-prod \
     --allocated-storage 500 \
     --apply-immediately
   ```

#### Issue: Replication Lag (Read Replica Behind)

**Symptoms:**
- Read queries returning stale data
- Replication lag > 1 second
- Booking confirmations not showing immediately

**Investigation:**
```bash
# Check replication lag
SHOW SLAVE STATUS\G
# Look at "Seconds_Behind_Master"

# Check binary log position
SHOW MASTER STATUS;
```

**Fix:**
1. Restart replication
   ```sql
   STOP SLAVE;
   START SLAVE;
   ```

2. If lag persists, skip problematic transaction
   ```sql
   SET GLOBAL SQL_SLAVE_SKIP_COUNTER = 1;
   START SLAVE;
   ```

3. Or rebuild replica
   ```bash
   # From master, create backup
   mysqldump -u admin -p database_name > backup.sql
   
   # Restore on replica and restart replication
   ```

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** Platform & SRE Team
