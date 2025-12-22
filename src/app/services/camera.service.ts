import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Camera } from '../models';

@Injectable({
    providedIn: 'root',
})
export class CameraService {
    private firestore = inject(Firestore);

    getCameras(): Observable<Camera[]> {
        const camerasRef = collection(this.firestore, 'camaras');
        return collectionData(query(camerasRef), { idField: 'id' }) as Observable<Camera[]>;
    }

    getCameraById(id: string): Observable<Camera> {
        const cameraDoc = doc(this.firestore, `camaras/${id}`);
        return docData(cameraDoc, { idField: 'id' }) as Observable<Camera>;
    }

    getCamerasByLocation(locationId: string): Observable<Camera[]> {
        const camerasRef = collection(this.firestore, 'camaras');
        const q = query(camerasRef, where('locationId', '==', locationId));
        return collectionData(q, { idField: 'id' }) as Observable<Camera[]>;
    }

    getCamerasByStatus(status: string): Observable<Camera[]> {
        const camerasRef = collection(this.firestore, 'camaras');
        const q = query(camerasRef, where('status', '==', status));
        return collectionData(q, { idField: 'id' }) as Observable<Camera[]>;
    }

    addCamera(camera: Camera) {
        const camerasRef = collection(this.firestore, 'camaras');
        return addDoc(camerasRef, camera);
    }

    updateCamera(camera: Camera) {
        const cameraDoc = doc(this.firestore, `camaras/${camera.id}`);
        const { id, ...data } = camera;
        return updateDoc(cameraDoc, data);
    }

    deleteCamera(id: string) {
        const cameraDoc = doc(this.firestore, `camaras/${id}`);
        return deleteDoc(cameraDoc);
    }
}
