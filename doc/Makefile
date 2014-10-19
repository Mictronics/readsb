#
# makefile for piaware doc files
#

DOCDIR=/usr/share/man/man1

MANPAGES= dump1090.1

all:
	@echo "'make install' to install docs"

install:
	@echo ---- installing docs
	cp $(MANPAGES) $(DOCDIR)
	@echo --- compressing docs
	cd $(DOCDIR); gzip --force -9 $(MANPAGES)

