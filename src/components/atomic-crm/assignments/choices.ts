export const STATUS_CHOICES = [
  { id: "todo", name: "resources.assignments.status.todo" },
  { id: "in_progress", name: "resources.assignments.status.in_progress" },
  { id: "done", name: "resources.assignments.status.done" },
];

export const PRIORITY_CHOICES = [
  { id: "low", name: "resources.assignments.priority.low" },
  { id: "medium", name: "resources.assignments.priority.medium" },
  { id: "high", name: "resources.assignments.priority.high" },
];

// Ordered by when they fall in the day, not alphabetically -- the My
// Week day view sorts tasks by this order.
export const TIME_BLOCK_CHOICES = [
  { id: "fajr_quran", name: "resources.assignments.time_block.fajr_quran" },
  { id: "morning_prep", name: "resources.assignments.time_block.morning_prep" },
  { id: "deep_work_1", name: "resources.assignments.time_block.deep_work_1" },
  { id: "sales_comm", name: "resources.assignments.time_block.sales_comm" },
  { id: "buffer", name: "resources.assignments.time_block.buffer" },
  { id: "deep_work_2", name: "resources.assignments.time_block.deep_work_2" },
  { id: "learning", name: "resources.assignments.time_block.learning" },
  { id: "exercise", name: "resources.assignments.time_block.exercise" },
  { id: "evening_personal", name: "resources.assignments.time_block.evening_personal" },
  { id: "evening_review", name: "resources.assignments.time_block.evening_review" },
];

export const TIME_BLOCK_ORDER: Record<string, number> = Object.fromEntries(
  TIME_BLOCK_CHOICES.map((choice, index) => [choice.id, index]),
);
