'use client';

import { useState, useEffect } from 'react';
import TapoCameraStream from '@/components/TapoCameraStream';
import { useCameraStore } from '@/store/cameraStore';
import { Camera, Plus, Trash2, Grid3x3, Square } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function CamerasPage() {
    const { cameras, removeCamera, loadCameras } = useCameraStore();
    const [selectedView, setSelectedView] = useState<'grid' | 'single'>('grid');
    const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

    useEffect(() => {
        loadCameras();
    }, [loadCameras]);

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

    return (
        <div className={styles.dashboard}>
            <div className={styles.camerasHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Camera Streams</h1>
                    <p className={styles.pageSubtitle}>
                        Live view from your TP-Link Tapo cameras
                    </p>
                </div>
            </div>

            {cameras.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Camera className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className={styles.emptyTitle}>No cameras added yet</h2>
                    <p className={styles.emptyDescription}>
                        Get started by adding your first Tapo camera using the "Add Camera" button in the sidebar
                    </p>
                    <div className={styles.quickSetupGuide}>
                        <h3>Quick Setup Guide</h3>
                        <ol>
                            <li>Open the Tapo app on your phone</li>
                            <li>Go to Camera Settings → Advanced Settings → Device Account</li>
                            <li>Create a Device Account with username and password</li>
                            <li>Find your camera's IP address in your router or Tapo app</li>
                            <li>Click "Add Camera" in the sidebar and enter the information</li>
                            <li>Start the RTSP server: <code>node server/rtsp-websocket-server.js</code></li>
                        </ol>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.cameraControls}>
                        <div className={styles.viewToggle}>
                            <button
                                onClick={() => setSelectedView('grid')}
                                className={`${styles.viewButton} ${selectedView === 'grid' ? styles.activeView : ''}`}
                            >
                                <Grid3x3 className="w-4 h-4" />
                                Grid View
                            </button>
                            <button
                                onClick={() => setSelectedView('single')}
                                className={`${styles.viewButton} ${selectedView === 'single' ? styles.activeView : ''}`}
                            >
                                <Square className="w-4 h-4" />
                                Single View
                            </button>
                        </div>
                        <span className={styles.cameraCount}>
                            {cameras.length} camera{cameras.length !== 1 ? 's' : ''} connected
                        </span>
                    </div>

                    {selectedView === 'grid' && (
                        <div className={styles.camerasGrid}>
                            {cameras.map((camera) => (
                                <div key={camera.id} className={styles.cameraCard}>
                                    <button
                                        onClick={() => handleDeleteCamera(camera.id)}
                                        className={styles.deleteButton}
                                        title="Remove camera"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
                            <div className={styles.singleViewContainer}>
                                <div className={styles.cameraCardLarge}>
                                    <button
                                        onClick={() => handleDeleteCamera(cameras[selectedCameraIndex].id)}
                                        className={styles.deleteButton}
                                        title="Remove camera"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
                                <div className={styles.cameraSelector}>
                                    {cameras.map((camera, index) => (
                                        <button
                                            key={camera.id}
                                            onClick={() => setSelectedCameraIndex(index)}
                                            className={`${styles.selectorButton} ${selectedCameraIndex === index ? styles.activeSelector : ''}`}
                                        >
                                            {camera.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className={styles.streamingInstructions}>
                        <h2>Streaming Instructions</h2>
                        <ol>
                            <li>Ensure your cameras are accessible on your local network</li>
                            <li>Start the RTSP WebSocket server: <code>node server/rtsp-websocket-server.js</code></li>
                            <li>Refresh this page to see live streams</li>
                            <li>Add more cameras using the "Add Camera" button in the sidebar</li>
                        </ol>
                    </div>
                </>
            )}
        </div>
    );
}
