import type { Node, Edge } from '@xyflow/react';
import type { FlowEdgeData, FlowNodeData, SemanticLevel } from '@/types/graph';

const MASTER_NODES: Node<FlowNodeData>[] = [
  {
    id: 'svc-order',
    type: 'flowNode',
    position: { x: 320, y: 20 },
    data: {
      kind: 'service',
      semanticLevel: 1,
      businessName: 'Order Service',
      businessDescription: 'Owns order lifecycle from request intake through persistence and event publication.',
      technicalName: 'com.flow.order.OrderService',
      avgDurationMs: 14,
      callsPerHour: 41600,
      errorRate: 0.4,
      status: 'healthy',
      usedInFlows: ['Create Order', 'Cancel Order', 'Get Order Details'],
      serviceGroup: 'order',
    },
  },
  {
    id: 'svc-payment',
    type: 'flowNode',
    position: { x: 740, y: 180 },
    data: {
      kind: 'service',
      semanticLevel: 1,
      businessName: 'Payment Service',
      businessDescription: 'Processes payment authorization, capture, retries, and payment failure handling.',
      technicalName: 'com.flow.payment.PaymentService',
      avgDurationMs: 120,
      callsPerHour: 12200,
      errorRate: 1.2,
      status: 'healthy',
      usedInFlows: ['Create Order'],
      serviceGroup: 'payment',
    },
  },
  {
    id: 'svc-inventory',
    type: 'flowNode',
    position: { x: -40, y: 220 },
    data: {
      kind: 'service',
      semanticLevel: 1,
      businessName: 'Inventory Service',
      businessDescription: 'Validates stock, reserves quantities, and releases reservation on timeout or cancellation.',
      technicalName: 'com.flow.inventory.InventoryService',
      avgDurationMs: 4,
      callsPerHour: 12847,
      errorRate: 4.1,
      status: 'degraded',
      usedInFlows: ['Create Order', 'Cancel Order'],
      serviceGroup: 'inventory',
    },
  },
  {
    id: 'svc-notify',
    type: 'flowNode',
    position: { x: 760, y: 460 },
    data: {
      kind: 'service',
      semanticLevel: 1,
      businessName: 'Notification Service',
      businessDescription: 'Consumes order events and triggers customer communications and internal analytics updates.',
      technicalName: 'com.flow.notify.NotificationService',
      avgDurationMs: 6,
      callsPerHour: 12200,
      errorRate: 0.2,
      status: 'healthy',
      usedInFlows: ['Create Order', 'Cancel Order'],
      serviceGroup: 'notify',
    },
  },

  // Level 2: entry points
  {
    id: 'ep-create',
    type: 'flowNode',
    position: { x: 320, y: -120 },
    data: {
      kind: 'endpoint',
      semanticLevel: 2,
      businessName: 'Create Order',
      businessDescription: 'Accepts a new order request from the customer through the REST API.',
      technicalName: 'OrderController.createOrder()',
      httpMethod: 'POST',
      path: '/api/orders',
      avgDurationMs: 22,
      callsPerHour: 12847,
      errorRate: 0.3,
      status: 'healthy',
      lastExecuted: '2 min ago',
      usedInFlows: ['Create Order'],
      isOnActivePath: true,
      serviceGroup: 'order',
    },
  },
  {
    id: 'ep-cancel',
    type: 'flowNode',
    position: { x: 120, y: -40 },
    data: {
      kind: 'endpoint',
      semanticLevel: 2,
      businessName: 'Cancel Order',
      businessDescription: 'Cancels an existing order and releases reserved inventory.',
      technicalName: 'OrderController.cancelOrder()',
      httpMethod: 'DELETE',
      path: '/api/orders/{id}',
      avgDurationMs: 15,
      callsPerHour: 342,
      errorRate: 0.5,
      status: 'healthy',
      usedInFlows: ['Cancel Order'],
      serviceGroup: 'order',
    },
  },
  {
    id: 'ep-get',
    type: 'flowNode',
    position: { x: 520, y: -40 },
    data: {
      kind: 'endpoint',
      semanticLevel: 2,
      businessName: 'Get Order Details',
      businessDescription: 'Retrieves order information including status, items, and payment details.',
      technicalName: 'OrderController.getOrder()',
      httpMethod: 'GET',
      path: '/api/orders/{id}',
      avgDurationMs: 3,
      callsPerHour: 28400,
      errorRate: 0.0,
      status: 'healthy',
      usedInFlows: ['Get Order Details'],
      serviceGroup: 'order',
    },
  },

  // Level 3: main business logic methods
  {
    id: 'svc-validate',
    type: 'flowNode',
    position: { x: 320, y: 120 },
    data: {
      kind: 'method',
      semanticLevel: 3,
      businessName: 'Validate Cart',
      businessDescription: 'Checks that all items in the cart are available in inventory and calculates the final price including tax.',
      technicalName: 'OrderService.validateCart()',
      signature: 'OrderService#validateCart(String):ValidationResult',
      avgDurationMs: 3,
      callsPerHour: 12847,
      errorRate: 0.1,
      status: 'healthy',
      usedInFlows: ['Create Order', 'Get Order Details'],
      isOnActivePath: true,
      serviceGroup: 'order',
    },
  },
  {
    id: 'svc-fraud',
    type: 'flowNode',
    position: { x: 320, y: 260 },
    data: {
      kind: 'method',
      semanticLevel: 3,
      businessName: 'Check Fraud Risk',
      businessDescription: 'Evaluates the order against fraud detection rules. Blocks suspicious orders before payment processing.',
      technicalName: 'FraudService.evaluateRisk()',
      signature: 'FraudService#evaluateRisk(Order):RiskScore',
      avgDurationMs: 8,
      callsPerHour: 12847,
      errorRate: 0.0,
      status: 'healthy',
      usedInFlows: ['Create Order'],
      isOnActivePath: true,
      serviceGroup: 'order',
    },
  },
  {
    id: 'meth-reserve',
    type: 'flowNode',
    position: { x: 80, y: 360 },
    data: {
      kind: 'method',
      semanticLevel: 3,
      businessName: 'Reserve Inventory',
      businessDescription: 'Locks requested quantity so other orders cannot claim the same stock.',
      technicalName: 'InventoryService.reserveStock()',
      signature: 'InventoryService#reserveStock(List<Item>):ReservationResult',
      avgDurationMs: 4,
      callsPerHour: 12847,
      errorRate: 4.1,
      status: 'degraded',
      usedInFlows: ['Create Order', 'Cancel Order'],
      isOnActivePath: true,
      serviceGroup: 'inventory',
    },
  },
  {
    id: 'meth-charge',
    type: 'flowNode',
    position: { x: 560, y: 360 },
    data: {
      kind: 'method',
      semanticLevel: 3,
      businessName: 'Process Payment',
      businessDescription: 'Charges card or wallet and returns structured payment result.',
      technicalName: 'PaymentService.charge()',
      signature: 'PaymentService#charge(PaymentRequest):PaymentResult',
      avgDurationMs: 120,
      callsPerHour: 12200,
      errorRate: 1.2,
      status: 'healthy',
      usedInFlows: ['Create Order'],
      isOnActivePath: true,
      serviceGroup: 'payment',
    },
  },

  // Level 4: infrastructure destinations
  {
    id: 'db-orders',
    type: 'flowNode',
    position: { x: 80, y: 520 },
    data: {
      kind: 'database',
      semanticLevel: 4,
      businessName: 'Save Order Record',
      businessDescription: 'Persists the completed order to the database for fulfillment processing.',
      technicalName: 'OrderRepository.save()',
      avgDurationMs: 2,
      callsPerHour: 12200,
      errorRate: 0.0,
      status: 'healthy',
      usedInFlows: ['Create Order', 'Cancel Order', 'Get Order Details'],
      isOnActivePath: true,
      serviceGroup: 'order',
    },
  },
  {
    id: 'topic-order',
    type: 'flowNode',
    position: { x: 560, y: 520 },
    data: {
      kind: 'topic',
      semanticLevel: 4,
      businessName: 'Publish Order Event',
      businessDescription: 'Sends order confirmation to downstream services including email and analytics.',
      technicalName: 'topic:order.events.v1',
      avgDurationMs: 1,
      callsPerHour: 12200,
      errorRate: 0.0,
      status: 'healthy',
      usedInFlows: ['Create Order', 'Cancel Order'],
      isOnActivePath: true,
      serviceGroup: 'notify',
    },
  },

  // Level 5: low-level implementation methods
  {
    id: 'meth-risk-rules',
    type: 'flowNode',
    position: { x: 460, y: 260 },
    data: {
      kind: 'method',
      semanticLevel: 5,
      businessName: 'Apply Rule Engine',
      businessDescription: 'Runs policy rules and calculates risk score buckets.',
      technicalName: 'RiskRulesEngine.applyPolicies()',
      signature: 'RiskRulesEngine#applyPolicies(Order):RuleResult',
      avgDurationMs: 3,
      callsPerHour: 12847,
      errorRate: 0.0,
      status: 'healthy',
      usedInFlows: ['Create Order'],
      isOnActivePath: true,
      serviceGroup: 'order',
    },
  },
  {
    id: 'meth-retry',
    type: 'flowNode',
    position: { x: 700, y: 360 },
    data: {
      kind: 'method',
      semanticLevel: 5,
      businessName: 'Handle Soft Decline Retry',
      businessDescription: 'Retries payment on transient gateway errors with bounded backoff.',
      technicalName: 'PaymentRetryPolicy.execute()',
      signature: 'PaymentRetryPolicy#execute(PaymentRequest):PaymentResult',
      avgDurationMs: 12,
      callsPerHour: 1250,
      errorRate: 0.3,
      status: 'healthy',
      usedInFlows: ['Create Order'],
      isOnActivePath: true,
      serviceGroup: 'payment',
    },
  },
];

