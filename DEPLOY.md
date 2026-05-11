# Deploying Finch to K3s

Target: Raspberry Pi K3s cluster with ARM64 nodes. Single-user, no app auth (Tailscale controls access).

## Prerequisites

- K3s cluster running on your Pi nodes
- `kubectl` configured to talk to your cluster
- Images published to GHCR (see [Image Publishing](#image-publishing))

## Image Publishing

Push to `main` or create a git tag to trigger the GitHub Actions workflow (`.github/workflows/build-images.yml`). It builds multi-arch images (linux/amd64 + linux/arm64) and pushes to GHCR:

- `ghcr.io/m-ryan-nugent/finch-backend`
- `ghcr.io/m-ryan-nugent/finch-frontend`

Tags produced per push:
- `latest` (from main branch only)
- `sha-<short-sha>` (every push)
- `v1.0.0`, `v1.0` (from git tags like `v1.0.0`)

To publish the first version:

```bash
git tag v0.1.0
git push origin main --tags
```

### GHCR image visibility

GHCR packages inherit the repository's visibility by default. **If your GitHub repo is private, your container images will also be private**, and your K3s nodes will not be able to pull them without credentials.

The simplest option is to make the packages public. After the first workflow run publishes the images, go to `https://github.com/users/m-ryan-nugent/packages` and change the visibility of `finch-backend` and `finch-frontend` to **Public**. The images contain only application code, no secrets.

If you need the images to stay private, set up an image pull secret:

```bash
kubectl create secret docker-registry ghcr-pull-secret -n finch \
  --docker-server=ghcr.io \
  --docker-username=m-ryan-nugent \
  --docker-password=YOUR_GITHUB_PAT
```

The PAT needs the `read:packages` scope. Create one at `https://github.com/settings/tokens`.

Then add `imagePullSecrets` to the pod spec in `k8s/03-backend.yaml`, `k8s/04-frontend.yaml`, and `k8s/05-migrate-job.yaml`. For example, in each file, add this under `spec.template.spec`:

```yaml
    spec:
      imagePullSecrets:
        - name: ghcr-pull-secret
      containers:
        ...
```

## First-Time Deployment

### 1. Create namespace

```bash
kubectl apply -f k8s/00-namespace.yaml
```

### 2. Create secrets

The only secret is the Postgres password. Non-secret database config (host, port, db name, user) is set directly in the manifests.

```bash
kubectl create secret generic finch-secrets -n finch \
  --from-literal=POSTGRES_PASSWORD='YOUR_PASSWORD_HERE'
```

### 3. Deploy Postgres

```bash
kubectl apply -f k8s/02-postgres.yaml
```

Wait for Postgres to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=finch-postgres -n finch --timeout=120s
```

### 4. Run migrations

The migration manifest uses `generateName`, so each run creates a uniquely named Job. Use `kubectl create` (not `apply`):

```bash
kubectl create -f k8s/05-migrate-job.yaml
```

Wait for completion and check logs:

```bash
kubectl wait --for=condition=complete job -l app=finch-migrate -n finch --timeout=120s
kubectl logs -l app=finch-migrate -n finch
```

Completed Jobs auto-delete after 2 minutes (`ttlSecondsAfterFinished: 120`).

### 5. Deploy backend and frontend

```bash
kubectl apply -f k8s/03-backend.yaml
kubectl apply -f k8s/04-frontend.yaml
```

### 6. Verify everything is running

```bash
kubectl get pods -n finch
kubectl get svc -n finch
```

All pods should show `Running` and `1/1` ready.

## Accessing the App

The frontend Service is exposed as a NodePort on port **30180**. Access it from any machine on your Tailscale network:

```
http://<any-node-tailscale-ip>:30180
```

For example, if pi-worker-1 has Tailscale IP `100.x.y.z`:

```
http://100.x.y.z:30180
```

The frontend nginx proxies all `/api/` requests to the backend internally within the cluster. No CORS is needed. There is no separate backend URL to configure.

## Updating to a New Version

### 1. Update image tags

Edit the image tags in these files to match the new version:

- `k8s/03-backend.yaml` (backend Deployment)
- `k8s/04-frontend.yaml` (frontend Deployment)
- `k8s/05-migrate-job.yaml` (migration Job)

For example, change `v0.1.0` to `v0.2.0`.

### 2. Run migrations

Create a new migration Job (each `kubectl create` produces a fresh Job with a unique name):

```bash
kubectl create -f k8s/05-migrate-job.yaml
kubectl wait --for=condition=complete job -l app=finch-migrate -n finch --timeout=120s
kubectl logs -l app=finch-migrate -n finch
```

If Alembic reports "already at head", that is normal for releases with no schema changes.

### 3. Apply updated deployments

```bash
kubectl apply -f k8s/03-backend.yaml
kubectl apply -f k8s/04-frontend.yaml
```

Kubernetes will perform a rolling update for each Deployment.

### 4. Verify

```bash
kubectl rollout status deployment/finch-backend -n finch
kubectl rollout status deployment/finch-frontend -n finch
kubectl get pods -n finch
```

## Debugging

### Pod logs

```bash
kubectl logs deployment/finch-backend -n finch
kubectl logs deployment/finch-frontend -n finch
kubectl logs -l app=finch-postgres -n finch
```

### Shell into a pod

```bash
kubectl exec -it deployment/finch-backend -n finch -- sh
kubectl exec -it deployment/finch-frontend -n finch -- sh
```

### Check events for scheduling/pull issues

```bash
kubectl get events -n finch --sort-by='.lastTimestamp'
```

### Test backend health directly

```bash
kubectl port-forward svc/finch-backend 8000:8000 -n finch
# then: curl http://localhost:8000/api/v1/health
# and:  curl http://localhost:8000/api/v1/health/ready
```

### Check Postgres connectivity

```bash
kubectl exec -it finch-postgres-0 -n finch -- psql -U finch -d finch -c "SELECT 1"
```

### Run a one-off migration manually

```bash
kubectl run finch-migrate-manual --rm -it --restart=Never -n finch \
  --image=ghcr.io/m-ryan-nugent/finch-backend:v0.1.0 \
  --env="POSTGRES_HOST=finch-postgres" \
  --env="POSTGRES_DB=finch" \
  --env="POSTGRES_USER=finch" \
  --env="POSTGRES_PASSWORD=$(kubectl get secret finch-secrets -n finch -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)" \
  -- uv run alembic upgrade head
```

## Where Data Lives

All persistent data is in the Postgres PVC:

```bash
kubectl get pvc -n finch
```

This PVC is provisioned by K3s's default StorageClass (typically `local-path`). The actual data directory is on whichever worker node the Postgres pod is scheduled to.

To find the node:

```bash
kubectl get pod finch-postgres-0 -n finch -o wide
```

## Production Risk Notes

This deployment is designed for a personal homelab. Before storing real financial data, review these risks:

### No application authentication

There is no login, no user accounts, no session management. Anyone who can reach port 30180 on your cluster can read and modify all data. Tailscale is your only access control layer. This is acceptable only if:
- All nodes are on your Tailscale network
- You trust everyone on your Tailscale network
- The NodePort is not reachable from the public internet

### Database durability

- **Single replica**: Postgres runs as a single pod. If the node fails, data is unavailable until the pod is rescheduled.
- **Local storage**: K3s `local-path` storage is tied to one node. If that node's SD card or disk fails, data is lost.
- **No backups are configured**. You must set up your own backup strategy.

### Backup and restore

There is no automated backup. To back up manually:

```bash
kubectl exec finch-postgres-0 -n finch -- pg_dump -U finch finch > finch-backup-$(date +%Y%m%d).sql
```

To restore:

```bash
cat finch-backup.sql | kubectl exec -i finch-postgres-0 -n finch -- psql -U finch finch
```

Consider setting up a CronJob or cron on the Pi host to run `pg_dump` on a schedule and copy the output to a second storage location.

### Secrets handling

- `finch-secrets` is a Kubernetes Secret (base64-encoded, not encrypted at rest by default in K3s)
- Do not commit `k8s/01-secrets.yaml` with real values
- For stronger secrets management, consider enabling K3s secrets encryption or using an external secrets store in the future

### Single-instance database

There is no replication or failover. If Postgres crashes, the StatefulSet will restart it, but there will be brief downtime. This is acceptable for a personal app.

### ARM64 considerations

- All base images used (`python:3.12-slim`, `node:20-alpine`, `nginx:alpine`, `postgres:16-alpine`) have official ARM64 support
- The GitHub Actions workflow builds multi-arch images with QEMU emulation. ARM64 builds may be slower than AMD64 in CI
- If you encounter ARM64-specific issues with Python packages that have native extensions, check that the package publishes ARM64 wheels
