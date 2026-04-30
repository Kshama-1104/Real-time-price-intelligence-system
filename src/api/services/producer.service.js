const logger = require('../../core/logger');
const brokerManager = require('../../core/broker/broker-manager');
const partitionAllocator = require('../../core/broker/partition-allocator');
const schemaService = require('./schema.service');
const { randomUUID } = require('crypto');

class ProducerService {
  async produce(topicName, eventData) {
    try {
      // Validate schema
      await schemaService.validate(topicName, eventData.value);

      // Allocate partition
      const partition = await partitionAllocator.allocate(topicName, eventData.key);

      // Create event
      const event = {
        id: randomUUID(),
        topic: topicName,
        partition,
        timestamp: new Date().toISOString(),
        key: eventData.key || null,
        value: eventData.value,
        headers: eventData.headers || {}
      };

      // Produce to broker
      await brokerManager.produce(topicName, partition, event);

      logger.info(`Event produced: ${event.id} to topic ${topicName} partition ${partition}`);
      return {
        id: event.id,
        topic: topicName,
        partition,
        offset: event.offset
      };
    } catch (error) {
      logger.error(`Error producing event to topic ${topicName}:`, error);
      throw error;
    }
  }

  async produceBatch(topicName, events) {
    try {
      const results = [];

      for (const eventData of events) {
        try {
          const result = await this.produce(topicName, eventData);
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      logger.info(`Batch produced to topic ${topicName}: ${results.filter(r => r.success).length} successful`);
      return {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      logger.error(`Error producing batch to topic ${topicName}:`, error);
      throw error;
    }
  }
}

module.exports = new ProducerService();

