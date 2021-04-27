# Useful Resources for Pose Estimation
## Two Pose Estimation Github Repo
> https://github.com/xingyizhou/pose-hg-3d \
  https://github.com/facebookresearch/VideoPose3D

## Real-time Pose Estimation
> https://blog.tensorflow.org/2018/05/real-time-human-pose-estimation-in.html \
  https://towardsdatascience.com/realtime-multiple-person-2d-pose-estimation-using-tensorflow2-x-93e4c156d45f \
  https://ai.googleblog.com/2020/08/on-device-real-time-body-pose-tracking.html
  https://github.com/abishekvashok/Rep-Counter

## How to Install PyTroch & Torchvision on RaspberryPi
> https://medium.com/analytics-vidhya/quick-setup-instructions-for-installing-pytorch-and-fastai-on-raspberry-pi-4-5ffbe45e0ae3 \
whl files of torch and torchvision can be found here: https://github.com/Kashu7100/pytorch-armv7l

## How to activate/deactivate virtual environment of python3
> source env/bin/activate \
  deactivate

### Detectron2 Github Repo
> https://github.com/facebookresearch/detectron2

### Command to extract poses from any input mp4 video
> cd inference \
  python3 infer_video_d2.py \
     --cfg COCO-Keypoints/keypoint_rcnn_R_101_FPN_3x.yaml \
     --output-dir ../video/ChineseKonfuPose.npy \
     --image-ext mp4 \
     ../video/ChineseKongfu_clipped.mp4
