import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export interface CameraDevice {
  name: string;
  model: string;
  type: string;
  locationHint: string;
  status: 'configured' | 'online';
}

@Component({
  selector: 'app-office-cameras',
  templateUrl: './office-cameras.component.html',
  styleUrls: ['./office-cameras.component.scss'],
})
export class OfficeCamerasComponent implements OnInit {
  pageTitle = 'Office Cameras';
  readonly portalUrl = 'https://web.ezykam.com/login';
  copiedDeviceName: string | null = null;

  readonly cameraList: CameraDevice[] = [
    {
      name: 'CP-E38Q',
      model: 'CP Plus E38Q',
      type: '3MP Smart Wi-Fi PT Camera',
      locationHint: 'Main Office Area',
      status: 'configured',
    },
    {
      name: 'CP-E38Q 2',
      model: 'CP Plus E38Q',
      type: '3MP Smart Wi-Fi PT Camera',
      locationHint: 'Branch Floor 1',
      status: 'configured',
    },
    {
      name: 'CP-E38Q 3',
      model: 'CP Plus E38Q',
      type: '3MP Smart Wi-Fi PT Camera',
      locationHint: 'Branch Floor 2',
      status: 'configured',
    },
    {
      name: 'CP-E35A',
      model: 'CP Plus E35A',
      type: 'Outdoor HD Camera',
      locationHint: 'Main Entrance / Reception',
      status: 'configured',
    },
    {
      name: 'CP-E35A 2',
      model: 'CP Plus E35A',
      type: 'Outdoor HD Camera',
      locationHint: 'Secondary Entrance / Parking',
      status: 'configured',
    },
    {
      name: 'CP-E28Q',
      model: 'CP Plus E28Q',
      type: '2MP Smart Wi-Fi Camera',
      locationHint: 'Meeting Room A',
      status: 'configured',
    },
    {
      name: 'CP-E28Q 2',
      model: 'CP Plus E28Q',
      type: '2MP Smart Wi-Fi Camera',
      locationHint: 'Counseling Room B',
      status: 'configured',
    },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.pageTitle = this.route.snapshot?.data?.['title'] ?? 'Office Cameras';
  }

  openCameraPortal(): void {
    window.open(this.portalUrl, '_blank', 'noopener,noreferrer');
  }

  copyToClipboard(name: string): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(name).then(() => {
        this.copiedDeviceName = name;
        setTimeout(() => {
          if (this.copiedDeviceName === name) {
            this.copiedDeviceName = null;
          }
        }, 2000);
      });
    }
  }
}
