#!/bin/bash
# Trims the Lift backup folder to the newest KEEP backups.
#
# Lift downloads a FULL snapshot of the whole database on every Finish
# Workout, so older backups are pure redundancy — only the newest few
# matter. This deletes nothing but lift-backup-*.json files, keeps the
# newest KEEP of them, and quietly does nothing if the folder is missing.
#
# Run it by hand:            bash prune-backups.sh
# Keep a different number:   KEEP=5 bash prune-backups.sh
# Non-standard folder:       LIFT_DIR="$HOME/somewhere/Lift" bash prune-backups.sh
#
# To run automatically once a day, see com.lift.prune-backups.plist in
# this folder (install instructions in the README).
set -euo pipefail

KEEP="${KEEP:-3}"

# Find the backup folder: Desktop/Lift, else iCloud Drive/Lift.
if [ -z "${LIFT_DIR:-}" ]; then
  for d in "$HOME/Desktop/Lift" "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Lift"; do
    if [ -d "$d" ]; then LIFT_DIR="$d"; break; fi
  done
fi
[ -n "${LIFT_DIR:-}" ] && [ -d "$LIFT_DIR" ] || exit 0

cd "$LIFT_DIR"
# Newest first by modification time; everything past the first KEEP goes.
# (|| true: an empty folder is fine, not an error.)
{ ls -t lift-backup-*.json 2>/dev/null || true; } | tail -n +$((KEEP + 1)) | while IFS= read -r f; do
  rm -- "$f"
done
