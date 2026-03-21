'use client';

import { useEffect, useState } from 'react';
import TapoCameraStream from '@/components/TapoCameraStream';
import { useCameraStore } from '@/store/cameraStore';
import {
    Camera,
    Plus,
    Trash2,
    Grid3x3,
    Square,
    Smartphone,
    Router,
    CheckCircle2,
} from 'lucide-react';
import styles from '@/app/page.module.css';

export default function CamerasPage() {
    const { cameras, removeCamera, loadCameras } = useCameraStore();
    const [selectedView, setSelectedView] = useState<'grid' | 'single'>('grid');
    const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

    useEffect(() => {
        loadCameras();
    }, [loadCameras]);

    useEffect(() => {
        if (cameras.length > 0) {
            fetch('/api/relay/start', { method: 'POST' }).catch(() => { });
        }
    }, [cameras.length]);

    const handleDeleteCamera = async (id: string) => {
        if (!confirm('Are you sure you want to remove this camera?')) return;
        fetch(`/api/relay/camera/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => { });
        try {
            await removeCamera(id);
        } catch (error) {
            console.error(error);
            alert('Could not remove camera from database.');
        }
    };

    const openAddCamera = () => {
        window.dispatchEvent(new Event('xmarte:add-camera'));
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.camerasHeader}>
                <div className={styles.camerasHeading}>
                    <span className={styles.camerasEyebrow}>Smart Cameras</span>
                    <h1 className={styles.pageTitle}>Cameras</h1>
                    <p className={styles.tabSubtitle}>
                        Add your cameras once and watch them here. The app handles the video connection automatically in the background.
                    </p>
                </div>
                <button className={styles.addBtn} onClick={openAddCamera} type="button">
                    <Plus size={16} />
                    Add Camera
                </button>
            </div>

            {cameras.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyHero}>
                        <div className={styles.emptyLead}>
                            <div className={styles.emptyIcon}>
                                <Camera size={34} />
                            </div>

                            <div className={styles.emptyCopy}>
                                <h2 className={styles.emptyTitle}>No cameras connected</h2>
                                <p className={styles.emptyText}>
                                    Add your first camera and the system will prepare the live view automatically. You only need the camera name, IP, username, and password.
                                </p>

                                <div className={styles.emptyBadges}>
                                    <span className={styles.emptyBadge}>
                                        <CheckCircle2 size={14} />
                                        Saved to your account
                                    </span>
                                    <span className={styles.emptyBadge}>
                                        <CheckCircle2 size={14} />
                                        Automatic video setup
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.emptyActions}>
                            <button className={styles.addBtn} onClick={openAddCamera} type="button">
                                <Plus size={16} />
                                Add First Camera
                            </button>
                        </div>
                    </div>

                    <div className={styles.setupGrid}>
                        <article className={styles.setupCard}>
                            <div className={styles.setupCardIcon}>
                                <Smartphone size={18} />
                            </div>
                            <h3>Create the camera login</h3>
                            <p>In the Tapo app, open the advanced camera settings and create the username and password used by this app.</p>
                        </article>

                        <article className={styles.setupCard}>
                            <div className={styles.setupCardIcon}>
                                <Router size={18} />
                            </div>
                            <h3>Find the camera IP</h3>
                            <p>Use the IP shown in the Tapo app or in your router DHCP list before adding the camera.</p>
                        </article>

                        <article className={styles.setupCard}>
                            <div className={styles.setupCardIcon}>
                                <CheckCircle2 size={18} />
                            </div>
                            <h3>Finish in one step</h3>
                            <p>Save the camera here and the app will try to prepare the live stream automatically.</p>
                        </article>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.cameraControls}>
                        <div className={styles.viewToggle}>
                            <button
                                onClick={() => setSelectedView('grid')}
                                className={`${styles.viewBtn} ${selectedView === 'grid' ? styles.viewBtnActive : ''}`}
                            >
                                <Grid3x3 size={16} />
                                Grid View
                            </button>
                            <button
                                onClick={() => setSelectedView('single')}
                                className={`${styles.viewBtn} ${selectedView === 'single' ? styles.viewBtnActive : ''}`}
                            >
                                <Square size={16} />
                                Focus View
                            </button>
                        </div>
                        <span className={styles.cameraCount}>
                            {cameras.length} camera{cameras.length !== 1 ? 's' : ''} connected
                        </span>
                    </div>

                    {selectedView === 'grid' && (
                        <div className={styles.cameraGrid}>
                            {cameras.map((camera) => (
                                <div key={camera.id} className={styles.cameraCard}>
                                    <button
                                        onClick={() => handleDeleteCamera(camera.id)}
                                        className={styles.cameraDeleteBtn}
                                        title="Remove camera"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <TapoCameraStream
                                        camera={camera}
                                        width={640}
                                        height={360}
                                        autoplay={true}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedView === 'single' && (
                        <>
                            <div className={styles.cameraSingle}>
                                <div className={styles.cameraCard}>
                                    <button
                                        onClick={() => handleDeleteCamera(cameras[selectedCameraIndex].id)}
                                        className={styles.cameraDeleteBtn}
                                        title="Remove camera"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <TapoCameraStream
                                        camera={cameras[selectedCameraIndex]}
                                        width={1280}
                                        height={720}
                                        autoplay={true}
                                    />
                                </div>
                            </div>

                            {cameras.length > 1 && (
                                <div className={styles.cameraThumbs}>
                                    {cameras.map((camera, index) => (
                                        <button
                                            key={camera.id}
                                            onClick={() => setSelectedCameraIndex(index)}
                                            className={`${styles.cameraThumb} ${selectedCameraIndex === index ? styles.cameraThumbActive : ''}`}
                                        >
                                            {camera.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className={styles.setupGuide}>
                        <h3>Before viewing the stream</h3>
                        <ol>
                            <li>Keep the camera connected to your home network.</li>
                            <li>Use Test in the add-camera form if you want to confirm the credentials before saving.</li>
                            <li>If a stream takes a few seconds to appear, the app is still preparing it.</li>
                            <li>Use Grid View for many cameras or Focus View for one larger feed.</li>
                        </ol>
                    </div>
                </>
            )}
        </div>
    );
}
