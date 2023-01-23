struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>
}

@vertex
fn vertex_main(@builtin(vertex_index) vertex_index: u32) -> Fragment {
    var positions = array<vec2<f32>, 3> (
        // Position for vertex at index 0
        vec2<f32>(0, .5),
        // Position for vertex at index 1
        vec2<f32>(-.5, .5),
        // Position for vertex at index 2
        vec2<f32>(.5, .5),
    );

    // Color array for each vertex
    var colors = array<vec3<f32>, 3> (
        vec3<f32>(1, 0, 0),
        vec3<f32>(0, 1, 0),
        vec3<f32>(0, 0, 1),
    );

    var output : Fragment;
    output.Position = vec4<f32>(positions[vertex_index], 0, 1);
    // Add alpha channel of 1 to color to make it vector 4
    output.Color = vec4<f32>(colors[vertex_index], 1);

    return output;
}

@fragment
fn fragment_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}