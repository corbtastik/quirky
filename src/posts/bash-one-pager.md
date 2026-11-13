---
title: "Bash One Pager"
date: 2025-12-27
tags: ["tutorial", "bash", "linux"]
description: "A little ditty about bash"
---

One page of the Bash I reach for most. File operations at the top, shell
scripting at the bottom.

## File Operations

The ones you will use every day.

| Command | Description |
| :--- | :--- |
| `ls -lah` | List all files (including hidden) with human-readable sizes. |
| `cp -r source dest` | Copy files or directories recursively. |
| `mv source dest` | Move or rename a file/directory. |
| `rm -rf path` | **Danger:** Forcefully remove a directory and its contents. |
| `touch file.txt` | Create an empty file or update its timestamp. |
| `cat file.txt` | Output the entire content of a file. |
| `less file.txt` | View file content one page at a time (`q` to quit). |
| `head -n 10 file` | View the first 10 lines of a file. |
| `tail -f file.log` | Follow the output of a file as it grows (great for logs). |
| `find . -name "*.js"` | Find files ending in `.js` in the current directory. |

## Directory Operations

Getting around.

| Command | Description |
| :--- | :--- |
| `pwd` | Print Working Directory (where am I?). |
| `cd /path/to/dir` | Change directory. |
| `cd ..` | Go up one directory level. |
| `cd ~` | Go to the user's home directory. |
| `cd -` | Go back to the *previous* directory you were in. |
| `mkdir -p a/b/c` | Create a nested directory tree in one go. |
| `tree -L 2` | Show directory structure as a tree (max depth 2). |

## Disk, CPU, and Memory

What the box is doing.

| Command | Description |
| :--- | :--- |
| `df -h` | Show **Disk Free** space in human-readable format. |
| `du -sh folder/` | Show **Disk Usage** summary for a specific folder. |
| `free -h` | Show available RAM and Swap memory. |
| `top` | Live view of system processes and resource usage. |
| `htop` | A prettier, more interactive version of `top` (if installed). |
| `uptime` | Show how long the system has been running and load averages. |

## Process Management

What is running, and how to stop it.

| Command | Description |
| :--- | :--- |
| `ps aux` | List all running processes for all users. |
| `ps aux \| grep node` | Find a specific process (e.g., node). |
| `pidof app_name` | Get the ID (PID) of a specific program. |
| `kill 1234` | Terminate process with PID 1234. |
| `kill -9 1234` | **Force** kill process 1234 (use carefully). |
| `killall nginx` | Kill all processes named `nginx`. |
| `bg` / `fg` | Send a job to background or bring to foreground. |
| `Ctrl + Z` | Suspend the current foreground process. |

## Users and Environment

Who you are and where you are.

| Command | Description |
| :--- | :--- |
| `whoami` | Display current username. |
| `id` | Show user ID and group IDs. |
| `sudo command` | Run command as root (SuperUser). |
| `su - username` | Switch to another user environment. |
| `env` | List all environment variables. |
| `export VAR=value` | Set an environment variable. |
| `echo $PATH` | Print the executable search path. |
| `history` | Show command history. |

## Network & Host Info

Who you are on the wire.

| Command | Description |
| :--- | :--- |
| `hostname -I` | Display the host's IP address(es). |
| `ping google.com` | Check connectivity to a host. |
| `curl -I example.com` | Fetch HTTP headers from a URL. |
| `wget url` | Download a file from the web. |
| `netstat -tuln` | Show active listening ports (TCP/UDP). |
| `ss -tulpn` | Modern replacement for `netstat`. |
| `ssh user@host` | Secure Shell: Connect to a remote server. |
| `scp file user@host:~` | Secure Copy: Upload file to remote home dir. |

## Date, Time, & Scheduling

| Command | Description |
| :--- | :--- |
| `date` | Show current date and time. |
| `date -u` | Show time in UTC. |
| `cal` | Show a calendar for the current month. |
| `crontab -e` | Edit cron jobs (scheduled tasks). |
| `crontab -l` | List current cron jobs. |
| `at 5pm` | Schedule a one-time job for 5 PM. |

---

# Bash Scripting Basics

Bash is a glue language. Here is what the glue looks like.

## A Script Worth Keeping

This one archives a directory and throws away the old copies. It is short, but
it leans on most of what makes Bash useful.

```bash
#!/usr/bin/env bash
# Archive a directory, then keep only the newest few archives.
set -euo pipefail

SRC="${1:-.}"                 # what to back up (default: here)
KEEP="${2:-3}"                # how many archives to keep
DEST="$HOME/backups"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ -d "$SRC" ] || die "no such directory: $SRC"
mkdir -p "$DEST"

name=$(basename "$(cd "$SRC" && pwd)")
stamp=$(date +%Y%m%d-%H%M%S)
archive="$DEST/$name-$stamp.tar.gz"

tar -czf "$archive" -C "$SRC" .
printf 'wrote %s (%s)\n' "$archive" "$(du -h "$archive" | cut -f1)"

# Oldest first past the keep limit, deleted one at a time.
pruned=0
while IFS= read -r old; do
  rm -f "$old"
  printf 'pruned %s\n' "$old"
  pruned=$((pruned + 1))
done < <(ls -1t "$DEST/$name"-*.tar.gz | tail -n +$((KEEP + 1)))

printf 'kept %d, pruned %d\n' "$KEEP" "$pruned"
```

Seven things are doing the work there.

| Line | What it shows |
| :--- | :--- |
| `set -euo pipefail` | Stop on an error, an unset variable, or a failed pipe. |
| `${1:-.}` | Use the argument, or fall back to a default. |
| `die() { ...; }` | A function, writing to stderr and exiting. |
| `[ -d "$SRC" ] \|\| die ...` | Test, then run the right side only on failure. |
| `$(basename ...)` | Command substitution, nested two deep. |
| `done < <(ls -1t ...)` | Process substitution, so the counter survives the loop. |
| `$((pruned + 1))` | Arithmetic, no `expr` needed. |

Run it with no arguments and it backs up the current directory, keeping three.
