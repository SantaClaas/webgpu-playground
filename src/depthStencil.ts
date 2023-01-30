

export function createDepthStencil(device: GPUDevice, width: number, height: number) {
    // Make depth buffer resources
    // Depth stencil
    const depthStencilState: GPUDepthStencilState = {
        format: "depth24plus-stencil8",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
    };

    const depthStencilBufferDescriptor: GPUTextureDescriptor = {
        size: {
            width,
            height,
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


    return { depthStencilAttachment, depthStencilState };
}