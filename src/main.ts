// Try this with fable later 🤔 https://fable.io/docs/communicate/js-from-fable.html#importing-relative-paths-when-using-an-output-directory
import shader from "./shaders.wgsl?raw";
import * as TriangleMesh from "./triangleMesh";
import * as QuadrilateralMesh from "./quadrilateralMesh";
import * as Material from "./material";
import { mat4, ReadonlyVec3 } from "gl-matrix";
import * as Triangle from "./triangle";
import * as Camera from "./camera";
import * as Scene from "./scene";


console.log("🏃💨🏎️💨");

if (!navigator.gpu) {
    console.error("WebGPU is not supported");
    throw Error("WebGPU is not supported yet 😔");
}

const canvas = document.querySelector("canvas");


if (!canvas) {
    throw Error("Expected to have one canvas element");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Wrapper around the physical graphics card to query it's properties like performance or limits
const adapter = await navigator.gpu.requestAdapter();

const device = await adapter?.requestDevice();
if (!device) {
    throw Error("Need device to run this code");
}
const context = canvas.getContext("webgpu");
if (!context) {
    throw Error("Expected to get context from canvas");
}

// Pixel format of the screen and the color buffer
const format: GPUTextureFormat = "bgra8unorm";
context.configure({
    device,
    format,
    alphaMode: "opaque"
});


// Create pipeline
const shaderModule = device.createShaderModule({
    code: shader
})

// Bind groups & pipeline -> render pass ?
// MESHES
const triangleMesh = TriangleMesh.create(device);
const quadrilateralMesh = QuadrilateralMesh.create(device);
// BIND GROUP LAYOUTS

// Description/Layout of the binding groups?
// Frame as in frame of a building or model (?)
const frameGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            // The uniform buffer?
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            // Tell it is a buffer ressource
            buffer: {},
        },
        {
            // And the storage buffer?
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: "read-only-storage",
                hasDynamicOffset: false,
            },
        },],
});

const materialGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            // The texture
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {},
        },
        {
            // And the sampler
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
        },],
});

const quadrilateralMaterial = await Material.create(device, "floor.jpg", materialGroupLayout);
if (!quadrilateralMaterial) {
    throw new Error("Could not create quadriliteral material")
}

const triangleMaterial = await Material.create(device, "hugo.jpg", materialGroupLayout);
if (!triangleMaterial) {
    throw new Error("Could not create triangle material");
}


const modelBufferDescriptor: GPUBufferDescriptor = {
    // A model matrix has 16 float32s (4x4) which is 16 * 4 bytes = 64 bytes per triangle
    // We just say we want a lot of triangles and need a lot of space (1024)
    size: 64 * 1024,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
};

const objectBuffer = device.createBuffer(modelBufferDescriptor);

// Make depth buffer resources
// Depth stencil
const depthStencilState: GPUDepthStencilState = {
    format: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less-equal",
};

const depthStencilBufferDescriptor: GPUTextureDescriptor = {
    size: {
        width: canvas.width,
        height: canvas.height,
        depthOrArrayLayers: 1,
    },
    format: "depth24plus-stencil8",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,

};
const depthStencilBuffer = device.createTexture(depthStencilBufferDescriptor);
const depthStencilView = depthStencilBuffer.createView({
    format: "depth24plus-stencil8",
    dimension: "2d",
    aspect: "all",
});
const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
    view: depthStencilView,
    // 1 is the maximum depth and we want to draw things that are closer than that
    depthClearValue: 1,
    depthLoadOp: "clear",
    depthStoreOp: "store",
    // Apprarently the stencil ops are required in the depth stencil context even though it is not by the type
    stencilLoadOp: "clear",
    stencilStoreOp: "discard",
};

const uniformBuffer = device.createBuffer({
    // 4x4 Matrix -> 4x4xfloat32 -> 4x4x4 bytes
    // 2 matrices -> 4x4x4x2
    size: 4 * 4 * 4 * 2,
    // Use as uniform and write data to it
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// Which things go into the group
const frameBindGroup = device.createBindGroup({
    layout: frameGroupLayout,
    entries: [
        {
            // Uniformbuffer
            binding: 0,
            resource: {
                buffer: uniformBuffer,
            },
        },
        {
            // Storage buffer
            binding: 1,
            resource: {
                buffer: objectBuffer,
            },
        },],
});

const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [frameGroupLayout, materialGroupLayout,],
})

