#!/bin/bash -x
set -e

cd $(dirname $0)
cd ..

APP_NAME=$(whoami)

function usage() {
    cat << EOF
Usage: $0 -H <hostname> [-i] [-n <api app name>]
    -H: target host
    -i: Initialize systemd config
    -n: Override app name from "$APP_NAME"
EOF
}

POST_SYNC_ARGS=()

while getopts "H:I:a:ghin:p:s" opt
do
    case $opt in
        H)
            HOST=$OPTARG
            POST_SYNC_ARGS+=("-$opt")
            POST_SYNC_ARGS+=($OPTARG)
            ;;
        i)
            POST_SYNC_ARGS+=("-$opt")
            ;;
        I)
            SSH_IDENTITY='-i '$OPTARG
            ;;
        n)
            APP_NAME=$OPTARG
            POST_SYNC_ARGS+=("-$opt")
            POST_SYNC_ARGS+=($OPTARG)
            ;;
        p)
            PORT_ARG="-$opt $OPTARG"
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

if [[ "$HOST" == "" ]]
then
    usage
    echo
    echo "-H is mandatory"
    exit 1
fi

DEST_DIR=/usr/local/matan/$APP_NAME

ssh $SSH_IDENTITY -o 'StrictHostKeyChecking no' $HOST cat /etc/ssh/ssh_host_dsa_key.pub >> ~/.ssh/known_hosts
ssh $SSH_IDENTITY $HOST "sudo mkdir -p $DEST_DIR"
ssh $SSH_IDENTITY $HOST "sudo chown -R \$(whoami) $DEST_DIR"

# # scp $SSH_IDENTITY utils/pre_rsync.sh $HOST:$DEST_DIR/utils
# ssh $SSH_IDENTITY $HOST $DEST_DIR/utils/pre_rsync.sh ${POST_SYNC_ARGS[@]}

if [[ "$SSH_IDENTITY" == "" ]]
then
    rsync -rlptzv --progress --omit-dir-times \
        --exclude=.git \
        --exclude=.vscode \
        --exclude=node_modules \
        --exclude=coverage \
        --exclude=.nyc_output \
        --exclude=config/local.yml \
        . $HOST:$DEST_DIR/
else
    rsync -e "ssh $SSH_IDENTITY" \
        -rlptzv --progress --omit-dir-times \
        --exclude=.git \
        --exclude=.vscode \
        --exclude=node_modules \
        --exclude=coverage \
        --exclude=.nyc_output \
        --exclude=config/local.yml \
        . $HOST:$DEST_DIR/
fi

ssh $SSH_IDENTITY $HOST $DEST_DIR/utils/post_rsync.sh ${POST_SYNC_ARGS[@]}
