const { Sequelize, Op } = require('sequelize');
const inventoryService = require('../../services/inventoryService');
const { inventoryNotificationQueue } = require('../../queues/inventoryNotificationQueue');
const { Product, ProductVariant } = require('../../models/Product');

async function getLowStockDashboard(req, res) {
  try {
    const { threshold = 10, limit = 50, skip = 0 } = req.query;

    const parsedThreshold = Math.max(parseInt(threshold, 10) || 10, 1);
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedSkip = Math.max(parseInt(skip, 10) || 0, 0);

    const lowStockData = await inventoryService.getLowStockItems(parsedThreshold, {
      limit: parsedLimit,
      skip: parsedSkip,
      includeArchived: false,
    });

    const totalPages = Math.ceil(lowStockData.totalCount / parsedLimit) || 0;
    const currentPage = Math.floor(parsedSkip / parsedLimit) + 1;

    return res.status(200).json({
      status: 'success',
      threshold: parsedThreshold,
      count: lowStockData.items.length,
      totalCount: lowStockData.totalCount,
      page: currentPage,
      limit: parsedLimit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1 && totalPages > 0,
      data: lowStockData.items,
    });
  } catch (error) {
    console.error('getLowStockDashboard error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch low stock items',
    });
  }
}

async function getInventoryDashboard(req, res) {
  try {
    const [productsCount, totalVariants, mainStockSum, variantStockSum, statusRows, lowStockData] =
      await Promise.all([
        Product.count({ where: { status: { [Op.ne]: 'archived' } } }),
        ProductVariant.count(),
        Product.sum('stockQuantity', { where: { status: { [Op.ne]: 'archived' } } }),
        ProductVariant.sum('stockQuantity'),
        Product.findAll({
          attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
          group: ['status'],
          raw: true,
        }),
        inventoryService.getLowStockItems(10, { limit: 1 }),
      ]);

    const mainTotal = Number(mainStockSum) || 0;
    const variantTotal = Number(variantStockSum) || 0;

    const statusDistribution = (statusRows || []).reduce((acc, item) => {
      acc[item.status || 'unknown'] = parseInt(item.count, 10) || 0;
      return acc;
    }, {});

    return res.status(200).json({
      status: 'success',
      data: {
        totalProducts: productsCount,
        totalVariants: totalVariants || 0,
        totalStock: mainTotal + variantTotal,
        mainStock: mainTotal,
        variantStock: variantTotal,
        lowStockItemsCount: lowStockData.totalCount,
        statusDistribution,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('getInventoryDashboard error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inventory dashboard',
    });
  }
}

async function triggerLowStockNotification(req, res) {
  try {
    const { threshold = 10 } = req.body;

    if (!Number.isInteger(threshold) || threshold < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Threshold must be a positive integer',
      });
    }

    const job = await inventoryNotificationQueue.add(
      'low-stock-notification',
      {
        type: 'low-stock-check',
        threshold,
        triggeredBy: req.user?.id || req.user?._id,
        triggeredAt: new Date(),
      },
      {
        jobId: `low-stock-${Date.now()}`,
        removeOnComplete: true,
      }
    );

    return res.status(202).json({
      status: 'success',
      message: 'Low stock notification job queued',
      jobId: job.id,
      threshold,
    });
  } catch (error) {
    console.error('triggerLowStockNotification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to queue low stock notification',
    });
  }
}

async function scheduleRecurringLowStockCheck(req, res) {
  try {
    const { interval = '0 0 * * *', threshold = 10, enabled = true } = req.body;

    if (!interval || !interval.match(/^[0-9\s\*\-,/]+$/)) {
      return res.status(400).json({
        status: 'error',
        message:
          'Invalid cron interval. Use standard cron expression (e.g., "0 0 * * *" for daily at midnight)',
      });
    }

    if (!Number.isInteger(threshold) || threshold < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Threshold must be a positive integer',
      });
    }

    if (!enabled) {
      const jobs = await inventoryNotificationQueue.getJobs(['wait', 'delayed', 'repeat']);
      for (const job of jobs) {
        if (job.name === 'low-stock-notification' && job.repeatJobKey) {
          await job.remove();
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'Recurring low stock checks disabled',
      });
    }

    const job = await inventoryNotificationQueue.add(
      'low-stock-notification',
      {
        type: 'low-stock-check',
        threshold,
        isRecurring: true,
      },
      {
        repeat: {
          pattern: interval,
        },
        removeOnComplete: true,
        jobId: 'recurring-low-stock-check',
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Recurring low stock check scheduled',
      jobId: job.id,
      interval,
      threshold,
      note: 'Jobs will run according to the cron schedule',
    });
  } catch (error) {
    console.error('scheduleRecurringLowStockCheck error:', error);
    const message = error.message.includes('duplicate key')
      ? 'Recurring job already exists'
      : 'Failed to schedule recurring check';
    return res.status(500).json({
      status: 'error',
      message,
    });
  }
}

async function getNotificationStatus(req, res) {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      inventoryNotificationQueue.getWaitingCount(),
      inventoryNotificationQueue.getActiveCount(),
      inventoryNotificationQueue.getCompletedCount(),
      inventoryNotificationQueue.getFailedCount(),
      inventoryNotificationQueue.getDelayedCount(),
    ]);

    const recentJobs = await inventoryNotificationQueue.getJobs(['completed', 'failed'], 0, 10);

    return res.status(200).json({
      status: 'success',
      data: {
        queue: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + completed + failed + delayed,
        },
        recentJobs: await Promise.all(
          recentJobs.map(async (job) => ({
            id: job.id,
            name: job.name,
            state:
              typeof job.getState === 'function' ? await job.getState() : job.state || 'unknown',
            data: job.data,
            createdAt: job.createdTimestamp,
            failedReason: job.failedReason,
            progress: job.progress?.toString() || null,
          }))
        ),
      },
    });
  } catch (error) {
    console.error('getNotificationStatus error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notification status',
    });
  }
}

module.exports = {
  getLowStockDashboard,
  getInventoryDashboard,
  triggerLowStockNotification,
  scheduleRecurringLowStockCheck,
  getNotificationStatus,
};
