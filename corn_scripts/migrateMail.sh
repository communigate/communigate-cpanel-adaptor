#!/bin/bash

queueFile="/var/CommuniGate/Migration/migrationQueue";
logFile="/var/CommuniGate/Migration/migrationLog";

if [ -f  $queueFile ]
then
    while read line
    do
	command=$line;
	account=`echo $command | cut -f 4 -d ' '`;
	server=`echo $command | cut -f 3 -d ' '`;
	echo "["`date`"] Copying account $account from $server:" >> $logFile;
	`$command >>$logFile 2>&1`
	tail -n +2 ${queueFile} > $queueFile
    done < $queueFile
fi