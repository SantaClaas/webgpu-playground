import { vec3, mat4 } from "gl-matrix"
import { degreeToRadian } from "./mathy";

export interface Triangle {
    position: vec3;
    eulers: vec3;
    model: mat4;
}

export function create(position: vec3, theta: number): Triangle {
    const eulers = vec3.create();
    eulers[2] = theta;
    return {
        position,
        eulers,
        model: mat4.create(),
    };
}

export function update({ eulers, position }: Triangle): Triangle {
    eulers[2] += 1;
    eulers[2] %= 360;

    const model = mat4.create();
    mat4.translate(model, model, position);
    mat4.rotateZ(model, model, degreeToRadian(eulers[2]));
    return { position, eulers, model };
}