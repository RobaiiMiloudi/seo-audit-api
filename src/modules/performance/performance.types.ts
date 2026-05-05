export interface PerformanceReport {
  performanceScore: number;
  speedIndex: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}
