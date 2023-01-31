import { Camera } from "./camera";

export function saveCamera(location: Camera) {
    localStorage.setItem("camera", JSON.stringify(location));
}

export function loadCamera() {
    const cameraJson = localStorage.getItem("camera");

    // Pray that this is valid and we didn't change properties 🙏😅
    return cameraJson ? JSON.parse(cameraJson) as Camera : null;
}