import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import jsPDF from 'jspdf';

// Generar código QR como Data URL
export const generateQRCode = async (data: string): Promise<string> => {
    try {
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

// Generar PDF con QR code para imprimir
export const generateQRPDF = async (
    equipmentName: string,
    equipmentId: string,
    qrCode: string
): Promise<void> => {
    try {
        const pdf = new jsPDF();

        // Título
        pdf.setFontSize(20);
        pdf.text('Código QR - Equipamiento', 105, 20, { align: 'center' });

        // Información del equipo
        pdf.setFontSize(12);
        pdf.text(`Equipo: ${equipmentName}`, 20, 40);
        pdf.text(`ID: ${equipmentId}`, 20, 50);

        // QR Code
        pdf.addImage(qrCode, 'PNG', 55, 60, 100, 100);

        // Instrucciones
        pdf.setFontSize(10);
        pdf.text('Escanea este código para ver la información del equipo', 105, 175, { align: 'center' });

        // Descargar PDF
        pdf.save(`QR_${equipmentName}_${equipmentId}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

// Clase para manejar el escáner de QR
export class QRScanner {
    private html5QrCode: Html5Qrcode | null = null;
    private isScanning = false;

    async startScanning(
        elementId: string,
        onSuccess: (decodedText: string) => void,
        onError?: (error: string) => void
    ): Promise<void> {
        if (this.isScanning) {
            console.warn('Scanner is already running');
            return;
        }

        try {
            this.html5QrCode = new Html5Qrcode(elementId);

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            };

            await this.html5QrCode.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    onSuccess(decodedText);
                },
                (errorMessage) => {
                    if (onError) {
                        onError(errorMessage);
                    }
                }
            );

            this.isScanning = true;
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            throw error;
        }
    }

    async stopScanning(): Promise<void> {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
                this.isScanning = false;
            } catch (error) {
                console.error('Error stopping QR scanner:', error);
            }
        }
    }

    isCurrentlyScanning(): boolean {
        return this.isScanning;
    }
}
