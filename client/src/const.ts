export interface SearchMode {
    value: ModeType;
    text: string;
}

type SearchModes = {
    [key: string]: SearchMode;
}

export type ModeType = 'basic' | 'medium' | 'advanced';

export const SEARCH_MODES: SearchModes = {
    basic: {
        value: 'basic',
        text: 'Basic'
    },
    medium: {
        value: 'medium',
        text: 'Medium'
    },
    advanced: {
        value: 'advanced',
        text: 'Advanced'
    },
}