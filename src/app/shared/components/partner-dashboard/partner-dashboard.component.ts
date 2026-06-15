import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { PartnerService } from '../../../core/services/partner.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-partner-dashboard',
  templateUrl: './partner-dashboard.component.html',
  styleUrls: ['./partner-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PartnerDashboardComponent implements OnInit {
  public summaryCards: any[] = [];
  public earningsOverviewOptions: EChartsOption = {};
  public payoutStatusOptions: EChartsOption = {};
  public payoutDistLegends: any[] = [];
  public recentStudents: any[] = [];
  public quickStats: any[] = [];
  public greeting = '';
  public userName = '';

  public currentPeriod = '7d';

  constructor(
    private partnerService: PartnerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadDashboardData();
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

  public onPeriodChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentPeriod = target.value;
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    const user = this.authService.currentUserValue;
    if (!user || !user.id) return;

    this.partnerService.getDashboard(user.id, this.currentPeriod).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mapDashboardData(res.data);
        }
      },
      error: (err) => console.error('Error loading partner dashboard data:', err)
    });
  }

  private mapDashboardData(data: any): void {
    // 1. Summary Cards
    const s = data.summary;
    this.summaryCards = [
      { 
        title: 'STUDENTS REFERRED', 
        value: ((s.studentsReferred.prefix || '') + s.studentsReferred.value + (s.studentsReferred.suffix || '')), 
        trend: s.studentsReferred.trend, 
        trendColor: s.studentsReferred.trendColor 
      },
      { 
        title: 'ASSIGNED AMOUNT', 
        value: ((s.assignedAmount.prefix || '') + s.assignedAmount.value + (s.assignedAmount.suffix || '')), 
        trend: s.assignedAmount.trend, 
        trendColor: s.assignedAmount.trendColor 
      },
      { 
        title: 'PAID AMOUNT', 
        value: ((s.paidAmount.prefix || '') + s.paidAmount.value + (s.paidAmount.suffix || '')), 
        trend: s.paidAmount.trend, 
        trendColor: s.paidAmount.trendColor 
      },
      { 
        title: 'PENDING BALANCE', 
        value: ((s.pendingBalance.prefix || '') + s.pendingBalance.value + (s.pendingBalance.suffix || '')), 
        trend: s.pendingBalance.trend, 
        trendColor: s.pendingBalance.trendColor 
      }
    ];

    // 2. Earnings Overview
    this.earningsOverviewOptions = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Assigned', 'Paid'],
        top: 10,
        right: 10,
        icon: 'circle',
        textStyle: { color: '#8a94a6', fontSize: 12 }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.earningsOverview.labels,
        axisLabel: { color: '#8a94a6', fontWeight: 'bold' },
        axisLine: { lineStyle: { color: '#e2e6ea' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8a94a6', formatter: '₹{value}' },
        splitLine: { lineStyle: { color: '#f0f2f5' } }
      },
      series: [
        {
          name: 'Assigned',
          type: 'line',
          smooth: true,
          data: data.earningsOverview.datasets.assigned,
          itemStyle: { color: '#0d6efd' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(13, 110, 253, 0.2)' },
              { offset: 1, color: 'rgba(13, 110, 253, 0)' }
            ])
          }
        },
        {
          name: 'Paid',
          type: 'line',
          smooth: true,
          data: data.earningsOverview.datasets.paid,
          itemStyle: { color: '#20c997' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(32, 201, 151, 0.2)' },
              { offset: 1, color: 'rgba(32, 201, 151, 0)' }
            ])
          }
        }
      ]
    };

    // 3. Payout Status
    const pDist = data.payoutStatus.distribution;
    const totalPayouts = data.payoutStatus.totalPayouts || 0;

    this.payoutDistLegends = [
      { label: 'Assigned', value: pDist.assigned, color: '#0d6efd' },
      { label: 'Paid', value: pDist.paid, color: '#20c997' },
      { label: 'Pending', value: pDist.pending, color: '#6c757d' },
      { label: 'Partial', value: pDist.partial, color: '#fd7e14' },
      { label: 'Dispute', value: pDist.dispute, color: '#dc3545' }
    ];

    this.payoutStatusOptions = {
      title: {
        text: `{val|${totalPayouts}}\n{lbl|TOTAL PAYOUTS}`,
        left: 'center',
        top: 'center',
        textStyle: {
          rich: {
            val: {
              fontSize: 26,
              fontWeight: 'bold',
              color: '#1a1d23',
              align: 'center',
              padding: [0, 0, 4, 0]
            },
            lbl: {
              fontSize: 9,
              fontWeight: 'bold',
              color: '#8a94a6',
              align: 'center'
            }
          }
        }
      },
      tooltip: { trigger: 'item' },
      legend: { show: false },
      series: [
        {
          name: 'Payout Status',
          type: 'pie',
          radius: ['55%', '85%'],
          avoidLabelOverlap: false,
          label: { show: false },
          itemStyle: { borderWidth: 2, borderColor: 'transparent' },
          data: [
            { value: pDist.assigned, name: 'Assigned', itemStyle: { color: '#0d6efd' } },
            { value: pDist.paid, name: 'Paid', itemStyle: { color: '#20c997' } },
            { value: pDist.pending, name: 'Pending', itemStyle: { color: '#6c757d' } },
            { value: pDist.partial, name: 'Partial', itemStyle: { color: '#fd7e14' } },
            { value: pDist.dispute, name: 'Dispute', itemStyle: { color: '#dc3545' } }
          ]
        }
      ]
    };

    // 4. Recent Students
    this.recentStudents = (data.recentStudents || []).map((st: any) => ({
      name: st.name,
      enrolled: st.enrolled,
      status: st.status,
      amount: st.amount,
      progress: st.progress,
      progressColor: this.getProgressColorForStatus(st.status)
    }));

    // 5. Quick Stats
    const q = data.quickStats;
    this.quickStats = [
      { icon: 'file-description', color: 'primary', label: 'ACTIVE RESOURCES', value: q.activeResources },
      { icon: 'alert-circle', color: 'danger', label: 'OPEN DISPUTES', value: q.openDisputes },
      { icon: 'calendar-event', color: 'success', label: 'PARTNER SINCE', value: q.partnerSince },
      { icon: 'user', color: 'warning', label: 'ASSIGNED MANAGER', value: q.assignedManager || 'None' }
    ];
  }

  private getProgressColorForStatus(status: string): string {
    switch((status || '').toUpperCase()) {
      case 'PAID': return '#20c997';
      case 'PARTIAL': return '#fd7e14';
      case 'PARTIAL_PAID': return '#fd7e14';
      case 'ASSIGNED': return '#0d6efd';
      case 'AMOUNT_ASSIGNED': return '#0d6efd';
      case 'DISPUTE': return '#dc3545';
      default: return '#6c757d';
    }
  }
}
