export default function getExtensionBase64(data: string) {
    const firstSymbol = data.charAt(0);
    switch (firstSymbol) {
        case '/':
            return '.jpeg';
        case 'i':
            return '.png';
        case 'U':
            return '.webp';
    }
}
