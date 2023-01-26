import { vec3, mat4, vec2 } from "gl-matrix"
import { degreeToRadian } from "./mathy";

export interface Camera {
    position: vec3;
    eulers: vec3;
    view: mat4;
    forwards: vec3;
    right: vec3;
    up: vec3;
}

export function create(position: vec3, theta: number, phi: number): Camera {

    const eulers: vec3 = [0, phi, theta];
    return {
        position,
        eulers,
        view: mat4.create(),
        forwards: vec3.create(),
        right: vec3.create(),
        up: vec3.create(),
    };
}

export function update({ eulers, right, up, position }: Camera): Camera {
    const forwards: vec3 = [
        Math.cos(degreeToRadian(eulers[2])) * Math.cos(degreeToRadian(eulers[1])),
        Math.sin(degreeToRadian(eulers[2])) * Math.cos(degreeToRadian(eulers[1])),
        Math.sin(degreeToRadian(eulers[1])),
    ];

    vec3.cross(right, forwards, [0, 0, 1]);
    vec3.cross(up, right, forwards);

    const target = vec3.create();
    vec3.add(target, position, forwards);
    const view = mat4.create();
    mat4.lookAt(view, position, target, up);

    return { position, eulers, view, forwards, right, up };
}
