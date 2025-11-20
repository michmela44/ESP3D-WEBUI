export enum CommandState {
    INITIATED,
    SENT,
    DONE,
    TIMED_OUT
}

export class Command {
    command: string;
    response: string[];
    state: CommandState;

    /**
     * Set to true to debug log when the command is being sent
     */
    debugSend: boolean;

    /**
     * Set to true to debug log when the response data is received
     */
    debugReceive: boolean;

    onDone: () => Promise<void>;

    constructor(command: string) {
        this.state = CommandState.INITIATED;
        this.response = [];
        this.command = command;
        this.onDone = () => {
            return Promise.resolve();
        };
        this.debugReceive = false;
        this.debugSend = false;
    }

    appendLine = (line: string) => {
        this.response.push(line);

        if (line.startsWith("ok") || line.startsWith("error")) {
            this.state = CommandState.DONE;
            if (this.onDone) {
                this.onDone();
            }
        }
    };

    getCommand() {
        return this.command;
    }
}