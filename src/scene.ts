import * as Triangle from "./triangle";
import * as Camera from "./camera";
import { vec3 } from "gl-matrix";

interface Scene {
    triangles: Triangle.Triangle[],
    player: Camera.Camera,
}

export function create(): Scene {
    return {
        triangles: [
            Triangle.create([2, 0, 0], 0),
        ],
        player: Camera.create([-2, 0, .5], 0, 0),
    }
}

export function update({ triangles, player }: Scene): Scene {
    return {
        triangles: triangles.map(Triangle.update),
        player: Camera.update(player),
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
