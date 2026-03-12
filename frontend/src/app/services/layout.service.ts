import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  headerContent = signal<TemplateRef<any> | null>(null);

  setHeaderContent(content: TemplateRef<any> | null) {
    this.headerContent.set(content);
  }

  clearHeaderContent() {
    this.headerContent.set(null);
  }
}
