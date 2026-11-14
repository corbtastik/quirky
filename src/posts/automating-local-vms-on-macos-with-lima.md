---
title: "Automating Local VMs on macOS (Apple Silicon) with Lima 🦙🍏"
date: 2026-01-18
tags: ["apple-silicon", "virtualization", "vm", "lima", "ubuntu", "mongodb", "postgres"]
description: "A repeatable, CLI-first framework to spin up multiple independent Lima VMs (with optional persistent disks), and provision MongoDB Community or Postgres idempotently."
---

## Automating local VMs with Lima (VZ) 🦙🍏

I wanted a local VM setup on Apple Silicon that's:

✅ **CLI-first** (no clicking around)<br>
✅ **Repeatable** (same commands every time)<br>
✅ **Modular** (one VM per service: MongoDB VM, Postgres VM, Nginx VM, etc.)<br>
✅ **Safe** (no accidental shared disks)<br>
✅ **Idempotent provisioning** (safe reruns)

So I built a small framework repo:

Code on GitHub: https://github.com/corbtastik/vm-bakeoff 🔗

It uses:

- **[Lima](https://lima-vm.io/)** 🦙 for VM lifecycle on macOS
- **[Apple Virtualization.framework](https://developer.apple.com/documentation/virtualization)** 🍏 via `vmType: vz` (native, not emulation)
- **Ubuntu ARM64 cloud images** from **[Canonical](https://cloud-images.ubuntu.com/)** 🐧
- Separate provisioning scripts for:
  - **[MongoDB Community](https://www.mongodb.com/docs/manual/administration/install-on-linux/)** 🍃 (I work for MongoDB, so... obviously 😄)
  - **[Postgres](https://www.postgresql.org/)** 🐘

---

## 0) What you'll build 🧱

By the end, you'll be able to do this:

- Create a **MongoDB VM**:
  - VM name: `mongodb-vz`
  - Disk name: `mongodb-data` (optional, but recommended for DBs)
  - MongoDB stores data under `/data/mongodb`
  - Auth enabled + users created
- Create a **Postgres VM**:
  - VM name: `postgres-vz`
  - Disk name: `postgres-data`
  - Postgres cluster lives under `/data/postgres/<major>/main`
  - App role + database created
- Keep host port forwards collision-free using **offset ports** (manual per VM), e.g.:
  - MongoDB guest `27017` → host `37017`
  - Postgres guest `5432` → host `35432`

Most important: **each VM is independent**. No "one VM running everything."
No "oops, two VMs share a disk." 🙅‍♂️💾

---

## ✅ Why Lima?

Lima is a great fit for local automation because it's:

- **YAML-driven** 🧩
- **Scriptable** ⌨️
- Supports `vmType: "vz"` on Apple Silicon 🍏⚡
- Works nicely with a "driver" model (start/stop/run/provision) 🔁

One key Lima concept:

> Some VM settings are **creation-time** ("birth-time").<br>
> So generate VM YAML *per VM*, then create it.

That's what this repo does.

---

## 1) Repo layout 🗂️

The repo splits config in two.

### A) VM configuration (CPU, memory, disk, port forwards)

Each VM has its own file:

- `vms/mongodb.env`
- `vms/postgres.env`
- `vms/nginx.env` (example diskless VM)

These define **how the VM runs**.

### B) Software configuration (MongoDB/Postgres settings)

Each piece of software has its own file:

- `software/mongodb.env`
- `software/postgres.env`
- `software/nginx.env`

These define **what gets installed**.

And provisioning scripts combine both.

---

## 2) Prereqs (host) 🧰

Install Lima and HTTPie:

{% code "Install the tools" %}
```bash
brew install lima httpie
limactl --version
http --version
```

---

## 3) Deterministic Ubuntu pinning 🔒

Cloud images drift. I want the same VM baseline every time, so we pin the
Ubuntu image SHA256 digest.

This writes a pinned file that every Ubuntu VM uses:

{% code "Pin the image" %}
```bash
make ubuntu-pin
```

We fetch the SHA256 for that exact Ubuntu cloud image build. Then we write a
pinned config here:

- `platforms/lima/images/ubuntu.env`

This gives you a stable foundation: "same inputs → same VM base."

---

## 4) VM lifecycle: `make up/down/status/ssh/destroy` (per VM) 🎛️

This is the core loop.

### Bring up the MongoDB VM

{% code "Up the MongoDB VM" %}
```bash
make up VM=mongodb
make status VM=mongodb
make ssh VM=mongodb
```

### Bring up the Postgres VM

{% code "Up the Postgres VM" %}
```bash
make up VM=postgres
make status VM=postgres
make ssh VM=postgres
```

### Stop a VM (no data loss)

{% code "Stop a VM" %}
```bash
make down VM=postgres
```

### Destroy a VM (and its disk, by default) 💣

{% code "Destroy a VM" %}
```bash
make destroy VM=postgres
```

Want to delete the VM but **keep its disk** (persistence test / rebuild VM
config / etc.)?

{% code "Destroy but keep the disk" %}
```bash
KEEP_DISK=1 make destroy VM=postgres
```

---

## 5) The disk strategy: optional, per VM 💾

Each VM can choose:

- `HAS_DATA_DISK=1` → create a named Lima disk (`<vm>-data`)
- `HAS_DATA_DISK=0` → diskless VM (fine for Nginx, utility boxes, etc.)

Inside the guest, the attached Lima disk shows up under `/mnt/...`. A bind
mount puts it at:

- `/data`

So for DB VMs, `/data` becomes the "persistence contract."

✅ MongoDB data goes to `/data/mongodb`<br>
✅ Postgres data goes to `/data/postgres/...`

---

## 6) Port forwards: manual "offset style" per VM 🔌

We define port forwards in each VM's `.env` so they're explicit and
collision-free.

Example pattern:

- MongoDB VM forwards guest `27017` to host `37017`
- Postgres VM forwards guest `5432` to host `35432`

That means you can run both at once without conflict 😎

---

## 7) Provisioning: MongoDB Community 🍃

Once the VM is up, provisioning installs and configures the software inside
it.

### Provision MongoDB VM

{% code "Provision MongoDB" %}
```bash
make provision-mongodb VM=mongodb
```

What provisioning does (high level):

- Ensures `/data` exists (and uses persistent disk if configured) 💾
- Installs MongoDB Community from MongoDB's official apt repo 🍃
- Configures `/etc/mongod.conf`:
  - `dbPath: /data/mongodb`
  - log path under `/data`
  - binds to `127.0.0.1` for safety 🔐
- Creates a root-only secrets file: `/etc/todo-secrets.env` 🔒
- Enables auth and reconciles users idempotently:
  - `dbAdmin` (root on `admin`)
  - `dbUser` (readWrite + dbAdmin on `todo`)
- Writes `MONGODB_URI` to the secrets file
- Installs `mdb_user` and `mdb_admin` helper aliases 🎯

---

## 8) Verify MongoDB ✅

SSH into the VM:

{% code "SSH in" %}
```bash
make ssh VM=mongodb
```

### Confirm data directory

{% code "Confirm the data directory" %}
```bash
sudo ls -la /data
sudo ls -la /data/mongodb
sudo systemctl status mongod --no-pager
```

### Check secrets

{% code "Check secrets" %}
```bash
sudo cat /etc/todo-secrets.env
```

### Connect as app user (`dbUser`)

{% code "Connect as dbUser" %}
```bash
sudo bash -lc 'source /etc/todo-secrets.env && mongosh "$MONGODB_URI" --eval "db.runCommand({ ping: 1 })"'
```

### Connect as admin (`dbAdmin`)

{% code "Connect as dbAdmin" %}
```bash
sudo bash -lc 'source /etc/todo-secrets.env && mongosh --host 127.0.0.1 --port 27017 --username "$DB_ADMIN_USER" --password "$DB_ADMIN_PASS" --authenticationDatabase admin --eval "db.runCommand({ connectionStatus: 1 })"'
```

If both work, auth is on and users exist. 🎉

---

## 9) Provisioning: Postgres 🐘

Bring up the Postgres VM and provision it:

{% code "Up and provision Postgres" %}
```bash
make up VM=postgres
make provision-postgres VM=postgres
```

What provisioning does:

- Ensures `/data` exists (persistent disk if configured) 💾
- Installs Postgres packages from Ubuntu repos 🐘
- Creates/moves the Postgres cluster to `/data/postgres/<major>/main`
- Configures:
  - `listen_addresses = 127.0.0.1`
  - port `5432`
  - `scram-sha-256` auth for localhost
- Generates or reuses secrets in `/etc/todo-secrets.env`:
  - `PG_DB`, `PG_USER`, `PG_PASS`
  - `POSTGRES_URI`
- Creates/updates the role idempotently
- Creates the database idempotently (using `createdb`, because
  `CREATE DATABASE` can't run inside `DO`) ✅

---

## 10) Verify Postgres ✅

SSH into the VM:

{% code "SSH in" %}
```bash
make ssh VM=postgres
```

### Check secrets

{% code "Check secrets" %}
```bash
sudo cat /etc/todo-secrets.env
```

### Connect as the app user (`todo_pg_user`) and create a table

{% code "Create a table as the app user" %}
```bash
sudo bash -lc 'source /etc/todo-secrets.env && psql "$POSTGRES_URI" -v ON_ERROR_STOP=1 <<SQL
CREATE TABLE IF NOT EXISTS todos (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO todos (title) VALUES (''hello from todo_pg_user'');
SELECT * FROM todos ORDER BY id DESC LIMIT 5;
SQL'
```

### Admin check (superuser)

On Ubuntu, "admin" is the `postgres` OS user and DB role:

{% code "Admin check" %}
```bash
sudo -u postgres psql -c "select current_user, current_database();"
```

Verify the role and DB exist:

{% code "Verify role and database" %}
```bash
sudo bash -lc 'source /etc/todo-secrets.env && sudo -u postgres psql -tAc "select rolname from pg_roles where rolname='\''$PG_USER'\''"'
sudo bash -lc 'source /etc/todo-secrets.env && sudo -u postgres psql -tAc "select datname from pg_database where datname='\''$PG_DB'\''"'
```

---

## 11) Optional: connect from macOS via forwarded ports 🍏➡️🐧

Your Postgres VM forwards guest `5432` to host `35432`. Connect from macOS
like this:

{% code "Postgres from macOS" %}
```bash
psql "postgresql://todo_pg_user:<PG_PASS>@127.0.0.1:35432/todo_pg" -c "select now();"
```

Same idea for MongoDB if you forward guest `27017` to host `37017`:

{% code "MongoDB from macOS" %}
```bash
mongosh "mongodb://dbUser:<DB_USER_PASS>@127.0.0.1:37017/todo?authSource=todo"
```

(Grab passwords from `/etc/todo-secrets.env` inside the VM.)

---

## 12) Acceptance checklist ✅✅✅

- [✅] Ubuntu image is pinned deterministically (digest) 🔒
- [✅] Multiple independent VMs can exist: `mongodb-vz`, `postgres-vz`, etc. 🧩
- [✅] Disks are per-VM: `mongodb-data`, `postgres-data` (no accidental sharing) 💾
- [✅] VMs can be diskless when appropriate (e.g. nginx) 🪶
- [✅] MongoDB stores data on `/data/mongodb` and auth works 🔐🍃
- [✅] Postgres stores data on `/data/postgres/...` and app role can create tables 🐘
- [✅] Rerunning provisioning is safe (idempotent behavior) 🔁

---

## Wrap-up 🎬

This repo stays small and boring, in the good way. 😄<br>
It's a pattern you can grow:

- add more VM configs under `vms/`
- add more provisioners under `scripts/guest/`
- keep a consistent lifecycle: `up → provision → test → down/destroy`

Building local demos or POCs? Want a reliable VM baseline on Apple Silicon?
This is a great place to start. 🦙🍏
