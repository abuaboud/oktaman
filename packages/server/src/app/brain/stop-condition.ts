import { conversationUtils, Session, SessionSource } from "@oktaman/shared";
import { logger } from "../common/logger";
import { StepResult, ToolSet } from "ai";

const MAX_STEPS = 40;

export function createStopCondition({ session }: { session: Pick<Session, 'id' | 'source'> }) {
    return ({ steps }: { steps: Array<StepResult<ToolSet>> }) => {
        if (steps.length > MAX_STEPS) {
            logger.info({
                sessionId: session.id,
                stepsCount: steps.length,
            }, '[QuickService] Stopping agent because step count is greater than 40');
            return true;
        }

        if (hasQuestions({ session, steps }) && session.source !== SessionSource.TELEGRAM) {
            return true;
        }

        return false;
    };
}


function hasQuestions({ session, steps }: HasQuestionsParams): boolean {
    const lastToolCall = steps[steps.length - 1].toolResults.map(result => conversationUtils.extractQuestionFromToolResult({
        toolName: result.toolName,
        input: result.input as Record<string, unknown> | undefined,
        output: result.output as Record<string, unknown> | undefined,
    })).flatMap(question => question);

    if (lastToolCall.length > 0) {
        logger.info({
            sessionId: session.id,
            questionsCount: lastToolCall.length,
        }, '[QuickService] Stopping agent because user has questions to answer');
        return true;
    }

    return false;
}


type HasQuestionsParams = {
    session: Pick<Session, 'id' | 'source'>;
    steps: Array<StepResult<ToolSet>>;
}
