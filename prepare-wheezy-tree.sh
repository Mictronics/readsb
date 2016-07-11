#!/bin/sh

# This is a nasty hack that prepares a separate package tree suitable for
# building the package for wheezy

TOP=`dirname $0`
OUT=$TOP/package-wheezy

rm -fr $OUT

FILES=$(find $TOP -mindepth 1 -maxdepth 1 -name 'debian-wheezy' -prune -o -print)
mkdir $OUT
cp -a $FILES $OUT

cp -a $TOP/debian-wheezy/* $OUT/debian/

echo "Updating changelog for wheezy backport build"
dch --changelog $OUT/debian/changelog --bpo --distribution wheezy-backports "Automated backport build for wheezy"

echo "OK, ready to go in $OUT"
