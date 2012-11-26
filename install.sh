#!/bin/sh

LC_ALL=en_US.ISO8859-1
export LC_ALL


BASEFOLDER="/var/CommuniGate"
APPLICATION="/opt"
RCDIR="/etc/rc.d"
PACKSRC=`pwd`

STARTSCRIPTS="/etc/rc.d/init.d"
if ! [ -d ${STARTSCRIPTS} ]; then
 STARTSCRIPTS="/etc/init.d" ;
fi


# Install CommuniGate

cp -r ${PACKSRC}/CGP/varCommuniGate /var/CommuniGate
cp -r ${PACKSRC}/CGP/optCommuniGate /opt/CommuniGate
cp -r ${PACKSRC}/CGP/initdCommuniGate /etc/init.d/CommuniGate
chmod +x /etc/init.d/CommuniGate

cat /var/CommuniGate/Settings/Main.settings | sed s/cpanel.communigate.com/`hostname`/g > /tmp/toto
mv /tmp/toto /var/CommuniGate/Settings/Main.settings

cat /var/CommuniGate/Directory/Main.data | sed s/cpanel.communigate.com/`hostname`/g > /tmp/toto
mv /tmp/toto /var/CommuniGate/Directory/Main.data

echo "creating startup script links"
(cd ${RCDIR}/rc0.d; ln -s ${STARTSCRIPTS}/CommuniGate K10CommuniGate)
(cd ${RCDIR}/rc1.d; ln -s ${STARTSCRIPTS}/CommuniGate K10CommuniGate)
(cd ${RCDIR}/rc2.d; ln -s ${STARTSCRIPTS}/CommuniGate K10CommuniGate)
(cd ${RCDIR}/rc3.d; ln -s ${STARTSCRIPTS}/CommuniGate S80CommuniGate)
(cd ${RCDIR}/rc5.d; ln -s ${STARTSCRIPTS}/CommuniGate S80CommuniGate)
(cd ${RCDIR}/rc6.d; ln -s ${STARTSCRIPTS}/CommuniGate K10CommuniGate)


# Stopping exm in case it's not diabled yet so spamd can start from CommuniGate.

/etc/init.d/exim stop

# Starting CommuniGate 
/etc/init.d/CommuniGate start


# Install the CommuniGate Provisioning Library

cp ${PACKSRC}/library/CLI.pm /usr/local/cpanel/perl
cp ${PACKSRC}/library/CLI.pm /usr/lib/perl5/vendor_perl
cp ${PACKSRC}/library/CLI.pm /usr/local/lib/perl5/5.8.8/x86_64-linux
cp ${PACKSRC}/library/CLI.pm /usr/local/lib/perl5/5.8.8/i686-linux

# Install the WHM plugins (administration and groupware control)

cp ${PACKSRC}/whm/addon_cgs-gwcontrol.cgi /usr/local/cpanel/whostmgr/docroot/cgi/
cp ${PACKSRC}/whm/addon_cgs.cgi /usr/local/cpanel/whostmgr/docroot/cgi/

# Check the scripts have executable flag

chmod +x /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgs-gwcontrol.cgi 
chmod +x /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgs.cgi 

# CGP Logo

cp ${PACKSRC}/whm/communigate.gif /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Install the WHM Script hooks (CommuniGate provisioning) 

cp ${PACKSRC}/whm/postwwwacct /usr/local/cpanel/scripts

# Check the script has executable flag
chmod +x /usr/local/cpanel/scripts/postwwwacct

# Install cPanel CommuniGate Custom Module

cp ${PACKSRC}/module/CommuniGate.pm /usr/local/cpanel/Cpanel


# Wrapper

cd ${PACKSRC}/distributable-cpwrap/
make
make install

cp ${PACKSRC}/distributable-cpwrap/cgppassadmin /usr/local/cpanel/bin

# Check executable flag

chmod +x /usr/local/cpanel/Cpanel/CommuniGate.pm
chmod +x /usr/local/cpanel/bin/cgppassadmin
chmod +x /usr/local/cpanel/bin/cgppasswrap
chmod u+s /usr/local/cpanel/bin/cgppasswrap


# Install cPanel Function hooks

