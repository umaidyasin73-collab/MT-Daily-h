export interface Entry {
  id: string;
  date: string;
  name: string;
  amount: number;
  type: 'sale' | 'received' | 'payment';
}

export type BackgroundStyle = 'aurora' | 'particles' | 'bokeh' | 'none';

export type Language = 'en' | 'ur';

export interface TranslationSet {
  title: string;
  subtitle: string;
  dateLabel: string;
  prevMonth: string;
  nextMonth: string;
  ovSale: string;
  ovReceived: string;
  ovPayment: string;
  tabSale: string;
  tabReceived: string;
  tabPayment: string;
  tabSummary: string;
  tabManageCities: string;
  addSaleTitle: string;
  addReceivedTitle: string;
  addPaymentTitle: string;
  branchName: string;
  receivedFrom: string;
  paidTo: string;
  amountPlaceholder: string;
  addBtn: string;
  errorRequired: string;
  downloadBtn: string;
  previousAmount: string;
  previousNote: string;
  tableSNo: string;
  tableName: string;
  tableAmount: string;
  tableActions: string;
  tableEmpty: string;
  historyTitle: string;
  historyDate: string;
  historyTotal: string;
  historyPrev: string;
  historyGrandTotal: string;
  manageCitiesTitle: string;
  manageCitiesSubtitle: string;
  cityInputLabel: string;
  cityCountLabel: string;
  citySearchPlaceholder: string;
  cityErrorEmpty: string;
  cityErrorExists: string;
  summaryTitle: string;
  summaryDate: string;
  summaryGrandTotalSale: string;
  summaryGrandTotalReceived: string;
  summaryGrandTotalPayment: string;
  languageSelect: string;
  bgSelect: string;
  toastAdded: string;
  toastDeleted: string;
  toastCityAdded: string;
  toastCityDeleted: string;
}
