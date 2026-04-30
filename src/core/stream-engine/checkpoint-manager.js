const logger = require('../logger');

class CheckpointManager {
  constructor() {
    this.checkpoints = new Map();
  }

  async save(consumerGroup, topic, partition, offset) {
    try {
      const key = `${consumerGroup}:${topic}:${partition}`;
      this.checkpoints.set(key, {
        consumerGroup,
        topic,
        partition,
        offset,
        timestamp: new Date()
      });
      logger.debug(`Checkpoint saved: ${key} = ${offset}`);
      return true;
    } catch (error) {
      logger.error('Error saving checkpoint:', error);
      throw error;
    }
  }

  async get(consumerGroup, topic) {
    try {
      const checkpoints = [];
      for (const checkpoint of this.checkpoints.values()) {
        if (checkpoint.consumerGroup === consumerGroup && checkpoint.topic === topic) {
          checkpoints.push(checkpoint);
        }
      }
      return checkpoints;
    } catch (error) {
      logger.error('Error getting checkpoint:', error);
      throw error;
    }
  }

  async getOffset(consumerGroup, topic, partition) {
    const key = `${consumerGroup}:${topic}:${partition}`;
    const checkpoint = this.checkpoints.get(key);
    return checkpoint ? checkpoint.offset : 0;
  }
}

module.exports = new CheckpointManager();

