#!/bin/sh
# Build an OktaMan release tarball for the current platform.
# Usage: ./scripts/build-release.sh <version>
#   e.g. ./scripts/build-release.sh 0.1.0
set -e

# ---------------------------------------------------------------------------
# Args & platform
# ---------------------------------------------------------------------------

VERSION="${1:?Usage: build-release.sh <version>}"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) PLATFORM="darwin" ;;
  Linux)  PLATFORM="linux" ;;
  *)      echo "Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
  x86_64|amd64)  ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)             echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${REPO_ROOT}/release-build"
TARBALL_NAME="oktaman-${VERSION}-${PLATFORM}-${ARCH}.tar.gz"
OUT_DIR="${REPO_ROOT}/release"

echo "==> Building OktaMan v${VERSION} for ${PLATFORM}-${ARCH}"
echo "    Repo root: ${REPO_ROOT}"

# ---------------------------------------------------------------------------
# Step 1: Build the project
# ---------------------------------------------------------------------------

echo "==> Installing dependencies..."
cd "$REPO_ROOT"
npm ci

echo "==> Building packages..."
npm run build

# ---------------------------------------------------------------------------
# Step 2: Assemble release directory
# ---------------------------------------------------------------------------

echo "==> Assembling release..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/packages/server"
mkdir -p "$BUILD_DIR/packages/ui"
mkdir -p "$BUILD_DIR/packages/shared"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/service"

# Copy built output
cp -r "$REPO_ROOT/packages/server/dist"   "$BUILD_DIR/packages/server/dist"
cp    "$REPO_ROOT/packages/server/package.json" "$BUILD_DIR/packages/server/package.json"

cp -r "$REPO_ROOT/packages/ui/dist"       "$BUILD_DIR/packages/ui/dist"
cp    "$REPO_ROOT/packages/ui/package.json"     "$BUILD_DIR/packages/ui/package.json"

cp -r "$REPO_ROOT/packages/shared/dist"   "$BUILD_DIR/packages/shared/dist"
cp    "$REPO_ROOT/packages/shared/package.json" "$BUILD_DIR/packages/shared/package.json"

# Copy root package.json (needed for workspaces resolution)
cp "$REPO_ROOT/package.json"       "$BUILD_DIR/package.json"
cp "$REPO_ROOT/package-lock.json"  "$BUILD_DIR/package-lock.json"

# Copy CLI and service files
cp "$REPO_ROOT/bin/oktaman.js"     "$BUILD_DIR/bin/oktaman.js"
cp "$REPO_ROOT/bin/oktaman-cli"    "$BUILD_DIR/bin/oktaman-cli"
chmod +x "$BUILD_DIR/bin/oktaman-cli"

cp "$REPO_ROOT/service/com.oktaman.plist"  "$BUILD_DIR/service/com.oktaman.plist"
cp "$REPO_ROOT/service/oktaman.service"    "$BUILD_DIR/service/oktaman.service"

# ---------------------------------------------------------------------------
# Step 3: Install production dependencies
# ---------------------------------------------------------------------------

echo "==> Installing production dependencies..."
cd "$BUILD_DIR"
npm ci --omit=dev

# Rebuild native addons for the current platform
echo "==> Rebuilding native addons..."
npm rebuild better-sqlite3 2>/dev/null || true

# ---------------------------------------------------------------------------
# Step 4: Prune unnecessary files from node_modules
# ---------------------------------------------------------------------------

echo "==> Pruning node_modules..."
cd "$BUILD_DIR"

# Remove test/doc/source files to reduce size
find node_modules -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name ".github" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type f -name "*.md" ! -name "LICENSE*" -delete 2>/dev/null || true
find node_modules -type f -name "*.ts" ! -name "*.d.ts" -delete 2>/dev/null || true
find node_modules -type f -name "*.map" -delete 2>/dev/null || true
find node_modules -type f -name "CHANGELOG*" -delete 2>/dev/null || true
find node_modules -type f -name ".eslint*" -delete 2>/dev/null || true
find node_modules -type f -name ".prettier*" -delete 2>/dev/null || true

# ---------------------------------------------------------------------------
# Step 5: Create tarball
# ---------------------------------------------------------------------------

echo "==> Creating tarball..."
mkdir -p "$OUT_DIR"
cd "$BUILD_DIR"
tar -czf "${OUT_DIR}/${TARBALL_NAME}" .

TARBALL_SIZE=$(du -sh "${OUT_DIR}/${TARBALL_NAME}" | cut -f1)
echo "==> Done! ${OUT_DIR}/${TARBALL_NAME} (${TARBALL_SIZE})"