const pipeline = await device.createRenderPipelineAsync({
    vertex: {
        module: shaderModule,
        entryPoint: "vertex_main",
        buffers: [triangleMesh.bufferLayout,],
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [{ format }],
    },
    primitive: {
        topology: "triangle-list"
    },
    layout: pipelineLayout,
    depthStencil: depthStencilState,
});

const projection = mat4.create();
// 45 degree in radians 
const fieldOfView = Math.PI / 4;
const aspectRatio = canvas.width / canvas.height;
const distance = { near: .1, far: 10 };
mat4.perspective(projection, fieldOfView, aspectRatio, distance.near, distance.far);

let scene = Scene.create();
let moveForwardsAmount = 0;
let moveRightAmount = 0;
let moveUpAmount = 0;

let spinPlayerX = 0;
let spinPlayerY = 0;

// CONTROLS
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "q":
        case " ":
            moveUpAmount = .02;
            return;
        case "e":
        case "Shift":
            moveUpAmount = -.02;
            return;
        case "w":
            moveForwardsAmount = .02;
            return;
        case "a":
            moveRightAmount = -.02;
            return;
        case "s":
            moveForwardsAmount = -.02;
            return;
        case "d":
            moveRightAmount = .02;
            return;
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "q":
        case " ":
            moveUpAmount = 0;
            return;
        case "e":
        case "Shift":
            moveUpAmount = 0;
            return;
        case "w":
            moveForwardsAmount = 0;
            return;
        case "a":
            moveRightAmount = 0;
            return;
        case "s":
            moveForwardsAmount = 0;
            return;
        case "d":
            moveRightAmount = 0;
            return;
    }
});

function handleMouseMove(event: MouseEvent) {
    spinPlayerX = event.movementX / 5;
    spinPlayerY = event.movementY / 5;
}

document.addEventListener("pointerlockchange", () => {
    // It is locked
    if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", handleMouseMove);
        return;
    }

    document.removeEventListener("mousemove", handleMouseMove);
})

canvas.addEventListener("click", () => {

    if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
        return;
    }

    // Other click handling
})
// RENDER

const render = () => {
    scene = Scene.update(scene);
    if (moveForwardsAmount !== 0 || moveRightAmount !== 0 || moveUpAmount !== 0)
        scene = Scene.movePlayer(scene, moveForwardsAmount, moveRightAmount, moveUpAmount);

    if (spinPlayerX !== 0 || spinPlayerY !== 0) {
        scene = Scene.spinPlayer(scene, spinPlayerX, spinPlayerY);
        spinPlayerX = spinPlayerY = 0;
    }

    const view = scene.renderData.viewTransform;

    device.queue.writeBuffer(objectBuffer, 0, scene.renderData.modelTransforms, 0, scene.renderData.modelTransforms.length);
    device.queue.writeBuffer(uniformBuffer, 0, view as ArrayBuffer);
    device.queue.writeBuffer(uniformBuffer, 64, projection as ArrayBuffer);


    // Create a pass
    // "Basically a command buffer"
    const commandEncoder = device.createCommandEncoder();
    // To access images we create image views on them (like vulkan?)(?)
    const textureView = context.getCurrentTexture().createView();
    // To record drawing commands we have a render pass encoder
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: { r: .5, g: .5, b: .5, a: 1 },
            loadOp: "clear",
            storeOp: "store",
        },],
        depthStencilAttachment,
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, frameBindGroup);

    // Triangles
    renderPass.setVertexBuffer(0, triangleMesh.buffer);
    // This binds the triangle material to the material bind group
    renderPass.setBindGroup(1, triangleMaterial.bindGroup);
    renderPass.draw(3, scene.renderData.countTriangles, 0, 0);

    // Quadrilaterals
    renderPass.setVertexBuffer(0, quadrilateralMesh.buffer);
    // This binds the quadrilateral material to the material bind group
    renderPass.setBindGroup(1, quadrilateralMaterial.bindGroup);

    // 6 is count of vertices
    renderPass.draw(6, scene.renderData.countQuadrilaterals, 0, scene.renderData.countTriangles);

    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Empty export to make file a module and allow async without a function (cheap trick)
export { }

console.log("Completed 🏁")