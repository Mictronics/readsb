// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// net_io.h: network handling.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This code is based on a detached fork of dump1090-fa.
//
// Copyright (c) 2014,2015 Oliver Jowett <oliver@mutability.co.uk>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

#ifndef NETIO_H
#define NETIO_H

// Describes a networking service (group of connections)

struct aircraft;
struct modesMessage;
struct client;
struct net_service;
typedef int (*read_fn)(struct client *, char *, int);
typedef void (*heartbeat_fn)(struct net_service *);

typedef enum
{
  READ_MODE_IGNORE,
  READ_MODE_BEAST,
  READ_MODE_BEAST_COMMAND,
  READ_MODE_ASCII
} read_mode_t;

/* Data mode to feed push server */
typedef enum
{
  PUSH_MODE_RAW,
  PUSH_MODE_BEAST,
  PUSH_MODE_SBS,
} push_mode_t;

// Describes one network service (a group of clients with common behaviour)

struct net_service
{
  int listener_count; // number of listeners
  int pusher_count; // Number of push servers connected to
  int connections; // number of active clients
  int serial_service; // 1 if this is a service for serial devices
  read_mode_t read_mode;
  read_fn read_handler;
  struct net_writer *writer; // shared writer state
  struct net_service* next;
  int *listener_fds; // listening FDs
  const char *read_sep; // hander details for input data
  const char *descr;
};

// Structure used to describe a networking client

struct client
{
  struct net_service *service; // Service this client is part of
  struct client* next; // Pointer to next client
  int fd; // File descriptor
  int buflen; // Amount of data on buffer
  int modeac_requested; // 1 if this Beast output connection has asked for A/C
  char buf[MODES_CLIENT_BUF_SIZE + 4]; // Read buffer+padding
};

// Common writer state for all output sockets of one type

struct net_writer
{
  void *data; // shared write buffer, sized MODES_OUT_BUF_SIZE
  int dataUsed; // number of bytes of write buffer currently used
#if !defined(__arm__)
  uint32_t padding;
#endif
  struct net_service *service; // owning service
  heartbeat_fn send_heartbeat; // function that queues a heartbeat if needed
  uint64_t lastWrite; // time of last write to clients
};

struct net_service *serviceInit (const char *descr, struct net_writer *writer, heartbeat_fn hb_handler, read_mode_t mode, const char *sep, read_fn read_handler);
struct client *serviceConnect (struct net_service *service, char *push_addr, char *push_port);
void serviceListen (struct net_service *service, char *bind_addr, char *bind_ports);
struct client *createSocketClient (struct net_service *service, int fd);
struct client *createGenericClient (struct net_service *service, int fd);

// viewadsb want to create these itselves
struct net_service *makeBeastInputService (void);
struct net_service *makeFatsvOutputService (void);

void sendBeastSettings (struct client *c, const char *settings);

void modesInitNet (void);
void modesQueueOutput (struct modesMessage *mm, struct aircraft *a);
void modesNetPeriodicWork (void);
void modesReadSerialClient(void);

// TODO: move these somewhere else
char *generateAircraftJson (const char *url_path, int *len);
char *generateStatsJson (const char *url_path, int *len);
char *generateReceiverJson (const char *url_path, int *len);
char *generateHistoryJson (const char *url_path, int *len);
void writeJsonToFile (const char *file, char * (*generator) (const char *, int*));

#endif
