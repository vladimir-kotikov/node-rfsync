import * as fs from 'fs';
import * as path from 'path';
import { unb64tgz } from "./Utils";

export interface ISyncService {
    sync(b64data: string): Promise<void>;
    drop(filePath: string, isDir?: boolean): Promise<void>;
}

export class SyncService implements ISyncService {
    constructor(private baseDir: string) { }

    sync = (data: string): Promise<void> => unb64tgz(data, this.baseDir);

    drop = (filePath: string, isDir?: boolean): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            (isDir ? fs.rmdir : fs.unlink)
                .apply(fs, [path.resolve(this.baseDir, filePath),
                (err: any) => { if (err) { reject(err) } else resolve(); }]);
        });
    };
}
