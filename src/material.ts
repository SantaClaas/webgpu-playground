interface Material {
    texture: GPUTexture,
    view: GPUTextureView,
    sampler: GPUSampler,
}

export async function create(device: GPUDevice, url: string) : Promise<Material | null> {
    //TODO move outside of create https://github.com/santaclaas.png
    // https://scontent-dus1-1.cdninstagram.com/v/t51.2885-15/38924142_1084915804990997_6341342835417022464_n.jpg?stp=dst-jpg_e35&_nc_ht=scontent-dus1-1.cdninstagram.com&_nc_cat=105&_nc_ohc=v72Kv8Uh1WIAX_tuXyf&edm=ACWDqb8BAAAA&ccb=7-5&ig_cache_key=MTg1MDQ5NzI5ODQ5NDk5MjUxOQ%3D%3D.2-ccb7-5&oh=00_AfCgKhyo3U6Z6MXz-8tuJAIs4lIbIT96C9-rlWyppisEPA&oe=63D789E7&_nc_sid=1527a3
    let response;
    try {

        response = await fetch(url);
    } catch (error) {
        console.error("Could not fetch image for texture", error);
        return null;
    }

    const blob = await response.blob();
    const imageData = await createImageBitmap(blob);

    const texture = await loadImageBitmap(device, imageData);
    const viewDescriptor: GPUTextureViewDescriptor = {
        format: "rgba8unorm",
        dimension: "2d",
        // What we want to view
        aspect: "all",
    };

    const view = texture.createView(viewDescriptor);

    // Create sampler
    const samperDescriptor : GPUSamplerDescriptor = {
        addressModeU: "repeat",
        addressModeV: "repeat",
        magFilter: "linear",
        minFilter: "nearest",
        mipmapFilter: "nearest",
        maxAnisotropy: 1,
    };

    const sampler = device.createSampler(samperDescriptor);

    return {
        texture,
        view,
        sampler,
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