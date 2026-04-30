const logger = require('../../core/logger');
const windowProcessor = require('../../core/stream-engine/window-processor');
const stateStore = require('../../core/stream-engine/state-store');
const eventRouter = require('../../core/stream-engine/event-router');

class StreamProcessorService {
  async process(events, pipeline) {
    try {
      let processed = events;

      // Apply transformations
      for (const step of pipeline.steps) {
        switch (step.type) {
          case 'filter':
            processed = this.filter(processed, step.condition);
            break;
          case 'map':
            processed = this.map(processed, step.function);
            break;
          case 'aggregate':
            processed = await this.aggregate(processed, step);
            break;
          case 'window':
            processed = await windowProcessor.process(processed, step);
            break;
          case 'route':
            processed = await eventRouter.route(processed, step);
            break;
        }
      }

      logger.info(`Processed ${events.length} events through pipeline`);
      return processed;
    } catch (error) {
      logger.error('Error processing stream:', error);
      throw error;
    }
  }

  filter(events, condition) {
    return events.filter(event => {
      // Evaluate condition
      return this.evaluateCondition(condition, event);
    });
  }

  map(events, mapper) {
    return events.map(event => {
      // Apply mapper function
      return mapper(event);
    });
  }

  async aggregate(events, config) {
    const state = await stateStore.get(config.stateKey);
    const aggregated = this.performAggregation(events, config, state);
    await stateStore.set(config.stateKey, aggregated);
    return aggregated;
  }

  performAggregation(events, config, state) {
    switch (config.operation) {
      case 'count':
        return (state?.count || 0) + events.length;
      case 'sum': {
        const sum = events.reduce((acc, e) => acc + (e.value[config.field] || 0), 0);
        return (state?.sum || 0) + sum;
      }
      case 'average': {
        const total = (state?.total || 0) + events.length;
        const sum2 = (state?.sum || 0) + events.reduce((acc, e) => acc + (e.value[config.field] || 0), 0);
        return sum2 / total;
      }
      default:
        return state;
    }
  }

  evaluateCondition(condition, event) {
    // Simplified condition evaluation
    try {
      const func = new Function('event', `return ${condition}`);
      return func(event);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new StreamProcessorService();

