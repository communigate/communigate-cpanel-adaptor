#!/bin/sh

# set the environment
LC_ALL=en_US.ISO8859-1
export LC_ALL

# config vars
HOSTNAME=`hostname`
SERVERADDRESS="127.0.0.1"
BASEFOLDER="/var/CommuniGate"
SERVERFOLDER="/opt/CommuniGate"
PACKSRC=`pwd`

#################################################       
#               CommuniGate Specific  	 	#
#################################################

# Stop some services
service exim stop
service dovecot stop
chkconfig exim off
chkconfig dovecot off
chkconfig CommuniGate on
service cpanel stop
service httpd stop

if [ -d "$BASEFOLDER" ]; then
echo "CommuniGate cPanel plugin is already installed. Exiting..."
exit;
fi

# Installing CGPro 6.0
if [ ! -d "$SERVERFOLDER" ]; then
wget -P${PACKSRC} ftp://www.communigate.com/pub/CommuniGatePro/6.0/CGatePro-Linux-6.0c-3.x86_64.rpm
rpm -Uvh ${PACKSRC}/CGatePro-Linux-6.0c-3.x86_64.rpm
service CommuniGate start
fi

# Lets add CGPro perl lib
rsync -az ${PACKSRC}/library/CLI.pm /usr/local/cpanel/perl/

# Copy the postmaster's settings file with the password
mkdir ${BASEFOLDER}/cPanel/
rsync -az ${PACKSRC}/CGP/Settings/* ${BASEFOLDER}/Settings/
rsync -az ${PACKSRC}/CGP/Accounts/postmaster.macnt/postmaster.settings ${BASEFOLDER}/Accounts/postmaster.macnt/account.settings

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
mkdir /usr/local/apache/htdocs/iOS
chmod 777 /usr/local/apache/htdocs/iOS
mkdir /var/CommuniGate/apple
cp ${PACKSRC}/iphone/iphonetemplate.mobileconfig /var/CommuniGate/apple/

# Install the WHM plugins (administration and groupware control)
cp ${PACKSRC}/whm/addon_cgs-gwcontrol.cgi /usr/local/cpanel/whostmgr/docroot/cgi/
cp ${PACKSRC}/whm/addon_cgs.cgi /usr/local/cpanel/whostmgr/docroot/cgi/
cp ${PACKSRC}/whm/cgi/* /usr/local/cpanel/whostmgr/docroot/cgi/
cp ${PACKSRC}/whm/templates/* /usr/local/cpanel/whostmgr/docroot/templates/

# Install CGP Logo
cp ${PACKSRC}/whm/communigate.gif /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Install the WHM Script hooks (CommuniGate provisioning)
cp ${PACKSRC}/whm/postwwwacct /usr/local/cpanel/scripts/

# Install cPanel CommuniGate Custom Module
cp ${PACKSRC}/module/CommuniGate.pm /usr/local/cpanel/Cpanel/

# CGPro cPanel Wrapper
cp ${PACKSRC}/cpwrap/ccaadmin /usr/local/cpanel/bin/
cp ${PACKSRC}/cpwrap/ccawrap /usr/local/cpanel/bin/

# Install cPanel Function hooks
cp ${PACKSRC}/hooks/addpop /usr/local/cpanel/hooks/email/
cp ${PACKSRC}/hooks/delpop /usr/local/cpanel/hooks/email/
cp ${PACKSRC}/hooks/passwdpop /usr/local/cpanel/hooks/email/
cp ${PACKSRC}/hooks/editquota /usr/local/cpanel/hooks/email/

# Register installed hooks
/usr/local/cpanel/bin/register_hooks

#Install config file
cp ${PACKSRC}/etc/cpanel_cgpro.conf /etc
chmod 600 /etc/cpanel_cgpro.conf

# Install CommuniGate Webmail in cPanel
cp ${PACKSRC}/webmail/webmail_communigate.yaml /var/cpanel/webmail/
cp -r ${PACKSRC}/webmail/CommuniGate /usr/local/cpanel/base/3rdparty/

# Install SSO for Webmail
mkdir /var/CommuniGate/cgi
cp ${PACKSRC}/sso/login.pl /var/CommuniGate/cgi/

# chkservd for CGServer & spamd
cp ${PACKSRC}/chkservd/CommuniGate /etc/chkserv.d/
cp ${PACKSRC}/chkservd/CommuniGate_spamd /etc/chkserv.d/
echo "CommuniGate:1" >> /etc/chkserv.d/chkservd.conf
echo "CommuniGate_spamd:1" >> /etc/chkserv.d/chkservd.conf

# Check the scripts have executable flag
chmod +x /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgs-gwcontrol.cgi
chmod +x /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgs.cgi
chmod +x /usr/local/cpanel/scripts/postwwwacct
chmod +x /var/CommuniGate/cgi/login.pl
chmod +x /usr/local/cpanel/Cpanel/CommuniGate.pm
chmod +x /usr/local/cpanel/bin/ccaadmin
chmod u+s+x /usr/local/cpanel/bin/ccawrap
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

/usr/local/cpanel/bin/rebuild_sprites
/usr/local/cpanel/bin/build_locale_databases

replace "cpanel.communigate.com" "${HOSTNAME}" -- /var/CommuniGate/Settings/Main.settings

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
