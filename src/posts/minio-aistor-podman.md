---
title: "Running MinIO AIStor in Podman"
date: 2026-11-12
tags: ["minio", "aistor", "podman", "containers", "object-storage"]
description: "A single node on a laptop, with diagrams. Four drives, a license, and the two traps that catch everyone."
---

AIStor is MinIO's object store for AI workloads. The container image is public.
The license is not. You can pull and start the server in a minute, but it will
refuse every S3 call until you feed it a license file.

Here is the whole shape of it before any commands.

<svg class="diagram" viewBox="0 0 680 300" role="img"
     aria-label="A client talks to ports 9000 and 9001 on the host. Podman forwards them to the AIStor server, which writes across four drives. A license file and a certs directory are mounted in.">
  <g class="dg-box">
    <rect x="8" y="96" width="112" height="56" rx="6"/>
    <text class="dg-strong" x="64" y="118" text-anchor="middle">client</text>
    <text class="dg-mono"   x="64" y="136" text-anchor="middle">mc, aws-sdk</text>
  </g>
  <path class="dg-line" d="M120 116 H188" marker-end="url(#dg-tip)"/>
  <path class="dg-line" d="M120 140 H188" marker-end="url(#dg-tip)"/>
  <text class="dg-mono"  x="154" y="110" text-anchor="middle">:9000</text>
  <text class="dg-mono"  x="154" y="158" text-anchor="middle">:9001</text>
  <rect class="dg-frame" x="188" y="40" width="268" height="224" rx="10"/>
  <text class="dg-small" x="202" y="60">podman container</text>
  <g class="dg-box">
    <rect x="212" y="84" width="220" height="68" rx="6"/>
    <text class="dg-strong" x="322" y="110" text-anchor="middle">minio server</text>
    <text class="dg-mono"   x="322" y="130" text-anchor="middle">S3 API + WebUI</text>
  </g>
  <g class="dg-box">
    <rect x="212" y="186" width="104" height="52" rx="6"/>
    <text class="dg-mono"  x="264" y="208" text-anchor="middle">minio.license</text>
    <text class="dg-small" x="264" y="226" text-anchor="middle">read only</text>
  </g>
  <g class="dg-box">
    <rect x="328" y="186" width="104" height="52" rx="6"/>
    <text class="dg-mono"  x="380" y="208" text-anchor="middle">certs/</text>
    <text class="dg-small" x="380" y="226" text-anchor="middle">TLS, optional</text>
  </g>
  <path class="dg-line" d="M264 186 V156" marker-end="url(#dg-tip)"/>
  <path class="dg-line" d="M380 186 V156" marker-end="url(#dg-tip)"/>
  <path class="dg-line" d="M432 118 H528" marker-end="url(#dg-tip)"/>
  <text class="dg-small" x="496" y="110" text-anchor="middle">erasure set</text>
  <g class="dg-box">
    <rect x="532" y="56" width="132" height="34" rx="5"/>
    <text class="dg-mono" x="598" y="78" text-anchor="middle">/mnt/data1</text>
    <rect x="532" y="98" width="132" height="34" rx="5"/>
    <text class="dg-mono" x="598" y="120" text-anchor="middle">/mnt/data2</text>
    <rect x="532" y="140" width="132" height="34" rx="5"/>
    <text class="dg-mono" x="598" y="162" text-anchor="middle">/mnt/data3</text>
    <rect x="532" y="182" width="132" height="34" rx="5"/>
    <text class="dg-mono" x="598" y="204" text-anchor="middle">/mnt/data4</text>
  </g>
  <text class="dg-small" x="598" y="234" text-anchor="middle">one volume each</text>
  <defs>
    <marker id="dg-tip" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
      <path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
</svg>
<span class="diagram-caption">One node, four drives, two mounted files.</span>

## What you need

Podman, and a license file from MinIO. Nothing else. The image lives on a
public registry, so there is no `podman login` step.

{% code "Pull the image" %}
```bash
podman pull quay.io/minio/aistor/minio:RELEASE.2026-08-07T18-34-35Z
```

That is about 392 MB.

## Trap one: drives on the root filesystem

Point the server at four directories on your normal disk and it will reject
all four. Every drive goes offline and nothing serves.

{% code "What that looks like" %}
```text
Error: Drive /tmp/d3 returned an unexpected error:
       drive is part of root drive, will not be used,
       please investigate - drive will be offline
```

