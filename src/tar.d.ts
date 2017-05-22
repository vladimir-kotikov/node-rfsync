declare module 'tar' {
    // export function c(options: {}, files: string[]): Promise<void>;
    export function c(options: CreateFileOptions, files: string[], callback: () => void): void;
    export function c(options: CreateFileOptions, files: string[]): Promise<void>;
    export function c(options: CreateOptions, files: string[]): NodeJS.ReadableStream;

    export function x(options?: ExtractFileOptions, files?: string[], callback?: () => void): void;
    export function x(options?: ExtractFileOptions, files?: string[]): Promise<void>;
    export function x(options?: ExtractOptions, files?: string[]): NodeJS.WritableStream;

    interface CreateFileOptions extends CreateOptions {
        file: string;
    }

    interface CreateOptions extends BaseOptions {
        prefix?: string;
        gzip?: boolean | any;
        portable?: boolean;
        mode?: number
        noDirRecurse?: boolean;
        follow?: boolean;
        noPax?: boolean
    }

    interface ExtractFileOptions extends ExtractOptions {
        file: string;
    }

    interface ExtractOptions extends BaseOptions {
        newer?: boolean;
        keep?: boolean;
        unlink?: boolean;
        strip?: boolean;
        preserveOwner?: boolean;
    }

    interface BaseOptions {
        sync?: boolean;
        onwarn?: (message: string, data: any) => void;
        strict?: boolean;
        cwd?: string;
        filter?: (filePath: string, stats: any) => boolean;
        preservePaths?: boolean;
        newer?: boolean;
        keep?: boolean;
        unlink?: boolean;
        strip?: boolean;
        preserveOwner?: boolean;
    }
}
