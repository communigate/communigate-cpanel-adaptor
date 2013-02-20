#!/bin/bash

myCgate="/var/CommuniGate"
myLogFile="/var/CommuniGate/spamassassin/spam-result.out"

myDate=`date +%Y-%m-%d\ %H:%M:%S`
echo "Date $myDate " $@ >> $myLogFile

#Get the fileid of the message file
QueuePath=$3
NewFile=`/bin/basename $QueuePath`'.tmp'
FinalFile=$NewFile'.sub'

SAUser=$1

echo $SAUser

# Formulate return-path and Envelope-To addresses from command line args.
# shift out the first 3 arguments, make sure one > to create a new file 
shift 4


echo "Return-Path:" $1 > /var/CommuniGate/Submitted/$NewFile


# shift out 5 command arguments.  and start appending
shift 2
Envelope=$1
shift
while [ $# -gt 0 ]
do
  Envelope=$Envelope','$1
  shift
done


# Formulate the envelope Header file.
echo "Envelope-To: " $Envelope >> $myCgate/Submitted/$NewFile

echo "X-Spam-Status: Scanner Called" >> $myCgate/Submitted/$NewFile

# using awk, and then send to spamc. 

/bin/gawk '/Received/, /\n/' $myCgate/$QueuePath | /usr/bin/spamc -d 127.0.0.1 -f -u $SAUser >> /var/CommuniGate/Submitted/$NewFile


#Now submit the file by renameing it to .sub
mv /var/CommuniGate/Submitted/$NewFile /var/CommuniGate/Submitted/$FinalFile

# done.
exit 0;