const MASTER_EDGES: Edge<FlowEdgeData>[] = [
  // level 1 service map
  { id: 'e-s1', source: 'svc-order', target: 'svc-inventory', type: 'flowEdge', data: { semanticLevel: 1, callCount: 12847, edgeType: 'sync' } },
  { id: 'e-s2', source: 'svc-order', target: 'svc-payment', type: 'flowEdge', data: { semanticLevel: 1, callCount: 12200, edgeType: 'sync' } },
  { id: 'e-s3', source: 'svc-payment', target: 'svc-notify', type: 'flowEdge', data: { semanticLevel: 1, callCount: 12200, edgeType: 'kafka' } },

  // level 2+ flow entry edges
  { id: 'e1', source: 'ep-create', target: 'svc-validate', type: 'flowEdge', data: { semanticLevel: 2, isOnActivePath: true, edgeType: 'sync' } },
  { id: 'e2', source: 'svc-validate', target: 'svc-fraud', type: 'flowEdge', data: { semanticLevel: 3, isOnActivePath: true, edgeType: 'sync' } },
  { id: 'e3', source: 'svc-fraud', target: 'meth-reserve', type: 'flowEdge', data: { semanticLevel: 3, isOnActivePath: true, edgeType: 'sync' } },
  { id: 'e4', source: 'svc-fraud', target: 'meth-charge', type: 'flowEdge', data: { semanticLevel: 3, isOnActivePath: true, edgeType: 'async' } },
  { id: 'e5', source: 'meth-reserve', target: 'db-orders', type: 'flowEdge', data: { semanticLevel: 4, isOnActivePath: true, edgeType: 'db' } },
  { id: 'e6', source: 'meth-charge', target: 'topic-order', type: 'flowEdge', data: { semanticLevel: 4, isOnActivePath: true, edgeType: 'kafka' } },
  { id: 'e7', source: 'ep-cancel', target: 'meth-reserve', type: 'flowEdge', data: { semanticLevel: 2, edgeType: 'sync' } },
  { id: 'e8', source: 'ep-get', target: 'db-orders', type: 'flowEdge', data: { semanticLevel: 2, edgeType: 'db' } },

  // level 5 low-level branches
  { id: 'e9', source: 'svc-fraud', target: 'meth-risk-rules', type: 'flowEdge', data: { semanticLevel: 5, isOnActivePath: true, edgeType: 'sync' } },
  { id: 'e10', source: 'meth-charge', target: 'meth-retry', type: 'flowEdge', data: { semanticLevel: 5, edgeType: 'async' } },
];

