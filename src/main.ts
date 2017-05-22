#!/usr/bin/env node

import * as nopt from 'nopt';
import { Client, Server, IAppRole } from "./Roles";

const ABBR = { h: '--help', p: '--port' };
const KNOWN_OPTS = { help: Boolean, port: Number };
const DOC = `
Usage:

    rfsync sync <host> [<directory>] [--port <port>]
    rfsync [<directory>] [--port <port>]
    rfsync help

    -p, --port <port>  Port to connect/listen to. Default is 28224
`;

const parsed = nopt(KNOWN_OPTS, ABBR);
const [commandOrDir, host, dir] = parsed.argv.remain;

if (parsed.help || commandOrDir == 'help') {
    console.log(DOC);
    process.exit(0);
}

const role: IAppRole = commandOrDir === 'sync' ?
    new Client(host, parsed.port, dir) :
    new Server(parsed.port, commandOrDir);

role.start();
