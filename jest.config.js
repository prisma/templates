"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: 'ts-jest',
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname',
        'jest-watch-select-projects',
        'jest-watch-suspend',
    ],
    globals: {
        'ts-jest': {
            diagnostics: Boolean(process.env.CI),
            compiler: 'ttypescript',
        },
    },
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map