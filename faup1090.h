

#include "dump1090.h"

#define FAUP1090_VERSION     "1.7"

#undef MODES_NET_INPUT_RAW_PORT
#define MODES_NET_INPUT_RAW_PORT    0

#undef MODES_NET_INPUT_BEAST_PORT
#define MODES_NET_INPUT_BEAST_PORT  0

#undef MODES_NET_OUTPUT_FA_TSV_PORT
#define MODES_NET_OUTPUT_FA_TSV_PORT 10001

struct {
    char net_input_beast_ipaddr[32];
} faup1090;

#define FAUP1090_NET_OUTPUT_IP_ADDRESS "127.0.0.1"


