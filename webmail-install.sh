#!/bin/bash

PACKSRC=`pwd`
MAINADDR=`ifconfig | grep "inet addr:" | awk '{print $2}' | cut -d":" -f2 | head -1`
source ${PACKSRC}/config.ini

cd ${PACKSRC}
wget -O${PACKSRC}/webmail-distro.tgz 'https://dl.dropbox.com/s/jtu8bfneb6aapug/webmail-distro.tgz?dl=1'
tar -xvf ${PACKSRC}/webmail-distro.tgz
cd ${PACKSRC}/webmail/
rm -f ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin
mv ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin_template ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin
replace "url:https://91.215.218.251:9100" "url:https://${MAINADDR}:9100" -- ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin
sh ${PACKSRC}/webmail/install.sh
rm -rf ${PACKSRC}/webmail-distro.tgz
