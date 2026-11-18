---
title: "Getting Started with OrbStack on macOS"
date: 2025-12-28
tags: ["macos", "devops", "docker", "kubernetes", "orbstack"]
description: "A fast, lightweight guide to replacing Docker Desktop with OrbStack for containers, Linux VMs, and Kubernetes."
subtitle: "Replacing Docker Desktop with OrbStack."
---

For years Docker Desktop was the only real choice on macOS. It cost you.
Battery drain. Loud fans. A filesystem that crawled.

Enter **OrbStack**. A native Mac app. Lighter, faster, and it behaves like it
belongs on the machine. It is more than a Docker replacement. It runs Linux
machines and Kubernetes clusters too.

This guide sticks to the `orb` CLI.

## 1. Installation

Homebrew is the quickest way in. Open a terminal and run:

```bash
brew install orbstack
```

OrbStack sets itself up on first launch. It installs the orb, docker and kubectl
command-line tools for you.

## 2. Running a Linux Virtual Machine

This is where the orb CLI shines. Containers go through docker. Linux machines
go through orb.

### Create a Machine

Spin up an Ubuntu box. Ubuntu is the default.

```bash
# Syntax: orb create [distro] [name]
orb create ubuntu sandbox
```

### Access the Machine

No ssh keys. No config files. The orb CLI handles the login:

```bash
# Log into the default user
orb -m sandbox
```

## 3. Running a Container

**Note**: orb runs the engine. You still run containers with docker. OrbStack
drops in where the Docker engine was, so your old commands work unchanged.

### Run a Web Server

Let's run a simple Nginx container.

```bash
docker run -d --name my-web nginx
```

### Magic Domains

This is OrbStack's killer feature. Forget localhost:8080. Every running
container gets a domain named after it.

Open your browser and visit: [http://my-web.orb.local](http://my-web.orb.local)

It resolves straight to your container. No port clashes. No `localhost`
guesswork.

## 4. Running a Kubernetes Cluster

orb turns the cluster on and off. You still deploy with `kubectl`.

### Enable Kubernetes via CLI

K8s ships off, to save resources. Turn it on from the terminal:

```bash
# Enable and start the Kubernetes cluster
orb start k8s
```

**Note**: It may take a few moments for the cluster to spin up.

### Deploy a Pod

Once the cluster is up, OrbStack sets your context for you.

```bash
# Create a pod
kubectl run k8s-demo --image=nginx

# Wait for it to start
kubectl get pods -w
```

### Exposing Services

Create a Service of type `LoadBalancer`. OrbStack hands it an IP your Mac can
reach, right away.

```bash
# Expose the pod
kubectl expose pod k8s-demo --type=LoadBalancer --port=80

# Get the External IP
kubectl get svc k8s-demo
```

## 5. Cleanup

Finished exploring? OrbStack is fast enough that tearing it down costs you
nothing. Here is how to clear what we made.

### Remove the Linux VM

```bash
orb delete sandbox
```

### Remove the Container

```bash
docker rm -f my-web
```

### Disable the Kubernetes Cluster

```bash
orb stop k8s
orb config set k8s.enabled false
```

## Summary

You swapped a heavy virtualization stack for one native app.

* Infrastructure Management: Use orb (e.g., orb create, orb restart, orb list).
* Container Workloads: Use docker (standard CLI).
* Cluster Workloads: Use kubectl (standard CLI).
