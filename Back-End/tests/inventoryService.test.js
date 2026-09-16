jest.mock('../models/Product', () => ({
  Product: {
    findByPk: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
  ProductVariant: {
    update: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../models/InventoryLedger', () => ({
  recordMovement: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
}));

const { Product, ProductVariant } = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');
const {
  processPurchase,
  processReturn,
  adjustStock,
  getCurrentStock,
  getLowStockItems,
} = require('../services/inventoryService');

describe('inventoryService', () => {
  const validProductId = 'a111a111-a111-a111-a111-a111a111a111';
  const validVariantId = 'b222b222-b222-b222-b222-b222b222b222';
  const validOrderId = 'c333c333-c333-c333-c333-c333c333c333';
  const validUserId = 'd444d444-d444-d444-d444-d444d444d444';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPurchase', () => {
    test('successfully deducts inventory and records ledger movement on purchase', async () => {
      Product.findByPk.mockResolvedValue({
        id: validProductId,
        name: 'African Black Soap',
        stockQuantity: 20,
        variants: [],
      });

      Product.update.mockResolvedValue([1]);
      InventoryLedger.recordMovement.mockResolvedValue({ id: 'ledger-101' });

      const result = await processPurchase(validProductId, null, 5, validOrderId, validUserId);

      expect(result).toMatchObject({
        productId: validProductId,
        stockBefore: 20,
        stockAfter: 15,
        adjustment: -5,
        ledgerId: 'ledger-101',
      });

      expect(Product.update).toHaveBeenCalledWith(
        { stockQuantity: 15, inStock: true },
        expect.any(Object)
      );

      expect(InventoryLedger.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          product: validProductId,
          type: 'purchase',
          quantity: -5,
          stockBefore: 20,
          stockAfter: 15,
          relatedOrder: validOrderId,
        }),
        expect.any(Object)
      );
    });

    test('marks inStock as false when stock drops to exactly 0', async () => {
      Product.findByPk.mockResolvedValue({
        id: validProductId,
        name: 'African Black Soap',
        stockQuantity: 3,
        variants: [],
      });

      Product.update.mockResolvedValue([1]);
      InventoryLedger.recordMovement.mockResolvedValue({ id: 'ledger-102' });

      const result = await processPurchase(validProductId, null, 3, validOrderId, validUserId);

      expect(result.stockAfter).toBe(0);
      expect(Product.update).toHaveBeenCalledWith(
        { stockQuantity: 0, inStock: false },
        expect.any(Object)
      );
    });

    test('rejects purchase when requested quantity exceeds available stock', async () => {
      Product.findByPk.mockResolvedValue({
        id: validProductId,
        name: 'African Black Soap',
        stockQuantity: 2,
        variants: [],
      });

      await expect(
        processPurchase(validProductId, null, 5, validOrderId, validUserId)
      ).rejects.toThrow(/would result in negative quantity/i);

      expect(Product.update).not.toHaveBeenCalled();
      expect(InventoryLedger.recordMovement).not.toHaveBeenCalled();
    });

    test('deducts stock from specific product variant when variantId is provided', async () => {
      Product.findByPk.mockResolvedValue({
        id: validProductId,
        name: 'African Black Soap',
        variants: [
          {
            id: validVariantId,
            sku: 'SOAP-200G',
            stockQuantity: 10,
          },
        ],
      });

      ProductVariant.update.mockResolvedValue([1]);
      ProductVariant.findAll.mockResolvedValue([{ stockQuantity: 8 }]);
      Product.update.mockResolvedValue([1]);
      InventoryLedger.recordMovement.mockResolvedValue({ id: 'ledger-103' });

      const result = await processPurchase(
        validProductId,
        validVariantId,
        2,
        validOrderId,
        validUserId
      );

      expect(result).toMatchObject({
        productId: validProductId,
        variantId: validVariantId,
        sku: 'SOAP-200G',
        stockBefore: 10,
        stockAfter: 8,
        adjustment: -2,
      });

      expect(ProductVariant.update).toHaveBeenCalledWith(
        { stockQuantity: 8, inStock: true },
        expect.any(Object)
      );
    });
  });

  describe('processReturn', () => {
    test('successfully restores inventory on order return/cancellation', async () => {
      Product.findByPk.mockResolvedValue({
        id: validProductId,
        name: 'African Black Soap',
        stockQuantity: 5,
        variants: [],
      });

      Product.update.mockResolvedValue([1]);
      InventoryLedger.recordMovement.mockResolvedValue({ id: 'ledger-104' });

      const result = await processReturn(
        validProductId,
        null,
        2,
        validOrderId,
        'Customer changed mind',
        validUserId
      );

      expect(result).toMatchObject({
        productId: validProductId,
        stockBefore: 5,
        stockAfter: 7,
        adjustment: 2,
        ledgerId: 'ledger-104',
      });

      expect(Product.update).toHaveBeenCalledWith(
        { stockQuantity: 7, inStock: true },
        expect.any(Object)
      );

      expect(InventoryLedger.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          product: validProductId,
          type: 'return',
          quantity: 2,
          stockBefore: 5,
          stockAfter: 7,
          relatedOrder: validOrderId,
        }),
        expect.any(Object)
      );
    });
  });

  describe('getCurrentStock', () => {
    test('returns stock for standalone product', async () => {
      Product.findByPk.mockResolvedValue({ stockQuantity: 42 });

      const stock = await getCurrentStock(validProductId);
      expect(stock).toBe(42);
      expect(Product.findByPk).toHaveBeenCalledWith(validProductId, {
        attributes: ['stockQuantity'],
        raw: true,
      });
    });

    test('returns stock for product variant', async () => {
      ProductVariant.findOne.mockResolvedValue({ stockQuantity: 18 });

      const stock = await getCurrentStock(validProductId, validVariantId);
      expect(stock).toBe(18);
      expect(ProductVariant.findOne).toHaveBeenCalledWith({
        where: { id: validVariantId, productId: validProductId },
        raw: true,
      });
    });
  });

  describe('getLowStockItems', () => {
    test('filters and lists items below stock threshold', async () => {
      Product.findAll.mockResolvedValue([
        {
          id: validProductId,
          name: 'Rare Botanical Cream',
          stockQuantity: 3,
          status: 'active',
          variants: [],
        },
      ]);
      Product.count.mockResolvedValue(1);

      const result = await getLowStockItems(5);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        type: 'main',
        productId: validProductId,
        productName: 'Rare Botanical Cream',
        stock: 3,
        threshold: 5,
      });
    });
  });

  describe('input validation', () => {
    test('throws for invalid UUID', async () => {
      await expect(adjustStock('invalid-uuid', null, 5, 'restock')).rejects.toThrow(
        'Invalid product ID'
      );
    });

    test('throws for delta of zero', async () => {
      await expect(adjustStock(validProductId, null, 0, 'restock')).rejects.toThrow(
        'Delta must be a non-zero integer'
      );
    });

    test('throws when reason is missing', async () => {
      await expect(adjustStock(validProductId, null, 5, '')).rejects.toThrow('Reason is required');
    });
  });
});
