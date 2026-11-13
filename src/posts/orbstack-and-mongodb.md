---
title: "OrbStack and MongoDB"
date: 2025-12-28
tags: ["tutorial", "orbstack", "mongodb", "docker", "database"]
description: "How to run a secure, persistent MongoDB Community instance on using OrbStack."
---

[Part 1](/posts/getting-started-with-orbstack-on-macos/) got OrbStack running
with throwaway containers. Now let's build something you can keep: a persistent
**MongoDB** database.

Remove a Docker container and the data goes with it. For a database that is a
problem. The stock MongoDB container has another one. No password. The door is
wide open.

In this guide, we will:

1. Set up **local persistent storage** so your data survives container restarts.
2. Run the **latest MongoDB Community** container.
3. **Secure the instance** by creating an Admin user and a dedicated Application user.

---

## 1. Prepare Local Storage

OrbStack maps your Mac's filesystem into containers, and it is quick about it.
Make a folder to hold the database files.

Open your terminal and run:

```bash
# Create a directory for your data
mkdir -p ~/orbstack-data/mongo

# Navigate to it to verify
cd ~/orbstack-data/mongo
pwd
```

> Make a note of this path. OrbStack will write the database files here.

## 2. Run the Secure Container

We use the official `mongodb/mongodb-community-server` image. Two environment
variables lock it down at birth. They create a root user.

Run this. The whole block pastes as one command:

```bash
docker run -d \
  --name orb-mongo \
  -p 27017:27017 \
  -v ~/orbstack-data/mongo:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=securepass123 \
  mongodb/mongodb-community-server:latest
```

### Breakdown of flags:

* `-v ~/orbstack-data/mongo:/data/db`: Maps the folder we just created to MongoDB's internal data directory.
* `-e MONGO_INITDB_ROOT...`: These variables trigger the container to start with access control enabled and create a "Root" user in the admin database.
* `mongodb/mongodb-community-server:latest`: Pulls the absolute latest version of the Community Edition.

Verify it is running:

```bash
docker ps
```

## 3. Create a Database and App User

The admin account is not for your app. Give the app its own user, with only the
rights it needs.

Use `docker exec` to step inside the container. The `mongosh` tool is already in
there.

### A. Connect as Admin

Log in with the credentials from step 2:

```bash
docker exec -it orb-mongo mongosh -u admin -p securepass123
```

You should see the `test>` prompt.

### B. Create the Database and User

Run this inside the `mongosh` prompt. It makes a database called `my_app`. It
makes a user called `app_user`. That user can read and write **only** that
database.

```javascript
// Switch to (or create) the new database
use my_app

// Create the restricted user
db.createUser({
  user: "app_user",
  pwd: "app_password_456",
  roles: [
    { role: "readWrite", db: "my_app" }
  ]
})
```

If successful, you will see `{ ok: 1 }`. Type `exit` to leave the shell.

## 4. Verify Persistence

Let's prove that our data is safe.

1. Kill the container:

```bash
docker rm -f orb-mongo
```

2. Check your Mac folder:

Look in `~/orbstack-data/mongo`. Files everywhere. WiredTiger,
`collection-*.wt`. That is your database.

3. Spin it up again:

Run the exact same `docker run` command from Step 2.

4. Test the User:

Log in as the new user.

```bash
docker exec -it orb-mongo mongosh "mongodb://app_user:app_password_456@localhost:27017/my_app"
```

You are in? Congratulations. You have a persistent, password-protected MongoDB
database running on your Mac under OrbStack.

### Connection String for your App

Point your Node.js, Python or Go app at this URI:

`mongodb://app_user:app_password_456@localhost:27017/my_app?authSource=my_app`
