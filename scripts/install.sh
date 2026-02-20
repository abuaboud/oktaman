#!/bin/sh
# OktaMan Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/AbuAboud/oktaman/main/scripts/install.sh | bash
set -e

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GITHUB_REPO="AbuAboud/oktaman"
OKTAMAN_HOME="${OKTAMAN_HOME:-$HOME/.oktaman}"
NODE_VERSION="22.14.0"
PORT="${OKTAMAN_PORT:-4321}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log_info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
log_ok()    { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
log_warn()  { printf '\033[1;33m==>\033[0m %s\n' "$*"; }
log_error() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; }

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_error "'$1' is required but not found."
    exit 1
  fi
}

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    log_error "curl or wget is required."
    exit 1
  fi
}

download() {
  # $1 = url, $2 = output file
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
  else
    log_error "curl or wget is required."
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Detect platform
# ---------------------------------------------------------------------------

detect_platform() {
  OS="$(uname -s)"
  ARCH="$(uname -m)"

  case "$OS" in
    Darwin) PLATFORM="darwin" ;;
    Linux)  PLATFORM="linux" ;;
    *)
      log_error "Unsupported OS: $OS"
      exit 1
      ;;
  esac

  case "$ARCH" in
    x86_64|amd64)  ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *)
      log_error "Unsupported architecture: $ARCH"
      exit 1
      ;;
  esac

  log_info "Detected platform: ${PLATFORM}-${ARCH}"
}

# ---------------------------------------------------------------------------
# Resolve latest version
# ---------------------------------------------------------------------------

resolve_version() {
  if [ -n "$OKTAMAN_VERSION" ]; then
    VERSION="$OKTAMAN_VERSION"
    log_info "Using specified version: $VERSION"
    return
  fi

  log_info "Fetching latest release..."
  VERSION=$(fetch "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" \
    | grep '"tag_name"' | head -1 | sed 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/')

  if [ -z "$VERSION" ]; then
    VERSION="v0.1.0"
    log_warn "Could not fetch latest release, using default: $VERSION"
  fi

  # Strip leading 'v' for display but keep for download URL
  log_info "Latest version: $VERSION"
}

# ---------------------------------------------------------------------------
# Check existing install
# ---------------------------------------------------------------------------

check_existing() {
  if [ -f "$OKTAMAN_HOME/version" ]; then
    CURRENT="$(cat "$OKTAMAN_HOME/version")"
    if [ "$CURRENT" = "$VERSION" ]; then
      log_warn "OktaMan $VERSION is already installed."
      printf "Reinstall? [y/N] "
      read -r answer
      case "$answer" in
        [yY]|[yY][eE][sS]) ;;
        *) log_info "Cancelled."; exit 0 ;;
      esac
    else
      log_info "Upgrading from $CURRENT to $VERSION"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Create directory structure
# ---------------------------------------------------------------------------

prepare_dirs() {
  mkdir -p "$OKTAMAN_HOME/bin"
  mkdir -p "$OKTAMAN_HOME/logs"
  mkdir -p "$OKTAMAN_HOME/home"
  mkdir -p "$OKTAMAN_HOME/storage"
}

# ---------------------------------------------------------------------------
# Download and extract OktaMan release
# ---------------------------------------------------------------------------

install_app() {
  # Strip leading v for filename convention
  VERSION_NUM="${VERSION#v}"
  TARBALL_NAME="oktaman-${VERSION_NUM}-${PLATFORM}-${ARCH}.tar.gz"
  TARBALL_URL="https://github.com/${GITHUB_REPO}/releases/download/${VERSION}/${TARBALL_NAME}"

  log_info "Downloading OktaMan ${VERSION}..."
  TMPDIR_INSTALL="$(mktemp -d)"
  TARBALL_PATH="${TMPDIR_INSTALL}/${TARBALL_NAME}"
  download "$TARBALL_URL" "$TARBALL_PATH"

  log_info "Extracting to ${OKTAMAN_HOME}/app/..."
  rm -rf "$OKTAMAN_HOME/app"
  mkdir -p "$OKTAMAN_HOME/app"
  tar -xzf "$TARBALL_PATH" -C "$OKTAMAN_HOME/app" --strip-components=1

  rm -rf "$TMPDIR_INSTALL"
}

