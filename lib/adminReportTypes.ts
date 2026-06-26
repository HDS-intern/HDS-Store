export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom'

export type SalesPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type ReportSummary = {
  totalSales: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  averageOrderValue: number
  totalProductsSold: number
  cancelledOrders: number
  returnedOrders: number
  pendingOrders: number
}

export type SalesByPeriodRow = {
  period: string
  sales: number
  orders: number
  units: number
}

export type OrderStatusRow = {
  status: string
  count: number
  revenue: number
}

export type ProductSalesRow = {
  productName: string
  sku: string
  quantitySold: number
  revenue: number
  stockRemaining: number
}

export type CategorySalesRow = {
  category: string
  sales: number
  orders: number
}

export type CustomerSalesRow = {
  customerName: string
  orders: number
  totalPurchase: number
  lastPurchaseDate: string
}

export type PaymentMethodRow = {
  method: string
  sales: number
  orders: number
}

export type CouponRow = {
  coupon: string
  uses: number
  discountGiven: number
  salesGenerated: number
}

export type TaxReport = {
  gstCollected: number
  cgst: number
  sgst: number
  igst: number
  taxableAmount: number
}

export type ShippingReport = {
  shippingCharges: number
  provider: string
  deliveredOrders: number
  returnedShipments: number
}

export type TopProductRow = {
  rank: number
  productName: string
  sku: string
  quantitySold: number
  revenue: number
  orders: number
}

export type LowProductRow = {
  productName: string
  sku: string
  quantitySold: number
  revenue: number
  stock: number
}

export type ProfitReport = {
  grossProfit: number
  netProfit: number
  profitMargin: number
  revenue: number
  productCost: number
  shippingCost: number
  discounts: number
  taxes: number
}

export type ComparisonReport = {
  label: string
  currentRevenue: number
  previousRevenue: number
  currentOrders: number
  previousOrders: number
  revenueChangePct: number
  ordersChangePct: number
}

export type OrderDetailRow = {
  orderId: string
  customer: string
  products: string
  quantity: number
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  orderDate: string
  paymentMethod: string
}

export type ChartPoint = {
  label: string
  revenue: number
}

export type ChartValue = {
  label: string
  value: number
}

export type AdminReportPayload = {
  generatedAt: string
  dateRange: {
    start: string
    end: string
    label: string
  }
  summary: ReportSummary
  salesByPeriod: SalesByPeriodRow[]
  orderStatusBreakdown: OrderStatusRow[]
  productSales: ProductSalesRow[]
  categorySales: CategorySalesRow[]
  customerSales: CustomerSalesRow[]
  paymentMethods: PaymentMethodRow[]
  coupons: CouponRow[]
  tax: TaxReport
  shipping: ShippingReport
  topProducts: TopProductRow[]
  lowProducts: LowProductRow[]
  profit: ProfitReport
  comparison: ComparisonReport
  orderDetails: OrderDetailRow[]
  chartSeries: {
    salesOverTime: ChartPoint[]
    categoryPie: ChartValue[]
    paymentDonut: ChartValue[]
    monthlyBars: ChartPoint[]
  }
}
