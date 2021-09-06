#!/bin/bash -x

set -e

cd $(dirname $0)
cd ..

APP_NAME=matan

function usage() {
    cat << EOF
Usage: $0 [-i]
    -i: Initialize systemd config
    -n: Override app name from "$APP_NAME"
EOF
}

while getopts "H:hin:" opt
do
    case $opt in
        H)
            # Ignored
            HOST=$OPTARG
            ;;
        i)
            DO_SYSTEMD_CONFIG=1
            ;;
        n)
            APP_NAME=$OPTARG
            ;;
        h)
            usage
            exit 0
            ;;
        *)
            usage
            exit 1
    esac
done

DEST_DIR=/usr/local/matan/$APP_NAME

cp $DEST_DIR/package-lock.json /tmp/$APP_NAME-package-lock.json
