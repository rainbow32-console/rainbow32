import { getCurrentGameName } from './index';

export function storeToFile(obj: any, prefix?: string) {
    const stringified = JSON.stringify(obj);

    localStorage.setItem(
        'saveFile.' + getCurrentGameName() + (prefix ? ':' + prefix : ''),
        stringified
    );
}

export function readFromFile<T>(prefix?: string): T | undefined {
    if (
        !localStorage.getItem(
            'saveFile.' + getCurrentGameName() + (prefix ? ':' + prefix : '')
        )
    )
        return;

    return JSON.parse(
        localStorage.getItem(
            'saveFile.' + getCurrentGameName() + (prefix ? ':' + prefix : '')
        ) || '{}'
    );
}
