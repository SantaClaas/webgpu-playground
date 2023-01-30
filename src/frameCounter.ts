export function setUpFrameCounter() {

    const frameCounter = document.querySelector("p");
    let lastTimeStamp = 0;
    function updateTime(timeStamp: DOMHighResTimeStamp) {
        frameCounter!.innerText = Math.floor(1000 / (timeStamp - lastTimeStamp)).toString();

        lastTimeStamp = timeStamp;
    }

    return updateTime;
}