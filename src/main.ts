// Try this with fable later 🤔 https://fable.io/docs/communicate/js-from-fable.html#importing-relative-paths-when-using-an-output-directory
import shader from "./shaders.wgsl?raw";
import * as TriangleMesh from "./triangleMesh";
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
const triangleMesh = TriangleMesh.create(device);

const material = await Material.create(device, "hugo.jpg");
if (!material) {
    throw new Error("Could not create material");
}


const uniformBuffer = device.createBuffer({
    // 4x4 Matrix -> 4x4xfloat32 -> 4x4x4 bytes
    // 3 matrices -> 4x4x4x3
    size: 4 * 4 * 4 * 3,
    // Use as uniform and write data to it
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// Description/Layout of the binding groups?
const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        // Tell it is a buffer ressource
        buffer: {},
    }, {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
    }, {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
    },],
});

// Which things go into the group
const bindGroup = device.createBindGroup({
    entries: [{
        binding: 0,
        resource: {
            buffer: uniformBuffer,
        },
    }, {
        binding: 1,
        resource: material.view,
    }, {
        binding: 2,
        resource: material.sampler,
    },],
    layout: bindGroupLayout,
});

const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
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
    layout: pipelineLayout,
    primitive: {
        topology: "triangle-list"
    }
});

const projection = mat4.create();
// 45 degree in radians 
const fieldOfView = Math.PI / 4;
const aspectRatio = canvas.width / canvas.height;
const distance = { near: .1, far: 10 };
mat4.perspective(projection, fieldOfView, aspectRatio, distance.near, distance.far);

let scene = Scene.create();
let forwardsAmount = 0;
let rightAmount = 0;

let spinPlayerX = 0;
let spinPlayerY = 0;

// CONTROLS
document.addEventListener("keydown", (event) => {

    console.log(event.code);
    switch (event.code) {
        case "KeyW":
            forwardsAmount = .02;
            return;
        case "KeyA":
            rightAmount = -.02;
            return;
        case "KeyS":
            forwardsAmount = -.02;
            return;
        case "KeyD":
            rightAmount = .02;
            return;
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.code) {
        case "KeyW":
            forwardsAmount = 0;
            return;
        case "KeyA":
            rightAmount = 0;
            return;
        case "KeyS":
            forwardsAmount = 0;
            return;
        case "KeyD":
            rightAmount = 0;
            return;
    }
});

document.addEventListener("mousemove", (event) => {
    spinPlayerX = event.movementX / 5;
    spinPlayerY = -event.movementY / 5;
});

canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
})
// RENDER

const render = () => {
    scene = Scene.update(scene);
    if (forwardsAmount !== 0 || rightAmount !== 0)
        scene = Scene.movePlayer(scene, forwardsAmount, rightAmount);

    if (spinPlayerX !== 0 || spinPlayerY !== 0) {
        scene = Scene.spinPlayer(scene, spinPlayerX, spinPlayerY);
        spinPlayerX = spinPlayerY = 0;
    }

    const view = scene.player.view;

    device.queue.writeBuffer(uniformBuffer, 64, view as ArrayBuffer);
    device.queue.writeBuffer(uniformBuffer, 128, projection as ArrayBuffer);

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
        },]
    });

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, triangleMesh.buffer);
    scene.triangles.forEach(({ model }) => {
        // Model transform
        device.queue.writeBuffer(uniformBuffer, 0, model as ArrayBuffer);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.draw(3, 1, 0, 0);
    });

    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Empty export to make file a module and allow async without a function (cheap trick)
export { }

console.log("Completed 🏁")