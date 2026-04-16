// Message classification types for Nemotron Communication Layer
export var MessageClass;
(function (MessageClass) {
    MessageClass["SIMPLE_ACK"] = "2k";
    MessageClass["STATUS_UPDATE"] = "2k";
    MessageClass["PROGRESS_REPORT"] = "4k";
    MessageClass["DEPENDENCY_UPDATE"] = "4k";
    MessageClass["QUESTION"] = "4k";
    MessageClass["BUILD_PROMPT"] = "6k";
    MessageClass["ARCHITECTURE_DECISION"] = "6k";
    MessageClass["CODE_REVIEW"] = "6k";
    MessageClass["INTEGRATION_COMPLEX"] = "8k";
    MessageClass["DEBUGGING_SESSION"] = "8k";
    MessageClass["ESCALATION"] = "8k";
})(MessageClass || (MessageClass = {}));
export var Priority;
(function (Priority) {
    Priority["CRITICAL"] = "CRITICAL";
    Priority["HIGH"] = "HIGH";
    Priority["MEDIUM"] = "MEDIUM";
    Priority["LOW"] = "LOW";
})(Priority || (Priority = {}));
