#!/bin/bash

PACKSRC=`pwd`
#################################################
#		cPanel Specific			#
#################################################

# Register installed hooks
/usr/local/cpanel/bin/manage_hooks delete module CGPro::Hooks

# iPhone provisioning using default httpd
rm -rf /usr/local/apache/htdocs/iOS
rm -rf /var/CommuniGate/apple

# Uninstall the WHM plugins (administration and groupware control)
if [ `ls /var/cpanel/apps/addon_cgpro*.conf | wc -l` -gt 0 ]
then
    chmod +x ${PACKSRC}/scripts/unregister_apps.sh
    ${PACKSRC}/scripts/unregister_apps.sh
fi

rm -rf /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgpro*
rm -f /usr/local/cpanel/whostmgr/docroot/templates/addon_cgpro_*

# Uninstall CGP Logo
rm -f /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Uninstall the WHM Script hooks (CommuniGate provisioning)
if [ -f /usr/local/cpanel/scripts/postwwwacct ]
then
    rm -f /usr/local/cpanel/scripts/postwwwacct
fi

# Uninstall cPanel CommuniGate Custom Module
rm -f /usr/local/cpanel/Cpanel/CommuniGate.pm


rm -f /usr/local/cpanel/perl/CLI.pm
rm -f /usr/local/cpanel/CLI.pm
PERL_VERSION=`perl -v | grep 'This is perl' | perl -pe 's/^.*?v(\d+\.\d+\.\d+).*?$/$1/g'`
MY_PERL_PATHS="/usr/local/lib/perl5/$PERL_VERSION /usr/local/lib/perl/$PERL_VERSION /usr/local/share/perl/$PERL_VERSION /usr/local/share/perl5"
DEFAULT_PERL_PATHS=`perl -e "print join ' ', @INC"`
PERL_PATH=""
found=
for i in ${MY_PERL_PATHS[@]}; do
    for j in ${DEFAULT_PERL_PATHS[@]}; do
	[[ $i == $j ]] && { PERL_PATH=$i; found=1; break; }
    done
    [[ -n $skip ]] && { break; }
done
if [ ! -d $PERL_PATH ]
then
    mkdir -p $PERL_PATH
fi
rm -f /usr/local/cpanel/perl/CLI.pm $PERL_PATH/

rm -f /usr/local/cpanel/XIMSS.pm


# CGPro cPanel Wrapper
rm -f /usr/local/cpanel/bin/ccaadmin
rm -f /usr/local/cpanel/bin/ccawrap
rm -rf /usr/local/cpanel/bin/admin/CGPro

# Uninstall cPanel Function hooks
rm -rf /var/cpanel/perl5/lib/CGPro/

#Uninstall config file
rm -f /var/cpanel/communigate.yaml
rm -f /var/cpanel/cgpro/classes.yaml

# Uninstall CommuniGate Webmail in cPanel
rm -f /var/cpanel/webmail/webmail_communigate*
rm -rf /usr/local/cpanel/base/3rdparty/CommuniGate*

# Uninstall SSO for Webmail
rm -f /var/CommuniGate/cgi/login.pl

# chkservd for CGServer & spamd
rm -f /etc/chkserv.d/CommuniGate
rm -f /etc/chkserv.d/CommuniGate_spamd
sed -i -e '/^CommuniGate/d' /etc/chkserv.d/chkservd.conf

# Uninstall CommuniGate Plugin
BASEDIR='/usr/local/cpanel/base/frontend';
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")
THEMES=($(find ${BASEDIR} -maxdepth 1 -mindepth 1 -type d))
LOCALES=($(find ${PACKSRC}/locale -maxdepth 1 -mindepth 1))
IFS=$OLDIFS

tLen=${#THEMES[@]}
lLen=${#LOCALES[@]}

for (( i=0; i<${tLen}; i++ ));
do
    if [ "${THEMES[$i]}" == "${BASEDIR}/CommuniGate" ]
    then
        continue
    fi
    rm -rf ${THEMES[$i]}/cgpro
    rm -f ${THEMES[$i]}/branding/cgpro_*
    rm -rf ${THEMES[$i]}/dynamicui/dynamicui_cgpro.conf
    rm -f ${THEMES[$i]}/js2-min/cgpro/mail
    rmdir  ${THEMES[$i]}/js2-min/cgpro
    rm -f ${THEMES[$i]}/css2-min/cgpro/mail
    rmdir ${THEMES[$i]}/css2-min/cgpro
    for ((j=0; j<${lLen}; j++)); do
        TARGET=${THEMES[$i]}/locale/`basename ${LOCALES[$j]} '{}'`.yaml.local
	sed -i -e '/^"*CGP/d' ${TARGET}
    done
done

# Uninstall CommuniGate Plugin Webmail
BASEDIR='/usr/local/cpanel/base/webmail';
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")
THEMES=($(find ${BASEDIR} -maxdepth 1 -mindepth 1 -type d))
IFS=$OLDIFS
for (( i=0; i<${tLen}; i++ ));
do
    rm -rf ${THEMES[$i]}/cgpro
done

# Update Feature List
rm -f /usr/local/cpanel/whostmgr/addonfeatures/cgpro
/usr/local/cpanel/bin/rebuild_sprites
/usr/local/cpanel/bin/build_locale_databases
