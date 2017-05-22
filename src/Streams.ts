import { Transform, PassThrough } from 'stream';

export class Base64Encoder extends Transform {
    private extra: Buffer | null = null;

    _transform(chunk: Buffer, encoding: string, cb: () => void) {
        // Add any previous extra bytes to the chunk
        if (this.extra) {
            chunk = Buffer.concat([this.extra, chunk]);
            this.extra = null;
        }

        // 3 bytes are represented by 4 characters, so we can only encode in groups of 3 bytes
        const remaining = chunk.length % 3;

        if (remaining !== 0) {
            // Store the extra bytes for later
            this.extra = chunk.slice(chunk.length - remaining);
            chunk = chunk.slice(0, chunk.length - remaining);
        }

        // Push the chunk
        this.push(chunk.toString('base64'));
        cb();
    }
    _flush(cb: () => void) {
        if (this.extra) {
            this.push(this.extra.toString('base64'));
        }

        cb();
    }

};

export class Base64Decoder extends Transform {
    static fromString(b64string: string): Base64Decoder {
        let pt = new PassThrough();
        pt.write(b64string)
        pt.end();
        return pt.pipe(new Base64Decoder());
    }
    private extra: string = '';
    constructor() {
        super({ decodeStrings: false });
    }

    _transform(chunk: string, encoding: string, cb: () => void) {
        chunk = '' + chunk;
        chunk = this.extra + chunk.replace(/(\r\n|\n|\r)/gm, '');

        const remaining = chunk.length % 4;
        this.extra = chunk.slice(chunk.length - remaining);
        chunk = chunk.slice(0, chunk.length - remaining);

        const buf = Buffer.from(chunk, 'base64');
        this.push(buf);
        cb();
    }

    _flush(cb: () => void) {
        if (this.extra.length) {
            this.push(Buffer.from(this.extra, 'base64'));
        }

        cb();
    }
};
