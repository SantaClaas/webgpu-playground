// Try this with fable later 🤔 https://fable.io/docs/communicate/js-from-fable.html#importing-relative-paths-when-using-an-output-directory
import shader from "./shaders.wgsl?raw";
import * as Material from "./material";
import { mat4 } from "gl-matrix";
import * as Scene from "./scene";
import { configureControls } from "./controls";
import { createDepthStencil } from "./depthStencil";
import * as Mesh from "./mesh"
import {setUpFrameCounter} from "./frameCounter"

// Pixel format of the screen and the color buffer
const format: GPUTextureFormat = "bgra8unorm";
function configureCanvas(canvas: HTMLCanvasElement, device: GPUDevice) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw Error("Expected to get context from canvas");
    }

    context.configure({
        device,
        format,
        alphaMode: "opaque"
    });

    return context;
}


function createProjection(aspectRatio: number) {

    const projection = mat4.create();
    // 45 degree in radians 
    const fieldOfView = Math.PI / 4;
    const distance = { near: .1, far: 20 };
    mat4.perspective(projection, fieldOfView, aspectRatio, distance.near, distance.far);

    return projection;
}

console.log("🏃💨🏎️💨");

if (!navigator.gpu) {
    console.error("WebGPU is not supported");
    throw Error("WebGPU is not supported yet 😔");
}

const canvas = document.querySelector("canvas");

if (!canvas) {
    throw Error("Expected to have one canvas element");
}


// Wrapper around the physical graphics card to query it's properties like performance or limits
const adapter = await navigator.gpu.requestAdapter();

const device = await adapter?.requestDevice();
if (!device) {
    throw Error("Need device to run this code");
}

const context = configureCanvas(canvas, device);

// Create pipeline
const shaderModule = device.createShaderModule({
    code: shader
})

// Bind groups & pipeline -> render pass ?
// MESHES
const triangleMesh = Mesh.createTriangleMesh();
const quadrilateralMesh = Mesh.createQuadrilateralMesh();
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

const [floorImage, hugoImage] = await Promise.all([Material.fetchTexture("Blazor.png"), Material.fetchTexture("hugo.jpg")]);

if (!floorImage) {
    throw new Error("Could not load quadrilaterals image");
}

if (!hugoImage) {
    throw new Error("Could not load image for triangles");
}

const quadrilateralMaterial = await Material.create(device, floorImage, materialGroupLayout);

const triangleMaterial = await Material.create(device, hugoImage, materialGroupLayout);

const modelBufferDescriptor: GPUBufferDescriptor = {
    // A model matrix has 16 float32s (4x4) which is 16 * 4 bytes = 64 bytes per triangle
    // We just say we want a lot of triangles and need a lot of space (1024)
    size: 64 * 1024,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
};

const objectBuffer = device.createBuffer(modelBufferDescriptor);

const { depthStencilAttachment, depthStencilState } = createDepthStencil(device, canvas.width, canvas.height);

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
        buffers: [Mesh.createMeshBufferLayout(triangleMesh)],
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [{ format }],
    },
    primitive: {
        topology: "triangle-list",
    },
    layout: pipelineLayout,
    depthStencil: depthStencilState,
});

const getUserInputs = configureControls(canvas);

let scene = Scene.create();
const aspectRatio = canvas.width / canvas.height;
const projection = createProjection(aspectRatio);

// Buffers
const triangleMeshBuffer = Mesh.createMeshBuffer(device, triangleMesh);
const quadrilateralMeshBuffer = Mesh.createMeshBuffer(device, quadrilateralMesh);
// RENDER
const updateTime = setUpFrameCounter();
const render = (timestamp: DOMHighResTimeStamp) => {
    updateTime(timestamp);

    scene = Scene.update(scene);

    const { moveForwardsAmount, moveRightAmount, moveUpAmount, spinPlayerX, spinPlayerY } = getUserInputs();
    if (moveForwardsAmount !== 0 || moveRightAmount !== 0 || moveUpAmount !== 0)
        scene = Scene.movePlayer(scene, moveForwardsAmount, moveRightAmount, moveUpAmount);

    if (spinPlayerX !== 0 || spinPlayerY !== 0) {
        scene = Scene.spinPlayer(scene, spinPlayerX, spinPlayerY);
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
    renderPass.setVertexBuffer(0, triangleMeshBuffer);
    // This binds the triangle material to the material bind group
    renderPass.setBindGroup(1, triangleMaterial.bindGroup);
    renderPass.draw(3, scene.renderData.countTriangles, 0, 0);

    // Quadrilaterals
    renderPass.setVertexBuffer(0, quadrilateralMeshBuffer);
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
