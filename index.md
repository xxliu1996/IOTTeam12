# IOTTeam12
This pose estimation project is based on a real time pose animaiton project on:
```
https://github.com/xiaowuc2/Real-Time-Pose-Animation
```
Compared with the original app, we add a movements counter to the web page and the conter implementation is inspired by the following project.
```
https://github.com/bipinkc19/squat-counter
```
## How to implement the **Real-Time-Pose-Estimation** on your laptop.
My laptop is a Macbook. Here I just provide a tutorial for setting up the environmnet on a Macbook. Please search online for equvilant commands for othere OS.

1. Install ```Homebrew``` on your Macbook. (If you have already installed it, skip this step.)
```shell
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

2. Install ```node``` , ```npm```, and ```yarn```. (If you have already installed it, skip this step.)
```shell
brew install node
brew install npm
brew install yarn
```

3. Clone the reposigory into your compututer.
```shell
git clone https://github.com/icedragonsoul/IOTTeam12.git
```

4. Go to directory ```IOTTeam12/PoseEstimation/Real-Time-Pose-Estimation```, and install essential packages. (Just copied from ```https://github.com/xiaowuc2/Real-Time-Pose-Animation```.)
```shell
cd IOTTeam12/PoseEstimation/Real-Time-Pose-Estimation
yarn
npm install paper
```
