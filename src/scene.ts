import * as Triangle from "./triangle";
import * as Camera from "./camera";
import { vec3, mat4 } from "gl-matrix";

interface Scene {
    triangles: Triangle.Triangle[],
    player: Camera.Camera,
    objectData: Float32Array,
    triangleCount: number,
}

export function create(): Scene {

    const triangles = [];
    const objectData = new Float32Array(16 * 1024);
    let triangleCount = 0;
    for (let y = -5, modelIndex = 0; y < 5; y++, modelIndex++) {
        const triangle = Triangle.create([2, y, 0], 0);
        triangles.push(triangle);

        // Set the values in the object data byte array that represents the matrices for the model?
        const matrix = mat4.create();
        // 16 because matrix is 4 x 4
        for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
            objectData[16 * modelIndex + byteIndex] = <number>matrix.at(byteIndex);
        }

        triangleCount++;
    }
    return {
        triangles,
        player: Camera.create([-2, 0, .5], 0, 0),
        objectData,
        triangleCount,
    };
}

export function update(scene: Scene): Scene {
    const { objectData } = scene;
    const triangles = scene.triangles.map((triangle, modelIndex) => {
        triangle = Triangle.update(triangle);

        // Side effect updating is bad. Need to change later 🙃
        // Update the corresponding model data
        for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
            objectData[16 * modelIndex + byteIndex] = <number>triangle.model.at(byteIndex);
        }

        return triangle;
    });

    return {
        ...scene,
        objectData,
        triangles,
        player: Camera.update(scene.player),
    }
}


export function spinPlayer(scene: Scene, deltaX: number, deltaY: number): Scene {

    const { eulers } = scene.player;
    eulers[2] -= deltaX;
    eulers[2] %= 360;

    eulers[1] = Math.min(
        89,
        Math.max(-89, eulers[1] + deltaY)
    );

    return {
        ...scene,
        player: { ...scene.player, eulers: eulers },
    };
}

export function movePlayer(scene: Scene, forwardsAmount: number, rightAmount: number): Scene {

    const { position, forwards, right } = scene.player;

    vec3.scaleAndAdd(position, position, forwards, forwardsAmount);
    vec3.scaleAndAdd(position, position, right, rightAmount);


    return { ...scene, player: { ...scene.player, position, forwards, right } };
}
