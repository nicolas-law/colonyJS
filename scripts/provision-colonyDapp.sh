#!/bin/bash

# Paths
COLONY_DAPP_PATH="colonyDapp";
ROOT_PATH=$(pwd)

# TODO later: do not hardcode this
COLONY_DAPP_COMMIT_HASH="b801772ccd02240b9c7a337696896c5d3814d22d"

log() {
    # Colors
    GREEN='\033[0;32m'
    NC='\033[0m' # No Color
    # Weights
    BOLD='\033[1m'
    echo "${GREEN}${BOLD}$1${NC}"
}

log "Initialize colonyDapp"
[[ -d "${COLONY_DAPP_PATH}" ]] || git clone git@github.com:JoinColony/colonyDapp.git ${COLONY_DAPP_PATH}
cd ${COLONY_DAPP_PATH}
git fetch

log "Checked out colonyDapp at ${COLONY_DAPP_COMMIT_HASH}"
git checkout ${COLONY_DAPP_COMMIT_HASH}

log "Provisioning colonyDapp"
yarn run provision

log "Linking colonyJS for colonyDapp"
rm -rf src/lib/colony-js
ln -s src/lib/colony-js ${ROOT_PATH}

cd ${ROOT_PATH}
