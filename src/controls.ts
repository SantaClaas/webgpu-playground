
export function configureControls(canvas: HTMLCanvasElement) {

    let moveForwardsAmount = 0;
    let moveRightAmount = 0;
    let moveUpAmount = 0;

    let spinPlayerX = 0;
    let spinPlayerY = 0;

    function getUserInputs() {
        const getUserInputs = {
            moveForwardsAmount,
            moveRightAmount,
            moveUpAmount,
            spinPlayerX,
            spinPlayerY,
        };

        // Reset spin
        spinPlayerX = spinPlayerY = 0;

        return getUserInputs;
    }


    // CONTROLS
    document.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "Q":
            case "q":
            case " ":
                moveUpAmount = .02;
                return;
            case "E":
            case "e":
            case "Shift":
                moveUpAmount = -.02;
                return;
            case "W":
            case "w":
                moveForwardsAmount = .02;
                return;
            case "A":
            case "a":
                moveRightAmount = -.02;
                return;
            case "S":
            case "s":
                moveForwardsAmount = -.02;
                return;
            case "D":
            case "d":
                moveRightAmount = .02;
                return;
        }
    });

    document.addEventListener("keyup", (event) => {

        switch (event.key) {
            case "Q":
            case "q":
            case " ":
                moveUpAmount = 0;
                return;
            case "E":
            case "e":
            case "Shift":
                moveUpAmount = 0;
                return;
            case "W":
            case "w":
                moveForwardsAmount = 0;
                return;
            case "A":
            case "a":
                moveRightAmount = 0;
                return;
            case "S":
            case "s":
                moveForwardsAmount = 0;
                return;
            case "D":
            case "d":
                moveRightAmount = 0;
                return;
        }
    });

    function handleMouseMove(event: MouseEvent) {
        spinPlayerX = event.movementX / 5;
        spinPlayerY = event.movementY / 5;
    }

    document.addEventListener("pointerlockchange", () => {
        // It is locked
        if (document.pointerLockElement === canvas) {
            document.addEventListener("mousemove", handleMouseMove);
            return;
        }

        document.removeEventListener("mousemove", handleMouseMove);
    })

    canvas.addEventListener("click", () => {

        if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
            return;
        }

        // Other click handling
    });


    return getUserInputs;
}