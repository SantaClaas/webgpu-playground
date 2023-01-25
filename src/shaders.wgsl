// Holds the transformation matrices
struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

// Defining it as uniform makes it like a global value
@binding(0) @group(0) var<uniform> transform_uniform_buffer_object : TransformData;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>,
};

@vertex
fn vertex_main(@location(0) vertex_position: vec3<f32>, @location(1) vertex_color : vec3<f32>) -> Fragment {

    var output : Fragment;
    // X, Y, Z from buffer and W as 1
    output.Position = 
        // Make things closer bigger and further away smaller
        transform_uniform_buffer_object.projection 
            // Set to world to view coordinates (the camera point of view coordinates system)
            * transform_uniform_buffer_object.view
            // First set to from model coordinates to world coordinates
            * transform_uniform_buffer_object.model
            * vec4<f32>(vertex_position, 1);

    // Append alpha channel of 1 to color to make it vector 4
    output.Color = vec4<f32>(vertex_color, 1);

    // Transform data

    return output;
}

@fragment
fn fragment_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}