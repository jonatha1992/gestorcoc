import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiIconName =
  | 'panel'
  | 'alert'
  | 'clipboard'
  | 'archive'
  | 'users'
  | 'layers'
  | 'clock'
  | 'warning'
  | 'check-circle'
  | 'spark'
  | 'bolt'
  | 'shield'
  | 'building'
  | 'badge'
  | 'search'
  | 'calendar'
  | 'map'
  | 'pin'
  | 'camera'
  | 'activity'
  | 'briefcase'
  | 'eye'
  | 'refresh'
  | 'filter-off'
  | 'route';

@Component({
  selector: 'app-ui-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (name()) {
      @case ('panel') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 4h18v16H3z" />
          <path d="M3 9h18" />
          <path d="M8 15h3" />
          <path d="M13 15h3" />
        </svg>
      }
      @case ('alert') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      }
      @case ('clipboard') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="8" y="3" width="8" height="4" rx="1" />
          <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      }
      @case ('archive') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 7h18" />
          <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
          <path d="M9 11h6" />
          <path d="M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1Z" />
        </svg>
      }
      @case ('users') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
      @case ('layers') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 16.5 9 4.5 9-4.5" />
        </svg>
      }
      @case ('clock') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      }
      @case ('warning') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 8v5" />
          <path d="M12 17h.01" />
          <path d="m10.4 3.84-8.2 14.2A2 2 0 0 0 3.94 21h16.12a2 2 0 0 0 1.74-2.96l-8.2-14.2a2 2 0 0 0-3.2 0Z" />
        </svg>
      }
      @case ('check-circle') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      }
      @case ('spark') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m13 2 1.5 4.5L19 8l-4.5 1.5L13 14l-1.5-4.5L7 8l4.5-1.5L13 2Z" />
          <path d="m6 14 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
        </svg>
      }
      @case ('bolt') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        </svg>
      }
      @case ('shield') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      }
      @case ('building') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 10h.01" />
          <path d="M9 14h.01" />
          <path d="M15 10h.01" />
          <path d="M15 14h.01" />
          <path d="M11 21v-4h2v4" />
        </svg>
      }
      @case ('badge') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3 4 7v6c0 5 3.5 7.5 8 8 4.5-.5 8-3 8-8V7l-8-4Z" />
          <path d="M9.5 11.5h5" />
          <path d="M12 9v5" />
        </svg>
      }
      @case ('search') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      }
      @case ('calendar') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />
        </svg>
      }
      @case ('map') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" />
          <path d="M9 4v14" />
          <path d="M15 6v14" />
        </svg>
      }
      @case ('pin') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      }
      @case ('camera') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 10h20" />
          <path d="M6 10V7h12v3" />
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <circle cx="12" cy="15" r="3" />
        </svg>
      }
      @case ('activity') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      }
      @case ('briefcase') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
        </svg>
      }
      @case ('eye') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      }
      @case ('refresh') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      }
      @case ('filter-off') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
          <path d="m3 3 18 18" />
        </svg>
      }
      @case ('route') {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M8 6h3a5 5 0 0 1 5 5v1" />
          <path d="M16 18h-3a5 5 0 0 1-5-5v-1" />
        </svg>
      }
      @default {
        <svg [attr.class]="iconClass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      }
    }
  `,
})
export class UiIconComponent {
  name = input<UiIconName>('panel');
  className = input('h-5 w-5');
  strokeWidth = input(1.8);

  iconClass(): string {
    return this.className();
  }
}
