// Try this with fable later 🤔 https://fable.io/docs/communicate/js-from-fable.html#importing-relative-paths-when-using-an-output-directory
import shader from "./shaders.wgsl?raw";
import * as TriangleMesh from "./triangleMesh";

console.log("👋")
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

const bindGroupLayout = device.createBindGroupLayout({
    entries: [],
});

const bindGroup = device.createBindGroup({
    entries: [],
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
renderPass.setBindGroup(0, bindGroup);
renderPass.setVertexBuffer(0, triangleMesh.buffer);
// 3 Points, 1 instance, 0 index (first) of vertex, first index (0)
renderPass.draw(3, 1, 0, 0);
renderPass.end();

device.queue.submit([commandEncoder.finish()]);


// Empty export to make file a module and allow async without a function (cheap trick)
export { }

console.log("Completed 🏁")