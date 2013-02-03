#!/bin/bash

#To be run after classifying the plays.
#Copy the output to main.js
gawk -F ',' '{ print $6 }' plays.json | sort | uniq -c | sort -k2 -n | gawk '{ if (NR>1) { sum+= $1; printf("%d", sum); if (NR<15) printf(", ");} } END {printf("\n");}'

