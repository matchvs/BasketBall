var mvs = require("Matchvs");
var uiPanel = require("uiPanel");
cc.Class({
    extends: uiPanel,

    properties: {
        bgmAudio: {
            default: null,
            url: cc.AudioClip
        },
        powerGauge: {
            default: null,
            type: cc.ProgressBar
        },
        fireCd: 0,
        goalAudio: {
            default: null,
            url: cc.AudioClip
        },
        countDownAnim: {
            default: null,
            type: cc.Animation
        }
    },
    onLoad() {
        this._super();
        this.isPowerGauge = false;
        this.curFireCd = this.fireCd;
        this.progressSpeed = 1;
        this.lastTime = GLB.gameTime;
        this.nodeDict["playerIcon1"].getComponent('playerIcon').setData({id: GLB.playerUserIds[0]});
        this.nodeDict["playerIcon2"].getComponent('playerIcon').setData({id: GLB.playerUserIds[1]});
        this.nodeDict["right"].on(cc.Node.EventType.TOUCH_START, this.rightStart, this);
        this.nodeDict["right"].on(cc.Node.EventType.TOUCH_END, this.rightCancel, this);
        this.nodeDict["left"].on(cc.Node.EventType.TOUCH_START, this.leftStart, this);
        this.nodeDict["left"].on(cc.Node.EventType.TOUCH_END, this.leftCancel, this);
        this.nodeDict["powerButton"].on(cc.Node.EventType.TOUCH_START, this.startPowerGauge, this);
        this.nodeDict["powerButton"].on(cc.Node.EventType.TOUCH_END, this.sendFireMsg, this);
        this.nodeDict["exit"].on("click", this.exit, this);
        this.timeLb = this.nodeDict["timeLb"].getComponent(cc.Label);

        this.selfScoreLb = this.nodeDict["scoreLb1"].getComponent(cc.Label);
        this.rivalScoreLb = this.nodeDict["scoreLb2"].getComponent(cc.Label);

        clientEvent.on(clientEvent.eventType.roundStart, this.roundStart, this);
        clientEvent.on(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.on(clientEvent.eventType.score, this.scoreEvent, this);
        clientEvent.on(clientEvent.eventType.leaveRoomMedNotify, this.leaveRoom, this);

        this.bgmId = cc.audioEngine.play(this.bgmAudio, true, 1);
    },

    scoreEvent() {
        this.selfScoreLb.string = Game.GameManager.selfScore;
        this.rivalScoreLb.string = Game.GameManager.rivalScore;
        cc.audioEngine.play(this.goalAudio, false, 1);
    },

    exit() {
        uiFunc.openUI("uiExit");
    },

    leaveRoom(data) {
        if (Game.GameManager.gameState !== GameState.Over) {
            uiFunc.openUI("uiTip", function(obj) {
                var uiTip = obj.getComponent("uiTip");
                if (uiTip) {
                    uiTip.setData("对手离开了游戏");
                }
            }.bind(this));
        }
    },

    rightStart() {
        this.sendDirectMsg(DirectState.Right);
    },

    rightCancel() {
        this.sendDirectMsg(DirectState.None);
    },

    leftStart() {
        this.sendDirectMsg(DirectState.Left);
    },

    leftCancel() {
        this.sendDirectMsg(DirectState.None);
    },

    sendDirectMsg(direction) {
        if (Game.GameManager.gameState === GameState.Play) {
            mvs.engine.sendFrameEvent(JSON.stringify({
                action: GLB.DIRECTION,
                direction: direction
            }));
        }
    },

    // 蓄力--
    startPowerGauge() {
        this.isPowerGauge = true;
    },

    sendFireMsg() {
        if (this.curFireCd < 0) {
            this.curFireCd = this.fireCd;
            if (Game.GameManager.gameState === GameState.Play) {
                var speed = this.powerGauge.progress * GLB.speed;
                setTimeout(function() {
                    mvs.engine.sendFrameEvent(JSON.stringify({
                        action: GLB.FIRE_EVENT,
                        speed: speed
                    }));
                }, 400);
                mvs.engine.sendFrameEvent(JSON.stringify({
                    action: GLB.FIRE_ANIM
                }));
            }
        }
        this.powerGauge.progress = 0;
        this.isPowerGauge = false;
    },

    gameOver: function() {
        this.nodeDict['gameOver'].getComponent(cc.Animation).play();
        this.nodeDict['gameOver'].getComponent(cc.AudioSource).play();

        cc.audioEngine.stop(this.bgmId);
    },

    roundStart: function() {
        this.nodeDict['readyGo'].getComponent(cc.Animation).play();
        this.nodeDict['readyGo'].getComponent(cc.AudioSource).play();
    },

    update(dt) {
        this.curFireCd -= dt;
        if (this.isPowerGauge) {
            this.powerGauge.progress += this.progressSpeed * dt;
        }
        this.timeLb.string = Game.GameManager.gameTime;
        if (Game.GameManager.gameTime < 10) {
            if (this.lastTime != Game.GameManager.gameTime) {
                this.countDownAnim.play();
            }
            this.lastTime = Game.GameManager.gameTime;
        }
    },

    onDestroy() {
        cc.audioEngine.stop(this.bgmId);
        clientEvent.off(clientEvent.eventType.score, this.scoreEvent, this);
        clientEvent.off(clientEvent.eventType.leaveRoomMedNotify, this.leaveRoom, this);
        clientEvent.off(clientEvent.eventType.roundStart, this.roundStart, this);
        clientEvent.off(clientEvent.eventType.gameOver, this.gameOver, this);

    }
});
