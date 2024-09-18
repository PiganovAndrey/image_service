export const hashToPath = (hash: string) => {
    const subdirs = [hash.substring(0, 9), hash.substring(9, 18), hash.substring(18, 27), hash.substring(27)];

    return subdirs.join('/'); // + '/';
};

export const getExtension = (name: string) => name.substring(name.lastIndexOf('.'), name.length);
