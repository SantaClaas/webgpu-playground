import { vec3, mat4 } from "gl-matrix"

export interface Quadrilateral {
    position: vec3;
    model: mat4;
}

export function create(position: vec3): Quadrilateral {
    return {
        position,
        model: mat4.create(),
    };
}

export function update({ position }: Quadrilateral): Quadrilateral {
    // Not doing anything. We might want in the future
    const model = mat4.create();
    mat4.translate(model, model, position);
    return { position, model };
}