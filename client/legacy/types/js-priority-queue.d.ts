declare module "js-priority-queue" {
  type Comparator<T> = (a: T, b: T) => number;

  type PriorityQueueOptions<T> = {
    comparator?: Comparator<T>;
  };

  export default class PriorityQueue<T> {
    constructor(options?: PriorityQueueOptions<T>);
    queue(item: T): void;
    dequeue(): T;
    peek(): T;
    readonly length: number;
  }
}
