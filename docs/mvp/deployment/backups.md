# Backups

## MVP Status

MVP defines a **manual backup strategy**. Automation is post-MVP.

## MVP: Manual Backup Procedure

### CSV/Export Backup

Users should regularly export their data as a manual backup:

1. Navigate to **Settings → Export Data**
2. Select **Export Format**: CSV (per table) or ZIP (full backup)
3. Choose data range: All data / Current year / Custom range
4. Click **Export** → file downloads to device
5. Store backup in a secure location (cloud storage, external drive)

### Verification Steps

After each manual backup:

1. **Checksum verification** (optional):
   ```bash
   sha256sum ledger-mx-backup-20240101.zip
   # Save checksum for integrity verification
   ```

2. **Restore test** (recommended monthly):
   - Import backup to a test/demo account
   - Verify transaction counts match
   - Verify account balances match
   - Delete test import after verification

3. **Backup log**:
   - Record date of backup
   - Record backup location
   - Record verification status

## Post-MVP: Automated Backups

### Future Strategy: pg_dump Rotation

#### Approach

Daily pg_dump with rotation:

```bash
# Cron job
0 2 * * * docker exec postgres pg_dump -U user ledger_mx | gzip > /backups/ledger_mx_$(date +\%Y\%m\%d).sql.gz
```

#### Retention

- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

#### Restore

```bash
gunzip < /backups/ledger_mx_20240101.sql.gz | docker exec -i postgres psql -U user ledger_mx
```

### Alternative: Volume Snapshots

Future: filesystem snapshots of PostgreSQL data volume.

## Sync as Backup

Electric sync provides some backup:

- Data exists on client (PGlite)
- Data exists on server (PostgreSQL)
- Not a replacement for backups

## Post-MVP TODO

- [ ] Implement automated pg_dump
- [ ] Implement rotation script
- [ ] Document restore procedure
- [ ] Test restore process
- [ ] Add backup scheduling UI
- [ ] Add backup verification automation
