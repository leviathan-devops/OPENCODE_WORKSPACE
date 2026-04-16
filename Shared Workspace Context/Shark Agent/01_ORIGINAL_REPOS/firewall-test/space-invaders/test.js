// Using multiple-word variable names (FORBIDDEN in AGENTS.md)
const inputPID = 12345;
const existingClient = new HttpClient();
const connectTimeout = 5000;
const workerPath = "/path/to/worker";

function prepareJournal(dir) {
    return dir + "/journal.json";
}
