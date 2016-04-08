declare var anyvar:any;

declare module 'vm' {
    export = anyvar;
}
declare module 'fs' {
    export = anyvar;
}
declare module 'path' {
    export = anyvar;
}