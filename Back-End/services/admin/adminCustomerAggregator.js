// services/admin/adminCustomerAggregator.js

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function formatCurrency(amount = 0) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function buildCustomerProfiles(users = [], orders = [], newsletterMap = new Map()) {
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

    if (userId) {
      for (const cust of customerMap.values()) {
        if (cust.userId === userId) {
          targetCustomer = cust;
          break;
        }
      }
    }

    if (!targetCustomer && orderEmail && customerMap.has(orderEmail)) {
      targetCustomer = customerMap.get(orderEmail);
    }

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

  return { allCustomers, metrics };
}

function filterAndSortCustomers(allCustomers, query = {}) {
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
    const dateA = a.latestOrderDate ? new Date(a.latestOrderDate) : (a.registeredAt ? new Date(a.registeredAt) : new Date(0));
    const dateB = b.latestOrderDate ? new Date(b.latestOrderDate) : (b.registeredAt ? new Date(b.registeredAt) : new Date(0));
    return dateB - dateA;
  });

  return { filtered, search, segment, sort };
}

module.exports = {
  normalizeEmail,
  formatCurrency,
  buildCustomerProfiles,
  filterAndSortCustomers,
};
