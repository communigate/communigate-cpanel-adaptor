#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();

my $domain = $q->param('domain');
my $days = $cpanel->api2('CommuniGate', 'ListWorkDays', { 'domain' => $domain } );

print "Content-type: text/html\r\n\r\n";


my $wdays = join ",", @{$days->{cpanelresult}->{data}->[0]->{default}};
print '
<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Sun">Sun</label>
<input name="WorkDays" value="Sun" id="WorkDays-Sun"' . ($wdays =~ m/Sun/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>

<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Mon">Mon</label>
<input name="WorkDays" value="Mon" id="WorkDays-Mon"' . ($wdays =~ m/Mon/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>

<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Tue">Tue</label>
<input name="WorkDays" value="Tue" id="WorkDays-Tue"' . ($wdays =~ m/Tue/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>

<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Wed">Wed</label>
<input name="WorkDays" value="Wed" id="WorkDays-Wed"' . ($wdays =~ m/Wed/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>

<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Thu">Thu</label>
<input name="WorkDays" value="Thu" id="WorkDays-Thu"' . ($wdays =~ m/Thu/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>

<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Fri">Fri</label>
<input name="WorkDays" value="Fri" id="WorkDays-Fri"' . ($wdays =~ m/Fri/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>

<span style="display: block; float: left; text-align: center; padding-right: 5px;">
<label style="display: block;" for="WorkDays-Sat">Sat</label>
<input name="WorkDays" value="Sat" id="WorkDays-Sat"' . ($wdays =~ m/Sat/ ? ' checked="checked"' : '') . ' type="checkbox">
</span>
';

$cpanel->end();