MinIO checks whether a drive sits on the root filesystem, and refuses the
ones that do. Give it a volume per drive instead.

{% code "Make four volumes" %}
```bash
for i in 1 2 3 4; do podman volume create aistor-data$i; done
```

A bind mount from the host works too. A plain directory inside the container
does not.

## Run it

{% code "Start a single node" %}
```bash
podman run -d --name aistor \
  -p 9000:9000 -p 9001:9001 \
  -v aistor-data1:/mnt/data1 \
  -v aistor-data2:/mnt/data2 \
  -v aistor-data3:/mnt/data3 \
  -v aistor-data4:/mnt/data4 \
  -v "$HOME/minio/minio.license:/minio.license:ro" \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD='choose-something-long' \
  quay.io/minio/aistor/minio:RELEASE.2026-08-07T18-34-35Z \
  server /mnt/data{1...4} --console-address :9001 --license /minio.license
```

Two things in that command are worth a second look.

`/mnt/data{1...4}` is MinIO's own shorthand, not your shell's. It expands to
four drives. You can go up to `{1...64}`.

`--console-address :9001` is not optional. The console binds to port 0 by
default, which means a random port. Name it or you will not find it.

## What a good start looks like

{% code "First run" %}
```text
INFO: Found unformatted pool - pool-0 (will attempt formatting with quorum: 3)
INFO: Successfully formatted pool pool-0 (quorum: 3)
INFO: First-time cluster setup completed successfully:
INFO:   Pool-0: 4/4 drives formatted and online
MinIO AIStor Server
API: http://127.0.0.1:9000
WebUI: http://127.0.0.1:9001
```

Four of four drives, online. The pool formats once and remembers.

## Trap two: no license, no service

Leave the license out and the server still starts. It looks healthy. It is not.

{% code "The line that matters" %}
```text
WARN: No valid license found, running in offline mode.
      All S3 operations are denied.
      Please install a valid license using 'mc license update' to restore service.
```

This is the one that wastes an afternoon. The server is up, the console
answers, the drives are formatted, and every single bucket call fails. Read
the startup log.

<svg class="diagram" viewBox="0 0 640 150" role="img"
     aria-label="Without a license the server starts but denies all S3 operations. With a license it serves, and mc can set an alias against it.">
  <g class="dg-box">
    <rect x="8" y="46" width="130" height="58" rx="6"/>
    <text class="dg-strong" x="73" y="70" text-anchor="middle">server starts</text>
    <text class="dg-small"  x="73" y="88" text-anchor="middle">drives formatted</text>
  </g>
  <path class="dg-line" d="M138 62 H232" marker-end="url(#dg-tip2)"/>
  <text class="dg-small" x="185" y="54" text-anchor="middle">no license</text>
  <path class="dg-line" d="M138 96 H232" marker-end="url(#dg-tip2)"/>
  <text class="dg-small" x="185" y="116" text-anchor="middle">license</text>
  <g class="dg-box">
    <rect x="236" y="34" width="180" height="48" rx="6"/>
    <text class="dg-strong" x="326" y="55" text-anchor="middle">offline mode</text>
    <text class="dg-mono"   x="326" y="72" text-anchor="middle">all S3 calls denied</text>
  </g>
  <g class="dg-note">
    <rect x="236" y="88" width="180" height="48" rx="6"/>
    <text class="dg-strong" x="326" y="109" text-anchor="middle">serving</text>
    <text class="dg-mono"   x="326" y="126" text-anchor="middle">buckets, objects, UI</text>
  </g>
  <path class="dg-line" d="M416 112 H500" marker-end="url(#dg-tip2)"/>
  <g class="dg-box">
    <rect x="504" y="88" width="128" height="48" rx="6"/>
    <text class="dg-mono" x="568" y="117" text-anchor="middle">mc alias set</text>
  </g>
  <defs>
    <marker id="dg-tip2" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
      <path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
</svg>
<span class="diagram-caption">The server starts either way. Only one branch serves data.</span>

## Where everything lives

| What | Where | Note |
| --- | --- | --- |
| S3 API | `:9000` | the default, set with `--address` |
| WebUI | `:9001` | set it, or you get a random port |
| Drives | `/mnt/data1` to `/mnt/data4` | one volume each |
| License | `/minio.license` | path passed to `--license` |
| Certs | `/root/.minio/certs` | default, set with `--certs-dir` |

