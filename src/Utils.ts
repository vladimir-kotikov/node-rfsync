import * as tar from "tar";
import { Base64Decoder, Base64Encoder } from './Streams';

export function b64tgz(file: string | string[], cwd?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let result = "";
        tar.c({ cwd, gzip: true, portable: true }, Array.isArray(file) ? file : [file])
            .pipe(new Base64Encoder())
            .on('data', (data: string) => result += data)
            .on('error', (err: any) => reject(err))
            .on('end', () => resolve(result));
    });
}

export function unb64tgz(b64data: string, baseDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        Base64Decoder.fromString(b64data)
            .pipe(tar.x({ cwd: baseDir }))
            .on('error', reject)
            .on('end', resolve);
    });
}