# ---------------------------------------------------------------------------
# Download Node.js binary
# ---------------------------------------------------------------------------

install_node() {
  # Check if bundled node already exists and is the right version
  if [ -x "$OKTAMAN_HOME/bin/node" ]; then
    EXISTING_NODE_VER="$("$OKTAMAN_HOME/bin/node" --version 2>/dev/null || echo "")"
    if [ "$EXISTING_NODE_VER" = "v${NODE_VERSION}" ]; then
      log_info "Node.js v${NODE_VERSION} already installed, skipping."
      return
    fi
  fi

  # Map platform/arch to Node.js download naming
  case "$PLATFORM" in
    darwin) NODE_OS="darwin" ;;
    linux)  NODE_OS="linux" ;;
  esac

  NODE_TARBALL="node-v${NODE_VERSION}-${NODE_OS}-${ARCH}.tar.gz"
  NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TARBALL}"

  log_info "Downloading Node.js v${NODE_VERSION}..."
  TMPDIR_NODE="$(mktemp -d)"
  download "$NODE_URL" "${TMPDIR_NODE}/${NODE_TARBALL}"

  log_info "Extracting Node.js binary..."
  tar -xzf "${TMPDIR_NODE}/${NODE_TARBALL}" -C "$TMPDIR_NODE" --strip-components=1
  cp "${TMPDIR_NODE}/bin/node" "$OKTAMAN_HOME/bin/node"
  chmod +x "$OKTAMAN_HOME/bin/node"

  rm -rf "$TMPDIR_NODE"
  log_ok "Node.js v${NODE_VERSION} installed."
}

# ---------------------------------------------------------------------------
# Install CLI wrapper
# ---------------------------------------------------------------------------

install_cli() {
  cp "$OKTAMAN_HOME/app/bin/oktaman-cli" "$OKTAMAN_HOME/bin/oktaman"
  chmod +x "$OKTAMAN_HOME/bin/oktaman"
  log_ok "CLI installed to $OKTAMAN_HOME/bin/oktaman"
}

# ---------------------------------------------------------------------------
# Install OS service
# ---------------------------------------------------------------------------

install_service_darwin() {
  PLIST_SRC="$OKTAMAN_HOME/app/service/com.oktaman.plist"
  PLIST_DST="$HOME/Library/LaunchAgents/com.oktaman.plist"

  mkdir -p "$HOME/Library/LaunchAgents"

  # Stop existing service if running
  if launchctl list "com.oktaman" >/dev/null 2>&1; then
    log_info "Stopping existing service..."
    launchctl bootout "gui/$(id -u)/com.oktaman" 2>/dev/null \
      || launchctl unload "$PLIST_DST" 2>/dev/null || true
    sleep 1
  fi

  # Replace placeholders
  sed \
    -e "s|{{OKTAMAN_HOME}}|${OKTAMAN_HOME}|g" \
    -e "s|{{HOME}}|${HOME}|g" \
    "$PLIST_SRC" > "$PLIST_DST"

  # Load the service
  launchctl bootstrap "gui/$(id -u)" "$PLIST_DST" 2>/dev/null \
    || launchctl load "$PLIST_DST" 2>/dev/null
  log_ok "launchd service installed and started."
}

