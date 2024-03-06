import type { client_id } from '../../../../.././types/typeAliases';
import type { Prompt } from '../../../../../types/Prompt';

/**
 * Socket.io progress for remote text generation
 *
 * This is a request from client to server
 */
export interface Promptbooks_Request {
    /**
     * Client responsible for the requests
     */
    readonly clientId: client_id;

    /**
     * The Prompt to execute
     */
    readonly prompt: Prompt;
}
