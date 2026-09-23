// services/adminCustomerService.js
const { Op } = require('sequelize');
const User = require('../models/User');
const { Order, OrderItem, OrderShippingAddress } = require('../models/Order');
const Newsletter = require('../models/Newsletter');
const {
  normalizeEmail,
  formatCurrency,
  buildCustomerProfiles,
  filterAndSortCustomers,
} = require('./admin/adminCustomerAggregator');

async function fetchAdminCustomers(query = {}) {
  const [users, orders, newsletters] = await Promise.all([
    User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isAdmin', 'createdAt', 'updatedAt'],
    }),
    Order.findAll({
      include: [
        { model: OrderShippingAddress, as: 'shippingAddress' },
        { model: OrderItem, as: 'orderItems' },
      ],
      order: [['createdAt', 'DESC']],
    }),
    Newsletter.findAll({
      attributes: ['email', 'isActive', 'createdAt'],
    }).catch(() => []),
  ]);

  const newsletterMap = new Map();
  for (const n of newsletters) {
    const norm = normalizeEmail(n.email);
    if (norm) {
      newsletterMap.set(norm, n);
    }
  }

  const { allCustomers, metrics } = buildCustomerProfiles(users, orders, newsletterMap);
  const { filtered, search, segment, sort } = filterAndSortCustomers(allCustomers, query);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedCustomers = filtered.slice(offset, offset + limit);

  return {
    metrics,
    customers: paginatedCustomers,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
    },
    filters: {
      search,
      segment,
      sort,
    },
  };
}

async function fetchAdminCustomerDetail(identifier) {
  if (!identifier) throw new Error('Customer identifier required');

  const normalized = normalizeEmail(identifier);

  let user = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  if (isUuid) {
    user = await User.findByPk(identifier, {
      attributes: ['id', 'name', 'email', 'role', 'isAdmin', 'createdAt', 'updatedAt'],
    });
  }
  if (!user) {
    user = await User.findOne({
      where: { email: normalized },
      attributes: ['id', 'name', 'email', 'role', 'isAdmin', 'createdAt', 'updatedAt'],
    });
  }

  const searchEmails = [normalized];
  if (user?.email) {
    searchEmails.push(normalizeEmail(user.email));
  }
  const uniqueEmails = [...new Set(searchEmails.filter(Boolean))];

  const shippingMatches = await OrderShippingAddress.findAll({
    where: {
      email: { [Op.in]: uniqueEmails },
    },
    attributes: ['orderId'],
    raw: true,
  });
  const emailOrderIds = shippingMatches.map((sa) => sa.orderId).filter(Boolean);

  const orConditions = [
    ...(user ? [{ userId: user.id }] : []),
    ...(emailOrderIds.length > 0 ? [{ id: { [Op.in]: emailOrderIds } }] : []),
  ];

  const matchingOrders =
    orConditions.length > 0
      ? await Order.findAll({
          where: { [Op.or]: orConditions },
          include: [
            { model: OrderShippingAddress, as: 'shippingAddress' },
            { model: OrderItem, as: 'orderItems' },
          ],
          order: [['createdAt', 'DESC']],
        })
      : [];

  const customerEmail = user ? user.email : normalized;
  const newsletterEntry = await Newsletter.findOne({
    where: { email: customerEmail },
  }).catch(() => null);

  const addresses = [];
  let totalSpend = 0;
  for (const ord of matchingOrders) {
    if (ord.fulfillmentStatus !== 'cancelled') {
      totalSpend += Number(ord.totalPrice || 0);
    }
    const a = ord.shippingAddress;
    if (a && a.address && !addresses.some((ex) => ex.address === a.address)) {
      addresses.push({
        firstName: a.firstName || '',
        lastName: a.lastName || '',
        address: a.address || '',
        city: a.city || '',
        country: a.country || '',
        zip: a.zip || '',
      });
    }
  }

  const name = user?.name || (addresses[0] ? `${addresses[0].firstName} ${addresses[0].lastName}`.trim() : customerEmail.split('@')[0]);
  const isVip = totalSpend >= 200 || matchingOrders.length >= 3;

  return {
    customer: {
      id: user?.id || identifier,
      name,
      email: customerEmail,
      role: user?.role || (user?.isAdmin ? 'admin' : 'customer'),
      isAdmin: Boolean(user?.isAdmin || user?.role === 'admin'),
      isRegistered: Boolean(user),
      registeredAt: user?.createdAt || null,
      isNewsletterSubscribed: Boolean(newsletterEntry && (newsletterEntry.isActive ?? true)),
      isVip,
      totalSpend: formatCurrency(totalSpend),
      ordersCount: matchingOrders.length,
      averageOrderValue: formatCurrency(matchingOrders.length > 0 ? totalSpend / matchingOrders.length : 0),
    },
    addresses,
    orders: matchingOrders.map((ord) => ({
      id: ord.id,
      createdAt: ord.createdAt,
      totalPrice: Number(ord.totalPrice || 0),
      currency: ord.currency || 'USD',
      isPaid: Boolean(ord.isPaid),
      paidAt: ord.paidAt,
      isDelivered: Boolean(ord.isDelivered),
      deliveredAt: ord.deliveredAt,
      fulfillmentStatus: ord.isDelivered ? 'delivered' : ord.fulfillmentStatus,
      paymentMethod: ord.paymentMethod,
      itemsCount: (ord.orderItems || []).reduce((acc, item) => acc + (item.qty || 1), 0),
      items: (ord.orderItems || []).map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        image: item.image,
      })),
      shippingAddress: ord.shippingAddress,
    })),
  };
}

module.exports = {
  fetchAdminCustomers,
  fetchAdminCustomerDetail,
};
