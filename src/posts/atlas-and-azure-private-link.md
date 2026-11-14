---
title: "Atlas and Azure Private Link 🔗"
date: 2026-01-16
tags: ["atlas", "mongodb", "security", "private-endpoint", "private-link", "azure"]
description: "Create an Azure Private Link connection to MongoDB Atlas and connect an application using a Private Endpoint–aware connection string."
---

## What we're doing here 🤔

> **Goal**: Your app connects to MongoDB Atlas over **private networking**
> (not the public internet) using an Atlas **Private Endpoint–aware**
> connection string.

**Key idea** 💡: The driver resolves an **SRV record**. Something like
`_mongodb._tcp.cluster0-pl-0.<hash>.mongodb.net`. That record points at
hostnames like `pl-0-<region>.<hash>.mongodb.net`. Your DNS has to resolve
those to the **private IP** of your Azure Private Endpoint NIC.

Useful background (light reading, not homework 😄):

- [MongoDB Atlas Private Endpoints overview](https://www.mongodb.com/docs/atlas/security-private-endpoint/)
- [Azure Private Link overview](https://learn.microsoft.com/en-us/azure/private-link/private-link-overview)
- [SRV records (Wikipedia)](https://en.wikipedia.org/wiki/SRV_record)
- [DNS basics (Wikipedia)](https://en.wikipedia.org/wiki/Domain_Name_System)

---

## Azure Private Link + Atlas ✅

### 0) Prereqs (don't skip) 🧰

- **Atlas cluster**: Dedicated cluster **M10+** (Private Endpoints are not
  supported on free/flex tiers).
  - [Atlas cluster tiers](https://www.mongodb.com/docs/atlas/cluster-tier/)
- **Atlas permissions**: You'll want **Project Owner** (or higher) in Atlas to
  configure Private Endpoints.
  - [Atlas user roles](https://www.mongodb.com/docs/atlas/reference/user-roles/)
- **Azure network**: An Azure **VNet + subnet** where your app will run (VM,
  AKS node pool, container host, etc.).
  - [Azure VNet overview](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview)
- **Database user**: A MongoDB database user in Atlas.
  - [Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/)
- Tools (optional but helpful):
  - `az` CLI (Azure)
  - `atlas` CLI (MongoDB)
  - `node` 18+ / `npm` (only if you want the test app)

---

## 1) Create the Atlas Private Link Service (Atlas-side) 🏗️

This creates the Atlas-side Azure **Private Link Service**. Your Azure Private
Endpoint will connect to it.

Atlas docs (workflow + concepts):

- [Atlas private endpoints overview](https://www.mongodb.com/docs/atlas/security-private-endpoint/)
- [Manage & connect from private endpoints](https://www.mongodb.com/docs/atlas/security-manage-private-endpoint/)

### Option A: Atlas UI (recommended)

- Atlas → **Security** → **Database & Network Access** → **Private Endpoint**
- Click **Add Private Endpoint**
- Choose **Azure**
- Choose the **same region** as your Atlas cluster (or the region Atlas
  requires for your deployment)
- Wait until the Atlas **Endpoint Service** status becomes **Available**

Atlas then hands you Azure-side values. Watch for a resource ID like this:

- `.../providers/Microsoft.Network/privateLinkServices/pls_<...>`

That is the target you'll connect to from Azure.

### Option B: Atlas CLI (repeatable)

- [Atlas CLI docs](https://www.mongodb.com/docs/atlas/cli/current/command/atlas-privateendpoints-azure-create/)

{% code "Create the Private Link Service" %}
```bash
atlas privateEndpoints azure create \
  --region eastus \
  --projectId <ATLAS_PROJECT_ID> \
  --output json
```

This returns an Atlas **endpoint service ID**. You need it for the handshake
in step 3.

---

## 2) Create the Azure Private Endpoint (Azure-side) 🔌

Now build the Azure **Private Endpoint** inside your VNet and subnet. It
creates a NIC with a **private IP** in your subnet. Then it wires that NIC to
the Atlas Private Link Service.

Azure docs:

- [Private endpoint overview](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
- [Create a private endpoint (CLI quickstart)](https://learn.microsoft.com/en-us/azure/private-link/create-private-endpoint-cli)
- [Azure CLI reference](https://learn.microsoft.com/en-us/cli/azure/network/private-endpoint?view=azure-cli-latest)

### Option A: Azure Portal (most common)

- Azure Portal → **Private Link Center** → **Private endpoints** → **+ Create**
- Choose your **Subscription**, **Resource group**, and **Region**
- Networking step: choose your **Virtual network** and **Subnet**
- Resource step: connect by **Resource ID**
- Paste the Atlas-provided **Private Link Service resource ID** (the one that
  ends in `.../privateLinkServices/pls_...`)
- Create the private endpoint

### Option B: Azure CLI (scriptable)

Atlas often generates a ready-to-run command like this:

{% code "Create the Private Endpoint" %}
```bash
az network private-endpoint create \
  --resource-group resource-group-name \
  --name endpoint-name \
  --vnet-name vnet-name \
  --subnet subnet-xxxx1 \
  --private-connection-resource-id /subscriptions/<...>/resourceGroups/<...>/providers/Microsoft.Network/privateLinkServices/pls_<...> \
  --connection-name pls_<...> \
  --manual-request true
```

Notes:

- You control: `--resource-group`, `--name`, `--vnet-name`, `--subnet`
- Atlas controls: `--private-connection-resource-id ...privateLinkServices/pls_...` (don't change it)
- If Azure CLI requires a location, add: `--location <azure-region>` (same
  region as your VNet)

#### Field mapping (Atlas-generated values → Azure CLI flags)

| CLI flag | What it is | Where the value comes from |
| --- | --- | --- |
| `--resource-group <rg>` | RG where the **private endpoint** resource will live | **You choose** |
| `--name <name>` | Name of the **Azure Private Endpoint** resource | **You choose** |
| `--vnet-name <vnet>` | VNet to place the endpoint NIC into | **You choose** |
| `--subnet <subnet>` | Subnet inside that VNet | **You choose** |
| `--private-connection-resource-id .../privateLinkServices/pls_...` | Target Atlas **Private Link Service** | **Atlas provides** |
| `--connection-name <conn-name>` | Friendly name for the PE connection | Atlas suggests (any name is fine) |
| `--manual-request true` | Manual approval handshake | Atlas expects this |

---

## 3) Register the Azure Private Endpoint with Atlas (the "handshake") 🤝

After Azure creates the Private Endpoint, you need **two values** from Azure:

- **Azure Private Endpoint resource ID** (the PE object ID)
- **Private IP address** assigned to the endpoint NIC

### Get the values from Azure (Portal)

- Azure Private Endpoint → **Properties** → copy the **Resource ID**
  - Looks like: `/subscriptions/.../resourceGroups/.../providers/Microsoft.Network/privateEndpoints/<your-endpoint-name>`
- Azure Private Endpoint → **Network interface** (or DNS configuration / NIC)
  → copy the **Private IP**

### Option A: Atlas UI

Atlas → **Database & Network Access → Private Endpoint**, find your Azure
entry and complete the wizard:

- Paste the **Azure Private Endpoint Resource ID**
- Paste the **Private IP address**

Then wait for Atlas to show the endpoint as **Available**.

### Option B: Atlas CLI

- [CLI docs](https://www.mongodb.com/docs/atlas/cli/current/command/atlas-privateendpoints-azure-interfaces-create/)

{% code "Register the endpoint with Atlas" %}
```bash
atlas privateEndpoints azure interfaces create <endpointServiceId> \
  --privateEndpointId "<AZURE_PRIVATE_ENDPOINT_RESOURCE_ID>" \
  --privateEndpointIpAddress "<PRIVATE_IP>" \
  --projectId <ATLAS_PROJECT_ID> \
  --output json
```

---

## 4) DNS (the #1 reason "it looks green but won't connect") 🧠

This is where most Private Link setups succeed or fail.

Your app will connect using a Private Endpoint–aware SRV hostname like:

- `cluster0-pl-0.<hash>.mongodb.net`

That SRV record resolves to one or more targets like:

- `pl-0-<region>.<hash>.mongodb.net`

Inside Azure, those `pl-0-...` hostnames must resolve to the **private IP** of
your Private Endpoint NIC.

Atlas docs for this behavior:

- [Private endpoint–aware connection strings](https://www.mongodb.com/docs/atlas/security-private-endpoint/#private-endpoint-aware-connection-strings)
- [Manage & connect from private endpoints](https://www.mongodb.com/docs/atlas/security-manage-private-endpoint/)

### Option A (recommended): Azure Private DNS Zone 🗺️

[Azure Private DNS (concept)](https://learn.microsoft.com/en-us/azure/dns/private-dns-overview)

- Create a **Private DNS zone** for the cluster's subdomain:
  - Prefer: `<hash>.mongodb.net` (scoped + safer)
- Link the private DNS zone to your VNet.
- Add **A record(s)** for the SRV targets returned by DNS:
  - Record name: `pl-0-<region>` (if zone is `<hash>.mongodb.net`)
  - Record value: the **Private IP** of your Private Endpoint NIC

Your SRV lookup may return several targets. You may also run several
endpoints. Create an A record for each `pl-<n>-...` hostname.

### Option B (quick proof): `/etc/hosts` on the app machine 🧪

Want to prove it works right now? Map the SRV target hostname straight to the
private IP:

{% code "Temporary hosts entry" %}
```bash
sudo sh -c 'echo "<PRIVATE_IP>  pl-0-<region>.<hash>.mongodb.net" >> /etc/hosts'
```

Not production DNS, but great for a fast "does this work?" ✅

---

## 5) Smoke testing (DNS first, then TCP) 🔍

Run these **from the machine where your app will run**. An Azure VM, an AKS
node, a bastion host. Your laptop works only if it sits on that VNet over VPN
or ExpressRoute, and uses the same DNS.

### 5.1 Confirm status (control-plane) 🟢

- **Atlas**: Network Access → Private Endpoint shows **Available**
- **Azure**: Private Endpoint connection shows **Approved** (not Pending)

If either isn't true, don't bother testing DNS yet.

### 5.2 Get the SRV hostname from Atlas 🔗

Atlas → **Database (Deployments/Clusters)** → **Connect** → **Connect your
application**

Pick the connection string that mentions **Private Endpoint** (or includes
`-pl-0-`), like:

- `mongodb+srv://...@cluster0-pl-0.<hash>.mongodb.net/?...`

The hostname after the `@` is your **SRV hostname**.

### 5.3 Resolve the SRV record 📌

{% code "Resolve the SRV record" %}
```bash
nslookup -type=SRV _mongodb._tcp.<SRV_HOSTNAME>
```

Example:

{% code "Example" %}
```bash
nslookup -type=SRV _mongodb._tcp.cluster0-pl-0.<hash>.mongodb.net
```

You should see one or more SRV targets and ports.

### 5.4 Resolve the SRV target to an IP 🧭

Pick one SRV target hostname and resolve it:

{% code "Resolve the target" %}
```bash
nslookup <SRV_TARGET_HOSTNAME>
```

✅ Success looks like: it returns a **private IP** (your Private Endpoint NIC
IP).

If it returns a public IP, your DNS isn't wired for Private Link yet.

### 5.5 Test TCP reachability 🔥

If you have `nc`:

{% code "Test the port" %}
```bash
nc -vz <SRV_TARGET_HOSTNAME> <PORT>
```

✅ Success looks like: "succeeded" / "connected".

---

## 6) Optional: tiny Node.js "hello world" to prove it works 👋

Not the point of the post, but it's the cleanest end-to-end confirmation.

MongoDB Node driver docs:

- [Node.js driver fundamentals](https://www.mongodb.com/docs/drivers/node/current/)

### 6.1 Setup

{% code "Set up the project" %}
```bash
mkdir atlas-private-endpoint-hello
cd atlas-private-endpoint-hello
npm init -y
npm i mongodb dotenv
```

Create `.env`:

{% code ".env" %}
```bash
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>-pl-0.<hash>.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="pe_demo"
```

### 6.2 `index.js`

{% code "index.js" %}
```javascript
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in .env");

const dbName = process.env.MONGODB_DB || "pe_demo";
const client = new MongoClient(uri);

async function main() {
  await client.connect();

  const db = client.db(dbName);
  const col = db.collection("hello");

  // CREATE (upsert)
  const doc = { _id: "hello", msg: "hello private endpoint", ts: new Date() };
  await col.replaceOne({ _id: doc._id }, doc, { upsert: true });

  // READ
  console.log("READ:", await col.findOne({ _id: "hello" }));

  // UPDATE
  await col.updateOne(
    { _id: "hello" },
    { $set: { msg: "updated over private link 🚀", updatedAt: new Date() } }
  );
  console.log("UPDATED:", await col.findOne({ _id: "hello" }));

  // DELETE
  await col.deleteOne({ _id: "hello" });
  console.log("DELETED count:", await col.countDocuments({ _id: "hello" }));

  await client.close();
}

main().catch(async (err) => {
  console.error(err);
  try { await client.close(); } catch {}
  process.exit(1);
});
```

Run it:

{% code "Run it" %}
```bash
node index.js
```

---

## What "done" looks like ✅

- Atlas private endpoint status: **Available**
- Azure private endpoint connection: **Approved**
- `nslookup -type=SRV _mongodb._tcp.<srv-host>` returns SRV targets
- `nslookup <pl-0-...>` returns a **private IP**
- `nc -vz <pl-0-...> <port>` connects
- Node app connects and CRUD works 🎉

Hit a wall? 90% of the time it's DNS. Get `pl-0-...` resolving privately
first. After that everything turns boring, which is the good kind of boring 😄.
