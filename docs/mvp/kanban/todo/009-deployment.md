# Story: Deployment

**Status**: Todo
**Priority**: P2
**Estimated**: 3 days

## Goal

Deploy to homelab with Docker Compose.

## Context

- Create `deployment/README.md` with deployment overview
- Create `deployment/homelab.md` with homelab setup
- Create `deployment/env.md` with environment variables
- Create `deployment/backups.md` with backup strategy

## Acceptance Criteria

- [ ] Docker Compose for local development
- [ ] Homelab deployment with Traefik
- [ ] Environment variables documented
- [ ] Backup strategy: pg_dump rotation (future)

## Technical Notes

MVP deployment is homelab. Future: cloud deployment with backups.

## Tests Required

- Test Docker Compose setup
- Test deployment pipeline

## Dependencies

- 003-api-model.md
- 007-seeds.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Deployment documented and tested
