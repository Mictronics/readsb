#!/usr/bin/env python2

#
# Converts a Virtual Radar Server BasicAircraftLookup.sqb database
# into a bunch of json files suitable for use by the webmap
#

import sqlite3, json
from contextlib import closing

def extract(dbfile, todir, blocklimit):
    ac_count = 0
    block_count = 0

    blocks = {}
    for i in xrange(16):
        blocks['%01X' % i] = {}

    print 'Reading', dbfile
    with closing(sqlite3.connect(dbfile)) as db:
        with closing(db.execute('SELECT a.Icao, a.Registration, m.Icao FROM Aircraft a, Model m WHERE a.ModelID = m.ModelID')) as c:
            for icao24, reg, icaotype in c:
                bkey = icao24[0:1].upper()
                dkey = icao24[1:].upper()
                blocks[bkey][dkey] = {}
                if reg: blocks[bkey][dkey]['r'] = reg
                if icaotype: blocks[bkey][dkey]['t'] = icaotype
                ac_count += 1
    print 'Read', ac_count, 'aircraft'

    queue = list(blocks.keys())
    while queue:
        bkey = queue[0]
        del queue[0]

        blockdata = blocks[bkey]
        if len(blockdata) > blocklimit:
            print 'Splitting block', bkey, 'with', len(blockdata), 'entries..',
            children = {}
            for dkey in blockdata.keys():
                new_bkey = bkey + dkey[0]
                new_dkey = dkey[1:]

                if new_bkey not in children: blocks[new_bkey] = children[new_bkey] = {}
                children[new_bkey][new_dkey] = blockdata[dkey]

            print len(children), 'children'
            queue.extend(children.keys())
            blockdata = blocks[bkey] = { 'children' : sorted(children.keys()) }

        path = todir + '/' + bkey + '.json'
        print 'Writing', len(blockdata), 'entries to', path
        block_count += 1
        with closing(open(path, 'w')) as f:
            json.dump(obj=blockdata, fp=f, check_circular=False, separators=(',',':'), sort_keys=True)

    print 'Wrote', block_count, 'blocks'

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 3:
        print 'Syntax: %s <path to BasicAircraftLookup.sqb> <path to DB dir>' % sys.argv[0]
        sys.exit(1)
    else:
        extract(sys.argv[1], sys.argv[2], 1000)
        sys.exit(0)
