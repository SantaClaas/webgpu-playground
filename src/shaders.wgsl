// Holds the transformation matrices
struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

// Holds all the model data for each triangle?
struct ObjectData {
    model: array<mat4x4<f32>>,
}

// Defining it as uniform makes it like a global value
@binding(0) @group(0) var<uniform> transform_uniform_buffer_object : TransformData;
@binding(1) @group(0) var<storage, read> objects : ObjectData;

// The texture and sampler
@binding(0) @group(1) var material_texture : texture_2d<f32>;
@binding(1) @group(1) var texture_sampler : sampler;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TextureCoordinate : vec2<f32>,
};

@vertex
fn vertex_main(
    @builtin(instance_index) index_instance : u32,
    @location(0) vertex_position : vec3<f32>,
    @location(1) vertex_texture_coordinate : vec2<f32>) -> Fragment {

    var output : Fragment;
    // X, Y, Z from buffer and W as 1
    output.Position = 
        // Make things closer bigger and further away smaller
        transform_uniform_buffer_object.projection 
            // Set to world to view coordinates (the camera point of view coordinates system)
            * transform_uniform_buffer_object.view
            // First set to from model coordinates to world coordinates
            * objects.model[index_instance]
            * vec4<f32>(vertex_position, 1);

    // Append alpha channel of 1 to color to make it vector 4
    output.TextureCoordinate = vertex_texture_coordinate;

    // Transform data

    return output;
}

@fragment
fn fragment_main(@location(0) texture_coordinate : vec2<f32>) -> @location(0) vec4<f32> {
    let sampledValue = textureSample(material_texture, texture_sampler, texture_coordinate);
    // My naive implementation to make texture transparent based on alpha of texture
    if(sampledValue.w == 0){
        discard;
    }
    return sampledValue;
}