install_service_linux() {
  SERVICE_SRC="$OKTAMAN_HOME/app/service/oktaman.service"
  SYSTEMD_DIR="$HOME/.config/systemd/user"
  SERVICE_DST="${SYSTEMD_DIR}/oktaman.service"

  mkdir -p "$SYSTEMD_DIR"

  # Stop existing service if running
  systemctl --user stop oktaman 2>/dev/null || true

  # Replace placeholders
  sed \
    -e "s|{{OKTAMAN_HOME}}|${OKTAMAN_HOME}|g" \
    -e "s|{{HOME}}|${HOME}|g" \
    "$SERVICE_SRC" > "$SERVICE_DST"

  systemctl --user daemon-reload
  systemctl --user enable oktaman
  systemctl --user start oktaman

  # Enable lingering so service starts at boot without login
  if command -v loginctl >/dev/null 2>&1; then
    loginctl enable-linger "$(whoami)" 2>/dev/null || true
  fi

  log_ok "systemd user service installed and started."
}

install_service() {
  case "$PLATFORM" in
    darwin) install_service_darwin ;;
    linux)  install_service_linux ;;
  esac
}

# ---------------------------------------------------------------------------
# Add to PATH
# ---------------------------------------------------------------------------

add_to_path() {
  BIN_DIR="$OKTAMAN_HOME/bin"
  PATH_LINE="export PATH=\"${BIN_DIR}:\$PATH\""

  # Check if already in PATH
  case ":$PATH:" in
    *":${BIN_DIR}:"*) return ;;
  esac

  added=false

  # Zsh
  for rc in "$HOME/.zshrc"; do
    if [ -f "$rc" ]; then
      if ! grep -q '\.oktaman/bin' "$rc" 2>/dev/null; then
        printf '\n# OktaMan\n%s\n' "$PATH_LINE" >> "$rc"
        added=true
      fi
    fi
  done

  # Bash
  for rc in "$HOME/.bashrc" "$HOME/.bash_profile"; do
    if [ -f "$rc" ]; then
      if ! grep -q '\.oktaman/bin' "$rc" 2>/dev/null; then
        printf '\n# OktaMan\n%s\n' "$PATH_LINE" >> "$rc"
        added=true
      fi
    fi
  done

  # Fish
  FISH_CONF_DIR="$HOME/.config/fish/conf.d"
  if [ -d "$HOME/.config/fish" ]; then
    mkdir -p "$FISH_CONF_DIR"
    if [ ! -f "$FISH_CONF_DIR/oktaman.fish" ]; then
      printf 'fish_add_path %s\n' "$BIN_DIR" > "$FISH_CONF_DIR/oktaman.fish"
      added=true
    fi
  fi

  if [ "$added" = true ]; then
    log_info "Added $BIN_DIR to PATH in shell config."
    log_info "Restart your shell or run: export PATH=\"${BIN_DIR}:\$PATH\""
  fi
}

# ---------------------------------------------------------------------------
# Write version file
# ---------------------------------------------------------------------------

write_version() {
  printf '%s' "$VERSION" > "$OKTAMAN_HOME/version"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  printf '\n'
  printf '\033[1m  OktaMan Installer\033[0m\n'
  printf '  ─────────────────\n\n'

  need_cmd tar
  need_cmd uname

  detect_platform
  resolve_version
  check_existing
  prepare_dirs
  install_app
  install_node
  install_cli
  install_service
  add_to_path
  write_version

  printf '\n'
  log_ok "OktaMan ${VERSION} installed successfully!"
  printf '\n'
  printf '  URL:        http://localhost:%s\n' "$PORT"
  printf '  Data:       %s\n' "$OKTAMAN_HOME"
  printf '  CLI:        oktaman help\n'
  printf '\n'
  printf '  \033[1;33mNext step:\033[0m  Run "oktaman setup" to configure your AI provider.\n'
  printf '\n'
  printf '  Commands:\n'
  printf '    oktaman setup       Configure AI provider, tools, and channels\n'
  printf '    oktaman status      Check if OktaMan is running\n'
  printf '    oktaman logs        View recent logs\n'
  printf '    oktaman open        Open in browser\n'
  printf '    oktaman restart     Restart the service\n'
  printf '    oktaman update      Update to latest version\n'
  printf '    oktaman uninstall   Remove OktaMan\n'
  printf '\n'
}

main
