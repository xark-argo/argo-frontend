class TaskQueue {
  queue: any[]

  running: boolean

  taskInterval: number

  constructor(taskIntervalMs = 3000) {
    this.queue = []
    this.running = false
    this.taskInterval = taskIntervalMs
  }

  addTask(task) {
    this.queue.push(task)
    this.runNextTask()
  }

  clearQueue() {
    this.queue = []
  }

  async runNextTask() {
    if (this.running || this.queue.length === 0) {
      return
    }

    this.running = true
    const task = this.queue.shift()
    try {
      await task()
    } catch (error) {
      console.error('Task failed', error)
    }
    this.running = false
    this.runNextTask()
  }
}

export default TaskQueue