## Drives and parity

The four drives form one erasure set. MinIO splits each object into shards and
spreads them across every drive in the set. Some shards are parity.

<svg class="diagram" viewBox="0 0 680 276" role="img"
     aria-label="One object is split into four shards. Each shard is written to its own drive, mnt data 1 through 4. The four drives form one erasure set, so losing a drive does not lose the object.">
  <g class="dg-note">
    <rect x="250" y="12" width="180" height="48" rx="6"/>
    <text class="dg-strong" x="340" y="34" text-anchor="middle">object</text>
    <text class="dg-small"  x="340" y="50" text-anchor="middle">split on write</text>
  </g>
  <path class="dg-line" d="M340 60 V76"/>
  <path class="dg-line" d="M118 76 H562"/>
  <path class="dg-line" d="M118 76 V98" marker-end="url(#dg-tip3)"/>
  <path class="dg-line" d="M266 76 V98" marker-end="url(#dg-tip3)"/>
  <path class="dg-line" d="M414 76 V98" marker-end="url(#dg-tip3)"/>
  <path class="dg-line" d="M562 76 V98" marker-end="url(#dg-tip3)"/>
  <g class="dg-box">
    <rect x="58" y="98" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="118" y="122" text-anchor="middle">shard</text>
    <rect x="206" y="98" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="266" y="122" text-anchor="middle">shard</text>
    <rect x="354" y="98" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="414" y="122" text-anchor="middle">shard</text>
    <rect x="502" y="98" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="562" y="122" text-anchor="middle">shard</text>
  </g>
  <path class="dg-line" d="M118 136 V158" marker-end="url(#dg-tip3)"/>
  <path class="dg-line" d="M266 136 V158" marker-end="url(#dg-tip3)"/>
  <path class="dg-line" d="M414 136 V158" marker-end="url(#dg-tip3)"/>
  <path class="dg-line" d="M562 136 V158" marker-end="url(#dg-tip3)"/>
  <g class="dg-box">
    <rect x="58" y="158" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="118" y="182" text-anchor="middle">/mnt/data1</text>
    <rect x="206" y="158" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="266" y="182" text-anchor="middle">/mnt/data2</text>
    <rect x="354" y="158" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="414" y="182" text-anchor="middle">/mnt/data3</text>
    <rect x="502" y="158" width="120" height="38" rx="5"/>
    <text class="dg-mono" x="562" y="182" text-anchor="middle">/mnt/data4</text>
  </g>
  <path class="dg-line" d="M118 210 V218 H562 V210"/>
  <path class="dg-line" d="M340 218 V228"/>
  <text x="340" y="244" text-anchor="middle">one erasure set</text>
  <text class="dg-small" x="340" y="262" text-anchor="middle">lose a drive, the object survives</text>
  <defs>
    <marker id="dg-tip3" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
      <path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
</svg>
<span class="diagram-caption">One object, four shards, one shard per drive.</span>

The formatting log says `quorum: 3`. Three of the four drives have to agree
before the pool will format. The same idea protects reads later.

## Adding TLS

Drop a certificate and key into a directory and mount it.

{% code "Certs layout" %}
```text
certs/
├── public.crt
└── private.key
```

{% code "Mount it" %}
```bash
-v "$HOME/minio/certs:/root/.minio/certs" \
-e MINIO_SERVER_URL=https://localhost:9000 \
-e MINIO_BROWSER_REDIRECT_URL=https://localhost:9001
```

Set both URLs. The console builds links from them. Miss them and it will send
your browser to `http://` and the redirect will fail.

## Check it

{% code "Point mc at it" %}
```bash
mc alias set local http://localhost:9000 admin 'choose-something-long'
mc mb local/first-bucket
mc ls local
```

If `mc mb` fails and the server looks fine, go back and read the startup log
for the license warning.

## Clean up

{% code "Remove the node and its drives" %}
```bash
podman rm -f aistor
for i in 1 2 3 4; do podman volume rm aistor-data$i; done
```

The volumes hold the formatted pool. Remove them and the next start formats
a fresh one.

---

Everything above came from the image itself: `minio server --help` for the
flags, and a throwaway container for the two error messages. The full
documentation is at
[docs.min.io](https://docs.min.io/enterprise/aistor-object-store/).
