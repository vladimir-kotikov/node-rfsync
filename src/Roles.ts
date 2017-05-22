import * as fs from 'fs';
import * as path from 'path';
import { watch } from 'chokidar';
import * as WebSocket from 'ws';
import { Client as RPCClient } from 'noice-json-rpc'
import { ISyncService, SyncService } from './SyncService';
import { b64tgz } from "./Utils";
import { Server as WebSocketServer } from 'ws';
import { Server as RPCServer } from 'noice-json-rpc';

const DEFAULT_PORT = 28224;
const DEFAULT_DIR = './';

export interface IAppRole {
    start(): void
}

export class Server implements IAppRole {
    private baseDir: string

    constructor(
        private port: number = DEFAULT_PORT,
        baseDir: string = DEFAULT_DIR
    ) {
        this.baseDir = path.resolve(process.cwd(), baseDir);
        if (!fs.existsSync(this.baseDir)) {
            try {
                fs.mkdirSync(this.baseDir);
            } catch (err) {
                throw `Failed to create sync directory at ${this.baseDir}`
            }
        }

        if (!fs.statSync(this.baseDir).isDirectory()) {
            throw `${this.baseDir} doesn't appear to be a directory`
        }
    }

    public start(): void {
        const syncService: ISyncService = new SyncService(this.baseDir);
        const wsserver = new WebSocketServer({ port: this.port })
            .on('connection', () => console.log('Client connected'));

        const rpcserver = new RPCServer(wsserver);
        rpcserver.api().SyncService.expose(syncService);

        console.log(`Syncing changes to ${this.baseDir}...`);
        console.log(`Waiting for clients on port ${this.port}...`);
    }
}

export class Client implements IAppRole {
    private watchDir: string
    private syncService: ISyncService

    constructor(
        private host: string = 'localhost',
        private port: number = DEFAULT_PORT,
        watchDir: string = DEFAULT_DIR
    ) {
        this.watchDir = path.resolve(process.cwd(), watchDir);
        if (!fs.existsSync(this.watchDir) ||
            !fs.statSync(this.watchDir).isDirectory()) {

            throw "Directory to watch changes in must exist";
        }

        const connString = `ws://${this.host}:${this.port}`;
        console.log(`Connecting to ${connString}...`);

        try {
            const socket: WebSocket = new WebSocket(connString)
                .on('error', err => {
                    console.log(`Error connecting to ${connString}: ${err}`);
                    process.exit(2);
                });

            this.syncService = new RPCClient(socket)
                .api('SyncService.');

            console.log(`Watching ${this.watchDir} for changes...`);
        } catch (err) {
            throw `Error connecting to ${connString}: ${err}`;
        }
    }

    public start(ignored: string[] = ['node_modules', '.git']): void {
        const WATCH_OPTS = {
            cwd: this.watchDir,
            ignored
        };

        let snapshotting = true;
        const initFiles: string[] = [];

        watch(this.watchDir, WATCH_OPTS)
            .on('ready', () => {
                console.log(`Watching ${this.watchDir} for changes`);
                b64tgz(initFiles, this.watchDir)
                    .then(data => this.syncService.sync(data))
                    .then(() => console.log('Initial sync completed'))
                    .catch(err => console.error(err));
            })
            .on('add', (p: string) => {
                console.log(`File ${p} has been added`);
                if (snapshotting) return initFiles.push(p);

                return b64tgz(p, this.watchDir)
                    .then(data => this.syncService.sync(data))
                    .catch(err => console.error(err));
            })
            .on('change', (p: string) => {
                console.log(`File ${p} has been changed`);
                b64tgz(p, this.watchDir)
                    .then(data => this.syncService.sync(data))
                    .catch(err => console.error(err));
            })
            .on('unlink', (p: string) => {
                console.log(`File ${p} has been removed`);
                this.syncService.drop(p)
                    .catch(err => console.error(err));
            })
            .on('unlinkDir', (p: string) => {
                console.log(`Directory ${p} has been removed`);
                this.syncService.drop(p, true)
                    .catch(err => console.error(err));
            });
    }
}
