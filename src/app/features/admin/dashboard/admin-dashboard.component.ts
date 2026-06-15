import { Component, Directive, ElementRef, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

@Directive({
  selector: '[appAnimatedNumber]'
})
export class AnimatedNumberDirective implements OnInit {
  @Input() appAnimatedNumber: number | string = 0;
  @Input() duration: number = 1200;
  @Input() suffix: string = '';
  @Input() prefix: string = '';
  @Input() isDecimal: boolean = false;

  constructor(private el: ElementRef) { }

  ngOnInit() {
    this.animateValue();
  }

  animateValue() {
    let targetStr = String(this.appAnimatedNumber);
    let target = parseFloat(targetStr.replace(/[^\d.-]/g, ''));
    if (isNaN(target)) target = 0;

    let inputSuffix = '';
    if (targetStr.toLowerCase().endsWith('k')) inputSuffix = 'K';
    else if (targetStr.toLowerCase().endsWith('l')) inputSuffix = 'L';
    else if (targetStr.toLowerCase().endsWith('m')) inputSuffix = 'M';

    const start = 0;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / this.duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      let currentVal = ease * (target - start) + start;
      if (!this.isDecimal) currentVal = Math.floor(currentVal);
      let displayValue = this.isDecimal ? currentVal.toFixed(1) : currentVal.toLocaleString();
      this.el.nativeElement.innerHTML = `${this.prefix}${displayValue}${inputSuffix}${this.suffix}`;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent implements OnInit {
  public currentPeriod: string = '7d';
  public apiError: string | null = null;
  public greeting: string = '';
  public userName: string = '';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setGreeting();
    this.loadDashboardData(this.currentPeriod);
  }

  private setGreeting(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name || 'User';
    }
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }

  onPeriodChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.currentPeriod = selectElement.value;
    this.loadDashboardData(this.currentPeriod);
  }

  loadDashboardData(period: string): void {
    this.apiError = null;

    // KPI
    this.dashboardService.getKpiData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] KPI full data:', JSON.stringify(res?.data));
        if (res && res.data) {
          // try every likely key name the backend might use
          const rawCards: any[] =
            res.data.summaryCards ??
            res.data.cards ??
            res.data.kpiCards ??
            res.data.kpis ??
            res.data.metrics ??
            (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(rawCards) && rawCards.length > 0) {
            console.log('[Dashboard] KPI card[0] keys:', Object.keys(rawCards[0]));
            this.summaryCards = rawCards.map((c: any) => ({
              ...c,
              value: String(c.value ?? c.count ?? c.total ?? 0),
              title: c.title ?? c.label ?? c.name ?? '',
              trend: c.trend ?? c.trendText ?? c.change ?? '',
              trendColor: c.trendColor ?? c.color ?? '#198754',
              chartOptions: this.createSparkline(c.chartData || c.sparkline || c.data || [], c.trendColor ?? c.color ?? '#198754')
            }));
          } else {
            console.warn('[Dashboard] KPI: no cards found in response. Available keys:', Object.keys(res.data));
          }
        }
      },
      error: (err) => {
        console.error('Failed to load KPI data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });

    // Students
    this.dashboardService.getStudentsData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] Students data keys:', res?.data ? Object.keys(res.data) : res);
        if (res?.data?.topCountries?.[0]) console.log('[Dashboard] topCountries[0] keys:', Object.keys(res.data.topCountries[0]));
        if (res?.data?.statusBreakdown?.[0]) console.log('[Dashboard] statusBreakdown[0] keys:', Object.keys(res.data.statusBreakdown[0]));
        if (res && res.data) {
          if (Array.isArray(res.data.statusBreakdown)) {
            this.statusBreakdown = res.data.statusBreakdown.map((s: any) => ({
              ...s,
              label: s.label ?? s.name ?? s.status ?? '',
              value: s.value ?? s.count ?? 0,
              percent: s.percent ?? s.percentage ?? 0,
              fill: s.fill ?? s.percent ?? s.percentage ?? 0
            }));
          }
          if (Array.isArray(res.data.topCountries)) {
            this.topCountries = res.data.topCountries.map((c: any) => ({
              ...c,
              rank: c.rank ?? '',
              name: c.name ?? c.country ?? '',
              stats: c.stats ?? (c.students !== undefined ? `${c.students} Students · ${c.converted || 0} Converted` : ''),
              revenue: c.revenue ?? c.conversionRate ?? ''
            }));
          }
          if (Array.isArray(res.data.acquisitionFunnel)) {
            const funnelData = res.data.acquisitionFunnel.map((item: any) => {
              if (typeof item === 'number') return { value: item };
              return {
                ...item,
                value: item.value ?? item.count ?? item.total ?? 0,
                name: item.name ?? item.status ?? item.label ?? ''
              };
            });
            this.acquisitionFunnelOptions = {
              ...this.acquisitionFunnelOptions,
              series: [{ ...(this.acquisitionFunnelOptions.series as any)[0], data: funnelData }]
            };
          }
          if (Array.isArray(res.data.referralCompany)) {
            const refData = res.data.referralCompany.map((item: any) => {
              if (typeof item === 'number') return { value: item, name: '' };
              return {
                ...item,
                value: item.value ?? item.count ?? item.total ?? 0,
                name: item.name ?? item.label ?? item.title ?? ''
              };
            });
            this.referralCompanyOptions = {
              ...this.referralCompanyOptions,
              series: [{ ...(this.referralCompanyOptions.series as any)[0], data: refData }]
            };
            this.referralCompanyLegends = refData.map((item: any) => ({
              name: item.name || '',
              value: item.value || 0,
              color: item.itemStyle?.color || item.color || '#cccccc'
            }));
          }
          if (res.data.intakeCountrySeries) {
            this.intakeCountryOptions = {
              ...this.intakeCountryOptions,
              series: res.data.intakeCountrySeries
            };
          }
        }
      },
      error: (err) => {
        console.error('Failed to load Students data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });

    // Financial
    this.dashboardService.getFinancialData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] Financial data keys:', res?.data ? Object.keys(res.data) : res);
        if (res?.data?.financialMetrics?.[0]) console.log('[Dashboard] financialMetrics[0] keys:', Object.keys(res.data.financialMetrics[0]));
        if (res?.data?.topPayingEntities?.[0]) console.log('[Dashboard] topPayingEntities[0] keys:', Object.keys(res.data.topPayingEntities[0]));
        if (res?.data?.openDisputes?.[0]) console.log('[Dashboard] openDisputes[0] keys:', Object.keys(res.data.openDisputes[0]));
        if (res && res.data) {
          if (Array.isArray(res.data.financialMetrics)) {
            this.financialMetrics = res.data.financialMetrics.map((m: any) => ({
              ...m,
              label: m.label ?? m.name ?? m.title ?? '',
              value: m.value ?? m.amount ?? '',
              borderColor: m.borderColor ?? m.color ?? '#c8cdd5'
            }));
          }
          if (Array.isArray(res.data.topPayingEntities)) {
            this.topPayingEntities = res.data.topPayingEntities.map((ent: any) => ({
              ...ent,
              entity: ent.entity ?? ent.name ?? ent.title ?? '',
              type: ent.type ?? ent.category ?? '',
              amount: ent.amount ?? ent.value ?? ent.revenue ?? '',
              status: ent.status ?? ent.state ?? '',
              last: ent.lastActivity ?? ent.last ?? ent.date ?? ent.time ?? ent.lastPayment ?? ent.days ?? ent.updatedAt ?? ''
            }));
          }
          if (Array.isArray(res.data.openDisputes)) {
            this.openDisputes = res.data.openDisputes.map((disp: any) => ({
              ...disp,
              title: disp.title ?? disp.name ?? disp.entity ?? '',
              amount: disp.amount ?? disp.value ?? '',
              sub1: disp.sub1 ?? disp.reason ?? disp.type ?? disp.description ?? '',
              sub2: disp.sub2 ?? disp.date ?? disp.status ?? disp.last ?? ''
            }));
          }

          // Map paymentDistLegends defensively
          let finalLegends: any[] = [];

          const rawLegends = res.data.paymentDistLegends;
          const hasValidLegends = Array.isArray(rawLegends) && rawLegends.length > 0 &&
            rawLegends.some(leg => leg && (leg.label || leg.name || leg.title || leg.percent || leg.value));

          if (hasValidLegends) {
            finalLegends = rawLegends.map((leg: any) => {
              if (!leg) return { label: '', percent: '', color: '#cccccc' };
              return {
                ...leg,
                label: leg.label ?? leg.name ?? leg.title ?? '',
                percent: leg.percent ?? leg.value ?? '',
                color: leg.color ?? leg.itemStyle?.color ?? '#cccccc'
              };
            });
          } else if (Array.isArray(res.data.paymentDistribution) && res.data.paymentDistribution.length > 0) {
            // Auto-generate if missing, empty, or missing text
            const dist = res.data.paymentDistribution;
            const total = dist.reduce((sum: number, item: any) => sum + (Number(item?.value) || 0), 0);
            finalLegends = dist.map((item: any) => {
              if (!item) return { label: '', percent: '', color: '#cccccc' };
              return {
                label: item.name || '',
                percent: total > 0 ? ((Number(item.value) / total) * 100).toFixed(1) + '%' : (item.value ? item.value + '%' : ''),
                color: item.itemStyle?.color || item.color || '#cccccc'
              };
            });
          }
          this.paymentDistLegends = finalLegends;

          if (res.data.paymentsStatusSeries) {
            this.paymentsStatusOptions = {
              ...this.paymentsStatusOptions,
              series: res.data.paymentsStatusSeries
            };
          }
          if (res.data.paymentDistribution) {
            this.paymentDistributionOptions = {
              ...this.paymentDistributionOptions,
              series: [{ ...(this.paymentDistributionOptions.series as any)[0], data: res.data.paymentDistribution }]
            };
          }
        }
      },
      error: (err) => {
        console.error('Failed to load Financial data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });

    // Tasks
    this.dashboardService.getTasksData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] Tasks data keys:', res?.data ? Object.keys(res.data) : res);
        if (res?.data?.overdueTasks?.[0]) console.log('[Dashboard] overdueTasks[0] keys:', Object.keys(res.data.overdueTasks[0]));
        if (res && res.data) {
          if (Array.isArray(res.data.openDisputes)) this.openDisputes = res.data.openDisputes;
          if (Array.isArray(res.data.overdueTasks)) {
            this.overdueTasks = res.data.overdueTasks.map((t: any) => ({
              ...t,
              task: t.task ?? t.title ?? t.name ?? '',
              assignee: t.assignee ?? t.user ?? '',
              due: t.due ?? t.dueDate ?? t.date ?? '',
              priority: t.priority ?? t.level ?? '',
              priColor: t.priColor ?? t.priorityColor ?? t.color ?? '#dc3545',
              priBg: t.priBg ?? t.priorityBg ?? (t.priColor || t.priorityColor || t.color ? (t.priColor || t.priorityColor || t.color) + '22' : '#dc354522'),
              late: t.late ?? (t.daysLate != null ? `${t.daysLate}d` : null) ?? t.days ?? ''
            }));
          }
          const hm = res.data.priorityHeatmap;
          if (Array.isArray(hm)) {
            const grouped = hm.reduce((acc: any, curr: any) => {
              const status = curr.status ?? curr.name ?? curr.label ?? 'UNKNOWN';
              if (!acc[status]) {
                acc[status] = { status, low: 0, med: 0, high: 0 };
              }

              if (curr.priority) {
                const p = curr.priority.toLowerCase();
                const val = Number(curr.count) || Number(curr.value) || 0;
                if (p === 'low') acc[status].low += val;
                else if (p === 'medium' || p === 'med') acc[status].med += val;
                else if (p === 'high') acc[status].high += val;
              } else {
                acc[status].low += Number(curr.low) || 0;
                acc[status].med += Number(curr.med) || 0;
                acc[status].high += Number(curr.high) || 0;
              }

              return acc;
            }, {});
            this.priorityHeatmap = Object.values(grouped);
          } else if (hm && typeof hm === 'object') {
            this.priorityHeatmap = Object.entries(hm).map(([status, vals]: [string, any]) => ({
              status,
              low: vals?.low ?? vals?.LOW ?? 0,
              med: vals?.med ?? vals?.MED ?? vals?.medium ?? vals?.MEDIUM ?? 0,
              high: vals?.high ?? vals?.HIGH ?? 0
            }));
          }
          if (res.data.throughputSeries) {
            this.throughputOptions = {
              ...this.throughputOptions,
              series: res.data.throughputSeries
            };
          }
        }
      },
      error: (err) => {
        console.error('Failed to load Tasks data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });

    // Team
    this.dashboardService.getTeamData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] Team data keys:', res?.data ? Object.keys(res.data) : res);
        if (res?.data?.workload?.[0]) console.log('[Dashboard] workload[0] keys:', Object.keys(res.data.workload[0]));
        if (res?.data?.leaderboard?.[0]) console.log('[Dashboard] leaderboard[0] keys:', Object.keys(res.data.leaderboard[0]));
        if (res?.data?.branchPerformance?.[0]) console.log('[Dashboard] branchPerformance[0] keys:', Object.keys(res.data.branchPerformance[0]));
        if (res && res.data) {
          if (Array.isArray(res.data.workload)) {
            this.workload = res.data.workload.map((w: any) => {
              const active = w.active ?? w.totalTasks ?? w.tasks ?? 0;
              const overdue = w.overdue ?? w.overdueTasks ?? 0;
              const percent = active > 0 ? Math.round(((active - overdue) / active) * 100) : 0;
              const completed = active - overdue;
              return {
                ...w,
                name: w.name ?? w.user ?? '',
                stats: w.stats ?? `${completed}/${active}`,
                active,
                overdue,
                percent: w.percent ?? percent,
                color: w.color ?? w.barColor ?? '#0d6efd'
              };
            });
          }
          if (Array.isArray(res.data.roleBreakdown)) {
            const maxVal = Math.max(...res.data.roleBreakdown.map((r: any) => r.value ?? r.count ?? 0), 1);
            this.roleBreakdown = res.data.roleBreakdown.map((r: any) => {
              const val = r.value ?? r.count ?? 0;
              return {
                ...r,
                role: r.role ?? r.name ?? r.label ?? '',
                stats: r.stats ?? String(val),
                percent: r.percent ?? Math.round((val / maxVal) * 100)
              };
            });
          }
          if (Array.isArray(res.data.leaderboard)) {
            this.leaderboard = res.data.leaderboard.map((p: any) => ({
              ...p,
              rank: p.rank,
              name: p.name,
              location: p.location ?? p.branch ?? p.branchName ?? '',
              revenue: p.revenue ?? p.revenueFormatted ?? '₹0'
            }));
          }
          if (Array.isArray(res.data.pendingApprovals)) {
            const iconMap: Record<string, string> = {
              danger: 'alert-circle', warning: 'clock', info: 'user-check', secondary: 'shield'
            };
            this.pendingApprovals = res.data.pendingApprovals.map((p: any) => {
              const badge = p.badgeClass ?? p.color ?? 'secondary';
              return {
                ...p,
                title: p.title ?? p.label ?? p.name ?? '',
                count: p.count ?? p.value ?? 0,
                color: p.color ?? badge,
                icon: p.icon ?? iconMap[badge] ?? 'alert-circle'
              };
            });
          }
          if (Array.isArray(res.data.branchPerformance)) {
            this.branchPerformance = res.data.branchPerformance.map((b: any) => ({
              ...b,
              branch: b.branch ?? b.branchName ?? '',
              students: b.students ?? b.totalStudents ?? 0,
              active: b.active ?? b.activeStudents ?? 0,
              revenue: b.revenue ?? b.revenueFormatted ?? '₹0',
              tasks: b.tasks ?? b.totalTasks ?? 0,
              team: b.team ?? b.teamCount ?? 0,
              health: b.health ?? b.healthScore ?? 0,
              hColor: b.hColor ?? b.healthColor ?? '#198754'
            }));
          }
        }
      },
      error: (err) => {
        console.error('Failed to load Team data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });

    // Referrals
    this.dashboardService.getReferralsData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] Referrals data keys:', res?.data ? Object.keys(res.data) : res);
        if (res?.data?.referralMetrics?.[0]) console.log('[Dashboard] referralMetrics[0] keys:', Object.keys(res.data.referralMetrics[0]));
        if (res?.data?.topReferrers?.[0]) console.log('[Dashboard] topReferrers[0] keys:', Object.keys(res.data.topReferrers[0]));
        if (res && res.data) {
          if (Array.isArray(res.data.referralMetrics)) this.referralMetrics = res.data.referralMetrics;
          if (Array.isArray(res.data.referralFunnel)) this.referralFunnel = res.data.referralFunnel;
          if (Array.isArray(res.data.topReferrers)) this.topReferrers = res.data.topReferrers;
          if (res.data.earningsPartnerSeries) {
            this.earningsPartnerOptions = {
              ...this.earningsPartnerOptions,
              series: res.data.earningsPartnerSeries
            };
          }
        }
      },
      error: (err) => {
        console.error('Failed to load Referrals data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });

    // Audit
    this.dashboardService.getAuditData(period).subscribe({
      next: (res) => {
        console.log('[Dashboard] Audit response data keys:', res?.data ? Object.keys(res.data) : res);
        if (res && res.data) {
          // backend returns "recentAuditLog", template expects "auditLog"
          const rawLog = res.data.auditLog ?? res.data.recentAuditLog ?? [];
          if (Array.isArray(rawLog)) {
            this.auditLog = rawLog.map((l: any) => ({
              time: l.time,
              action: l.action,
              actionClass: (l.actionClass ?? l.action ?? '').toLowerCase().replace(/_/g, '-'),
              entity: l.entity ?? (l.entityType && l.entityId ? `${l.entityType}#${l.entityId}` : l.entityType ?? l.entityId ?? ''),
              actor: l.actor,
              change: l.change,
              changeClass: l.changeClass ?? (String(l.change ?? '').startsWith('+') ? 'text-success' : String(l.change ?? '').startsWith('-') ? 'text-danger' : 'text-muted')
            }));
          }
          // backend returns {type, description, timeAgo, color}, template expects {title, time, color}
          const rawFeed = res.data.activityFeed ?? [];
          if (Array.isArray(rawFeed)) {
            this.activityFeed = rawFeed.map((f: any) => ({
              title: f.title ?? f.description ?? f.type ?? '',
              time: f.time ?? f.timeAgo ?? '',
              color: f.color ?? 'blue'
            }));
          }
        }
      },
      error: (err) => {
        console.error('Failed to load Audit data', err);
        this.apiError = 'Failed to load dashboard data. Please try again later.';
      }
    });
  }

  // --- TOP CARDS (Sparklines) ---
  public createSparkline(data: number[], color: string): EChartsOption {
    return {
      xAxis: { type: 'category', show: false, boundaryGap: false },
      yAxis: { type: 'value', show: false, min: 'dataMin' },
      grid: { top: 4, right: 0, bottom: 4, left: 0 },
      tooltip: { show: false },
      series: [{
        data,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + '55' },
            { offset: 1, color: color + '05' }
          ])
        }
      }]
    };
  }

  public summaryCards: any[] = [];

  // --- SECTION 02: STUDENTS ---
  public acquisitionFunnelOptions: EChartsOption = {
    grid: { top: 40, right: 20, bottom: 40, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['LEAD', 'PROSPECTIVE', 'REGISTERED', 'STUDENT', 'LOST'],
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { fontWeight: 'bold', fontSize: 11, color: '#6c757d' }
    },
    yAxis: { type: 'value', show: false },
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      data: [],
      type: 'bar',
      barWidth: '55%',
      colorBy: 'data',
      label: { show: false, position: 'top', fontWeight: 'bold', color: '#3d4454', fontSize: 13 }
    }]
  };

  public referralCompanyOptions: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['52%', '78%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: true, scaleSize: 6 },
      data: []
    }]
  };

  public referralCompanyLegends: any[] = [];

  public statusBreakdown: any[] = [];

  public topCountries: any[] = [];

  public intakeCountryOptions: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['India', 'UK', 'US', 'Canada'], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { fontWeight: 'bold', color: '#6c757d' } },
    yAxis: { type: 'value', axisLabel: { color: '#6c757d' } },
    series: [
      { name: 'India', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.3 }, emphasis: { focus: 'series' }, data: [], itemStyle: { color: '#0d6efd' } },
      { name: 'UK', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.3 }, emphasis: { focus: 'series' }, data: [], itemStyle: { color: '#20c997' } },
      { name: 'US', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.3 }, emphasis: { focus: 'series' }, data: [], itemStyle: { color: '#ffc107' } },
      { name: 'Canada', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.3 }, emphasis: { focus: 'series' }, data: [], itemStyle: { color: '#dc3545' } }
    ]
  };

  // --- SECTION 03: FINANCIAL ---
  public financialMetrics: any[] = [];

  public paymentsStatusOptions: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Paid', 'Pending', 'Partial', 'Dispute'], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { color: '#6c757d', fontWeight: 'bold' } },
    yAxis: { type: 'value', axisLabel: { color: '#6c757d' } },
    series: [
      { name: 'Paid', type: 'bar', stack: 'Total', data: [], itemStyle: { color: '#20c997', borderRadius: [0, 0, 0, 0] }, barWidth: '45%' },
      { name: 'Pending', type: 'bar', stack: 'Total', data: [], itemStyle: { color: '#ffc107' }, barWidth: '45%' },
      { name: 'Partial', type: 'bar', stack: 'Total', data: [], itemStyle: { color: '#0d6efd' }, barWidth: '45%' },
      { name: 'Dispute', type: 'bar', stack: 'Total', data: [], itemStyle: { color: '#dc3545', borderRadius: [3, 3, 0, 0] }, barWidth: '45%' }
    ]
  };

  public paymentDistributionOptions: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    series: [{
      type: 'pie',
      radius: ['52%', '78%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: true, scaleSize: 6 },
      data: []
    }]
  };

  public paymentDistLegends: any[] = [];

  public topPayingEntities: any[] = [];

  public openDisputes: any[] = [];

  // --- SECTION 04: TASKS ---
  public priorityHeatmap: any[] = [];

  public getHeatmapColor(value: number, type: string): string {
    if (type === 'low_med') {
      if (value < 10) return '#dbeafe';
      if (value < 20) return '#93c5fd';
      return '#3b82f6';
    } else {
      if (value < 6) return '#fee2e2';
      if (value < 10) return '#fca5a5';
      return '#ef4444';
    }
  }

  public throughputOptions: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['created', 'completed'], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], axisLabel: { color: '#6c757d', fontWeight: 'bold' } },
    yAxis: { type: 'value', axisLabel: { color: '#6c757d' } },
    series: [
      { name: 'created', type: 'line', data: [], itemStyle: { color: '#0d6efd' }, smooth: true, showSymbol: true, symbolSize: 6 },
      { name: 'completed', type: 'line', data: [], itemStyle: { color: '#20c997' }, smooth: true, showSymbol: true, symbolSize: 6 }
    ]
  };

  public overdueTasks: any[] = [];

  public workload: any[] = [];

  // --- SECTION 05: TEAM & BRANCHES ---
  public roleBreakdown: any[] = [];

  public leaderboard: any[] = [];

  public pendingApprovals: any[] = [];

  public branchPerformance: any[] = [];

  // --- SECTION 06: REFERRALS & PARTNERS ---
  public referralMetrics: any[] = [];

  public earningsPartnerOptions: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['agency', 'coaching', 'influencer', 'student'], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { color: '#6c757d', fontWeight: 'bold' } },
    yAxis: { type: 'value', axisLabel: { color: '#6c757d' } },
    series: [
      { name: 'agency', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.35 }, data: [], itemStyle: { color: '#0d6efd' } },
      { name: 'coaching', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.35 }, data: [], itemStyle: { color: '#20c997' } },
      { name: 'influencer', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.35 }, data: [], itemStyle: { color: '#ffc107' } },
      { name: 'student', type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.35 }, data: [], itemStyle: { color: '#dc3545' } }
    ]
  };

  public referralFunnel: any[] = [];

  public topReferrers: any[] = [];

  // --- SECTION 07: AUDIT & ACTIVITY ---
  public auditLog: any[] = [];

  public activityFeed: any[] = [];
}
