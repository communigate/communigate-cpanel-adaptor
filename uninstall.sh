#!/bin/sh


BASEFOLDER="/var/CommuniGate"
APPLICATION="/opt"
RCDIR="/etc/rc.d"
PACKSRC=`pwd`

STARTSCRIPTS="/etc/rc.d/init.d"
if ! [ -d ${STARTSCRIPTS} ]; then
 STARTSCRIPTS="/etc/init.d" ;
fi


# Remove CommuniGate

/etc/init.d/CommuniGate stop
rm -rf /var/CommuniGate
rm -rf /opt/CommuniGate
rm -rf /etc/init.d/CommuniGate

echo "removing startup script links"
(cd ${RCDIR}/rc0.d; rm -f K10CommuniGate)
(cd ${RCDIR}/rc1.d; rm -f K10CommuniGate)
(cd ${RCDIR}/rc2.d; rm -f K10CommuniGate)
(cd ${RCDIR}/rc3.d; rm -f S80CommuniGate)
(cd ${RCDIR}/rc5.d; rm -f S80CommuniGate)
(cd ${RCDIR}/rc6.d; rm -f K10CommuniGate)


# Remove the CommuniGate Provisioning Library

rm -f /usr/local/cpanel/perl/CLI.pm
rm -f /usr/lib/perl5/vendor_perl/CLI.pm
rm -f /usr/local/lib/perl5/5.8.8/x86_64-linux/CLI.pm

# Remove the WHM plugins (administration and groupware control)

rm -f /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgs*


# CGP Logo

rm -f /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Remove the WHM Script hooks (CommuniGate provisioning) 

rm -f /usr/local/cpanel/scripts/postwwwacct

# Remove cPanel CommuniGate Custom Module

rm -f /usr/local/cpanel/Cpanel/CommuniGate.pm
rm -f /usr/local/cpanel/bin/cgppassadmin
rm -f /usr/local/cpanel/bin/cgppasswrap
rm -f /usr/local/cpanel/bin/ccaadmin
rm -f /usr/local/cpanel/bin/ccawrap


# Remove cPanel Function hooks

rm -f /usr/local/cpanel/hooks/email/addpop
rm -f /usr/local/cpanel/hooks/email/delpop
rm -f /usr/local/cpanel/hooks/email/passwdpop

/usr/local/cpanel/bin/register_hooks

# Remove CommuniGate Theme

rm -rf /usr/local/cpanel/base/frontend/CommuniGate

/etc/init.d/cpanel restart

# Add the following lines to /usr/local/apache/etc/httpd.conf

/etc/init.d/httpd stop

cat /usr/local/apache/conf/includes/post_virtualhost_global.conf | grep -v "Microsoft-Server-ActiveSync" > /tmp/toto
mv /tmp/toto /usr/local/apache/conf/includes/post_virtualhost_global.conf 

# Restart Apache 

/etc/init.d/httpd start

# Iphone Provisioning
rm -rf /usr/local/apache/htdocs/iOS

# Firewall opening for CommuniGate Ports

iptables -D INPUT -p tcp -d `hostname` --dport 8010 -j ACCEPT
iptables -D INPUT -p tcp -d `hostname` --dport 9010 -j ACCEPT
iptables -D INPUT -p tcp -d `hostname` --dport 8100 -j ACCEPT
iptables -D INPUT -p tcp -d `hostname` --dport 9100 -j ACCEPT
iptables-save

# Set the default theme to CommuniGate

cat /etc/wwwacct.conf | grep -v DEFMOD > /tmp/toto
cat /tmp/toto > /etc/wwwacct.conf
echo "DEFMOD x3" >> /etc/wwwacct.conf
rm -f /tmp/toto

