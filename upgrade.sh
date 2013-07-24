#!/bin/bash

PACKSRC=`pwd`

#################################################
#		cPanel Specific			#
#################################################

# iPhone provisioning using default httpd
cp ${PACKSRC}/iphone/iphonetemplate.mobileconfig /var/CommuniGate/apple/

# Install CGP Logo
cp ${PACKSRC}/whm/communigate.gif /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Install cPanel CommuniGate Custom Module
cp ${PACKSRC}/module/CommuniGate.pm /usr/local/cpanel/Cpanel/

# Lets add CGPro perl lib
cp ${PACKSRC}/library/CLI.pm /usr/local/cpanel/perl/
if [ ! -L /usr/local/cpanel/CLI.pm ]
then
    rm -f /usr/local/cpanel/CLI.pm
    ln -s /usr/local/cpanel/perl/CLI.pm /usr/local/cpanel
fi
if [ ! -L /usr/local/lib/perl5/`perl -v | grep 'This is perl' | cut -f 2 -d 'v' | cut -f1 -d ' '`/CLI.pm ]
then
    rm -f /usr/local/lib/perl5/`perl -v | grep 'This is perl' | cut -f 2 -d 'v' | cut -f1 -d ' '`/CLI.pm
    ln -s /usr/local/cpanel/perl/CLI.pm /usr/local/lib/perl5/`perl -v | grep 'This is perl' | cut -f 2 -d 'v' | cut -f1 -d ' '`/CLI.pm
fi
ln -s /usr/local/cpanel/perl/CLI.pm /usr/local/lib/perl5/`perl -v | grep 'This is perl' | cut -f 2 -d 'v' | cut -f1 -d ' '`/


# CGPro cPanel Wrapper
cp ${PACKSRC}/cpwrap/ccaadmin /usr/local/cpanel/bin/
cp ${PACKSRC}/cpwrap/ccawrap /usr/local/cpanel/bin/

# Install cPanel Function hooks
if [ ! -d /var/cpanel/perl5/lib/ ]
then
    mkdir -p /var/cpanel/perl5/lib/
fi
/usr/local/cpanel/bin/manage_hooks delete module CGPro::Hooks
cp -rf ${PACKSRC}/hooks/CGPro /var/cpanel/perl5/lib/
# Register installed hooks
/usr/local/cpanel/bin/manage_hooks add module CGPro::Hooks

#Install config file
cp ${PACKSRC}/etc/cpanel_cgpro.conf /var/cpanel/communigate.yaml
chmod 600 /var/cpanel/communigate.yaml

# Install CommuniGate Webmail in cPanel
cp ${PACKSRC}/cgpro-webmail/webmail_communigate.yaml /var/cpanel/webmail/
cp -r ${PACKSRC}/cgpro-webmail/CommuniGate /usr/local/cpanel/base/3rdparty/

# Install SSO for Webmail
if [ ! -d /var/CommuniGate/cgi ]
then
    mkdir -p /var/CommuniGate/cgi
fi
cp ${PACKSRC}/sso/login.pl /var/CommuniGate/cgi/

# chkservd for CGServer & spamd
cp ${PACKSRC}/chkservd/CommuniGate /etc/chkserv.d/
cp ${PACKSRC}/chkservd/CommuniGate_spamd /etc/chkserv.d/

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
    rm -rf ${THEMES[$i]}/cgpro
    cp -r "${PACKSRC}/theme/cgpro" "${THEMES[$i]}/"
    rm -f ${THEMES[$i]}/branding/cgpro_*
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
    if [ -f ${THEMES[$i]}cgpro/mail/groupware.html ]
    then
	rm -f ${THEMES[$i]}cgpro/mail/groupware.html
    fi
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

chmod +x ${PACKSRC}/scripts/*

# Migrating groupware accounts
if [ -f /var/CommuniGate/cPanel/limits ]
then
    ${PACKSRC}/scripts/migrate_groupware.pl
    echo "!!! Please delete /var/CommuniGate/cPanel/limits by hand if seetings are OK !!!"
fi

# Purge unneeded files
if [ -f /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgpro-gwcontrol.cgi ]
then
    rm -f /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgpro-gwcontrol.cgi
fi
if [ -f /usr/local/cpanel/scripts/postwwwacct ]
then
    rm -f /usr/local/cpanel/scripts/postwwwacct
fi

# Update Feature List
cp ${PACKSRC}/featurelists/cgpro /usr/local/cpanel/whostmgr/addonfeatures/
/usr/local/cpanel/bin/rebuild_sprites
/usr/local/cpanel/bin/build_locale_databases

# install DKIM tools FOR CGPro server Only
chmod +x ${PACKSRC}/tools/*
cp ${PACKSRC}/tools/helper_DKIM_sign.pl /var/CommuniGate/
cp ${PACKSRC}/tools/helper_DKIM_verify.pl /var/CommuniGate/
${PACKSRC}/scripts/install_dkim_signer.pl

# Install the WHM plugins (administration and groupware control)
rm -f /usr/local/cpanel/whostmgr/docroot/templates/cgpro_*
cp ${PACKSRC}/whm/templates/* /usr/local/cpanel/whostmgr/docroot/templates/
rm -rf /usr/local/cpanel/whostmgr/docroot/cgi/cgpro*
cp -rf ${PACKSRC}/whm/cgi/* /usr/local/cpanel/whostmgr/docroot/cgi/

# install Perl dependencies
/usr/local/cpanel/bin/cpanm -f -q MIME::QuotedPrint::Perl

echo "Upgrade Finished!"
