import { mat4, vec3 } from "gl-matrix";

export interface Cube {
    position: vec3;
    model: mat4;
}

export function create(position: vec3): Cube {

    return {
        position,
        model: mat4.create(),
    }
}

export function update({ position }: Cube): Cube {
    // Not doing anything. We might want in the future
    const model = mat4.create();
    mat4.translate(model, model, position);
    return { position, model };
}