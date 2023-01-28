interface Material {
    texture: GPUTexture,
    view: GPUTextureView,
    sampler: GPUSampler,
    bindGroup: GPUBindGroup,
}
export async function fetchTexture(url:string) : Promise<ImageBitmap | null> {
    
    let response;
    try {

        response = await fetch(url);
    } catch (error) {
        console.error("Could not fetch image for texture", error);
        return null;
    }

    const blob = await response.blob();
    const imageData = await createImageBitmap(blob);

    return imageData;
}
export async function create(device: GPUDevice, imageData : ImageBitmap, bindGroupLayout: GPUBindGroupLayout): Promise<Material> {
    
    const texture = await loadImageBitmap(device, imageData);
    const viewDescriptor: GPUTextureViewDescriptor = {
        format: "rgba8unorm",
        dimension: "2d",
        // What we want to view
        aspect: "all",
    };

    const view = texture.createView(viewDescriptor);

    // Create sampler
    const samplerDescriptor: GPUSamplerDescriptor = {
        addressModeU: "repeat",
        addressModeV: "repeat",
        magFilter: "linear",
        minFilter: "nearest",
        mipmapFilter: "nearest",
        maxAnisotropy: 1,
    };

    const sampler = device.createSampler(samplerDescriptor);
    const bindGroup = device.createBindGroup({
        entries: [
            {
                binding: 0,
                resource: view,
            },
            {
                binding: 1,
                resource: sampler,
            },],
        layout: bindGroupLayout,
    });
    return {
        texture,
        view,
        sampler,
        bindGroup,
    };
}


async function loadImageBitmap(device: GPUDevice, imageData: ImageBitmap) {
    const textureDescriptor: GPUTextureDescriptor = {
        size: {
            width: imageData.width,
            height: imageData.height,
        },
        format: "rgba8unorm",
        // Sometimes it complains and we need to use render attachment apparently
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    };

    const texture = device.createTexture(textureDescriptor);
    const source: GPUImageCopyExternalImage = {
        source: imageData,
    };

    const destination: GPUImageCopyTextureTagged = {
        texture,
    };

    device.queue.copyExternalImageToTexture(source, destination, textureDescriptor.size);
    return texture;
}