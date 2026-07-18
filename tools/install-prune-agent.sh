#!/bin/bash
# One-shot installer for the Lift backup pruner. Run on the Mac either from
# a clone of the repo (bash tools/install-prune-agent.sh) or straight from
# the deployed site:
#
#   curl -fsSL https://accounterprob.github.io/lift/tools/install-prune-agent.sh | bash
#
# It installs ~/Scripts/prune-backups.sh, writes the launchd agent with the
# real home folder baked into its WatchPaths, (re)loads the agent, trims the
# backup folder right away, and lists any OTHER Lift-looking agents (e.g. an
# old age-based cleaner) with copy-paste commands to remove them — it never
# deletes anything it didn't install itself.
set -u

LABEL="com.lift.prune-backups"
AGENT="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DST="$HOME/Scripts/prune-backups.sh"
BASE_URL="${LIFT_BASE_URL:-https://accounterprob.github.io/lift}"

if [ "${LIFT_INSTALL_TEST:-}" != "1" ] && [ "$(uname)" != "Darwin" ]; then
  echo "This installer sets up a macOS launchd agent — run it on the Mac." >&2
  exit 1
fi

echo "== Lift backup pruner installer =="

# --- 1. Install the prune script (local sibling if run from a clone, else
#        download it from the deployed site). ---
mkdir -p "$(dirname "$SCRIPT_DST")"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-/nonexistent}")" 2>/dev/null && pwd || true)"
if [ -n "$SRC_DIR" ] && [ -f "$SRC_DIR/prune-backups.sh" ]; then
  cp "$SRC_DIR/prune-backups.sh" "$SCRIPT_DST"
  echo "• Installed $SCRIPT_DST (from repo)"
else
  if ! curl -fsSL "$BASE_URL/tools/prune-backups.sh" -o "$SCRIPT_DST"; then
    echo "Couldn't download prune-backups.sh from $BASE_URL — check the network and try again." >&2
    exit 1
  fi
  echo "• Installed $SCRIPT_DST (downloaded)"
fi
chmod +x "$SCRIPT_DST"

# --- 2. Write the agent with this machine's real paths (launchd can't
#        expand ~ in WatchPaths). ---
mkdir -p "$(dirname "$AGENT")"
cat > "$AGENT" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>"$SCRIPT_DST"</string>
  </array>
  <key>WatchPaths</key>
  <array>
    <string>$HOME/Desktop/Lift</string>
    <string>$HOME/Library/Mobile Documents/com~apple~CloudDocs/Lift</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>30</integer>
</dict>
</plist>
PLIST
echo "• Installed $AGENT"

# --- 3. (Re)load it — fires on every change to the Lift folder from now on. ---
launchctl unload "$AGENT" 2>/dev/null || true
if launchctl load "$AGENT"; then
  echo "• Agent loaded — it runs the moment a new backup lands in the folder."
else
  echo "launchctl load failed — you can still trim manually with: bash $SCRIPT_DST" >&2
fi

# --- 4. Trim right now and show what's left. ---
bash "$SCRIPT_DST" || true
for d in "$HOME/Desktop/Lift" "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Lift"; do
  if [ -d "$d" ]; then
    echo "• $d now contains:"
    ls -t "$d"/lift-backup-*.json 2>/dev/null | sed 's/^/    /' || true
  fi
done

# --- 5. Point out any other Lift-looking agents (e.g. an old 30-day
#        cleaner) without touching them. ---
others="$(ls "$HOME/Library/LaunchAgents" 2>/dev/null | grep -i lift | grep -vx "$LABEL.plist" || true)"
if [ -n "$others" ]; then
  echo
  echo "!! Other Lift-related agents exist. If one is an old backup cleaner,"
  echo "   remove it so two jobs don't manage the same folder:"
  printf '%s\n' "$others" | while IFS= read -r p; do
    echo "     launchctl unload ~/Library/LaunchAgents/$p && rm ~/Library/LaunchAgents/$p"
  done
fi

echo "Done."
