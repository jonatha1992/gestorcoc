import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService } from '../../../services/document.service';
import { DocumentModel } from '../../../models/document.model';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
           <button (click)="cancel()" class="group text-sm text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 flex items-center mb-2 transition-colors">
             <span class="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Volver al listado
           </button>
           <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
             {{ isEdit ? 'Editar Expediente' : 'Nuevo Expediente' }}
           </h1>
        </div>
        
        <!-- Decoration -->
        <div class="hidden md:block w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 rotate-12"></div>
      </div>

      <!-- Form Card -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50 p-8 relative">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"></div>

        <form (ngSubmit)="save()" #form="ngForm" class="space-y-8">

           <!-- TYPE SECTION -->
           <div class="bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
             <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Tipo de Movimiento</label>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <label class="cursor-pointer group relative">
                 <input type="radio" name="type" [(ngModel)]="document.type" value="ENTRADA" class="peer hidden" required>
                 <div class="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/10 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md flex items-center">
                   <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">📥</div>
                   <div>
                     <span class="block font-bold text-gray-900 dark:text-white">Entrada</span>
                     <span class="text-xs text-gray-500 dark:text-gray-400">Recepción de documentación externa</span>
                   </div>
                   <div class="ml-auto opacity-0 peer-checked:opacity-100 text-emerald-500 transform scale-0 peer-checked:scale-100 transition-all">
                     <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                   </div>
                 </div>
               </label>

               <label class="cursor-pointer group relative">
                 <input type="radio" name="type" [(ngModel)]="document.type" value="SALIDA" class="peer hidden" required>
                 <div class="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 peer-checked:border-blue-500 peer-checked:bg-blue-50/10 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md flex items-center">
                   <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">📤</div>
                   <div>
                     <span class="block font-bold text-gray-900 dark:text-white">Salida</span>
                     <span class="text-xs text-gray-500 dark:text-gray-400">Envío o despacho de documentación</span>
                   </div>
                   <div class="ml-auto opacity-0 peer-checked:opacity-100 text-blue-500 transform scale-0 peer-checked:scale-100 transition-all">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                   </div>
                 </div>
               </label>
             </div>
           </div>

           <!-- METADATA SECTION -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="group">
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Fecha</label>
                <input type="datetime-local" [(ngModel)]="dateInput" name="date" required
                  class="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all group-hover:border-gray-300 dark:group-hover:border-gray-600">
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Referencia / Expediente <span class="text-gray-300 dark:text-gray-600 font-normal normal-case">(Opcional)</span>
                </label>
                <input type="text" [(ngModel)]="document.referenceNumber" name="referenceNumber" placeholder="Ej: EXP-2024-001... (Dejar vacío para auto-generar)"
                  class="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 outline-none transition-all group-hover:border-gray-300 dark:group-hover:border-gray-600 placeholder-gray-400">
              </div>
           </div>

           <!-- PARTICIPANTS SECTION -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="group">
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Remitente</label>
               <input type="text" [(ngModel)]="document.sender" name="sender" required placeholder="¿Quién envía o inicia?"
                 class="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all group-hover:border-gray-300 dark:group-hover:border-gray-600">
             </div>
             <div class="group">
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Destinatario</label>
               <input type="text" [(ngModel)]="document.recipient" name="recipient" required placeholder="¿A quién va dirigido?"
                 class="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all group-hover:border-gray-300 dark:group-hover:border-gray-600">
             </div>
           </div>

           <!-- CONTENT SECTION -->
           <div class="group">
             <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Asunto Principal</label>
             <input type="text" [(ngModel)]="document.subject" name="subject" required placeholder="Título breve del documento..."
               class="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 outline-none transition-all group-hover:border-gray-300 dark:group-hover:border-gray-600">
           </div>

           <div class="group">
             <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Descripción / Observaciones</label>
             <textarea [(ngModel)]="document.description" name="description" rows="4" placeholder="Ingrese detalles adicionales, notas o comentarios..."
               class="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-y min-h-[100px] group-hover:border-gray-300 dark:group-hover:border-gray-600"></textarea>
           </div>

           <!-- STATUS SECTION -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
             <div>
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prioridad</label>
               <select [(ngModel)]="document.priority" name="priority" required
                 class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all cursor-pointer">
                 <option value="BAJA">🟢 Baja</option>
                 <option value="MEDIA">🟡 Media</option>
                 <option value="ALTA">🔴 Alta</option>
               </select>
             </div>
             <div>
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Estado Inicial</label>
               <select [(ngModel)]="document.status" name="status" required
                 class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all cursor-pointer">
                 <option value="PENDIENTE">⏳ Pendiente</option>
                 <option value="EN_PROCESO">⚙️ En Proceso</option>
                 <option value="FINALIZADO">✅ Finalizado</option>
                 <option value="ARCHIVADO">🗄️ Archivado</option>
               </select>
             </div>
           </div>

           <!-- ACTIONS -->
           <div class="pt-6 flex items-center justify-end space-x-4 border-t border-gray-100 dark:border-gray-700/50">
             <button type="button" (click)="cancel()"
               class="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
               Cancelar
             </button>
             <button type="submit" [disabled]="!form.valid || isSaving"
               class="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center">
               <span *ngIf="isSaving" class="animate-spin mr-2">⏳</span>
               {{ isSaving ? 'Guardando...' : 'Guardar Expediente' }}
             </button>
           </div>

        </form>
      </div>
    </div>
  `
})
export class DocumentFormComponent {
  private documentService = inject(DocumentService);
  private router = inject(Router);

  isEdit = false;
  isSaving = false;
  dateInput: string = new Date().toISOString().slice(0, 16);

  document: Partial<DocumentModel> = {
    type: 'ENTRADA',
    referenceNumber: '',
    status: 'PENDIENTE',
    priority: 'MEDIA'
  };

  async save() {
    this.isSaving = true;
    try {
      const finalDoc: DocumentModel = {
        ...(this.document as DocumentModel),
        date: Timestamp.fromDate(new Date(this.dateInput)),
        referenceNumber: this.document.referenceNumber || `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      };

      await this.documentService.addDocument(finalDoc);
      this.router.navigate(['/documents']);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error al guardar el documento. Revise la consola.');
    } finally {
      this.isSaving = false;
    }
  }

  cancel() {
    this.router.navigate(['/documents']);
  }
}
