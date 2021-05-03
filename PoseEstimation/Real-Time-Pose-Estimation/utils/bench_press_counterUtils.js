let minPoseConfidence = 0.15;

let w = 432;
let h = 368;

let countLeftPresses = 0;
let pressLeftPos = 0;
let prevPressLeftPos = 0;

let countRightPresses = 0;
let pressRightPos = 0;
let prevPressRightPos = 0;

export function anglePoints(a, b, c) {
    let ba = [a[0] - b[0], a[1] - b[1]];
    let bc = [c[0] - b[0], c[1] - b[1]];
    let cosineAngle = (ba[0] * bc[0] + ba[1] * bc[1]) / (Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1]) * Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]));
    let angle = Math.acos(cosineAngle);

    return angle / Math.PI * 180;
}

export function benchPressLeftCounter(currentPose) {
    let pressLeftAngle = 0;
    if (currentPose[6]['score'] > minPoseConfidence && currentPose[8]['score'] > minPoseConfidence && currentPose[10]['score'] > minPoseConfidence){
        let center6 = [currentPose[6]['position']['x'] * w, currentPose[6]['position']['y'] * h]; // left shoulder
        let center8 = [currentPose[8]['position']['x'] * w, currentPose[8]['position']['y'] * h]; // left elbow
        let center10 = [currentPose[10]['position']['x'] * w, currentPose[10]['position']['y'] * h]; // left palm
        pressLeftAngle = anglePoints(center6, center8, center10);

        if (pressLeftAngle <= 50) {
            pressLeftPos = 1;
        } else {
            pressLeftPos = 0;
        }
        if (prevPressLeftPos - pressLeftPos == 1) {
            countLeftPresses +=1;
        }
        prevPressLeftPos = pressLeftPos;
    }

    return ([pressLeftAngle, pressLeftPos, countLeftPresses]);
}

export function benchPressRightCounter(currentPose) {
    let pressRightAngle = 0;
    if (currentPose[5]['score'] > minPoseConfidence && currentPose[7]['score'] > minPoseConfidence && currentPose[9]['score'] > minPoseConfidence){
        let center5 = [currentPose[5]['position']['x'] * w, currentPose[5]['position']['y'] * h]; // right shoulder
        let center7 = [currentPose[7]['position']['x'] * w, currentPose[7]['position']['y'] * h]; // right elbow
        let center9 = [currentPose[9]['position']['x'] * w, currentPose[9]['position']['y'] * h]; // right palm
        pressRightAngle = anglePoints(center5, center7, center9);

        if (pressRightAngle <= 50) {
            pressRightPos = 1;
        } else {
            pressRightPos = 0;
        }
        if (prevPressRightPos - pressRightPos == 1) {
            countRightPresses +=1;
        }
        prevPressRightPos = pressRightPos;
    }

    return ([pressRightAngle, pressRightPos, countRightPresses]);
}
