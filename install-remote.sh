#!/bin/bash

PACKSRC=`pwd`
source ${PACKSRC}/config.ini

#################################################
#               CommuniGate Specific  	 	#
#################################################

#################################################
#		cPanel Specific			#
#################################################

# iPhone provisioning using default httpd
mkdir -p /usr/local/apache/htdocs/iOS
chmod 777 /usr/local/apache/htdocs/iOS
mkdir -p /var/CommuniGate/apple
cp ${PACKSRC}/iphone/iphonetemplate.mobileconfig /var/CommuniGate/apple/

# Install the WHM plugins
cp -rf ${PACKSRC}/whm/cgi/* /usr/local/cpanel/whostmgr/docroot/cgi/
cp ${PACKSRC}/whm/templates/* /usr/local/cpanel/whostmgr/docroot/templates/

# Install CGP Logo
cp ${PACKSRC}/whm/communigate.gif /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Install cPanel CommuniGate Custom Module
cp ${PACKSRC}/module/CommuniGate.pm /usr/local/cpanel/Cpanel/

# Lets add CGPro perl lib
cp ${PACKSRC}/library/CLI.pm /usr/local/cpanel/perl/
ln -s /usr/local/cpanel/perl/CLI.pm /usr/local/cpanel
ln -s /usr/local/cpanel/perl/CLI.pm /usr/local/lib/perl5/`perl -v | grep 'This is perl' | cut -f 2 -d 'v' | cut -f1 -d ' '`/
cp ${PACKSRC}/library/XIMSS.pm /usr/local/cpanel/

# CGPro cPanel Wrapper
cp ${PACKSRC}/cpwrap/ccaadmin /usr/local/cpanel/bin/
cp ${PACKSRC}/cpwrap/ccawrap /usr/local/cpanel/bin/

# Install cPanel Function hooks
if [ ! -d /var/cpanel/perl5/lib/ ]
then
    mkdir -p /var/cpanel/perl5/lib/
fi
cp -rf ${PACKSRC}/hooks/CGPro /var/cpanel/perl5/lib/
# Register installed hooks
/usr/local/cpanel/bin/manage_hooks add module CGPro::Hooks

#Install config files
cp ${PACKSRC}/etc/cpanel_cgpro.conf /var/cpanel/communigate.yaml

chmod 600 /var/cpanel/communigate.yaml
if [ ! -d /var/cpanel/cgpro/ ]
then
    mkdir -p /var/cpanel/cgpro/
fi
if [ ! -f /var/cpanel/cgpro/classes.yaml ]
    cp ${PACKSRC}/etc/classes.yaml /var/cpanel/cgpro/classes.yaml
fi

# Install CommuniGate Webmail in cPanel
cp ${PACKSRC}/cgpro-webmail/webmail_communigate.yaml /var/cpanel/webmail/
cp -r ${PACKSRC}/cgpro-webmail/CommuniGate /usr/local/cpanel/base/3rdparty/

# Install SSO for Webmail
mkdir -p /var/CommuniGate/cgi
cp ${PACKSRC}/sso/login.pl /var/CommuniGate/cgi/

# Check the scripts have executable flag
chmod +x /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgpro*
chmod +x /var/CommuniGate/cgi/login.pl
chmod +x /usr/local/cpanel/Cpanel/CommuniGate.pm
chmod +x /usr/local/cpanel/bin/ccaadmin
chmod +s+x /usr/local/cpanel/bin/ccawrap
chmod u+s /opt/CommuniGate/mail

# Install CommuniGate Plugin
BASEDIR='/usr/local/cpanel/base/frontend';
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")
THEMES=($(find ${BASEDIR} -maxdepth 1 -mindepth 1 -type d))
IFS=$OLDIFS

tLen=${#THEMES[@]}

LOCALES=($(find ${PACKSRC}/locale -maxdepth 1 -mindepth 1))
lLen=${#LOCALES[@]}

for (( i=0; i<${tLen}; i++ ));
do
    if [ "${THEMES[$i]}" == "${BASEDIR}/CommuniGate" ]
    then
        continue
    fi
    cp -r "${PACKSRC}/theme/cgpro" "${THEMES[$i]}/"
    cp "${PACKSRC}/icons/"* "${THEMES[$i]}/branding"
    cp "${PACKSRC}/plugin/dynamicui_cgpro.conf" "${THEMES[$i]}/dynamicui/"
    if [ ! -d ${THEMES[$i]}/js2-min/cgpro ]
    then
	mkdir -p ${THEMES[$i]}/js2-min/cgpro
    fi
    if [ ! -L ${THEMES[$i]}/js2-min/cgpro/mail ]
    then
	ln -s ${THEMES[$i]}/js2-min/mail ${THEMES[$i]}/js2-min/cgpro/
    fi
    if [ ! -d ${THEMES[$i]}/css2-min/cgpro ]
    then
	mkdir -p ${THEMES[$i]}/css2-min/cgpro
    fi
    if [ ! -L ${THEMES[$i]}/css2-min/cgpro/mail ]
    then
	ln -s ${THEMES[$i]}/css2-min/mail ${THEMES[$i]}/css2-min/cgpro/
    fi
    chmod +x ${THEMES[$i]}/cgpro/backup/getaccbackup.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/backup/getaliasesbackup.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/backup/getfiltersbackup.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/mail/checkDomainSettings.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/mail/getDomainAccounts.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/mail/getVCARD.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/getXmppHistory.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/playwav.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/getwav.live.cgi

    for ((j=0; j<${lLen}; j++)); do
        TARGET=${THEMES[$i]}/locale/`basename ${LOCALES[$j]} '{}'`.yaml.local
        if [ ! -f ${TARGET} ]
        then
            echo "---" > ${TARGET}
        else
            sed -i -e '/^CGP/d' ${TARGET}
        fi
        cat ${LOCALES[$j]} >> ${TARGET}
    done
done
# Update Feature List
cp ${PACKSRC}/featurelists/cgpro /usr/local/cpanel/whostmgr/addonfeatures/
chmod +x ${PACKSRC}/scripts/*
${PACKSRC}/scripts/migrate_groupware.pl
${PACKSRC}/scripts/modify_features.pl
${PACKSRC}/scripts/rename_classes.pl
${PACKSRC}/scripts/init_pbx.pl
/usr/local/cpanel/bin/rebuild_sprites
/usr/local/cpanel/bin/build_locale_databases

# install Perl dependencies
if [ `perldoc -l  MIME::QuotedPrint::Perl | wc -l` == 0 ]
then
    /usr/local/cpanel/bin/cpanm -f -q MIME::QuotedPrint::Perl
fi
${PACKSRC}/scripts/editconfig.pl