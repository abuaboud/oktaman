import { z } from "zod"

export enum TodoStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed"
}

export const Todo = z.object({
    id: z.string(),
    content: z.string().describe("The task description"),
    status: z.nativeEnum(TodoStatus),
    created: z.coerce.date(),
    updated: z.coerce.date(),
})

export type Todo = z.infer<typeof Todo>

export const TodoList = z.array(Todo)
export type TodoList = z.infer<typeof TodoList>
