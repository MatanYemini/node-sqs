#!/bin/bash -x
# Script for running post rsync to get service to run:
# * runs npm install
# * optionally sets up systemd for service
# * restarts service
# TODO: automate creation of config/local.yml
set -e

cd $(dirname $0)
cd ..

APP_NAME=$(whoami)

function usage() {
    cat << EOF
Usage: $0 [-i] [-n <api app name>]
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

STASHED_LOCK="/tmp/$APP_NAME-package-lock.json"

if cmp --silent -- "$STASHED_LOCK" "package-lock.json"; then
  echo "Do diff found -- good to go"
else
  echo "Need to install some stuff"
  npm ci
fi

sudo chgrp -R ubuntu .
sudo chmod -R g+w .

if [[ "$DO_SYSTEMD_CONFIG" == "1" ]]
then
    SYSTEMD_FILE=matan-$APP_NAME.service
    cat > /tmp/$SYSTEMD_FILE << EOF
[Unit]
Description=Matan backend $APP_NAME
Documentation=TBD
After=network.target

[Service]
ExecStart=/usr/local/matan/$APP_NAME/start.sh
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/$SYSTEMD_FILE /lib/systemd/system/
    sudo rm -f /etc/systemd/system/multi-user.target.wants/$SYSTEMD_FILE
    sudo ln -s /lib/systemd/system/$SYSTEMD_FILE /etc/systemd/system/multi-user.target.wants/$SYSTEMD_FILE
    sudo systemctl daemon-reload
fi

sudo service matan-$APP_NAME restart
sudo service matan-$APP_NAME status
