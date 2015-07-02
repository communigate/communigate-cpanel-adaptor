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

# Install the WHM plugins
cp -rf ${PACKSRC}/whm/cgi/* /usr/local/cpanel/whostmgr/docroot/cgi/
cp ${PACKSRC}/whm/templates/* /usr/local/cpanel/whostmgr/docroot/templates/

if [ -f /usr/local/cpanel/bin/register_appconfig ]
then
    chmod +x ${PACKSRC}/scripts/register_apps.sh
    ${PACKSRC}/scripts/register_apps.sh
fi

# Install CGP Logo
cp ${PACKSRC}/whm/communigate.gif /usr/local/cpanel/whostmgr/docroot/images/communigate.gif

# Install cPanel CommuniGate Custom Module
cp ${PACKSRC}/module/CommuniGate.pm /usr/local/cpanel/Cpanel/

# Lets add CGPro perl lib
cp ${PACKSRC}/library/CLI.pm /usr/local/cpanel/perl/
ln -s /usr/local/cpanel/perl/CLI.pm /usr/local/cpanel

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
ln -s /usr/local/cpanel/perl/CLI.pm $PERL_PATH/

cp ${PACKSRC}/library/XIMSS.pm /usr/local/cpanel/

# CGPro cPanel Wrapper
cp ${PACKSRC}/cpwrap/ccaadmin /usr/local/cpanel/bin/
cp ${PACKSRC}/cpwrap/ccawrap /usr/local/cpanel/bin/
cp -r ${PACKSRC}/cpwrap/CGPro /usr/local/cpanel/bin/admin/

# install Perl dependencies
if [ `perldoc -l YAML::Syck | wc -l` == 0 ]
then
    /usr/local/cpanel/bin/cpanm -f -q YAML::Syck
fi
chmod +x ${PACKSRC}/scripts/install_cpanel_module.pl
${PACKSRC}/scripts/install_cpanel_module.pl MIME::QuotedPrint::Perl
${PACKSRC}/scripts/install_cpanel_module.pl XML::SAX
${PACKSRC}/scripts/install_cpanel_module.pl GD::Barcode::QRcode

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
then
    cp ${PACKSRC}/etc/classes.yaml /var/cpanel/cgpro/classes.yaml
fi

# Install CommuniGate Webmail in cPanel
# cp ${PACKSRC}/cgpro-webmail/webmail_communigate.yaml /var/cpanel/webmail/
# cp ${PACKSRC}/cgpro-webmail/webmail_communigatepronto.yaml /var/cpanel/webmail/
cp -r ${PACKSRC}/cgpro-webmail/CommuniGate /usr/local/cpanel/base/3rdparty/
cp -r ${PACKSRC}/cgpro-webmail/CommuniGatePronto /usr/local/cpanel/base/3rdparty/

# Check the scripts have executable flag
chmod +x /usr/local/cpanel/whostmgr/docroot/cgi/addon_cgpro*
chmod +x /usr/local/cpanel/Cpanel/CommuniGate.pm
chmod +x /usr/local/cpanel/bin/ccaadmin
chmod +s+x /usr/local/cpanel/bin/ccawrap
chmod +x /usr/local/cpanel/bin/admin/CGPro/cca

# Install CommuniGate Plugin
BASEDIR='/usr/local/cpanel/base/frontend';
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")
THEMES=($(find ${BASEDIR} -maxdepth 1 -mindepth 1 -type d))
LOCALES=($(find ${PACKSRC}/locale -maxdepth 1 -mindepth 1))
IFS=$OLDIFS

tLen=${#THEMES[@]}
lLen=${#LOCALES[@]}

cp ${PACKSRC}/module/*.pm /usr/local/cpanel/Cpanel/

# Start x3
cp -r ${PACKSRC}/theme/* ${BASEDIR}/x3/
cp ${PACKSRC}/icons/* ${BASEDIR}/x3/branding
cp ${PACKSRC}/plugin/*.conf ${BASEDIR}/x3/dynamicui/

if [ ! -d ${BASEDIR}/x3/js2-min/cgpro ]
then
    mkdir -p ${BASEDIR}/x3/js2-min/cgpro
fi
if [ ! -L ${BASEDIR}/x3/js2-min/cgpro/mail ]
then
    ln -s ${BASEDIR}/x3/js2-min/mail ${BASEDIR}/x3/js2-min/cgpro/
fi
if [ ! -d ${BASEDIR}/x3/css2-min/cgpro ]
then
    mkdir -p ${BASEDIR}/x3/css2-min/cgpro
fi
if [ ! -L ${BASEDIR}/x3/css2-min/cgpro/mail ]
then
    ln -s ${BASEDIR}/x3/css2-min/mail ${BASEDIR}/x3/css2-min/cgpro/
fi
chmod +x ${BASEDIR}/x3/cgpro/backup/getaccbackup.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/backup/getaliasesbackup.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/backup/getfiltersbackup.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/mail/checkDomainSettings.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/mail/getDomainAccounts.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/mail/getVCARD.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/mail/getQR.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/mail/contactsimport.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/getXmppHistory.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/playwav.live.cgi
chmod +x ${BASEDIR}/x3/cgpro/getwav.live.cgi

for ((j=0; j<${lLen}; j++)); do
    TARGET=${BASEDIR}/x3/locale/`basename ${LOCALES[$j]} '{}'`.yaml.local
    if [ ! -f ${TARGET} ]
    then
        echo "---" > ${TARGET}
    else
	sed -i -e '/^"*CGP/d' ${TARGET}
    fi
    cat ${LOCALES[$j]} >> ${TARGET}
done
# END x3

# START paper_lantern
cp -a ${PACKSRC}/paper_lantern/* ${BASEDIR}/paper_lantern/
cp ${PACKSRC}/icons/* ${BASEDIR}/paper_lantern/styled/basic/icons/
cp ${PACKSRC}/plugin/*.conf ${BASEDIR}/paper_lantern/dynamicui

if [ ! -d ${BASEDIR}/paper_lantern/js2-min/cgpro ]
then
    mkdir -p ${BASEDIR}/paper_lantern/js2-min/cgpro
fi
if [ ! -L ${BASEDIR}/paper_lantern/js2-min/cgpro/mail ]
then
    ln -s ${BASEDIR}/paper_lantern/js2-min/mail ${BASEDIR}/paper_lantern/js2-min/cgpro/
fi
if [ ! -d ${BASEDIR}/paper_lantern/css2-min/cgpro ]
then
    mkdir -p ${BASEDIR}/paper_lantern/css2-min/cgpro
fi
if [ ! -L ${BASEDIR}/paper_lantern/css2-min/cgpro/mail ]
then
    ln -s ${BASEDIR}/paper_lantern/css2-min/mail ${BASEDIR}/paper_lantern/css2-min/cgpro/
fi
chmod +x ${BASEDIR}/paper_lantern/cgpro/backup/getaccbackup.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/backup/getaliasesbackup.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/backup/getfiltersbackup.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/mail/checkDomainSettings.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/mail/getDomainAccounts.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/mail/getVCARD.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/mail/getQR.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/mail/contactsimport.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/getXmppHistory.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/playwav.live.cgi
chmod +x ${BASEDIR}/paper_lantern/cgpro/getwav.live.cgi

for ((j=0; j<${lLen}; j++)); do
    TARGET=${BASEDIR}/paper_lantern/locale/`basename ${LOCALES[$j]} '{}'`.yaml.local
    if [ ! -f ${TARGET} ]
    then
        echo "---" > ${TARGET}
    else
	sed -i -e '/^"*CGP/d' ${TARGET}
    fi
    cat ${LOCALES[$j]} >> ${TARGET}
done
# END paper_lantern 

# Install CommuniGate Plugin Webmail
BASEDIR='/usr/local/cpanel/base/webmail';
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")
THEMES=($(find ${BASEDIR} -maxdepth 1 -mindepth 1 -type d))
IFS=$OLDIFS
tLen=${#THEMES[@]}

for (( i=0; i<${tLen}; i++ ));
do
    cp -r "${PACKSRC}/theme_webmail/cgpro" "${THEMES[$i]}/"
    chmod +x ${THEMES[$i]}/cgpro/energy.live.cgi
    chmod +x ${THEMES[$i]}/cgpro/pronto.live.cgi
done

# Update Feature List
cp ${PACKSRC}/featurelists/cgpro /usr/local/cpanel/whostmgr/addonfeatures/
chmod +x ${PACKSRC}/scripts/*
${PACKSRC}/scripts/migrate_groupware.pl
${PACKSRC}/scripts/modify_features.pl $1
/usr/local/cpanel/bin/rebuild_sprites
/usr/local/cpanel/bin/build_locale_databases

chmod +x ${PACKSRC}/scripts/editconfig.pl
${PACKSRC}/scripts/editconfig.pl

