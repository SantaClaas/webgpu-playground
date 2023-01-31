import { mat4, vec3 } from "gl-matrix";
import { degreeToRadian } from "./mathy";

export interface Cube {
    position: vec3;
    model: mat4;
    // IDK what eulers is from the example with the triangle so I just save it like this
    rotationDegree: number;
}

export function create(position: vec3): Cube {

    return {
        rotationDegree: 0,
        position,
        model: mat4.create(),
    }
}

export function update({ position, rotationDegree }: Cube): Cube {
    rotationDegree += .01;
    rotationDegree %= 360;
    
    
    const model = mat4.create();
    mat4.translate(model, model, position);
    mat4.rotate(model, model, degreeToRadian(rotationDegree), [1, 1, 1]);
    const scale = 8;
    mat4.scale(model, model, [scale, scale, scale])


    return { position, model, rotationDegree };
}