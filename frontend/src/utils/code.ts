/**
 * 生成随机编码的工具函数
 */

/**
 * 生成客户编码
 * 格式: CUS + 时间戳(36进制) + 随机数
 */
export function generateCompanyCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `CUS${timestamp}${random}`
}

/**
 * 生成合同编号
 * 格式: CON + 时间戳(36进制) + 随机数
 */
export function generateContractCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `CON${timestamp}${random}`
}

/**
 * 生成服务编号
 * 格式: SVC + 时间戳(36进制) + 随机数
 */
export function generateServiceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `SVC${timestamp}${random}`
}

/**
 * 生成发票编号
 * 格式: INV + 时间戳(36进制) + 随机数
 */
export function generateInvoiceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `INV${timestamp}${random}`
}

/**
 * 生成收款编号
 * 格式: PAY + 时间戳(36进制) + 随机数
 */
export function generatePaymentCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PAY${timestamp}${random}`
}
