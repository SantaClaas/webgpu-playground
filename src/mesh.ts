interface Mesh {
    vertices: Float32Array;
}

export function createTriangleMesh(): Mesh {
    // Layout is X, Y, Z, R, U, V
    // U, V are texture coordinates
    const vertices = new Float32Array(
        [
            // X, Y, Z         U, V
            0, 0, .5,   /* */ .5, 0,
            0, -.5, -.5,/* */ .0, 1,
            0, .5, -.5, /* */ 1, 1,
        ]
    );

    return { vertices };
}

export function createQuadrilateralMesh(): Mesh {
    // Layout is X, Y, Z, R, U, V
    // U, V are texture coordinates
    const vertices = new Float32Array(
        [
            // X, Y, Z          U, V
            -.5, -.5, 0,/* */ 0, 0,
            .5, -.5, 0, /* */ 1, 0,
            .5, .5, 0,  /* */ 1, 1,

            .5, .5, 0,  /* */ 1, 1,
            -.5, .5, 0, /* */ 0, 1,
            -.5, -.5, 0,/* */ 0, 0,
        ]
    );

    return { vertices };
}

export function createMeshBuffer(device: GPUDevice, { vertices }: Mesh) {

    // Visible to the vertex shader/can be uses as a veretx buffer
    // and we can copy data to it
    const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    // Arguments used by the device to create the buffer
    const descriptor: GPUBufferDescriptor = {
        size: vertices.byteLength,
        usage,
        // Have the buffer open when we create it so that we can immediately write to it
        mappedAtCreation: true,
    };

    // Mapping seems to mean something like visible to us on the CPU to edit and view
    const buffer = device.createBuffer(descriptor);

    // Returns an array buffer we can write to
    // Set vertices
    new Float32Array(buffer.getMappedRange()).set(vertices);
    // Close it
    buffer.unmap();

    return buffer;
}

export function createMeshBufferLayout(_: Mesh) {
    // Define buffer layout
    const bufferLayout: GPUVertexBufferLayout = {
        // How many bytes we need to step to get to the next vertex
        // 5 32 bit numbers are one vertex as seen above (X,Y,Z,R,U,V)
        // 32 bit are 4 bytes per number and we have 5 numbers
        // so 5 * 4 = 24
        arrayStride: 20,
        // There is position and color in there,
        attributes: [
            // Position attribute
            {
                // @location(0)
                shaderLocation: 0,
                // X and Y = 3 * float32
                format: "float32x3",
                // Starts at 0
                offset: 0,
            },
            // Color attribute
            {
                shaderLocation: 1,
                format: "float32x2",
                // 3 float32 for color before is 12 bytes
                offset: 12,
            },
        ]
    };

    return bufferLayout;
}