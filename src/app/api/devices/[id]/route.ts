import { NextRequest, NextResponse } from 'next/server';
import { devices } from '@/data/devices';
import { getAuthenticatedUser } from '@/lib/auth';

// In-memory store
let deviceStore = [...devices];

// GET /api/devices/[id] - Get a specific device
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
        return NextResponse.json({
            success: false,
            error: 'Authentication required',
        }, { status: 401 });
    }

    const device = deviceStore.find(d => d.id === params.id);

    if (!device) {
        return NextResponse.json({
            success: false,
            error: 'Device not found',
        }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        data: device,
    });
}

// PUT /api/devices/[id] - Update a device
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { user, error: authError } = await getAuthenticatedUser();
        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
            }, { status: 401 });
        }

        const body = await request.json();
        const index = deviceStore.findIndex(d => d.id === params.id);

        if (index === -1) {
            return NextResponse.json({
                success: false,
                error: 'Device not found',
            }, { status: 404 });
        }

        deviceStore[index] = {
            ...deviceStore[index],
            ...body,
            updatedAt: new Date(),
        };

        return NextResponse.json({
            success: true,
            data: deviceStore[index],
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Failed to update device',
        }, { status: 400 });
    }
}

// PATCH /api/devices/[id] - Update device state
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { user, error: authError } = await getAuthenticatedUser();
        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
            }, { status: 401 });
        }

        const body = await request.json();
        const index = deviceStore.findIndex(d => d.id === params.id);

        if (index === -1) {
            return NextResponse.json({
                success: false,
                error: 'Device not found',
            }, { status: 404 });
        }

        deviceStore[index] = {
            ...deviceStore[index],
            state: {
                ...deviceStore[index].state,
                ...body.state,
            },
            updatedAt: new Date(),
        };

        return NextResponse.json({
            success: true,
            data: deviceStore[index],
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Failed to update device state',
        }, { status: 400 });
    }
}

// DELETE /api/devices/[id] - Delete a device
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
        return NextResponse.json({
            success: false,
            error: 'Authentication required',
        }, { status: 401 });
    }

    const index = deviceStore.findIndex(d => d.id === params.id);

    if (index === -1) {
        return NextResponse.json({
            success: false,
            error: 'Device not found',
        }, { status: 404 });
    }

    deviceStore = deviceStore.filter(d => d.id !== params.id);

    return NextResponse.json({
        success: true,
        message: 'Device deleted',
    });
}
