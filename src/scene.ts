import * as Triangle from "./triangle";
import * as Camera from "./camera";
import { vec3, mat4 } from "gl-matrix";
import * as Quadrilateral from "./quadrilateral";

interface RenderData {
    viewTransform: mat4;
    modelTransforms: Float32Array;
    countTriangles: number;
    countQuadrilaterals: number;
}

interface Scene {
    triangles: Triangle.Triangle[],
    quadrilaterals: Quadrilateral.Quadrilateral[],
    player: Camera.Camera,
    objectData: Float32Array,
    triangleCount: number,
    quadLiteralsCount: number,
    renderData: RenderData,
}
function createTriangles() {
    const triangles = [];
    const objectData = new Float32Array(16 * 1024);
    for (let y = -5, modelIndex = 0; y <= 5; y++, modelIndex++) {
        const triangle = Triangle.create([2, y, 0], 0);
        triangles.push(triangle);

        // Translate to initial position
        // This could probably be put into the create function
        mat4.translate(triangle.model, triangle.model, triangle.position);

        // Set the values in the object data byte array that represents the matrices for the model?
        const matrix = mat4.create();
        // 16 because matrix is 4 x 4
        for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
            objectData[16 * modelIndex + byteIndex] = <number>matrix.at(byteIndex);
        }
    }

    return { triangles, objectData };
}

function createQuadrilaterals(objectData: Float32Array, offset: number) {
    const quadrilaterals = [];

    // Assuming offset is >= 0
    for (let x = -10, modelIndex = offset; x <= 10; x++) {
        for (let y = -10; y <= 10; y++, modelIndex++) {
            const quadliteral = Quadrilateral.create([x, y, 0]);
            quadrilaterals.push(quadliteral);
            // Translate to initial position
            // This could probably be put into the create function
            mat4.translate(quadliteral.model, quadliteral.model, quadliteral.position);
            // Set the values in the object data byte array that represents the matrices for the model?
            const matrix = mat4.create();
            // 16 because matrix is 4 x 4
            for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
                objectData[16 * modelIndex + byteIndex] = <number>quadliteral.model.at(byteIndex); //<number>matrix.at(byteIndex);
            }
        }


    }
    console.log(quadrilaterals.length)
    return { quadrilaterals, objectData };
}
export function create(): Scene {
    const { triangles, objectData } = createTriangles();
    // Bad side effect on object data here but will fix later™
    const { quadrilaterals, objectData: newObjectData } = createQuadrilaterals(objectData, triangles.length);
    const playerCamera = Camera.create([-2, 0, .5], 0, 0);
    return {
        triangles,
        player: playerCamera,
        objectData: newObjectData,
        triangleCount: triangles.length,
        quadrilaterals,
        quadLiteralsCount: quadrilaterals.length,
        renderData: {
            countQuadrilaterals: quadrilaterals.length,
            countTriangles: triangles.length,
            modelTransforms: newObjectData,
            viewTransform: playerCamera.view,
        },
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

    // We don't update quadrilaterals because they don't move and we translated them to their original position initally

    const newPlayerCamera = Camera.update(scene.player);
    // We don't update the quadrilaterals
    return {
        ...scene,
        objectData,
        triangles,
        // quadrilaterals,
        player: newPlayerCamera,

        renderData: {
            ...scene.renderData,
            modelTransforms: objectData,
            viewTransform: newPlayerCamera.view,
        }
    }
}


export function spinPlayer(scene: Scene, deltaX: number, deltaY: number): Scene {

    const { eulers } = scene.player;
    eulers[2] -= deltaX;
    eulers[2] %= 360;

    eulers[1] = Math.min(
        89,
        Math.max(-89, eulers[1] - deltaY)
    );

    return {
        ...scene,
        player: { ...scene.player, eulers: eulers },
    };
}

export function movePlayer(scene: Scene, forwardsAmount: number, rightAmount: number, upAmount: number): Scene {

    const { position, forwards, right, up } = scene.player;

    vec3.scaleAndAdd(position, position, forwards, forwardsAmount);
    vec3.scaleAndAdd(position, position, right, rightAmount);
    vec3.scaleAndAdd(position, position, up, upAmount);


    return { ...scene, player: { ...scene.player, position, forwards, right, up } };
}
