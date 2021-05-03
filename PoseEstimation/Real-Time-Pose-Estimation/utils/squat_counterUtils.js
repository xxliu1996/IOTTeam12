let minPoseConfidence = 0.15;

let w = 432;
let h = 368;

let countLeftSquats = 0;
let squatLeftPos = 0;
let prevSquatLeftPos = 0;

let countRightSquats = 0;
let squatRightPos = 0;
let prevSquatRightPos = 0;

export function anglePoints(a, b, c) {
    let ba = [a[0] - b[0], a[1] - b[1]];
    let bc = [c[0] - b[0], c[1] - b[1]];
    let cosineAngle = (ba[0] * bc[0] + ba[1] * bc[1]) / (Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1]) * Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]));
    let angle = Math.acos(cosineAngle);

    return angle / Math.PI * 180;
}

export function squatLeftCounter(currentPose) {
    let squatLeftAngle = 0;
    if (currentPose[12]['score'] > minPoseConfidence && currentPose[14]['score'] > minPoseConfidence && currentPose[16]['score'] > minPoseConfidence){
        let center12 = [currentPose[12]['position']['x'] * w, currentPose[12]['position']['y'] * h]; // left hip
        let center14 = [currentPose[14]['position']['x'] * w, currentPose[14]['position']['y'] * h]; // left knee
        let center16 = [currentPose[16]['position']['x'] * w, currentPose[16]['position']['y'] * h]; // left ankle
        squatLeftAngle = anglePoints(center12, center14, center16);

        if (squatLeftAngle <= 80) {
            squatLeftPos = 1;
        } else {
            squatLeftPos = 0;
        }
        if (prevSquatLeftPos - squatLeftPos == 1) {
            countLeftSquats +=1;
        }
        prevSquatLeftPos = squatLeftPos;
    }

    return ([squatLeftAngle, squatLeftPos, countLeftSquats]);
}

export function squatRightCounter(currentPose) {
    let squatRightAngle = 0;
    if (currentPose[11]['score'] > minPoseConfidence && currentPose[13]['score'] > minPoseConfidence && currentPose[15]['score'] > minPoseConfidence){
        let center11 = [currentPose[11]['position']['x'] * w, currentPose[11]['position']['y'] * h]; // right hip
        let center13 = [currentPose[13]['position']['x'] * w, currentPose[13]['position']['y'] * h]; // right knee
        let center15 = [currentPose[15]['position']['x'] * w, currentPose[15]['position']['y'] * h]; // right ankle
        squatRightAngle = anglePoints(center12, center14, center16);

        if (squatRightAngle <= 80) {
            squatRightPos = 1;
        } else {
            squatRightPos = 0;
        }
        if (prevSquatRightPos - squatRightPos == 1) {
            countRightSquats +=1;
        }
        prevSquatRightPos = squatRightPos;
    }

    return ([squatRightAngle, squatRightPos, countRightSquats]);
}
