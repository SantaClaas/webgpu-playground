struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>
}

@vertex
fn vertex_main(@location(0) vertex_position: vec2<f32>, @location(1) vertex_color : vec3<f32>) -> Fragment {

    var output : Fragment;
    // X, Y from buffer and 0 as Z and W as 1
    output.Position = vec4<f32>(vertex_position, 0, 1);
    // Append alpha channel of 1 to color to make it vector 4
    output.Color = vec4<f32>(vertex_color, 1);

    return output;
}

@fragment
fn fragment_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}