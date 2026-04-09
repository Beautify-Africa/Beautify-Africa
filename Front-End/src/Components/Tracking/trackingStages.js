export const TRACKING_STAGES = [
  {
    key: 'processing',
    label: 'Ritual Accepted',
    detail: 'Your order was confirmed and entered our fulfillment queue.',
  },
  {
    key: 'packed',
    label: 'Atelier Wrapped',
    detail: 'Every item was quality checked, packed, and sealed for dispatch.',
  },
  {
    key: 'shipped',
    label: 'Continental Route',
    detail: 'The shipment is with our courier and moving toward your city.',
  },
  {
    key: 'delivered',
    label: 'Doorstep Arrival',
    detail: 'Delivery is complete and your order reached its destination.',
  },
];

export function resolveTrackingStatus(order) {
  if (order?.isDelivered) return 'delivered';
  return order?.fulfillmentStatus || 'processing';
}

export function getTrackingStageIndex(status) {
  const index = TRACKING_STAGES.findIndex((stage) => stage.key === status);
  return index === -1 ? 0 : index;
}

export function getTrackingStage(order) {
  const status = resolveTrackingStatus(order);
  const index = getTrackingStageIndex(status);

  return {
    status,
    index,
    stage: TRACKING_STAGES[index],
  };
}
