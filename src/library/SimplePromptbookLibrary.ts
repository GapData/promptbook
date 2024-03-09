import spaceTrim from 'spacetrim';
import { promptbookStringToJson } from '../conversion/promptbookStringToJson';
import { validatePromptbookJson } from '../conversion/validatePromptbookJson';
import { NotFoundError } from '../errors/NotFoundError';
import { CreatePromptbookExecutorSettings } from '../execution/createPromptbookExecutor';
import type { Prompt } from '../types/Prompt';
import type { PromptbookJson } from '../types/PromptbookJson/PromptbookJson';
import type { PromptbookString } from '../types/PromptbookString';
import type { string_name, string_promptbook_url } from '../types/typeAliases';
import { PromptbookLibrary } from './PromptbookLibrary';

/**
 * Options for SimplePromptbookLibrary
 */
type SimplePromptbookLibraryLibraryOptions = {
    /**
     * The library of promptbooks
     */
    readonly library: Record<string_promptbook_url, PromptbookJson>;

    /**
     * Optional settings for creating a PromptbookExecutor
     */
    readonly settings?: Partial<CreatePromptbookExecutorSettings>;
};

/**
 * Library of promptbooks that groups together promptbooks for an application.
 * This implementation is a very thin wrapper around the Array / Set of promptbooks.
 *
 * @see https://github.com/webgptorg/promptbook#promptbook-library
 */
export class SimplePromptbookLibrary implements PromptbookLibrary {
    /**
     * Constructs Promptbook from any sources
     *
     * Note: During the construction syntax and logic of all sources are validated
     * Note: You can combine .ptbk.md and .ptbk.json files BUT it is not recommended
     *
     * @param promptbookSources contents of .ptbk.md or .ptbk.json files
     * @param settings settings for creating executor functions
     * @returns PromptbookLibrary
     */
    public static fromSources(
        promptbookSources: Record<string_promptbook_url, PromptbookJson | PromptbookString>,
        settings?: Partial<CreatePromptbookExecutorSettings>,
    ): SimplePromptbookLibrary {
        const library: Record<string_name, PromptbookJson> = {};
        for (const [name, source] of Object.entries(promptbookSources)) {
            let promptbook: PromptbookJson;

            if (typeof source === 'string') {
                // Note: When directly creating from string, no need to validate the source
                //       The validation is performed always before execution

                promptbook = promptbookStringToJson(source);
            } else {
                promptbook = source;
            }
            validatePromptbookJson(promptbook);

            if (promptbook.promptbookUrl === undefined) {
                throw new Error(
                    spaceTrim(`
                      Promptbook with name "${name}" does not have defined URL

                      Note: Promptbooks without URLs are called anonymous promptbooks
                            They can be used as standalone promptbooks, but they cannot be referenced by other promptbooks
                            And also they cannot be used in the promptbook library

                  `),
                );
            }

            library[promptbook.promptbookUrl] = promptbook;
        }
        return new SimplePromptbookLibrary({ library, settings });
    }

    private constructor(private readonly options: SimplePromptbookLibraryLibraryOptions) {}

    /**
     * Gets all promptbooks in the library
     */
    public listPromptbooks(): Array<string_promptbook_url> {
        return Object.keys(this.options.library);
    }

    /**
     * Gets promptbook by its URL
     *
     * Note: This is not a direct fetching from the URL, but a lookup in the library
     */
    public getPromptbookByUrl(url: string_promptbook_url): PromptbookJson {
        const promptbook = this.options.library[url];
        if (!promptbook) {
            throw new NotFoundError(
                spaceTrim(
                    (block) => `
                        Promptbook with url "${url}" not found

                        Available promptbooks:
                        ${block(
                            this.listPromptbooks()
                                .map((promptbookUrl) => `- ${promptbookUrl}`)
                                .join('\n'),
                        )}

                    `,
                ),
            );
        }
        return promptbook;
    }

    /**
     * Checks whether given prompt was defined in any promptbook in the library
     */
    public isResponsibleForPrompt(prompt: Prompt): boolean {
        // TODO: [🎛] DO not hardcode this, really validate whether the prompt is in the library
        prompt;
        return true;
    }
}