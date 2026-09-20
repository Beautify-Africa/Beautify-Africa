// services/adminCustomerService.js
const User = require('../models/User');
const { Order, OrderItem, OrderShippingAddress } = require('../models/Order');
const Newsletter = require('../models/Newsletter');

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function formatCurrency(amount = 0) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

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

  // Newsletter map
  const newsletterMap = new Map();
  for (const n of newsletters) {
    const norm = normalizeEmail(n.email);
    if (norm) {
      newsletterMap.set(norm, n);
    }
  }

  // Customer map keyed by normalized email
  const customerMap = new Map();

  // 1. Seed registered users
  for (const u of users) {
    const normEmail = normalizeEmail(u.email);
    if (!normEmail) continue;

    customerMap.set(normEmail, {
      id: u.id,
      userId: u.id,
      name: u.name || normEmail.split('@')[0],
      email: u.email,
      role: u.role || (u.isAdmin ? 'admin' : 'customer'),
      isAdmin: Boolean(u.isAdmin || u.role === 'admin'),
      isRegistered: true,
      registeredAt: u.createdAt,
      orders: [],
      shippingAddresses: [],
    });
  }

  // 2. Associate orders or create guest customer profiles
  for (const order of orders) {
    const shippingAddr = order.shippingAddress || {};
    const orderEmail = normalizeEmail(shippingAddr.email || order.paymentResultEmail);
    const userId = order.userId;

    let targetCustomer = null;

    // First try by registered user ID
    if (userId) {
      for (const cust of customerMap.values()) {
        if (cust.userId === userId) {
          targetCustomer = cust;
          break;
        }
      }
    }

    // Next try by email
    if (!targetCustomer && orderEmail && customerMap.has(orderEmail)) {
      targetCustomer = customerMap.get(orderEmail);
    }

    // Otherwise create guest entry if email exists
    if (!targetCustomer && orderEmail) {
      const guestName =
        [shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(' ') ||
        orderEmail.split('@')[0];

      targetCustomer = {
        id: `guest_${order.id.slice(0, 8)}`,
        userId: null,
        name: guestName,
        email: shippingAddr.email || orderEmail,
        role: 'customer',
        isAdmin: false,
        isRegistered: false,
        registeredAt: null,
        orders: [],
        shippingAddresses: [],
      };
      customerMap.set(orderEmail, targetCustomer);
    }

    if (targetCustomer) {
      targetCustomer.orders.push(order);
      if (shippingAddr.address && !targetCustomer.shippingAddresses.some((a) => a.address === shippingAddr.address)) {
        targetCustomer.shippingAddresses.push({
          firstName: shippingAddr.firstName || '',
          lastName: shippingAddr.lastName || '',
          address: shippingAddr.address || '',
          city: shippingAddr.city || '',
          country: shippingAddr.country || '',
          zip: shippingAddr.zip || '',
        });
      }
    }
  }

  // 3. Calculate statistics per customer
  const allCustomers = [];
  let globalRevenue = 0;
  let globalOrdersCount = 0;

  for (const cust of customerMap.values()) {
    const custOrders = cust.orders || [];
    const ordersCount = custOrders.length;
    globalOrdersCount += ordersCount;

    let totalSpend = 0;
    let latestOrderDate = null;
    let latestOrderStatus = null;
    let latestOrderIsPaid = null;

    if (ordersCount > 0) {
      // Sort orders descending by createdAt
      custOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      latestOrderDate = custOrders[0].createdAt;
      latestOrderStatus = custOrders[0].isDelivered ? 'delivered' : custOrders[0].fulfillmentStatus;
      latestOrderIsPaid = custOrders[0].isPaid;

      for (const ord of custOrders) {
        if (ord.fulfillmentStatus !== 'cancelled') {
          totalSpend += Number(ord.totalPrice || 0);
        }
      }
    }

    globalRevenue += totalSpend;
    const avgOrderValue = ordersCount > 0 ? totalSpend / ordersCount : 0;
    const normEmail = normalizeEmail(cust.email);
    const newsletterEntry = newsletterMap.get(normEmail);
    const isNewsletterSubscribed = Boolean(newsletterEntry && (newsletterEntry.isActive ?? true));
    const isVip = totalSpend >= 200 || ordersCount >= 3;

    allCustomers.push({
      id: cust.id,
      userId: cust.userId,
      name: cust.name,
      email: cust.email,
      role: cust.role,
      isAdmin: cust.isAdmin,
      isRegistered: cust.isRegistered,
      registeredAt: cust.registeredAt,
      ordersCount,
      totalSpend: formatCurrency(totalSpend),
      averageOrderValue: formatCurrency(avgOrderValue),
      latestOrderDate,
      latestOrderStatus,
      latestOrderIsPaid,
      isNewsletterSubscribed,
      isVip,
      shippingAddresses: cust.shippingAddresses,
    });
  }

  // 4. Calculate Telemetry KPIs
  const totalCustomers = allCustomers.length;
  const registeredCount = allCustomers.filter((c) => c.isRegistered).length;
  const guestCount = allCustomers.filter((c) => !c.isRegistered).length;
  const vipCount = allCustomers.filter((c) => c.isVip).length;
  const newsletterCount = allCustomers.filter((c) => c.isNewsletterSubscribed).length;
  const avgCustomerValue = totalCustomers > 0 ? globalRevenue / totalCustomers : 0;

  const metrics = {
    totalCustomers,
    registeredCustomers: registeredCount,
    guestCustomers: guestCount,
    totalOrders: globalOrdersCount,
    totalRevenue: formatCurrency(globalRevenue),
    averageCustomerValue: formatCurrency(avgCustomerValue),
    vipCustomers: vipCount,
    newsletterSubscribers: newsletterCount,
  };

  // 5. Apply Filter: Search
  let filtered = allCustomers;
  const search = String(query.search || '').trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        String(c.id).toLowerCase().includes(search)
    );
  }

  // 6. Apply Filter: Segment
  const segment = String(query.segment || 'all').trim().toLowerCase();
  if (segment === 'registered') {
    filtered = filtered.filter((c) => c.isRegistered);
  } else if (segment === 'guest') {
    filtered = filtered.filter((c) => !c.isRegistered);
  } else if (segment === 'vip') {
    filtered = filtered.filter((c) => c.isVip);
  } else if (segment === 'newsletter') {
    filtered = filtered.filter((c) => c.isNewsletterSubscribed);
  }

  // 7. Apply Sorting
  const sort = String(query.sort || 'recent').trim().toLowerCase();
  filtered.sort((a, b) => {
    if (sort === 'spent_desc') {
      return b.totalSpend - a.totalSpend;
    }
    if (sort === 'orders_desc') {
      return b.ordersCount - a.ordersCount;
    }
    if (sort === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    // Default: 'recent'
    const dateA = a.latestOrderDate ? new Date(a.latestOrderDate) : (a.registeredAt ? new Date(a.registeredAt) : new Date(0));
    const dateB = b.latestOrderDate ? new Date(b.latestOrderDate) : (b.registeredAt ? new Date(b.registeredAt) : new Date(0));
    return dateB - dateA;
  });

  // 8. Pagination
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

  // Search by UUID or by Email
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

  // Find all orders associated with this user or email
  const whereClauses = [];
  if (user) {
    whereClauses.push({ userId: user.id });
  }

  const allOrders = await Order.findAll({
    include: [
      { model: OrderShippingAddress, as: 'shippingAddress' },
      { model: OrderItem, as: 'orderItems' },
    ],
    order: [['createdAt', 'DESC']],
  });

  const matchingOrders = allOrders.filter((ord) => {
    if (user && ord.userId === user.id) return true;
    const shippingEmail = normalizeEmail(ord.shippingAddress?.email);
    if (shippingEmail && (shippingEmail === normalized || (user && shippingEmail === normalizeEmail(user.email)))) {
      return true;
    }
    return false;
  });

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
