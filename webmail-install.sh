#!/bin/bash

PACKSRC=`pwd`
source ${PACKSRC}/config.ini

cd ${PACKSRC}
wget -O${PACKSRC}/webmail-distro.tgz 'http://itoolabs.com/download_protected/27ewefryg15sa1b35gf4enb8743iu44a2r/webmail-cpanel/2.0/webmail-distro.tgz'
tar -xvf ${PACKSRC}/webmail-distro.tgz
cd ${PACKSRC}/webmail/
rm -f ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin
mv ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin_template ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin
replace "url:https://91.215.218.251:9100" "url:https://${HOSTNAME}:9100" -- ${PACKSRC}/webmail/itoolabs_webmail.cpanelplugin
sh ${PACKSRC}/webmail/install.sh
rm -rf ${PACKSRC}/webmail/
rm -rf ${PACKSRC}/webmail-distro.tgz
echo "Dont forget to disable original webmail from default feature list in WHM!"
