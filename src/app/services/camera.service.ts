import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query, where, limit, orderBy } from '@angular/fire/firestore';
import { Observable, switchMap, of } from 'rxjs';
import { Camera } from '../models';
import { OrganizationAccessService } from './organization-access.service';

@Injectable({
    providedIn: 'root',
})
export class CameraService {
    private firestore = inject(Firestore);
    private orgAccess = inject(OrganizationAccessService);

    getCameras(): Observable<Camera[]> {
        const camerasRef = collection(this.firestore, 'camaras');

        return this.orgAccess.allowedAccess$.pipe(
            switchMap(access => {
                if (access.isAdmin) {
                    return collectionData(query(camerasRef, orderBy('name', 'asc'), limit(50)), { idField: 'id' }) as Observable<Camera[]>;
                }

                if ((!access.units || access.units.length === 0) && (!access.systems || access.systems.length === 0)) {
                    return of([]);
                }

                if (access.units && access.units.length > 0) {
                    return collectionData(query(camerasRef, where('orgUnitId', 'in', access.units.slice(0, 10)), orderBy('name', 'asc'), limit(50)), { idField: 'id' }) as Observable<Camera[]>;
                } else {
                    return collectionData(query(camerasRef, where('orgSystemId', 'in', access.systems!.slice(0, 10)), orderBy('name', 'asc'), limit(50)), { idField: 'id' }) as Observable<Camera[]>;
                }
            })
        );
    }

    getCameraById(id: string): Observable<Camera> {
        const cameraDoc = doc(this.firestore, `camaras/${id}`);
        return docData(cameraDoc, { idField: 'id' }) as Observable<Camera>;
    }

    getCamerasByLocation(locationId: string): Observable<Camera[]> {
        const camerasRef = collection(this.firestore, 'camaras');
        const q = query(camerasRef, where('locationId', '==', locationId), limit(50));
        return collectionData(q, { idField: 'id' }) as Observable<Camera[]>;
    }

    getCamerasByStatus(status: string): Observable<Camera[]> {
        const camerasRef = collection(this.firestore, 'camaras');
        const q = query(camerasRef, where('status', '==', status), limit(50));
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