export const zoomToSemanticLevel = (zoom: number): SemanticLevel => {
  if (zoom < 0.36) return 1;
  if (zoom < 0.56) return 2;
  if (zoom < 0.86) return 3;
  if (zoom < 1.15) return 4;
  return 5;
};

export const semanticLevelToZoom = (level: SemanticLevel): number => {
  const map: Record<SemanticLevel, number> = {
    1: 0.28,
    2: 0.46,
    3: 0.72,
    4: 1.0,
    5: 1.28,
  };
  return map[level];
};

export const getGraphForSemanticLevel = (level: SemanticLevel) => {
  const nodes = MASTER_NODES.filter((n) => n.data.semanticLevel <= level);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = MASTER_EDGES.filter((e) => {
    const edgeLevel = e.data?.semanticLevel ?? 1;
    return edgeLevel <= level && nodeIds.has(e.source) && nodeIds.has(e.target);
  });
  return { nodes, edges };
};

export const applyFocusToGraph = (
  graph: { nodes: Node<FlowNodeData>[]; edges: Edge<FlowEdgeData>[] },
  focusNodeId: string | null,
) => {
  if (!focusNodeId) return graph;
  const focusNode = graph.nodes.find((n) => n.id === focusNodeId);
  if (!focusNode) return graph;

  const neighbors = new Set<string>([focusNodeId]);
  for (const edge of graph.edges) {
    if (edge.source === focusNodeId || edge.target === focusNodeId) {
      neighbors.add(edge.source);
      neighbors.add(edge.target);
    }
  }

  const focusGroup = focusNode.data.serviceGroup;
  if (focusGroup) {
    for (const node of graph.nodes) {
      if (node.data.serviceGroup === focusGroup) neighbors.add(node.id);
    }
  }

  const nodes = graph.nodes.filter((n) => neighbors.has(n.id));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  return { nodes, edges };
};

export const sampleNodes = MASTER_NODES;
export const sampleEdges = MASTER_EDGES;
