#!/bin/bash

PACKSRC=`pwd`
source ${PACKSRC}/config.ini

#################################################
#               CommuniGate Specific  	 	#
#################################################

# Stop some services
service exim stop
service dovecot stop
chkconfig exim off
chkconfig dovecot off
service cpanel stop
service httpd stop

if [ -d "$BASEFOLDER" ]; then
echo "CommuniGate cPanel plugin is already installed. Exiting..."
exit;
fi

# Installing CGPro 6.0.2
if [ ! -d "$SERVERFOLDER" ]; then
wget -P${PACKSRC} http://www.communigate.com/pub/CommuniGatePro/CGatePro-Linux.x86_64.rpm
rpm -Uvh ${PACKSRC}/CGatePro-Linux.x86_64.rpm
rm -rf ${PACKSRC}/CGatePro-Linux.x86_64.rpm
chkconfig CommuniGate on
service CommuniGate start
service CommuniGate stop
mkdir -p ${BASEFOLDER}/cPanel/
mkdir -p ${BASEFOLDER}/spamassassin/
rsync -az ${PACKSRC}/CGP/Settings/* ${BASEFOLDER}/Settings/
rsync -az ${PACKSRC}/CGP/Accounts/postmaster.macnt/postmaster.macnt ${BASEFOLDER}/Accounts/postmaster.macnt/account.settings
rsync -az ${PACKSRC}/sso/scanspam.sh ${BASEFOLDER}/spamassassin/
fi

# Configure Airsync and Spamd
if grep -Fxq "Microsoft-Server-ActiveSync" /usr/local/apache/conf/includes/pre_main_global.conf
then
echo "Airsync already installed"
else
echo ProxyPass /Microsoft-Server-ActiveSync http://${HOSTNAME}:8100/Microsoft-Server-ActiveSync >> /usr/local/apache/conf/includes/pre_main_global.conf
echo ProxyPassReverse /Microsoft-Server-ActiveSync http://${HOSTNAME}:8100/Microsoft-Server-ActiveSync >> /usr/local/apache/conf/includes/pre_main_global.conf
fi

if grep -Fxq "CommuniGate Integration Settings" /etc/mail/spamassassin/local.cf
then
echo "spamd already configured"
else
echo "# CommuniGate Integration Settings #" >> /etc/mail/spamassassin/local.cf
echo "rewrite_header Subject *****SPAM*****" >> /etc/mail/spamassassin/local.cf
echo "report_safe 0" >> /etc/mail/spamassassin/local.cf
echo "add_header all Level _STARS(x)_" >> /etc/mail/spamassassin/local.cf
echo "# END of CommuniGate Integration Settings #" >> /etc/mail/spamassassin/local.cf
fi

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

# chkservd for CGServer & spamd
cp ${PACKSRC}/chkservd/CommuniGate /etc/chkserv.d/
echo "CommuniGate:1" >> /etc/chkserv.d/chkservd.conf

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

replace "cpanel.communigate.com" "${HOSTNAME}" -- /var/CommuniGate/Settings/Main.settings

# install DKIM tools FOR CGPro server Only
chmod +x ${PACKSRC}/tools/*
cp ${PACKSRC}/tools/helper_DKIM_sign.pl /var/CommuniGate/
cp ${PACKSRC}/tools/helper_DKIM_verify.pl /var/CommuniGate/
${PACKSRC}/scripts/install_dkim_signer.pl

# Install Active Queue Scripts
cp ${PACKSRC}/ActiveQueue/*spp* /opt/CommuniGate/PBXApps/

#################################################
#             	  OS Specific	  	 	#
#################################################

# Firewall opening for CommuniGate Ports
iptables -I INPUT -p tcp -d `hostname` --dport 8010 -j ACCEPT
iptables -I INPUT -p tcp -d `hostname` --dport 9010 -j ACCEPT
iptables -I INPUT -p tcp -d `hostname` --dport 8100 -j ACCEPT
iptables -I INPUT -p tcp -d `hostname` --dport 9100 -j ACCEPT
iptables-save

# Start needed services
service	cpanel start
service	httpd start
service CommuniGate start

# Installing iTool Labs webmail
sh ${PACKSRC}/webmail-install.sh

echo "Dont forget to run disable-services.pl script to stop cPanel's native mail software"
