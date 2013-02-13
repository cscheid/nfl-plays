#!/usr/bin/env python

import csv
import sys
import re
import json

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
        self.id = 0
        self.kind = "kick"
        self.yd = int_from_re(self.kick_yardage_re, desc)
        if 'no play' in desc:
            self.outcome = 2
        elif 'touchback' in desc:
            self.outcome = 0
        else:
            self.outcome = 1
    def attrs(self):
        return "%d, %d, %d" % (self.id, self.yd, self.outcome)

class OnsideKick(object):
    onside_kick_yardage_re = re.compile(r'kicks onside (-?[0-9]+) yard')
    def __init__(self, desc):
        self.id = 1
        self.kind = "onside kick"
        self.yd = int_from_re(self.onside_kick_yardage_re, desc)
        if 'recovered' in desc:
            self.outcome = 0
        else:
            self.outcome = 1
    def attrs(self):
        return "%d, %d, %d" % (self.id, self.yd, self.outcome)

class Pass(object):
    pass_yardage_re = re.compile(r'for (-?[0-9]+) yard')
    def __init__(self, desc):
        self.id = 2
        self.kind = "pass"
        self.yd = int_from_re(self.pass_yardage_re, desc)
        if 'intercepted' in desc:
            self.outcome = 2
        elif 'incomplete' in desc:
            self.outcome = 1
        else:
            self.outcome = 0
    def attrs(self):
        return "%d, %d, %d" % (self.id, self.yd, self.outcome)

class Rush(object):
    rush_yardage_re = re.compile(r'for (-?[0-9]+) yard')
    def __init__(self, desc):
        self.id = 3
        self.kind = "rush"
        self.yd = int_from_re(self.rush_yardage_re, desc)
    def attrs(self):
        return "%d, %d, 0" % (self.id, self.yd)

class Punt(object):
    punt_yardage_re = re.compile(r'punts (-?[0-9]+) yard')
    def __init__(self, desc):
        self.id = 4
        self.kind = "punt"
        if 'aborted' in desc:
            self.outcome = 2
        elif 'blocked' in desc:
            self.outcome = 3
        else:
            self.outcome = 0
        self.yd = int_from_re(self.punt_yardage_re, desc)
    def attrs(self):
        return "%d, %d, %d" % (self.id, self.yd, self.outcome)

class PAT(object):
    def __init__(self, desc):
        self.id = 5
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
        return "%d, 0, %d" % (self.id, self.outcome)

class FieldGoal(object):
    fg_yardage_re = re.compile(r'(-?[0-9]+) yard field goal')
    def __init__(self, desc):
        self.id = 6
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
        return "%d, %d, %d" % (self.id, self.yd, self.outcome)

class Sack(object):
    sack_yardage_re = re.compile(r'(-?[0-9]+) yard')
    def __init__(self, desc):
        self.id = 7
        self.kind = "sack"
        self.yd = int_from_re(self.sack_yardage_re, desc)
    def attrs(self):
        return "%d, %d, 0" % (self.id, self.yd)

class TwoPointAttempt(object):
    def __init__(self, desc):
        self.id = 8
        self.kind = "two-point"
        if 'attempt succeeds' in desc:
            self.outcome = 0
        elif 'attempt fails' in desc:
            self.outcome = 1
    def attrs(self):
        return "%d, 0, %d" % (self.id, self.outcome)

class Kneel(object):
    def __init__(self, desc):
        self.id = 9
        self.kind = "kneel"
    def attrs(self):
        return "%d, 0, 0" % self.id

class PenaltyBeforeSnap(object):
    def __init__(self, desc):
        self.id = 10
        self.kind = "penalty before snap"
    def attrs(self):
        return "%d, 0, 0" % self.id

class Spike(object):
    def __init__(self, desc):
        self.id = 11
        self.kind = "spike"
    def attrs(self):
        return "%d, 0, 0" % self.id

# class Unknown(object):
#     def __init__(self, desc):
#         self.id = 12
#         self.kind = "other"
#     def attrs(self):
#         return "%d, 0, 0" % self.id

class FumbledSnapHandoff(object):
    def __init__(self, desc):
        self.id = 12
        self.kind = "fumbled snap"
    def attrs(self):
        return "%d, 0, 0" % self.id

class UnderReview(object):
    def __init__(self, desc):
        self.id = 13
        self.kind = "under review"
    def attrs(self):
        return "%d, 0, 0" % self.id

##############################################################################

rush_re = re.compile(r'[A-Z]\. ?[A-Z][a-z]+ to [A-Z]+ [0-9]+ for')

scramble1_re = re.compile(r'[A-Za-z. ]+ for -?[0-9]+ yard')
scramble2_re = re.compile(r'[A-Za-z. ]+ to [A-Z]+ -?[0-9]+ for -?[0-9]+ yard')
scramble3_re = re.compile(r'[A-Za-z. ]+ to [0-9]+ for -?[0-9]+ yard')
scramble4_re = re.compile(r'[A-Za-z. ]+ lost -?[0-9]+ yard')

def classify_play(desc):
    odesc = desc
    desc = desc.lower()
    if 'two-point conversion attempt' in desc:
        return TwoPointAttempt(desc)
    if 'kicks' in desc:
        if 'kicks onside' in desc:
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
    if 'yard field goal' in desc:
        return FieldGoal(desc)
    if 'sacked' in desc:
        return Sack(desc)
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
    if 'false start' in desc:
        return PenaltyBeforeSnap(desc)
    if rush_re.search(odesc):
        return Rush(desc)
    if 'scrambles' in desc or \
       'ran ob' in desc or \
       'pushed ob' in desc:
        return Rush(desc)
    if 'fumbles (aborted)' in desc:
        return FumbledSnapHandoff(desc)
    if scramble1_re.search(odesc):
        return Rush(desc)
    if scramble2_re.search(odesc):
        return Rush(desc)
    if scramble3_re.search(odesc):
        return Rush(desc)
    if scramble4_re.search(odesc):
        return Rush(desc)
    if 'penalty' in desc:
        return PenaltyBeforeSnap(desc)
    if 'aborted' in desc:
        return FumbledSnapHandoff(desc)
    if 'play under review' in desc:
        return UnderReview(desc)
    sys.stderr.write("Can't identify play from description: '%s'\n" % odesc)
    return Unknown(desc)

##############################################################################

first=True
f = csv.reader(file('combined.csv'))
f.next()

plays = []

for j, l in enumerate(f):
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
    plays.append((curtime, down, togo, ydline, play, j))

def play_comp(p1, p2):
    if p1[4].id < p2[4].id: return -1
    if p1[4].id > p2[4].id: return 1
    return 0

plays.sort(play_comp)

def flatten_play((curtime, down, togo, ydline, play, j)):
    result = [curtime, down, togo, ydline]
    attrs = list(int(i) for i in play.attrs().split(', '))
    result.extend(attrs)
    result.append(j)
    return result

flattened_plays = [item for play in plays for item in flatten_play(play)]

counts = [0] * 15
for play in plays:
    play = flatten_play(play)
    counts[play[4]] += 1
for i in xrange(0, len(counts)-1):
    counts[i+1] = counts[i+1] + counts[i]

# for i, (curtime, down, togo, ydline, play, j) in enumerate(plays):
#     print "%s%d, %d, %d, %d, %s, %d" % (", " if i <> 0 else "", curtime, down, togo, ydline, play.attrs(), j)

#fixme
result = {"plays": flattened_plays,
          "counts": counts[:-1]}

print json.dumps(result)
