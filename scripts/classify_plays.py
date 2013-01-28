#!/usr/bin/env python

import csv
import sys
import re

##############################################################################

def int_from_re(re, str, ifbad=0):
    m = re.search(str)
    if m:
        try:
            return int(m.groups()[0])
        except ValueError:
            return ifbad
    else:
        return ifbad

class Kick(object):
    kick_yardage_re = re.compile(r'kicks (-?[0-9]+) yard')
    def __init__(self, desc):
        self.kind = "kick"
        self.yd = int_from_re(self.kick_yardage_re, desc)
    def attrs(self):
        return "0, %d, 0" % self.yd

class OnsideKick(object):
    onside_kick_yardage_re = re.compile(r'kicks onside (-?[0-9]+) yard')
    def __init__(self, desc):
        self.kind = "onside kick"
        self.yd = int_from_re(self.onside_kick_yardage_re, desc)
    def attrs(self):
        return "1, %d, 0" % self.yd

class Pass(object):
    pass_yardage_re = re.compile(r'for (-?[0-9]+) yard')
    def __init__(self, desc):
        self.kind = "pass kick"
        self.yd = int_from_re(self.pass_yardage_re, desc)
    def attrs(self):
        return "2, %d, 0" % self.yd

class Rush(object):
    rush_yardage_re = re.compile(r'for (-?[0-9]+) yard')
    def __init__(self, desc):
        self.kind = "rush"
        self.yd = int_from_re(self.rush_yardage_re, desc)
    def attrs(self):
        return "3, %d, 0" % self.yd

class Punt(object):
    punt_yardage_re = re.compile(r'punts (-?[0-9]+) yard')
    def __init__(self, desc):
        self.kind = "punt"
        if 'aborted' in desc:
            self.outcome = 2
        elif 'blocked' in desc:
            self.outcome = 3
        else:
            self.outcome = 0
        self.yd = int_from_re(self.punt_yardage_re, desc)
    def attrs(self):
        return "4, %d, %d" % (self.yd, self.outcome)

class PAT(object):
    def __init__(self, desc):
        self.kind = "pat"
        if 'is good' in desc:
            self.outcome = 0
        elif 'no good' in desc:
            self.outcome = 1
        elif 'aborted' in desc:
            self.outcome = 2
        elif 'blocked' in desc:
            self.outcome = 3
        else:
            self.outcome = 4
    def attrs(self):
        return "5, 0, %d" % self.outcome

class FieldGoal(object):
    fg_yardage_re = re.compile(r'(-?[0-9]+) yard field goal')
    def __init__(self, desc):
        self.kind = "field goal"
        self.yd = int_from_re(self.fg_yardage_re, desc)
        if 'is good' in desc:
            self.outcome = 0
        elif 'is no good' in desc:
            self.outcome = 1
        elif 'aborted' in desc:
            self.outcome = 2
        elif 'blocked' in desc:
            self.outcome = 3
        else:
            self.outcome = 4
    def attrs(self):
        return "6, %d, %d" % (self.yd, self.outcome)

class Sack(object):
    sack_yardage_re = re.compile(r'(-?[0-9]+) yard')
    def __init__(self, desc):
        self.kind = "sack"
        self.yd = int_from_re(self.sack_yardage_re, desc)
    def attrs(self):
        return "7, %d, 0" % self.yd

class TwoPointAttempt(object):
    def __init__(self, desc):
        self.kind = "two-point"
        if 'attempt succeeds' in desc:
            self.outcome = 0
        elif 'attempt fails' in desc:
            self.outcome = 1
    def attrs(self):
        return "8, 0, %d" % self.outcome

class Kneel(object):
    def __init__(self, desc):
        self.kind = "kneel"
    def attrs(self):
        return "9, 0, 0"

class PenaltyBeforeSnap(object):
    def __init__(self, desc):
        self.kind = "penalty before snap"
    def attrs(self):
        return "10, 0, 0"

class Spike(object):
    def __init__(self, desc):
        self.kind = "spike"
    def attrs(self):
        return "11, 0, 0"

class Unknown(object):
    def __init__(self, desc):
        self.kind = "other"
    def attrs(self):
        return "12, 0, 0"

##############################################################################

rush_re = re.compile(r'[A-Z]\. ?[A-Z][a-z]+ to [A-Z]+ [0-9]+ for')

def classify_play(desc):
    odesc = desc
    desc = desc.lower()
    if 'kicks' in desc:
        if 'onside' in desc:
            return OnsideKick(desc)
        else:
            return Kick(desc)
    if 'spiked' in desc:
        return Spike(desc)
    if 'back to pass' in desc:
        return Rush(desc)
    if 'pass' in desc:
        return Pass(desc)
    if 'punt' in desc:
        return Punt(desc)
    if 'extra point' in desc:
        return PAT(desc)
    if 'field goal' in desc:
        return FieldGoal(desc)
    if 'sacked' in desc:
        return Sack(desc)
    if 'two-point conversion attempt' in desc:
        return TwoPointAttempt(desc)
    if 'left end' in desc or \
       'right end' in desc or \
       'left guard' in desc or \
       'right guard' in desc or \
       'left tackle' in desc or \
       'right tackle' in desc or \
       'up the middle' in desc or \
       'rushed for' in desc:
        return Rush(desc)
    if 'kneel' in desc or \
       'knelt' in desc or \
       'took a knee' in desc or \
       'takes a knee' in desc:
        return Kneel(desc)
    if ') penalty' in desc:
        return PenaltyBeforeSnap(desc)
    if 'was penalized' in desc:
        return PenaltyBeforeSnap(desc)
    if rush_re.search(odesc):
        return Rush(desc)
    sys.stderr.write("Can't identify play from description: '%s'\n" % odesc)
    return Unknown(desc)

##############################################################################

print "["
first=True
f = csv.reader(file('combined.csv'))
f.next()

for l in f:
    row = list(l[i] for i in [1,2,3,6,7,8,9])
    qtr, mn, sec, down, togo, ydline, desc = row
    
    try: down = int(down)
    except ValueError: down = 0
        
    try: qtr = int(qtr)
    except ValueError: qtr = 0
    
    try: curtime = int(mn) * 60 + int(sec)
    except ValueError: curtime = 3600 - (qtr-1) * (15 * 60)

    try: togo = int(togo)
    except ValueError: togo = 0

    try: ydline = int(ydline)
    except ValueError: ydline = -1

    play = classify_play(desc)

    print "%s%d, %d, %d, %d, %s" % (", " if not first else "", curtime, down, togo, ydline, play.attrs())
    first = False

print "]"
