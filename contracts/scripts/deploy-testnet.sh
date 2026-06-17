#!/usr/bin/env bash
set -euo pipefail

echo "=== DeFi Marketplace - Testnet Deployment ==="

export STELLAR_RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
export STELLAR_NETWORK_PASSPHRASE="${STELLAR_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
export STELLAR_ADMIN_SECRET_KEY="${STELLAR_ADMIN_SECRET_KEY:-}"

if [ -z "$STELLAR_ADMIN_SECRET_KEY" ]; then
  echo "ERROR: STELLAR_ADMIN_SECRET_KEY is not set"
  exit 1
fi

NETWORK_ARGS="--rpc-url $STELLAR_RPC_URL --network-passphrase $STELLAR_NETWORK_PASSPHRASE"
ADMIN_ARGS="--source-account $STELLAR_ADMIN_SECRET_KEY"

echo ""
echo "1. Building contracts..."
cd "$(dirname "$0")/.."
cargo build --release

echo ""
echo "2. Installing Soroban CLI..."
cargo install soroban-cli --locked 2>/dev/null || true

echo ""
echo "3. Deploying Token contract..."
TOKEN_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_token.wasm)
echo "   Token contract: $TOKEN_ID"

echo ""
echo "4. Deploying AMM contract..."
AMM_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_amm.wasm)
echo "   AMM contract: $AMM_ID"

echo ""
echo "5. Deploying Lending contract..."
LENDING_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_lending.wasm)
echo "   Lending contract: $LENDING_ID"

echo ""
echo "6. Deploying Staking contract..."
STAKING_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_staking.wasm)
echo "   Staking contract: $STAKING_ID"

echo ""
echo "7. Deploying NFT contract..."
NFT_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_nft.wasm)
echo "   NFT contract: $NFT_ID"

echo ""
echo "8. Deploying Marketplace contract..."
MARKETPLACE_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_marketplace.wasm)
echo "   Marketplace contract: $MARKETPLACE_ID"

echo ""
echo "9. Deploying Launchpad contract..."
LAUNCHPAD_ID=$(soroban contract deploy \
  $NETWORK_ARGS $ADMIN_ARGS \
  --wasm target/wasm32-unknown-unknown/release/defi_launchpad.wasm)
echo "   Launchpad contract: $LAUNCHPAD_ID"

echo ""
echo "=== Deployment Summary ==="
echo "TOKEN_ID=$TOKEN_ID"
echo "AMM_ID=$AMM_ID"
echo "LENDING_ID=$LENDING_ID"
echo "STAKING_ID=$STAKING_ID"
echo "NFT_ID=$NFT_ID"
echo "MARKETPLACE_ID=$MARKETPLACE_ID"
echo "LAUNCHPAD_ID=$LAUNCHPAD_ID"

# Save to .env file
cat > .env.deployed <<EOF
# Deployed on $(date)
TOKEN_CONTRACT_ID=$TOKEN_ID
AMM_CONTRACT_ID=$AMM_ID
LENDING_CONTRACT_ID=$LENDING_ID
STAKING_CONTRACT_ID=$STAKING_ID
NFT_CONTRACT_ID=$NFT_ID
MARKETPLACE_CONTRACT_ID=$MARKETPLACE_ID
LAUNCHPAD_CONTRACT_ID=$LAUNCHPAD_ID
EOF

echo ""
echo "Deployment addresses saved to contracts/.env.deployed"
