/**
 * How the honeycomb and the wandering bees talk to each other.
 * The honeycomb asks for a bee with a task. One wandering bee flies over, works, and flies away again.
 * Tapping the jar disturbs every bee, including the one that is working.
 */
export const BEE_TASK = 'nudge-bee-task';
export const BEES_DISTURB = 'nudge-bees-disturb';

export interface BeeTask {
  /** Where to hover, in page coordinates. Asked for again on every frame so it follows the layout. */
  target: () => { x: number; y: number };
  /** How long the bee works once it has landed, in milliseconds. */
  work: number;
  onArrive: () => void;
  onDone: () => void;
  /** The bee was disturbed before it finished. */
  onAbort: () => void;
}

export interface BeeRequest {
  task: BeeTask;
  /** Set to true by the swarm if a bee took the task. */
  accepted: boolean;
}