cp ${PACKSRC}/hooks/addpop /usr/local/cpanel/hooks/email
cp ${PACKSRC}/hooks/delpop /usr/local/cpanel/hooks/email
cp ${PACKSRC}/hooks/passwdpop /usr/local/cpanel/hooks/email
cp ${PACKSRC}/hooks/editquota /usr/local/cpanel/hooks/email

/usr/local/cpanel/bin/register_hooks

# Install CommuniGate Theme (when compressed)

# cp ${PACKSRC}/theme/cpanel.CommuniGate.tar.gz /usr/local/cpanel/base/frontend
# cd /usr/local/cpanel/base/frontend
# gzip -d cpanel.CommuniGate.tar.gz
# tar xvf cpanel.CommuniGate.tar
# rm cpanel.CommuniGate.tar
# cd ${PACKSRC}

# Install CommuniGate Theme (when extracted)

cp -r ${PACKSRC}/theme/CommuniGate /usr/local/cpanel/base/frontend


/etc/init.d/cpanel restart

#install SSO
mkdir /var/CommuniGate/cgi
cp ${PACKSRC}/sso/login.pl /var/CommuniGate/cgi
chmod +x /var/CommuniGate/cgi/login.pl

# Configure Apache to Proxy ActiveSync traffic to CommuniGate Pro

# Add the following lines to /usr/local/apache/etc/httpd.conf (via /usr/local/apache/conf/includes/post_virtualhost_global.conf)

/etc/init.d/httpd stop

echo ProxyPass /Microsoft-Server-ActiveSync http://`hostname`:8100/Microsoft-Server-ActiveSync  >> /usr/local/apache/conf/includes/post_virtualhost_global.conf 
echo ProxyPassReverse /Microsoft-Server-ActiveSync http://`hostname`:8100/Microsoft-Server-ActiveSync >> /usr/local/apache/conf/includes/post_virtualhost_global.conf 

# Restart Apache 

/etc/init.d/httpd start

# Iphone Provisioning
mkdir /usr/local/apache/htdocs/iOS
chmod 777 /usr/local/apache/htdocs/iOS
mkdir /var/CommuniGate/apple
cp ${PACKSRC}/iphone/iphonetemplate.mobileconfig /var/CommuniGate/apple

# Firewall opening for CommuniGate Ports

iptables -I INPUT -p tcp -d `hostname` --dport 8010 -j ACCEPT
iptables -I INPUT -p tcp -d `hostname` --dport 9010 -j ACCEPT
iptables -I INPUT -p tcp -d `hostname` --dport 8100 -j ACCEPT
iptables -I INPUT -p tcp -d `hostname` --dport 9100 -j ACCEPT
iptables-save

# Set the default theme to CommuniGate

cat /etc/wwwacct.conf | grep -v DEFMOD > /tmp/toto
cat /tmp/toto > /etc/wwwacct.conf
echo "DEFMOD CommuniGate" >> /etc/wwwacct.conf
rm -f /tmp/toto


# Spam Assassin Configuration : 

echo "# CommuniGate Integration Settings" >> /etc/mail/spamassassin/local.cf
echo "rewrite_header Subject *****SPAM*****" >> /etc/mail/spamassassin/local.cf
echo "report_safe 0" >> /etc/mail/spamassassin/local.cf
echo "add_header all Level _STARS(x)_" >> /etc/mail/spamassassin/local.cf


# 1.1 Fix

chmod u+s /opt/CommuniGate/mail

# chkservd for CGServer & spamd

cp ${PACKSRC}/chkservd/CommuniGate /etc/chkserv.d/
cp ${PACKSRC}/chkservd/CommuniGate_spamd /etc/chkserv.d/
echo "CommuniGate:1" >> /etc/chkserv.d/chkservd.conf 
echo "CommuniGate_spamd:1" >> /etc/chkserv.d/chkservd.conf 

# Webmail 

cp ${PACKSRC}/webmail/webmail_communigate.yaml /var/cpanel/webmail
cp -r ${PACKSRC}/webmail/CommuniGate /usr/local/cpanel/base/3rdparty/


#FINAL RESTART

/etc/init.d/cpanel restart

